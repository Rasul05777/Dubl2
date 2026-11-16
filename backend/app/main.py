import os, secrets, hashlib, time, io, warnings, asyncio, logging
from pathlib import Path
from decimal import Decimal
from datetime import datetime, timezone
from urllib.parse import quote
from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from .storage import ImageStorage
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from pwdlib import PasswordHash
from PIL import Image, UnidentifiedImageError
from .db import db
from .models import AdminUser, Session, Category, Product, SiteSettings, Branch
from .schemas import CategoryInput, ProductInput, SettingsInput, Login, Checkout

app=FastAPI(title='Дубль второй API')
origin=os.getenv('PUBLIC_ORIGIN','http://localhost:3000')
app.add_middleware(CORSMiddleware,allow_origins=[origin],allow_credentials=True,allow_methods=['GET','POST','PATCH','DELETE'],allow_headers=['Content-Type'])
storage=ImageStorage()
if storage.driver=='local':
    app.mount('/uploads',StaticFiles(directory=storage.directory),name='uploads')
else:
    @app.get('/uploads/{filename}')
    async def read_upload(filename:str):
        if not __import__('re').fullmatch(r'[a-f0-9]{32}(-small)?\.webp',filename): fail('Не найдено',404)
        url=await asyncio.to_thread(storage.read_url,filename)
        return RedirectResponse(url,headers={'Cache-Control':'no-store'})

cookie_samesite=os.getenv('COOKIE_SAMESITE','lax')
if cookie_samesite not in ('lax','strict','none'): raise RuntimeError('Invalid COOKIE_SAMESITE')
if cookie_samesite=='none' and os.getenv('COOKIE_SECURE','true')!='true':
    raise RuntimeError('SameSite=None requires COOKIE_SECURE=true')
passwords=PasswordHash.recommended()
def fail(message,status=400): raise HTTPException(status,message)
def dump(obj): return {c.name:getattr(obj,c.name) for c in obj.__table__.columns}
async def settings(s):
    row=await s.get(SiteSettings,1)
    return SettingsInput(**(row.data if row else {}))
@app.middleware('http')
async def security(request,call_next):
    if request.method in ('POST','PATCH','DELETE') and request.headers.get('origin')!=origin:
        return Response('Origin rejected',status_code=403)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
    return response
async def admin(request:Request,s:AsyncSession=Depends(db)):
    token=request.cookies.get('session','')
    row=await s.get(Session,hashlib.sha256(token.encode()).hexdigest())
    if not row or row.expires<time.time(): fail('Войдите в систему',401)
    return row
# Single API worker: rate limits are process-local; run a shared limiter before scaling.
attempts={}
def limit(key,max_count,period=60):
    now=time.time(); recent=[x for x in attempts.get(key,[]) if x>now-period]
    if len(recent)>=max_count: fail('Слишком много запросов. Попробуйте позже.',429)
    attempts[key]=recent+[now]
@app.post('/api/admin/login')
async def login(data:Login,request:Request,response:Response,s:AsyncSession=Depends(db)):
    limit(('login',request.client.host),5,300)
    user=await s.scalar(select(AdminUser).where(AdminUser.username==data.username))
    if not user or not passwords.verify(data.password,user.password_hash): fail('Неверный логин или пароль',401)
    token=secrets.token_urlsafe(40)
    s.add(Session(token=hashlib.sha256(token.encode()).hexdigest(),admin_id=user.id,expires=time.time()+28800)); await s.commit()
    response.set_cookie('session',token,httponly=True,secure=os.getenv('COOKIE_SECURE','true')=='true',samesite=cookie_samesite,max_age=28800,path='/')
    return {'username':user.username}
@app.get('/api/admin/me')
async def me(a=Depends(admin)): return {'authenticated':True}
@app.post('/api/admin/logout')
async def logout(response:Response,a=Depends(admin),s:AsyncSession=Depends(db)):
    await s.execute(delete(Session).where(Session.token==a.token)); await s.commit(); response.delete_cookie('session',path='/',secure=os.getenv('COOKIE_SECURE','true')=='true',httponly=True,samesite=cookie_samesite); return {'ok':True}
