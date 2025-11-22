from pydantic import EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional

from app.models.base import DiminiBaseModel


class UserBase(DiminiBaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_within_bcrypt_limit(cls, value: str) -> str:
        # Bcrypt only supports passwords up to 72 bytes; reject anything longer
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes long")
        return value

class UserLogin(DiminiBaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    token_version: int = Field(alias="tokenVersion")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True

class Token(DiminiBaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(DiminiBaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
