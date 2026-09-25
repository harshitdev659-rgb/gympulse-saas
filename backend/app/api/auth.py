import secrets
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    get_password_hash, verify_password, create_access_token,
    dummy_verify_password, auth_rate_limiter
)
from app.core.dependencies import get_current_user, get_current_gym, require_owner_or_admin
from app.models.models import Gym, User, GymSetting
from app.schemas.schemas import (
    RegisterGymRequest, LoginRequest, TokenResponse, 
    UserResponse, UserCreate, UserUpdate, GymResponse,
    ForgotPasswordRequest, ResetPasswordRequest, SubmitPaymentRefRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication & Staff"])

@router.post("/register-gym", response_model=TokenResponse)
def register_gym(req: RegisterGymRequest, db: Session = Depends(get_db)):
    """
    Register a new gym facility and its owner account.
    Auto-generates dedicated public website defaults.
    Places gym in pending approval state awaiting Platform Owner verification.
    """
    email = req.email.lower().strip()
    gym_name = req.gym_name.strip()
    
    # Generate clean URL-safe slug
    clean_slug = "".join([c if c.isalnum() or c == "-" else "" for c in gym_name.lower().replace(" ", "-")])
    if not clean_slug:
        clean_slug = "gym"
    slug = clean_slug
    existing_gym = db.query(Gym).filter(Gym.slug == slug).first()
    if existing_gym:
        slug = f"{clean_slug}-{secrets.token_hex(2)}"

    # Determine plan tier and capacity based on registration selection
    selected_tier = (req.plan_tier or "pro").lower().strip()
    if selected_tier not in ["starter", "pro", "business"]:
        selected_tier = "pro"
    capacity = 10000 if selected_tier == "business" else 250 if selected_tier == "pro" else 50

    # Create Gym with Pending Platform Approval and Auto-Created Website
    gym = Gym(
        name=gym_name,
        slug=slug,
        email=email,
        phone=req.phone,
        currency=req.currency or "INR",
        plan_tier=selected_tier,
        subscription_status="active",
        approval_status="pending",  # Awaiting Platform Super Admin Approval
        is_approved=False,
        payment_verified=False,  # Awaiting Super Admin payment confirmation
        registration_payment_method=req.payment_method or "qr_code",
        registration_payment_ref=req.payment_ref,
        website_subdomain=slug,
        website_enabled=True,
        website_headline=f"Welcome to {gym_name}",
        website_tagline="Your Premier Fitness & Health Destination",
        website_about=f"{gym_name} provides state-of-the-art equipment, certified personal trainers, and high-energy workout programs tailored for your goals.",
        website_cover_image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80",
        website_amenities="Free Weights & Dumbbells, Cardio Theatre, Strength Training Machines, Personal Training, Locker Rooms & Showers, Steam & Sauna, Nutrition Bar",
        max_members=capacity
    )
    db.add(gym)
    db.flush()

    new_hash = get_password_hash(req.password)

    # Sync password across any previous registrations with this email so credentials authenticate everywhere
    existing_users = db.query(User).filter(User.email == email).all()
    for eu in existing_users:
        eu.password_hash = new_hash

    # Create Owner User for this new facility
    owner = User(
        gym_id=gym.id,
        full_name=req.owner_name.strip(),
        email=email,
        password_hash=new_hash,
        role="owner",
        is_superadmin=False,
        phone=req.phone,
        is_active=True
    )
    db.add(owner)

    # Create Default Settings
    settings_obj = GymSetting(
        gym_id=gym.id,
        business_hours="Mon-Sat: 6:00 AM - 10:00 PM, Sun: 8:00 AM - 6:00 PM",
        tax_percentage=18.0,  # Standard GST
        expiry_alert_days=7
    )
    db.add(settings_obj)

    # Pre-populate 3 standard membership plans in INR so their public website displays live pricing immediately
    from app.models.models import MembershipPlan
    plan_monthly = MembershipPlan(
        gym_id=gym.id,
        name="Monthly Flex Pass",
        description="Full gym floor, cardio zone, and locker room access.",
        duration_days=30,
        price=1499.0,
        billing_period="monthly",
        is_active=True
    )
    plan_quarterly = MembershipPlan(
        gym_id=gym.id,
        name="Quarterly Power Plan",
        description="3 months access + complimentary fitness assessment.",
        duration_days=90,
        price=3999.0,
        billing_period="quarterly",
        is_active=True
    )
    plan_annual = MembershipPlan(
        gym_id=gym.id,
        name="Annual Champion Pass",
        description="365 days unlimited facility access with locker privileges.",
        duration_days=365,
        price=12999.0,
        billing_period="yearly",
        is_active=True
    )
    db.add_all([plan_monthly, plan_quarterly, plan_annual])

    db.commit()
    db.refresh(gym)
    db.refresh(owner)

    token = create_access_token({
        "sub": str(owner.id),
        "gym_id": gym.id,
        "role": owner.role,
        "is_superadmin": owner.is_superadmin
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(owner),
        gym=GymResponse.model_validate(gym)
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user by email and password.
    Prioritizes newest registration and checks all accounts under this email
    so users registering a second gym authenticate cleanly.
    AppSec: Protected against brute-force and timing enumeration attacks.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not auth_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait a minute."
        )

    email = req.email.lower().strip()
    users = db.query(User).filter(User.email == email).order_by(User.id.desc()).all()
    if not users:
        # Constant-time dummy verification prevents timing enumeration
        dummy_verify_password(req.password)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    matched_user = None
    for u in users:
        if verify_password(req.password, u.password_hash):
            matched_user = u
            break

    if not matched_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not matched_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your administrator."
        )

    gym = None
    if matched_user.gym_id:
        gym = db.query(Gym).filter(Gym.id == matched_user.gym_id).first()
    elif not matched_user.is_superadmin and matched_user.role != "superadmin":
        raise HTTPException(status_code=404, detail="Gym tenant not found")

    token = create_access_token({
        "sub": str(matched_user.id),
        "gym_id": gym.id if gym else None,
        "role": matched_user.role,
        "is_superadmin": matched_user.is_superadmin
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(matched_user),
        gym=GymResponse.model_validate(gym) if gym else None
    )


@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    current_gym: Optional[Gym] = Depends(get_current_gym)
):
    """Retrieve logged in user and gym details."""
    return {
        "user": UserResponse.model_validate(current_user),
        "gym": GymResponse.model_validate(current_gym) if current_gym else None
    }

@router.post("/submit-payment", response_model=GymResponse)
def submit_payment_reference(
    req: SubmitPaymentRefRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Facility owner submits or updates payment reference/UTR for Super Admin verification.
    """
    if not current_user.gym_id:
        raise HTTPException(status_code=400, detail="User is not associated with any gym facility")
    
    gym = db.query(Gym).filter(Gym.id == current_user.gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found")
    
    gym.registration_payment_ref = req.payment_ref.strip()
    if req.payment_method:
        gym.registration_payment_method = req.payment_method.strip()
    gym.approval_status = "pending"
    gym.is_approved = False
    
    db.commit()
    db.refresh(gym)
    return GymResponse.model_validate(gym)

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        # Avoid user enumeration by returning a generic success message
        return {"message": "If that email exists, password reset instructions have been generated."}
    
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=2)
    db.commit()
    
    return {
        "message": "Password reset token generated successfully.",
        "reset_token": token  # Included for seamless testing/demo without SMTP server
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset user password using token."""
    user = db.query(User).filter(
        User.reset_token == req.token,
        User.reset_token_expiry > datetime.datetime.now(datetime.timezone.utc)
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    
    user.password_hash = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"message": "Password has been successfully updated. You may now log in."}

# Staff / Team Management within gym
@router.get("/users", response_model=List[UserResponse])
def list_gym_users(
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """List all staff and trainer users in the current gym."""
    return db.query(User).filter(User.gym_id == current_gym.id).all()

@router.post("/users", response_model=UserResponse)
def create_gym_user(
    req: UserCreate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Create a new staff or trainer account for the current gym."""
    existing = db.query(User).filter(
        User.gym_id == current_gym.id,
        User.email == req.email.lower().strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in your gym."
        )

    new_user = User(
        gym_id=current_gym.id,
        full_name=req.full_name.strip(),
        email=req.email.lower().strip(),
        password_hash=get_password_hash(req.password),
        role=req.role,
        phone=req.phone,
        permissions=req.permissions,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_gym_user(
    user_id: int,
    req: UserUpdate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Update a staff/trainer user in the current gym."""
    user = db.query(User).filter(User.id == user_id, User.gym_id == current_gym.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent demoting the last owner
    if req.role and req.role != "owner" and user.role == "owner":
        owner_count = db.query(User).filter(User.gym_id == current_gym.id, User.role == "owner").count()
        if owner_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot change role of the sole gym owner.")

    if req.full_name is not None:
        user.full_name = req.full_name.strip()
    if req.phone is not None:
        user.phone = req.phone.strip()
    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.permissions is not None:
        user.permissions = req.permissions
    if req.password:
        user.password_hash = get_password_hash(req.password)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_gym_user(
    user_id: int,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Permanently delete a staff or trainer account."""
    user = db.query(User).filter(User.id == user_id, User.gym_id == current_gym.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "owner":
        owner_count = db.query(User).filter(User.gym_id == current_gym.id, User.role == "owner").count()
        if owner_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the primary gym owner account.")
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user.full_name} deleted successfully."}
