from decimal import Decimal
from typing import Annotated, Literal
from pydantic import BaseModel, Field, field_validator
import re
class CategoryInput(BaseModel):
    name: str=Field(min_length=1,max_length=150)
    slug: str=Field(pattern=r'^[a-z0-9-]+$',max_length=150)
    sort_order: int=0
    is_active: bool=True
class ProductInput(CategoryInput):
    category_id: int
    description: str=Field(default='',max_length=3000)
    price: Decimal=Field(ge=0,le=1000000,decimal_places=2)
    weight: str=Field(default='',max_length=100)
    image_url: str=Field(default='',max_length=500)
    is_available: bool=True
    @field_validator('image_url')
    @classmethod
    def image(cls,v):
        if v and not (v.startswith('/uploads/') or v.startswith('/images/')): raise ValueError('Используйте загруженное изображение')
        return v
class SettingsInput(BaseModel):
    restaurant_name: str=Field(default='Дубль второй',max_length=150)
    logo_url: str=''
    hero_image_url: str='/images/hero.webp'
    hero_title: str='Кофе, выпечка и десерты'
    description: str='Место для ваших маленьких пауз. Свежая выпечка, любимый кофе и тёплые встречи.'
    contact_phone: str=''
    whatsapp: str=''
    address: str=''
    maps_url: str=''
    working_hours: str='Ежедневно, 09:00–23:00'
    delivery_enabled: bool=True
    pickup_enabled: bool=True
    delivery_price: Decimal|None=Field(default=None,ge=0)
    minimum_order_amount: Decimal=Field(default=Decimal('0'),ge=0)
    delivery_zone: str='Условия и зону доставки уточнит администратор.'
    scheduled_enabled: bool=False
    social_url: str=''
    seo_title: str='Дубль второй — гастробар'
    seo_description: str='Кофе, свежая выпечка и десерты. Меню и заказ на доставку.'
    @field_validator('maps_url','social_url')
    @classmethod
    def link(cls,v):
        if v and not v.startswith('https://'): raise ValueError('Требуется HTTPS-ссылка')
        return v
    @field_validator('logo_url','hero_image_url')
    @classmethod
    def image(cls,v): return ProductInput.image(v)
    @field_validator('whatsapp')
    @classmethod
    def phone(cls,v):
        if v and not re.fullmatch(r'\d{10,15}',v): raise ValueError('Номер: 10–15 цифр без знака +')
        return v
class Login(BaseModel):
    username: str=Field(max_length=100)
    password: str=Field(max_length=200)
class Item(BaseModel):
    product_id: int
    quantity: int=Field(ge=1,le=99)
class Checkout(BaseModel):
    items: list[Item]=Field(min_length=1,max_length=100)
    name: str=Field(min_length=2,max_length=100)
    phone: str=Field(pattern=r'^\+?[\d ()-]{10,22}$')
    method: Literal['delivery','pickup']
    address: str=Field(default='',max_length=500)
    comment: str=Field(default='',max_length=1000)
    scheduled_at: str=Field(default='',max_length=50)
