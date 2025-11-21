from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.config import settings
from app.database import db
from app.models.auth import UserCreate, UserLogin, UserResponse, Token, TokenData

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

router = APIRouter()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """Get the current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("user_id")
        email: str = payload.get("email")
        if user_id is None or email is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, email=email)
    except JWTError:
        raise credentials_exception
        
    user = await db.user.find_unique(where={"id": token_data.user_id})
    if user is None:
        raise credentials_exception
        
    # Check token version
    token_version = payload.get("token_version", 0)
    if token_version != user.tokenVersion:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been invalidated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return UserResponse.model_validate(user)

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new therapist"""
    # Check if user already exists
    existing_user = await db.user.find_first(where={"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = await db.user.create(
        data={
            "email": user_data.email,
            "name": user_data.name,
            "passwordHash": hashed_password,
            "role": "THERAPIST"
        }
    )
    
    logger.info(f"New user registered: {user.email}")
    return UserResponse.model_validate(user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with email and password"""
    # Find user
    user = await db.user.find_first(where={"email": form_data.username})
    
    if not user:
        # Update failed attempts for the IP (would need to track by IP in production)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if account is locked
    if user.accountLockedUntil and user.accountLockedUntil > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is temporarily locked due to too many failed attempts"
        )
    
    # Verify password
    if not verify_password(form_data.password, user.passwordHash):
        # Update failed login attempts
        failed_attempts = user.failedLoginAttempts + 1
        update_data = {"failedLoginAttempts": failed_attempts}
        
        # Lock account after 5 failed attempts
        if failed_attempts >= 5:
            update_data["accountLockedUntil"] = datetime.utcnow() + timedelta(minutes=15)
            
        await db.user.update(
            where={"id": user.id},
            data=update_data
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Reset failed attempts on successful login
    if user.failedLoginAttempts > 0:
        await db.user.update(
            where={"id": user.id},
            data={
                "failedLoginAttempts": 0,
                "accountLockedUntil": None
            }
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "token_version": user.tokenVersion
        },
        expires_delta=access_token_expires
    )
    
    logger.info(f"User logged in: {user.email}")
    return Token(access_token=access_token)

@router.post("/token", response_model=Token)
async def token(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible token endpoint"""
    return await login(form_data)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.post("/logout")
async def logout(current_user: UserResponse = Depends(get_current_user)):
    """Logout and invalidate all tokens"""
    # Increment token version to invalidate all existing tokens
    await db.user.update(
        where={"id": current_user.id},
        data={"tokenVersion": current_user.tokenVersion + 1}
    )
    
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully"}
