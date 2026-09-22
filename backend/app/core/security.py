from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
import bcrypt
from jose import jwt, JWTError
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Securely hash a password using bcrypt."""
    password_bytes = password.encode('utf-8')[:72]  # bcrypt max 72 bytes
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    try:
        plain_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# Pre-computed bcrypt hash for constant-time comparison against timing attacks
_DUMMY_BCRYPT_HASH = b"$2b$12$e8YQz.F3GhyG91079D/mUeRsqe8909c2U8H7vF2X99Q093J07K88e"

def dummy_verify_password(plain_password: str) -> None:
    """
    Performs constant-time bcrypt verification to mitigate user enumeration timing attacks
    when an email address does not exist in the database.
    """
    try:
        plain_bytes = plain_password.encode('utf-8')[:72]
        bcrypt.checkpw(plain_bytes, _DUMMY_BCRYPT_HASH)
    except Exception:
        pass

import time
from collections import defaultdict

class SimpleRateLimiter:
    """
    In-memory sliding window rate limiter.
    Provides DDoS and brute-force mitigation for authentication and public forms.
    """
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    def is_allowed(self, client_key: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        # Clean expired timestamps
        self.history[client_key] = [t for t in self.history[client_key] if t > cutoff]
        if len(self.history[client_key]) >= self.max_requests:
            return False
        self.history[client_key].append(now)
        return True

auth_rate_limiter = SimpleRateLimiter(max_requests=30, window_seconds=60)
inquiry_rate_limiter = SimpleRateLimiter(max_requests=10, window_seconds=60)