@app.get('/api/settings')
@app.get('/api/admin/settings',dependencies=[Depends(admin)])
async def get_settings(s:AsyncSession=Depends(db)): return await settings(s)
@app.patch('/api/admin/settings',dependencies=[Depends(admin)])
async def update_settings(data:SettingsInput,s:AsyncSession=Depends(db)):
    row=await s.get(SiteSettings,1)
    if not row: row=SiteSettings(id=1); s.add(row)
    row.data=data.model_dump(mode='json'); await s.commit(); return data
@app.get('/api/health')
async def health(): return {'status':'ok'}

@app.get('/api/branches')
async def branches(s:AsyncSession=Depends(db)): return [dump(x) for x in (await s.scalars(select(Branch).where(Branch.is_active==True))).all()]
@app.get('/api/categories')
async def categories(s:AsyncSession=Depends(db)): return [dump(x) for x in (await s.scalars(select(Category).where(Category.is_active==True).order_by(Category.sort_order,Category.id))).all()]
@app.get('/api/products')
async def products(s:AsyncSession=Depends(db)):
    return [dump(x) for x in (await s.scalars(select(Product).join(Category).where(Product.is_active==True,Category.is_active==True).order_by(Product.sort_order,Product.id))).all()]
@app.get('/api/products/{slug}')
async def product(slug:str,s:AsyncSession=Depends(db)):
    p=await s.scalar(select(Product).join(Category).where(Product.slug==slug,Product.is_active==True,Category.is_active==True))
    if not p: fail('Товар не найден',404)
    return dump(p)

def register_crud(name,model,schema):
    async def listing(s:AsyncSession=Depends(db)): return [dump(x) for x in (await s.scalars(select(model).order_by(model.sort_order,model.id))).all()]
    async def save(data,s,id=None):
        if model==Product and not await s.get(Category,data.category_id): fail('Категория не найдена')
        row=await s.get(model,id) if id else model()
        if row is None: fail('Не найдено',404)
        for k,v in data.model_dump().items(): setattr(row,k,v)
        s.add(row)
        try: await s.commit()
        except IntegrityError: await s.rollback(); fail('Такой адрес уже существует или нарушена связь данных')
        return dump(row)
    async def create(data:schema,s:AsyncSession=Depends(db)): return await save(data,s)
    async def update(id:int,data:schema,s:AsyncSession=Depends(db)): return await save(data,s,id)
    async def remove(id:int,s:AsyncSession=Depends(db)):
        row=await s.get(model,id)
        if not row: fail('Не найдено',404)
        if model==Category and await s.scalar(select(Product.id).where(Product.category_id==id).limit(1)): fail('Сначала перенесите или удалите товары категории')
        await s.delete(row); await s.commit(); return {'ok':True}
    for path,fn,methods in [('',listing,['GET']),('',create,['POST']),('/{id}',update,['PATCH']),('/{id}',remove,['DELETE'])]:
        app.add_api_route('/api/admin/'+name+path,fn,methods=methods,dependencies=[Depends(admin)])
register_crud('categories',Category,CategoryInput)
register_crud('products',Product,ProductInput)
@app.post('/api/admin/uploads',dependencies=[Depends(admin)])
async def upload(file:UploadFile):
    data=await file.read(8*1024*1024+1)
    if len(data)>8*1024*1024: fail('Максимальный размер — 8 МБ')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error',Image.DecompressionBombWarning)
            im=Image.open(io.BytesIO(data))
            if im.format not in ('JPEG','PNG','WEBP') or im.width*im.height>24000000: fail('Недопустимое изображение')
            im.load(); im=im.convert('RGB'); im.thumbnail((1920,1920))
            name=secrets.token_hex(16)
            full=io.BytesIO(); im.save(full,'WEBP',quality=85)
            im.thumbnail((640,640)); small=io.BytesIO(); im.save(small,'WEBP',quality=80)
    except (UnidentifiedImageError,OSError,Image.DecompressionBombError,Image.DecompressionBombWarning): fail('Файл не является безопасным изображением')
    try:
        await asyncio.to_thread(storage.save,name+'.webp',full.getvalue())
        await asyncio.to_thread(storage.save,name+'-small.webp',small.getvalue())
    except Exception:
        logging.exception('Image storage write failed')
        fail('Хранилище изображений временно недоступно',503)
    return {'url':'/uploads/'+name+'.webp'}
