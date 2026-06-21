import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token

def test_password_hashing():
    pwd = "supersecretpassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_tokens():
    data = {"sub": "user_12345"}
    token = create_access_token(data)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user_12345"
    assert decoded["type"] == "access"
