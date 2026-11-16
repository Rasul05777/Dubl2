from test_api import client
from unittest.mock import Mock
from app.storage import ImageStorage
import app.storage as module

def test_s3_storage_survives_backend_instance_replacement(monkeypatch):
    for key,value in {'STORAGE_BACKEND':'s3','S3_BUCKET':'test-bucket','S3_ENDPOINT_URL':'https://s3.twcstorage.ru','S3_ACCESS_KEY_ID':'test-key','S3_SECRET_ACCESS_KEY':'test-secret','S3_PREFIX':'uploads'}.items(): monkeypatch.setenv(key,value)
    client=Mock();client.generate_presigned_url.return_value='https://bucket.example/signed'
    monkeypatch.setattr(module,'s3_client',lambda:client)
    first=ImageStorage();first.save('a.webp',b'webp')
    client.put_object.assert_called_once_with(Bucket='test-bucket',Key='uploads/a.webp',Body=b'webp',ContentType='image/webp')
    second=ImageStorage();assert second.read_url('a.webp')=='https://bucket.example/signed'
    client.generate_presigned_url.assert_called_once_with('get_object',Params={'Bucket':'test-bucket','Key':'uploads/a.webp'},ExpiresIn=900)
    second.delete('a.webp');client.delete_object.assert_called_once_with(Bucket='test-bucket',Key='uploads/a.webp')

def test_cors_allows_only_configured_frontend(client):
    allowed=client.options('/api/admin/login',headers={'Origin':'http://localhost:3000','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'})
    assert allowed.status_code==200
    assert allowed.headers['access-control-allow-origin']=='http://localhost:3000'
    assert allowed.headers['access-control-allow-credentials']=='true'
    denied=client.options('/api/admin/login',headers={'Origin':'https://evil.example','Access-Control-Request-Method':'POST'})
    assert denied.status_code==400
    assert 'access-control-allow-origin' not in denied.headers
