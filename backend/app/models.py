from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase): pass
class AdminUser(Base):
    __tablename__='admins'
    id: Mapped[int]=mapped_column(primary_key=True)
    username: Mapped[str]=mapped_column(String(100),unique=True)
    password_hash: Mapped[str]
    created_at: Mapped[datetime]=mapped_column(default=lambda:datetime.now(timezone.utc).replace(tzinfo=None))
class Session(Base):
    __tablename__='sessions'
    token: Mapped[str]=mapped_column(String(64),primary_key=True)
    admin_id: Mapped[int]=mapped_column(ForeignKey('admins.id'))
    expires: Mapped[float]
class Branch(Base):
    __tablename__='branches'
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]
    address: Mapped[str]=mapped_column(default='')
    phone: Mapped[str]=mapped_column(default='')
    whatsapp: Mapped[str]=mapped_column(default='')
    latitude: Mapped[float|None]
    longitude: Mapped[float|None]
    working_hours: Mapped[str]=mapped_column(default='')
    is_active: Mapped[bool]=mapped_column(default=True)
class Category(Base):
    __tablename__='categories'
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]
    slug: Mapped[str]=mapped_column(unique=True)
    sort_order: Mapped[int]=mapped_column(default=0)
    is_active: Mapped[bool]=mapped_column(default=True)
class Product(Base):
    __tablename__='products'
    id: Mapped[int]=mapped_column(primary_key=True)
    category_id: Mapped[int]=mapped_column(ForeignKey('categories.id',ondelete='RESTRICT'))
    name: Mapped[str]
    slug: Mapped[str]=mapped_column(unique=True)
    description: Mapped[str]=mapped_column(Text,default='')
    price: Mapped[Decimal]=mapped_column(Numeric(12,2))
    weight: Mapped[str]=mapped_column(default='')
    image_url: Mapped[str]=mapped_column(default='')
    is_available: Mapped[bool]=mapped_column(default=True)
    is_active: Mapped[bool]=mapped_column(default=True)
    sort_order: Mapped[int]=mapped_column(default=0)
class SiteSettings(Base):
    __tablename__='settings'
    id: Mapped[int]=mapped_column(primary_key=True,default=1)
    data: Mapped[dict]=mapped_column(JSON,default=dict)
