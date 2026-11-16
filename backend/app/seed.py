import asyncio, os
from sqlalchemy import select
from pwdlib import PasswordHash
from .db import SessionLocal
from .models import AdminUser,Branch,Category,Product,SiteSettings
from .schemas import SettingsInput
async def seed():
    password=os.environ.get('ADMIN_PASSWORD','')
    if len(password)<12: raise RuntimeError('ADMIN_PASSWORD must contain at least 12 characters')
    async with SessionLocal() as s:
        if not await s.scalar(select(AdminUser.id).limit(1)):
            s.add(AdminUser(username=os.getenv('ADMIN_USERNAME','admin'),password_hash=PasswordHash.recommended().hash(password)))
        if not await s.get(SiteSettings,1): s.add(SiteSettings(id=1,data=SettingsInput().model_dump(mode='json')))
        if not await s.scalar(select(Branch.id).limit(1)): s.add(Branch(name='Дубль второй'))
        if not await s.scalar(select(Category.id).limit(1)):
            for order,(name,slug,items) in enumerate([
                ('Кофе','coffee',[('Капучино','cappuccino','Нежная молочная пена и насыщенный эспрессо','280','250 мл'),('Флэт уайт','flat-white','Двойной эспрессо и бархатистое молоко','310','200 мл')]),
                ('Выпечка','bakery',[('Миндальный круассан','almond-croissant','Слоёное тесто, миндальный крем и лепестки миндаля','320','110 г'),('Круассан классический','croissant','Хрустящая корочка и нежный сливочный вкус','230','80 г')]),
                ('Десерты','desserts',[('Чизкейк с малиной','cheesecake','Сливочный чизкейк с ягодным соусом','390','150 г'),('Шоколадный тарт','chocolate-tart','Тёмный шоколад на рассыпчатой песочной основе','360','120 г')])]):
                c=Category(name=name,slug=slug,sort_order=order);s.add(c);await s.flush()
                for i,(pn,ps,desc,price,weight) in enumerate(items): s.add(Product(category_id=c.id,name=pn,slug=ps,description=desc,price=price,weight=weight,sort_order=i))
        await s.commit()
if __name__=='__main__': asyncio.run(seed())
