import os
from cryptography.fernet import Fernet
from django.conf import settings

def get_fernet():
    key = os.environ.get('FERNET_KEY')
    if not key:
        raise ValueError("FERNET_KEY environment variable is not set")
    return Fernet(key.encode('utf-8'))

def encrypt_token(token: str) -> str:
    if not token:
        return ""
    f = get_fernet()
    return f.encrypt(token.encode('utf-8')).decode('utf-8')

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return ""
    f = get_fernet()
    return f.decrypt(encrypted_token.encode('utf-8')).decode('utf-8')
