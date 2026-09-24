from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.models import User, Gym

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate JWT token and return authenticated user."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    gym_id = payload.get("gym_id")
    is_superadmin = payload.get("is_superadmin", False)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if is_superadmin or gym_id is None:
        user = db.query(User).filter(User.id == int(user_id)).first()
    else:
        user = db.query(User).filter(User.id == int(user_id), User.gym_id == int(gym_id)).first()
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    return user

def get_current_gym(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Optional[Gym]:
    """Ensure the user's gym exists and is active, enforcing tenant boundary."""
    if current_user.gym_id is None and (current_user.is_superadmin or current_user.role == "superadmin"):
        return None
    gym = db.query(Gym).filter(Gym.id == current_user.gym_id).first()
    if not gym:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gym tenant not found"
        )
    return gym

class RoleChecker:
    """Dependency for Role-Based Access Control (RBAC)."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {user.role}. Required: {', '.join(self.allowed_roles)}"
            )
        return user

require_owner_or_admin = RoleChecker(["superadmin", "owner", "admin"])
require_owner = RoleChecker(["superadmin", "owner"])
require_staff_or_above = RoleChecker(["superadmin", "owner", "admin", "staff", "trainer"])
require_trainer = RoleChecker(["superadmin", "owner", "admin", "trainer"])

def require_superadmin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify that the user is the Platform Super Admin / Platform Owner."""
    if not (current_user.is_superadmin or current_user.role == "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform Super Admin privileges required."
        )
    return current_user

def require_approved_gym(
    current_gym: Gym = Depends(get_current_gym),
    current_user: User = Depends(get_current_user)
) -> Gym:
    """Verify that the facility has been approved by the platform owner."""
    if current_user.is_superadmin or current_user.role == "superadmin":
        return current_gym
    if not current_gym.is_approved and current_gym.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your gym facility registration is pending platform owner approval. Once approved, all operational features will unlock automatically."
        )
    return current_gym

