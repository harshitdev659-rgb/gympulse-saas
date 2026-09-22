import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_staff_or_above
from app.models.models import (
    Gym, User, Member, MemberMembership, MembershipPlan, Payment
)
from app.schemas.schemas import AssignMembershipRequest, MemberMembershipResponse

router = APIRouter(prefix="/memberships", tags=["Member Subscriptions"])

@router.post("/assign/{member_id}", response_model=MemberMembershipResponse)
def assign_or_renew_membership(
    member_id: int,
    req: AssignMembershipRequest,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Assign or renew a membership plan to a member with automatic expiry calculation."""
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.gym_id == current_gym.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    plan = db.query(MembershipPlan).filter(
        MembershipPlan.id == req.plan_id,
        MembershipPlan.gym_id == current_gym.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")

    # Determine start date
    today = datetime.date.today()
    start_date = req.start_date or today

    # If the member currently has an active membership that ends in the future,
    # and they are renewing, roll forward from that end date!
    existing_active = (
        db.query(MemberMembership)
        .filter(
            MemberMembership.gym_id == current_gym.id,
            MemberMembership.member_id == member.id,
            MemberMembership.status == "active",
            MemberMembership.end_date >= today
        )
        .order_by(MemberMembership.end_date.desc())
        .first()
    )
    if existing_active and not req.start_date:
        start_date = existing_active.end_date + datetime.timedelta(days=1)

    # Automatic end date calculation
    if req.custom_end_date:
        end_date = req.custom_end_date
    else:
        end_date = start_date + datetime.timedelta(days=plan.duration_days)

    price_to_pay = req.price_paid if req.price_paid is not None else plan.price

    new_membership = MemberMembership(
        gym_id=current_gym.id,
        member_id=member.id,
        plan_id=plan.id,
        start_date=start_date,
        end_date=end_date,
        price_paid=price_to_pay,
        status="active",
        notes=req.notes
    )
    db.add(new_membership)
    db.flush()

    # Update member status to active
    member.status = "active"

    # Optional immediate payment recording
    if req.record_payment and price_to_pay > 0:
        inv = f"INV-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{member.id}-{new_membership.id}"
        payment = Payment(
            gym_id=current_gym.id,
            member_id=member.id,
            membership_id=new_membership.id,
            amount=price_to_pay,
            payment_date=today,
            payment_method=req.payment_method or "cash",
            status="completed",
            invoice_number=inv,
            notes=f"Membership renewal: {plan.name}"
        )
        db.add(payment)

    db.commit()
    db.refresh(new_membership)

    return MemberMembershipResponse(
        id=new_membership.id,
        gym_id=new_membership.gym_id,
        member_id=new_membership.member_id,
        plan_id=new_membership.plan_id,
        plan_name=plan.name,
        start_date=new_membership.start_date,
        end_date=new_membership.end_date,
        price_paid=new_membership.price_paid,
        status=new_membership.status,
        notes=new_membership.notes,
        created_at=new_membership.created_at
    )

@router.patch("/{membership_id}/cancel")
def cancel_membership(
    membership_id: int,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Cancel an active membership."""
    mm = db.query(MemberMembership).filter(
        MemberMembership.id == membership_id,
        MemberMembership.gym_id == current_gym.id
    ).first()
    if not mm:
        raise HTTPException(status_code=404, detail="Membership record not found")

    mm.status = "cancelled"
    db.commit()
    return {"message": "Membership successfully cancelled."}
