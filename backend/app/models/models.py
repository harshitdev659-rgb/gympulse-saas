import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, ForeignKey, 
    Text, Date, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class Gym(Base):
    __tablename__ = "gyms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    currency = Column(String(10), default="INR", nullable=False)  # INR, USD, EUR, GBP, etc.
    logo_url = Column(String(500), nullable=True)
    plan_tier = Column(String(50), default="free", nullable=False)  # free, pro, business
    subscription_status = Column(String(50), default="active", nullable=False)  # active, past_due, trialing
    approval_status = Column(String(50), default="pending", nullable=False)  # pending, approved, rejected
    is_approved = Column(Boolean, default=False, nullable=False)
    payment_verified = Column(Boolean, default=True, nullable=False)
    website_subdomain = Column(String(100), unique=True, index=True, nullable=True)
    website_enabled = Column(Boolean, default=True, nullable=False)
    website_headline = Column(String(255), nullable=True)
    website_tagline = Column(Text, nullable=True)
    website_about = Column(Text, nullable=True)
    website_cover_image = Column(String(500), nullable=True)
    website_amenities = Column(Text, nullable=True)
    website_custom_domain = Column(String(255), nullable=True)
    max_members = Column(Integer, default=25, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    users = relationship("User", back_populates="gym", cascade="all, delete-orphan")
    members = relationship("Member", back_populates="gym", cascade="all, delete-orphan")
    plans = relationship("MembershipPlan", back_populates="gym", cascade="all, delete-orphan")
    memberships = relationship("MemberMembership", back_populates="gym", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="gym", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="gym", cascade="all, delete-orphan")
    trainers = relationship("Trainer", back_populates="gym", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="gym", cascade="all, delete-orphan")
    settings = relationship("GymSetting", back_populates="gym", uselist=False, cascade="all, delete-orphan")
    inquiries = relationship("GymInquiry", back_populates="gym", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="staff", nullable=False)  # superadmin, owner, admin, trainer, staff
    is_superadmin = Column(Boolean, default=False, nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="users")
    
    # Composite unique constraint on email per gym
    __table_args__ = (
        Index("ix_user_gym_email", "gym_id", "email", unique=True),
    )


class MembershipPlan(Base):
    __tablename__ = "membership_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, nullable=False)  # e.g. 30, 90, 180, 365, custom
    price = Column(Float, nullable=False)
    billing_period = Column(String(50), default="monthly", nullable=False)  # monthly, quarterly, half_yearly, yearly, custom
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="plans")
    member_memberships = relationship("MemberMembership", back_populates="plan")

class Member(Base):
    __tablename__ = "members"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(150), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    photo_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False, index=True)  # active, expired, pending, frozen
    join_date = Column(Date, default=datetime.date.today, nullable=False)
    assigned_trainer_id = Column(Integer, ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="members")
    assigned_trainer = relationship("Trainer", back_populates="assigned_members")
    memberships = relationship("MemberMembership", back_populates="member", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="member", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="member", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

class MemberMembership(Base):
    __tablename__ = "member_memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("membership_plans.id", ondelete="RESTRICT"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False, index=True)
    price_paid = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="active", nullable=False)  # active, expired, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="memberships")
    member = relationship("Member", back_populates="memberships")
    plan = relationship("MembershipPlan", back_populates="member_memberships")
    payments = relationship("Payment", back_populates="membership")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    check_in_time = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    check_out_time = Column(DateTime, nullable=True)
    method = Column(String(50), default="manual", nullable=False)  # manual, qr, kiosk
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="attendance_records")
    member = relationship("Member", back_populates="attendance_records")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey("member_memberships.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, default=datetime.date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="cash", nullable=False)  # cash, card, bank_transfer, online, other
    status = Column(String(50), default="completed", nullable=False)  # completed, pending, refunded
    invoice_number = Column(String(100), nullable=False, index=True)
    receipt_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="payments")
    member = relationship("Member", back_populates="payments")
    membership = relationship("MemberMembership", back_populates="payments")

class Trainer(Base):
    __tablename__ = "trainers"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False)
    specialty = Column(String(255), nullable=True)  # e.g., Bodybuilding, Yoga, Crossfit, HIIT
    bio = Column(Text, nullable=True)
    hourly_rate = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="trainers")
    assigned_members = relationship("Member", back_populates="assigned_trainer")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="system", nullable=False)  # expiry_reminder, payment_due, system, welcome
    recipient_email = Column(String(255), nullable=True)
    status = Column(String(50), default="sent", nullable=False)  # sent, pending, failed
    sent_at = Column(DateTime, default=get_utc_now, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="notifications")

class GymSetting(Base):
    __tablename__ = "gym_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    business_hours = Column(String(255), default="Mon-Sat: 6:00 AM - 10:00 PM, Sun: 8:00 AM - 6:00 PM")
    tax_percentage = Column(Float, default=0.0)
    expiry_alert_days = Column(Integer, default=7)
    receipt_footer_text = Column(Text, default="Thank you for training with us! Keep pushing your limits.")
    primary_color = Column(String(20), default="#3b82f6")
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="settings")

class GymInquiry(Base):
    __tablename__ = "gym_inquiries"
    
    id = Column(Integer, primary_key=True, index=True)
    gym_id = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False)
    plan_name = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(50), default="new", nullable=False)  # new, contacted, converted
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    gym = relationship("Gym", back_populates="inquiries")

