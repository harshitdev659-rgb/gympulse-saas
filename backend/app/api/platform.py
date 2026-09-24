from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
    pending_approvals = db.query(Gym).filter(Gym.approval_status == "pending").count()
    active_facilities = db.query(Gym).filter(Gym.approval_status == "approved").count()
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
