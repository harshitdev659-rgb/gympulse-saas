import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# ----------------- Auth & User Schemas -----------------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"
    gym: "GymResponse"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterGymRequest(BaseModel):
    gym_name: str = Field(..., min_length=2, max_length=100)
    owner_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    currency: str = "INR"

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "staff"  # admin, trainer, staff
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    gym_id: int
    full_name: str
    email: str
    role: str
    is_superadmin: bool = False
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

# ----------------- Gym & Settings Schemas -----------------
class GymResponse(BaseModel):
    id: int
    name: str
    slug: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    currency: str = "INR"
    logo_url: Optional[str] = None
    plan_tier: str
    subscription_status: str
    approval_status: str = "pending"
    is_approved: bool = False
    payment_verified: bool = True
    website_subdomain: Optional[str] = None
    website_enabled: bool = True
    website_headline: Optional[str] = None
    website_tagline: Optional[str] = None
    website_about: Optional[str] = None
    website_cover_image: Optional[str] = None
    website_amenities: Optional[str] = None
    website_custom_domain: Optional[str] = None
    max_members: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class GymUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = None
    logo_url: Optional[str] = None

class GymSettingResponse(BaseModel):
    id: int
    gym_id: int
    business_hours: str
    tax_percentage: float
    expiry_alert_days: int
    receipt_footer_text: str
    primary_color: str

    model_config = ConfigDict(from_attributes=True)

class GymSettingUpdate(BaseModel):
    business_hours: Optional[str] = None
    tax_percentage: Optional[float] = None
    expiry_alert_days: Optional[int] = None
    receipt_footer_text: Optional[str] = None
    primary_color: Optional[str] = None

# ----------------- Membership Plan Schemas -----------------
class PlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_days: int = Field(..., gt=0)
    price: float = Field(..., ge=0)
    billing_period: str = "monthly"  # monthly, quarterly, half_yearly, yearly, custom
    is_active: bool = True

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_days: Optional[int] = None
    price: Optional[float] = None
    billing_period: Optional[str] = None
    is_active: Optional[bool] = None

class PlanResponse(BaseModel):
    id: int
    gym_id: int
    name: str
    description: Optional[str] = None
    duration_days: int
    price: float
    billing_period: str
    is_active: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Member Schemas -----------------