@app.delete('/api/admin/uploads/{filename}',dependencies=[Depends(admin)])
async def remove_upload(filename:str,s:AsyncSession=Depends(db)):
    if not __import__('re').fullmatch(r'[a-f0-9]{32}\.webp',filename): fail('Неверное имя')
    url='/uploads/'+filename
    cfg=(await settings(s)).model_dump()
    if url in cfg.values() or await s.scalar(select(Product.id).where(Product.image_url==url)): fail('Изображение используется')
    try:
        await asyncio.to_thread(storage.delete,filename)
        await asyncio.to_thread(storage.delete,filename.replace('.webp','-small.webp'))
    except Exception:
        logging.exception('Image storage delete failed')
        fail('Хранилище изображений временно недоступно',503)
    return {'ok':True}
@app.post('/api/checkout/preview')
async def checkout(data:Checkout,request:Request,s:AsyncSession=Depends(db)):
    limit(('checkout',request.client.host),30)
    cfg=await settings(s)
    if not getattr(cfg,data.method+'_enabled'): fail('Этот способ получения недоступен')
    if data.method=='delivery' and len(data.address.strip())<5: fail('Укажите адрес доставки')
    if data.scheduled_at:
        if not cfg.scheduled_enabled: fail('Заказы ко времени недоступны')
        try:
            when=datetime.fromisoformat(data.scheduled_at)
            if when.tzinfo is None or when<=datetime.now(timezone.utc): fail('Укажите будущее время с часовым поясом')
        except ValueError: fail('Некорректное время')
    quantities={}
    for item in data.items: quantities[item.product_id]=quantities.get(item.product_id,0)+item.quantity
    lines=[]; total=Decimal('0')
    for pid,qty in quantities.items():
        if qty>99: fail('Слишком большое количество')
        p=await s.get(Product,pid)
        cat=await s.get(Category,p.category_id) if p else None
        if not p or not p.is_active or not p.is_available or not cat or not cat.is_active: fail('Один из товаров больше недоступен. Обновите корзину.',409)
        total+=p.price*qty; lines.append(f'{p.name} — {qty} шт. × {p.price:.2f} ₽')
    if total<cfg.minimum_order_amount: fail(f'Минимальная сумма: {cfg.minimum_order_amount} ₽')
    fee=cfg.delivery_price if data.method=='delivery' else Decimal('0')
    grand=total+(fee or 0)
    if not cfg.whatsapp: fail('Заказы ещё не настроены: свяжитесь с заведением',503)
    text='Здравствуйте! Хочу оформить заказ.\n\n'+'\n'.join(lines)+f'\n\nТовары: {total:.2f} ₽\nДоставка: '+('уточнит менеджер' if fee is None else f'{fee:.2f} ₽')+f'\nИтого: {grand:.2f} ₽'+(' + доставка' if fee is None else '')+f'\nПолучение: {"доставка" if data.method=="delivery" else "самовывоз"}\nАдрес: {data.address}\nИмя: {data.name}\nТелефон: {data.phone}\nВремя: {data.scheduled_at or "как можно скорее"}\nКомментарий: {data.comment}'
    return {'subtotal':format(total,'.2f'),'delivery_price':format(fee,'.2f') if fee is not None else None,'total':format(grand,'.2f'),'message':text,'whatsapp_url':f'https://wa.me/{cfg.whatsapp}?text={quote(text)}'}
