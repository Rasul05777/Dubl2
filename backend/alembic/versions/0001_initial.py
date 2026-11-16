"""Initial schema."""
from alembic import op
import sqlalchemy as sa
revision='0001'
down_revision=None

def upgrade():
    op.create_table('admins',sa.Column('id',sa.Integer,primary_key=True),sa.Column('username',sa.String(100),nullable=False,unique=True),sa.Column('password_hash',sa.String,nullable=False),sa.Column('created_at',sa.DateTime,nullable=False))
    op.create_table('sessions',sa.Column('token',sa.String(64),primary_key=True),sa.Column('admin_id',sa.Integer,sa.ForeignKey('admins.id'),nullable=False),sa.Column('expires',sa.Float,nullable=False))
    op.create_table('branches',sa.Column('id',sa.Integer,primary_key=True),*[sa.Column(k,sa.String,nullable=False) for k in ['name','address','phone','whatsapp','working_hours']],sa.Column('latitude',sa.Float),sa.Column('longitude',sa.Float),sa.Column('is_active',sa.Boolean,nullable=False))
    op.create_table('categories',sa.Column('id',sa.Integer,primary_key=True),sa.Column('name',sa.String,nullable=False),sa.Column('slug',sa.String,unique=True,nullable=False),sa.Column('sort_order',sa.Integer,nullable=False),sa.Column('is_active',sa.Boolean,nullable=False))
    op.create_table('products',sa.Column('id',sa.Integer,primary_key=True),sa.Column('category_id',sa.Integer,sa.ForeignKey('categories.id',ondelete='RESTRICT'),nullable=False),*[sa.Column(k,sa.String,nullable=False) for k in ['name','slug','weight','image_url']],sa.Column('description',sa.Text,nullable=False),sa.Column('price',sa.Numeric(12,2),nullable=False),sa.Column('is_available',sa.Boolean,nullable=False),sa.Column('is_active',sa.Boolean,nullable=False),sa.Column('sort_order',sa.Integer,nullable=False),sa.UniqueConstraint('slug'))
    op.create_table('settings',sa.Column('id',sa.Integer,primary_key=True),sa.Column('data',sa.JSON,nullable=False))
def downgrade():
    for table in ['settings','products','categories','branches','sessions','admins']:op.drop_table(table)