class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: str
    date_of_birth: Optional[datetime.date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"
    join_date: Optional[datetime.date] = None
    assigned_trainer_id: Optional[int] = None

    # Optional initial plan assignment
    initial_plan_id: Optional[int] = None
    initial_start_date: Optional[datetime.date] = None

    # Manual Membership support
    manual_plan_name: Optional[str] = None
    manual_duration_days: Optional[int] = None
    manual_price: Optional[float] = None
    manual_payment_method: Optional[str] = None

class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime.date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    assigned_trainer_id: Optional[int] = None

class MemberResponse(BaseModel):
    id: int
    gym_id: int
    first_name: str
    last_name: str
    full_name: str
    email: Optional[str] = None
    phone: str
    date_of_birth: Optional[datetime.date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    status: str
    join_date: datetime.date
    assigned_trainer_id: Optional[int] = None
    created_at: datetime.datetime
    # Computed current membership end date if active
    current_plan_name: Optional[str] = None
    membership_expiry_date: Optional[datetime.date] = None
    is_expiring_soon: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

# ----------------- Member Membership Schemas -----------------
class AssignMembershipRequest(BaseModel):
    plan_id: int
    start_date: Optional[datetime.date] = None
    custom_end_date: Optional[datetime.date] = None
    price_paid: Optional[float] = None
    payment_method: Optional[str] = "cash"  # If recording payment simultaneously
    record_payment: bool = True
    notes: Optional[str] = None

class MemberMembershipResponse(BaseModel):
    id: int
    gym_id: int
    member_id: int
    plan_id: int
    plan_name: Optional[str] = None
    start_date: datetime.date
    end_date: datetime.date
    price_paid: float
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Attendance Schemas -----------------
class CheckInRequest(BaseModel):
    member_id: int
    method: str = "manual"  # manual, qr, kiosk
    notes: Optional[str] = None

class CheckOutRequest(BaseModel):
    attendance_id: int

class AttendanceResponse(BaseModel):
    id: int
    gym_id: int
    member_id: int
    member_name: Optional[str] = None
    member_phone: Optional[str] = None
    check_in_time: datetime.datetime
    check_out_time: Optional[datetime.datetime] = None
    method: str
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- Payment Schemas -----------------
class PaymentCreate(BaseModel):
    member_id: int
    membership_id: Optional[int] = None
    amount: float = Field(..., gt=0)
    payment_date: Optional[datetime.date] = None
    payment_method: str = "cash"  # cash, card, bank_transfer, online, other
    status: str = "completed"
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    gym_id: int
    member_id: int
    member_name: Optional[str] = None
    membership_id: Optional[int] = None
    plan_name: Optional[str] = None
    amount: float
    payment_date: datetime.date
    payment_method: str
    status: str
    invoice_number: str
    receipt_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Trainer Schemas -----------------
class TrainerCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str
    specialty: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: float = 0.0
    is_active: bool = True
    create_user_account: bool = False
    password: Optional[str] = None

class TrainerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None

class TrainerResponse(BaseModel):
    id: int
    gym_id: int
    user_id: Optional[int] = None
    name: str
    email: Optional[str] = None
    phone: str
    specialty: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: float
    is_active: bool
    assigned_members_count: int = 0
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Detailed Member View -----------------
class MemberDetailResponse(MemberResponse):
    memberships: List[MemberMembershipResponse] = []
    payments: List[PaymentResponse] = []
    attendance_records: List[AttendanceResponse] = []
    total_attended: int = 0
    total_paid: float = 0.0

# ----------------- Dashboard & Reports Schemas -----------------
class DashboardStatsResponse(BaseModel):
    total_members: int
    active_members: int
    expired_members: int
    expiring_soon_members: int
    today_attendance: int
    active_now: int
    monthly_revenue: float
    last_month_revenue: float
    pending_payments_count: int
    pending_payments_amount: float
    new_members_this_month: int
    recent_checkins: List[AttendanceResponse] = []
    attendance_chart_data: List[dict] = []
    revenue_chart_data: List[dict] = []

# ----------------- AI Assistant Schemas -----------------
class AIQueryRequest(BaseModel):
    query: str

class AIQueryResponse(BaseModel):
    query: str
    answer: str
    suggested_actions: List[dict] = []
    data: Optional[Any] = None

# ----------------- SaaS Billing Schemas -----------------
class BillingStatusResponse(BaseModel):
    plan_tier: str
    subscription_status: str
    member_count: int
    max_members: int
    usage_percentage: float
    can_add_member: bool
    ai_enabled: bool
    features: List[str]

class UpgradePlanRequest(BaseModel):
    target_tier: str  # pro, business
    billing_cycle: str = "monthly"  # monthly, yearly

# ----------------- Public Website & Inquiry Schemas -----------------
class GymWebsiteUpdate(BaseModel):
    website_subdomain: Optional[str] = None
    website_enabled: Optional[bool] = None
    website_headline: Optional[str] = None
    website_tagline: Optional[str] = None
    website_about: Optional[str] = None
    website_cover_image: Optional[str] = None
    website_amenities: Optional[str] = None
    website_custom_domain: Optional[str] = None

class GymInquiryCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: str
    plan_name: Optional[str] = None
    message: Optional[str] = None

class GymInquiryResponse(BaseModel):
    id: int
    gym_id: int
    full_name: str
    email: Optional[str] = None
    phone: str
    plan_name: Optional[str] = None
    message: Optional[str] = None
    status: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Super Admin Platform Schemas -----------------
class PlatformGymApprovalRequest(BaseModel):
    action: str  # "approve" or "reject"
    notes: Optional[str] = None

class PlatformGymItem(BaseModel):
    id: int
    name: str
    slug: str
    email: str
    phone: Optional[str] = None
    currency: str
    plan_tier: str
    subscription_status: str
    approval_status: str
    is_approved: bool
    payment_verified: bool
    website_subdomain: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    member_count: int = 0
    created_at: datetime.datetime

# ----------------- Gym Decommissioning Schemas -----------------
class GymDecommissionRequest(BaseModel):
    password: str
    confirm_gym_name: str

class GymDecommissionResponse(BaseModel):
    success: bool
    message: str
    deleted_slug: str

