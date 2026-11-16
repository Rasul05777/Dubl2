import os,asyncio
os.environ['STORAGE_BACKEND']='local'
os.environ['PUBLIC_ORIGIN']='http://localhost:3000'
os.environ['COOKIE_SAMESITE']='lax'
os.environ['DATABASE_URL']='sqlite+aiosqlite://'
os.environ['COOKIE_SECURE']='false'
os.environ['UPLOAD_DIR']='/tmp/dubl-test-uploads'
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine,async_sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app,db,passwords,attempts
from app.models import Base,AdminUser,Category,Product,SiteSettings
from app.schemas import SettingsInput

@pytest.fixture
def client():
    engine=create_async_engine('sqlite+aiosqlite://',poolclass=StaticPool)
    sessions=async_sessionmaker(engine,expire_on_commit=False)
    async def init():
        async with engine.begin() as conn: await conn.run_sync(Base.metadata.create_all)
        async with sessions() as s:
            s.add(AdminUser(username='admin',password_hash=passwords.hash('test-password-123')))
            s.add(Category(id=1,name='Кофе',slug='coffee'))
            await s.flush()
            s.add(Product(id=1,category_id=1,name='Капучино',slug='coffee',price='280.50'))
            s.add(SiteSettings(id=1,data=SettingsInput(whatsapp='79991234567',delivery_price='100').model_dump(mode='json')))
            await s.commit()
    asyncio.run(init())
    async def override():
        async with sessions() as s: yield s
    app.dependency_overrides[db]=override;attempts.clear()
    with TestClient(app,headers={'Origin':'http://localhost:3000'}) as c: yield c
    app.dependency_overrides.clear();asyncio.run(engine.dispose())
def login(c): return c.post('/api/admin/login',json={'username':'admin','password':'test-password-123'})
def order(**kw): return dict(items=[{'product_id':1,'quantity':2}],name='Анна',phone='+79991234567',method='delivery',address='Улица Пушкина, 1',**kw)
def test_auth_csrf_and_session(client):
    assert client.get('/api/admin/products').status_code==401
    assert client.post('/api/admin/login',headers={'Origin':'https://evil.example'},json={'username':'admin','password':'test-password-123'}).status_code==403
    r=login(client);assert r.status_code==200;assert 'HttpOnly' in r.headers['set-cookie']
    assert client.get('/api/admin/me').status_code==200
    assert client.post('/api/admin/logout').status_code==200
    assert client.get('/api/admin/me').status_code==401

def test_checkout_uses_current_prices(client):
    r=client.post('/api/checkout/preview',json={**order(),'total':1});assert r.status_code==200
    assert r.json()['total']=='661.00';assert r.json()['whatsapp_url'].startswith('https://wa.me/79991234567?text=')
    login(client)
    data=client.get('/api/admin/products').json()[0];data['price']='300.25'
    assert client.patch('/api/admin/products/1',json=data).status_code==200
    assert client.post('/api/checkout/preview',json=order()).json()['total']=='700.50'
def test_unavailable_and_hidden_categories(client):
    login(client);p=client.get('/api/admin/products').json()[0];p['is_available']=False
    client.patch('/api/admin/products/1',json=p)
    assert client.post('/api/checkout/preview',json=order()).status_code==409
    assert client.delete('/api/admin/categories/1').status_code==400
    cat=client.get('/api/admin/categories').json()[0];cat['is_active']=False;client.patch('/api/admin/categories/1',json=cat)
    assert client.get('/api/products').json()==[]
def test_validation_upload_and_limits(client):
    assert client.post('/api/checkout/preview',json={**order(),'items':[]}).status_code==422
    assert client.post('/api/checkout/preview',json={**order(),'address':''}).status_code==400
    login(client)
    assert client.post('/api/admin/uploads',files={'file':('bad.png',b'<script>bad</script>','image/png')}).status_code==400
    from PIL import Image
    import io
    b=io.BytesIO();Image.new('RGB',(20,20)).save(b,'PNG')
    r=client.post('/api/admin/uploads',files={'file':('ok.png',b.getvalue(),'image/png')});assert r.status_code==200
    assert client.get(r.json()['url']).headers['content-type']=='image/webp'
    for _ in range(5): client.post('/api/admin/login',json={'username':'x','password':'wrong'})
    assert login(client).status_code==429
