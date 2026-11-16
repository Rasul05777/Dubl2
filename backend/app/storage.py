"""Local volume for development, S3-compatible private bucket for Cloud Apps.

Database URLs remain /uploads/<key>; API signs temporary read URLs for S3.
"""
import os
from functools import lru_cache
from pathlib import Path

@lru_cache
def s3_client():
    import boto3
    from botocore.config import Config
    return boto3.client('s3',endpoint_url=os.environ['S3_ENDPOINT_URL'],
        region_name=os.getenv('S3_REGION','ru-1'),
        aws_access_key_id=os.environ['S3_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['S3_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4',s3={'addressing_style':'path'},
            request_checksum_calculation='when_required',response_checksum_validation='when_required'))

class ImageStorage:
    def __init__(self):
        self.driver=os.getenv('STORAGE_BACKEND','local')
        if self.driver not in ('local','s3'): raise RuntimeError('Invalid STORAGE_BACKEND')
        self.directory=Path(os.getenv('UPLOAD_DIR','./uploads'))
        self.bucket=os.getenv('S3_BUCKET','')
        self.prefix=os.getenv('S3_PREFIX','uploads').strip('/')
        if self.driver=='local': self.directory.mkdir(parents=True,exist_ok=True)
        else:
            for key in ['S3_BUCKET','S3_ENDPOINT_URL','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY']:
                if not os.getenv(key): raise RuntimeError(f'Missing {key}')
    def key(self,name): return f'{self.prefix}/{name}' if self.prefix else name
    def save(self,name,data):
        if self.driver=='local': (self.directory/name).write_bytes(data)
        else: s3_client().put_object(Bucket=self.bucket,Key=self.key(name),Body=data,ContentType='image/webp')
    def delete(self,name):
        if self.driver=='local': (self.directory/name).unlink(missing_ok=True)
        else: s3_client().delete_object(Bucket=self.bucket,Key=self.key(name))
    def read_url(self,name):
        return s3_client().generate_presigned_url('get_object',Params={'Bucket':self.bucket,'Key':self.key(name)},ExpiresIn=900)
