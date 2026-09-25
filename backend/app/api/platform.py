from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.database import get_db
from app.core.dependencies import require_superadmin
from app.models.models import Gym, User, Member, Notification
from app.schemas.schemas import PlatformGymItem, PlatformGymApprovalRequest, GymResponse

router = APIRouter(prefix="/platform", tags=["Platform Super Admin Console"])

@router.get("/metrics")
def get_platform_metrics(
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Overview stats for the Platform Owner / Super Admin."""
    total_gyms = db.query(Gym).count()
    
    # Check both case-insensitive approval status, is_approved boolean, and active subscription status
    active_facilities = db.query(Gym).filter(
        or_(
            func.lower(Gym.approval_status) == "approved",
            Gym.is_approved == True,
            (Gym.subscription_status == "active") & (func.lower(Gym.approval_status) != "rejected")
        )
    ).count()

    pending_approvals = db.query(Gym).filter(
        or_(
            func.lower(Gym.approval_status) == "pending",
            (Gym.is_approved == False) & (func.lower(Gym.approval_status) != "rejected")
        )
    ).count()

    total_athletes = db.query(Member).count()
    
    # Estimate MRR in INR based on active facilities
    platform_mrr = active_facilities * 2499.0

    return {
        "total_gyms": total_gyms,
        "pending_approvals": pending_approvals,
        "active_facilities": active_facilities,
        "total_athletes": total_athletes,
        "platform_mrr": platform_mrr,
        "currency": "INR"
    }

@router.get("/gyms", response_model=List[PlatformGymItem])
def list_all_platform_gyms(
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """List all registered facilities with owner contact, plan tier, and approval status."""
    gyms = db.query(Gym).order_by(Gym.created_at.desc()).all()
    results = []
    
    for g in gyms:
        owner = db.query(User).filter(User.gym_id == g.id, User.role == "owner").first()
        mem_count = db.query(Member).filter(Member.gym_id == g.id).count()
        results.append(
            PlatformGymItem(
                id=g.id,
                name=g.name,
                slug=g.slug,
                email=g.email,
                phone=g.phone,
                currency=g.currency,
                plan_tier=g.plan_tier,
                subscription_status=g.subscription_status,
                approval_status=g.approval_status,
                is_approved=g.is_approved,
                payment_verified=g.payment_verified,
                registration_payment_method=g.registration_payment_method or "qr_code",
                registration_payment_ref=g.registration_payment_ref,
                requested_plan_tier=g.requested_plan_tier,
                tier_upgrade_status=g.tier_upgrade_status or "none",
                tier_upgrade_requested_at=g.tier_upgrade_requested_at,
                website_subdomain=g.website_subdomain,
                owner_name=owner.full_name if owner else "N/A",
                owner_email=owner.email if owner else g.email,
                member_count=mem_count,
                created_at=g.created_at
            )
        )
    return results

@router.post("/gyms/{gym_id}/approve-upgrade", response_model=GymResponse)
def approve_tier_upgrade(
    gym_id: int,
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Super Admin confirms receipt of offline/online payment and approves SaaS tier upgrade.
    """
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found")
    
    from app.services.billing_service import BillingService
    approved_gym = BillingService.approve_upgrade(gym, db)

    notif = Notification(
        gym_id=gym.id,
        title="Subscription Tier Upgraded!",
        message=f"Payment verified! Your facility plan has been upgraded to {approved_gym.plan_tier.upper()} tier.",
        type="system"
    )
    db.add(notif)
    db.commit()
    db.refresh(approved_gym)

    return GymResponse.model_validate(approved_gym)

@router.post("/gyms/{gym_id}/approve", response_model=GymResponse)
def approve_gym_facility(
    gym_id: int,
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Approve a facility application, unlocking operational features for the gym owner.
    """
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found")

    gym.approval_status = "approved"
    gym.is_approved = True
    gym.payment_verified = True
    gym.subscription_status = "active"

    # Send confirmation notification to gym
    notif = Notification(
        gym_id=gym.id,
        title="Facility Application Approved!",
        message="Your gym facility has been reviewed and approved by the Platform Administrator. All operational modules and floor check-ins are now fully unlocked.",
        type="system"
    )
    db.add(notif)
    db.commit()
    db.refresh(gym)

    return GymResponse.model_validate(gym)

@router.post("/gyms/approve-all")
def approve_all_pending_gyms(
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Approve all pending gym facilities in a single batch operation."""
    pending_gyms = db.query(Gym).filter(
        or_(
            func.lower(Gym.approval_status) == "pending",
            Gym.is_approved == False
        )
    ).all()
    count = 0
    for g in pending_gyms:
        g.approval_status = "approved"
        g.is_approved = True
        g.payment_verified = True
        g.subscription_status = "active"
        count += 1
    db.commit()
    return {"approved_count": count, "message": f"Successfully approved {count} facility applications."}

# ----------------- Platform Subscription Payment Settings -----------------
PLATFORM_PAYMENT_CONFIG = {
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=upi://pay?pa=gympulse.admin@upi%26pn=GymPulse%20SaaS%20Platform%26cu=INR",
    "upi_id": "gympulse.admin@upi",
    "payee_name": "GymPulse SaaS Platform",
    "card_enabled": True,
    "cash_enabled": True,
    "instructions": "Scan QR Code with PhonePe, Google Pay, or Paytm. Enter the transaction reference ID during registration for Super Admin verification."
}

@router.get("/payment-settings")
def get_platform_payment_settings():
    """Retrieve platform subscription payment details (QR code, UPI, Bank) - accessible for gym registration."""
    return PLATFORM_PAYMENT_CONFIG

@router.post("/payment-settings")
def update_platform_payment_settings(
    settings: Dict[str, Any],
    current_admin: User = Depends(require_superadmin)
):
    """Super Admin updates platform subscription payment methods and QR code."""
    for key in PLATFORM_PAYMENT_CONFIG:
        if key in settings:
            PLATFORM_PAYMENT_CONFIG[key] = settings[key]
    return PLATFORM_PAYMENT_CONFIG

@router.post("/gyms/{gym_id}/reject", response_model=GymResponse)
def reject_gym_facility(
    gym_id: int,
    req: PlatformGymApprovalRequest,
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Reject a gym registration application."""
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found")

    gym.approval_status = "rejected"
    gym.is_approved = False

    reason = req.notes or "Facility documentation or payment verification requirements were not met."
    notif = Notification(
        gym_id=gym.id,
        title="Facility Application Requires Review",
        message=f"Your facility application status has been updated: {reason}",
        type="system"
    )
    return GymResponse.model_validate(gym)

@router.delete("/gyms/{gym_id}")
def delete_gym_facility(
    gym_id: int,
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Super Admin deletion authority:
    Permanently deletes a facility and purges its dedicated public website and all tenant records.
    """
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found")

    gym_name = gym.name
    gym_slug = gym.slug
    website_slug = gym.website_subdomain or gym.slug

    from app.models.models import (
        GymInquiry, Notification, Payment, Attendance,
        MemberMembership, Member, MembershipPlan, Trainer, GymSetting, User
    )
    # If the operating superadmin was associated with this gym, detach them first
    if current_admin.gym_id == gym_id:
        current_admin.gym_id = None
        db.add(current_admin)
        db.flush()

    # Reassign or detach any other superadmin users before cascade
    db.query(User).filter(User.gym_id == gym_id, User.is_superadmin == True).update({"gym_id": None}, synchronize_session=False)

    db.query(GymInquiry).filter(GymInquiry.gym_id == gym_id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.gym_id == gym_id).delete(synchronize_session=False)
    db.query(Payment).filter(Payment.gym_id == gym_id).delete(synchronize_session=False)
    db.query(Attendance).filter(Attendance.gym_id == gym_id).delete(synchronize_session=False)
    db.query(MemberMembership).filter(MemberMembership.gym_id == gym_id).delete(synchronize_session=False)
    db.query(Member).filter(Member.gym_id == gym_id).delete(synchronize_session=False)
    db.query(MembershipPlan).filter(MembershipPlan.gym_id == gym_id).delete(synchronize_session=False)
    db.query(Trainer).filter(Trainer.gym_id == gym_id).delete(synchronize_session=False)
    db.query(GymSetting).filter(GymSetting.gym_id == gym_id).delete(synchronize_session=False)
    db.query(User).filter(User.gym_id == gym_id, User.is_superadmin == False).delete(synchronize_session=False)
    db.delete(gym)
    db.commit()

    return {
        "success": True,
        "message": f"Facility '{gym_name}' and its public website ('/facility/{website_slug}') have been permanently deleted.",
        "deleted_id": gym_id,
        "deleted_slug": gym_slug
    }

@router.post("/gyms/remove-all-active")
def remove_all_active_gyms(
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Permanently delete all currently active gym facilities and their tenant records."""
    active_gyms = db.query(Gym).filter(
        or_(
            func.lower(Gym.approval_status) == "approved",
            Gym.is_approved == True,
            (Gym.subscription_status == "active") & (func.lower(Gym.approval_status) != "rejected")
        )
    ).all()

    active_ids = [g.id for g in active_gyms]
    count = len(active_ids)

    if count > 0:
        from app.models.models import (
            GymInquiry, Notification, Payment, Attendance,
            MemberMembership, Member, MembershipPlan, Trainer, GymSetting, User
        )
        if current_admin.gym_id in active_ids:
            current_admin.gym_id = None
            db.add(current_admin)
            db.flush()

        db.query(User).filter(User.gym_id.in_(active_ids), User.is_superadmin == True).update({"gym_id": None}, synchronize_session=False)
        db.query(GymInquiry).filter(GymInquiry.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(Notification).filter(Notification.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(Payment).filter(Payment.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(Attendance).filter(Attendance.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(MemberMembership).filter(MemberMembership.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(Member).filter(Member.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(MembershipPlan).filter(MembershipPlan.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(Trainer).filter(Trainer.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(GymSetting).filter(GymSetting.gym_id.in_(active_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.gym_id.in_(active_ids), User.is_superadmin == False).delete(synchronize_session=False)
        db.query(Gym).filter(Gym.id.in_(active_ids)).delete(synchronize_session=False)
        db.commit()

    return {
        "success": True,
        "removed_count": count,
        "message": f"Successfully removed all {count} active gym facilities."
    }

@router.post("/gyms/remove-all")
def remove_all_gyms(
    current_admin: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Permanently delete all gym facilities across the entire platform."""
    all_gyms = db.query(Gym).all()
    all_ids = [g.id for g in all_gyms]
    count = len(all_ids)

    if count > 0:
        from app.models.models import (
            GymInquiry, Notification, Payment, Attendance,
            MemberMembership, Member, MembershipPlan, Trainer, GymSetting, User
        )
        if current_admin.gym_id in all_ids:
            current_admin.gym_id = None
            db.add(current_admin)
            db.flush()

        db.query(User).filter(User.gym_id.in_(all_ids), User.is_superadmin == True).update({"gym_id": None}, synchronize_session=False)
        db.query(GymInquiry).filter(GymInquiry.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(Notification).filter(Notification.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(Payment).filter(Payment.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(Attendance).filter(Attendance.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(MemberMembership).filter(MemberMembership.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(Member).filter(Member.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(MembershipPlan).filter(MembershipPlan.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(Trainer).filter(Trainer.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(GymSetting).filter(GymSetting.gym_id.in_(all_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.gym_id.in_(all_ids), User.is_superadmin == False).delete(synchronize_session=False)
        db.query(Gym).filter(Gym.id.in_(all_ids)).delete(synchronize_session=False)
        db.commit()

    return {
        "success": True,
        "removed_count": count,
        "message": f"Successfully removed all {count} gym facilities."
    }
