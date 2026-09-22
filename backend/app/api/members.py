import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_staff_or_above, require_approved_gym
from app.models.models import (
    Gym, User, Member, MemberMembership, MembershipPlan, 
    Payment, Attendance, Trainer
)
from app.schemas.schemas import (
    MemberCreate, MemberUpdate, MemberResponse, MemberDetailResponse,
    MemberMembershipResponse, PaymentResponse, AttendanceResponse
)
from app.services.billing_service import BillingService

router = APIRouter(prefix="/members", tags=["Members Management"])

def enrich_member_response(m: Member, db: Session, gym_id: int) -> MemberResponse:
    """Compute active plan and expiry status for a member."""
    today = datetime.date.today()
    active_membership = (
        db.query(MemberMembership, MembershipPlan)
        .join(MembershipPlan, MemberMembership.plan_id == MembershipPlan.id)
        .filter(
            MemberMembership.gym_id == gym_id,
            MemberMembership.member_id == m.id,
            MemberMembership.status == "active"
        )
        .order_by(MemberMembership.end_date.desc())
        .first()
    )

    plan_name = None
    expiry_date = None
    is_expiring_soon = False

    if active_membership:
        mm, p = active_membership
        plan_name = p.name
        expiry_date = mm.end_date
        if today <= mm.end_date <= today + datetime.timedelta(days=7):
            is_expiring_soon = True
        elif mm.end_date < today and m.status == "active":
            # Auto update status if expired
            m.status = "expired"
            mm.status = "expired"
            db.commit()

    return MemberResponse(
        id=m.id,
        gym_id=m.gym_id,
        first_name=m.first_name,
        last_name=m.last_name,
        full_name=m.full_name,
        email=m.email,
        phone=m.phone,
        date_of_birth=m.date_of_birth,
        gender=m.gender,
        address=m.address,
        emergency_contact_name=m.emergency_contact_name,
        emergency_contact_phone=m.emergency_contact_phone,
        photo_url=m.photo_url,
        notes=m.notes,
        status=m.status,
        join_date=m.join_date,
        assigned_trainer_id=m.assigned_trainer_id,
        created_at=m.created_at,
        current_plan_name=plan_name,
        membership_expiry_date=expiry_date,
        is_expiring_soon=is_expiring_soon
    )

@router.get("", response_model=List[MemberResponse])
def list_members(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    expiring_soon: bool = False,
    trainer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """List members strictly for current gym with search, filters, and pagination."""
    query = db.query(Member).filter(Member.gym_id == current_gym.id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Member.first_name.ilike(search_term),
                Member.last_name.ilike(search_term),
                Member.phone.ilike(search_term),
                Member.email.ilike(search_term)
            )
        )

    if status_filter and status_filter != "all":
        query = query.filter(Member.status == status_filter)

    if trainer_id:
        query = query.filter(Member.assigned_trainer_id == trainer_id)

    today = datetime.date.today()
    if expiring_soon:
        target_date = today + datetime.timedelta(days=7)
        expiring_member_ids = (
            db.query(MemberMembership.member_id)
            .filter(
                MemberMembership.gym_id == current_gym.id,
                MemberMembership.status == "active",
                MemberMembership.end_date >= today,
                MemberMembership.end_date <= target_date
            )
            .subquery()
        )
        query = query.filter(Member.id.in_(expiring_member_ids))

    members = query.order_by(Member.created_at.desc()).offset(skip).limit(limit).all()
    return [enrich_member_response(m, db, current_gym.id) for m in members]

@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    req: MemberCreate,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(require_approved_gym),
    db: Session = Depends(get_db)
):
    """Add a new member, enforcing SaaS subscription tier limits."""
    # Enforce tier limits
    BillingService.check_can_add_member(current_gym, db)

    # Check for duplicate phone in this gym
    existing = db.query(Member).filter(
        Member.gym_id == current_gym.id,
        Member.phone == req.phone.strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A member with phone {req.phone} already exists in your gym."
        )

    member = Member(
        gym_id=current_gym.id,
        first_name=req.first_name.strip(),
        last_name=req.last_name.strip(),
        email=req.email.lower().strip() if req.email else None,
        phone=req.phone.strip(),
        date_of_birth=req.date_of_birth,
        gender=req.gender,
        address=req.address,
        emergency_contact_name=req.emergency_contact_name,
        emergency_contact_phone=req.emergency_contact_phone,
        photo_url=req.photo_url,
        notes=req.notes,
        status=req.status or "active",
        join_date=req.join_date or datetime.date.today(),
        assigned_trainer_id=req.assigned_trainer_id
    )
    db.add(member)
    db.flush()

    # If initial plan is assigned
    if req.initial_plan_id:
        plan = db.query(MembershipPlan).filter(
            MembershipPlan.id == req.initial_plan_id,
            MembershipPlan.gym_id == current_gym.id
        ).first()
        if plan:
            start = req.initial_start_date or datetime.date.today()
            end = start + datetime.timedelta(days=plan.duration_days)
            membership = MemberMembership(
                gym_id=current_gym.id,
                member_id=member.id,
                plan_id=plan.id,
                start_date=start,
                end_date=end,
                price_paid=plan.price,
                status="active"
            )
            db.add(membership)
            db.flush()

            # Record initial payment
            inv = f"INV-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{member.id}-{plan.id}"
            payment = Payment(
                gym_id=current_gym.id,
                member_id=member.id,
                membership_id=membership.id,
                amount=plan.price,
                payment_date=start,
                payment_method="cash",
                status="completed",
                invoice_number=inv,
                notes=f"Initial subscription to {plan.name}"
            )
            db.add(payment)

    db.commit()
    db.refresh(member)
    return enrich_member_response(member, db, current_gym.id)

@router.get("/{member_id}", response_model=MemberDetailResponse)
def get_member_detail(
    member_id: int,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Retrieve complete profile of a member including full history."""
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.gym_id == current_gym.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    base = enrich_member_response(member, db, current_gym.id)

    # Memberships history
    memberships_data = (
        db.query(MemberMembership, MembershipPlan)
        .join(MembershipPlan, MemberMembership.plan_id == MembershipPlan.id)
        .filter(MemberMembership.gym_id == current_gym.id, MemberMembership.member_id == member.id)
        .order_by(MemberMembership.start_date.desc())
        .all()
    )
    memberships_list = [
        MemberMembershipResponse(
            id=mm.id,
            gym_id=mm.gym_id,
            member_id=mm.member_id,
            plan_id=mm.plan_id,
            plan_name=p.name,
            start_date=mm.start_date,
            end_date=mm.end_date,
            price_paid=mm.price_paid,
            status=mm.status,
            notes=mm.notes,
            created_at=mm.created_at
        )
        for mm, p in memberships_data
    ]

    # Payments history
    payments_data = (
        db.query(Payment)
        .filter(Payment.gym_id == current_gym.id, Payment.member_id == member.id)
        .order_by(Payment.payment_date.desc())
        .all()
    )
    payments_list = [
        PaymentResponse(
            id=py.id,
            gym_id=py.gym_id,
            member_id=py.member_id,
            member_name=member.full_name,
            membership_id=py.membership_id,
            amount=py.amount,
            payment_date=py.payment_date,
            payment_method=py.payment_method,
            status=py.status,
            invoice_number=py.invoice_number,
            receipt_url=py.receipt_url,
            notes=py.notes,
            created_at=py.created_at
        )
        for py in payments_data
    ]

    # Attendance records
    attendance_data = (
        db.query(Attendance)
        .filter(Attendance.gym_id == current_gym.id, Attendance.member_id == member.id)
        .order_by(Attendance.check_in_time.desc())
        .limit(50)
        .all()
    )
    attendance_list = [
        AttendanceResponse(
            id=att.id,
            gym_id=att.gym_id,
            member_id=att.member_id,
            member_name=member.full_name,
            member_phone=member.phone,
            check_in_time=att.check_in_time,
            check_out_time=att.check_out_time,
            method=att.method,
            notes=att.notes
        )
        for att in attendance_data
    ]

    total_attended = db.query(Attendance).filter(
        Attendance.gym_id == current_gym.id,
        Attendance.member_id == member.id
    ).count()

    total_paid = sum(p.amount for p in payments_data if p.status == "completed")

    return MemberDetailResponse(
        **base.model_dump(),
        memberships=memberships_list,
        payments=payments_list,
        attendance_records=attendance_list,
        total_attended=total_attended,
        total_paid=round(total_paid, 2)
    )

@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    req: MemberUpdate,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Update member profile details."""
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.gym_id == current_gym.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if req.first_name is not None:
        member.first_name = req.first_name.strip()
    if req.last_name is not None:
        member.last_name = req.last_name.strip()
    if req.phone is not None:
        member.phone = req.phone.strip()
    if req.email is not None:
        member.email = req.email.lower().strip() if req.email else None
    if req.date_of_birth is not None:
        member.date_of_birth = req.date_of_birth
    if req.gender is not None:
        member.gender = req.gender
    if req.address is not None:
        member.address = req.address
    if req.emergency_contact_name is not None:
        member.emergency_contact_name = req.emergency_contact_name
    if req.emergency_contact_phone is not None:
        member.emergency_contact_phone = req.emergency_contact_phone
    if req.photo_url is not None:
        member.photo_url = req.photo_url
    if req.notes is not None:
        member.notes = req.notes
    if req.status is not None:
        member.status = req.status
    if req.assigned_trainer_id is not None:
        member.assigned_trainer_id = req.assigned_trainer_id

    db.commit()
    db.refresh(member)
    return enrich_member_response(member, db, current_gym.id)

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: int,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Delete a member and all related tenant records."""
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.gym_id == current_gym.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()
    return None
