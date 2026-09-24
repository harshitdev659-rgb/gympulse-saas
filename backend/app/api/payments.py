import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_staff_or_above, require_approved_gym
from app.models.models import (
    Gym, User, Member, Payment, MemberMembership, MembershipPlan
)
from app.schemas.schemas import PaymentCreate, PaymentResponse
from app.services.export_service import ExportService

router = APIRouter(prefix="/payments", tags=["Payments & Invoicing"])

@router.get("", response_model=List[PaymentResponse])
def list_payments(
    status_filter: Optional[str] = None,
    member_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """List payments with filters strictly scoped to this gym."""
    query = (
        db.query(Payment, Member)
        .join(Member, Payment.member_id == Member.id)
        .filter(Payment.gym_id == current_gym.id)
    )

    if status_filter and status_filter != "all":
        query = query.filter(Payment.status == status_filter)

    if member_id:
        query = query.filter(Payment.member_id == member_id)

    if start_date:
        query = query.filter(Payment.payment_date >= start_date)

    if end_date:
        query = query.filter(Payment.payment_date <= end_date)

    records = query.order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()

    res = []
    for pay, mem in records:
        plan_name = None
        if pay.membership_id:
            mm = (
                db.query(MemberMembership, MembershipPlan)
                .join(MembershipPlan, MemberMembership.plan_id == MembershipPlan.id)
                .filter(MemberMembership.id == pay.membership_id)
                .first()
            )
            if mm:
                plan_name = mm[1].name

        res.append(
            PaymentResponse(
                id=pay.id,
                gym_id=pay.gym_id,
                member_id=pay.member_id,
                member_name=mem.full_name,
                membership_id=pay.membership_id,
                plan_name=plan_name,
                amount=pay.amount,
                payment_date=pay.payment_date,
                payment_method=pay.payment_method,
                status=pay.status,
                invoice_number=pay.invoice_number,
                receipt_url=pay.receipt_url,
                notes=pay.notes,
                created_at=pay.created_at
            )
        )
    return res

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    req: PaymentCreate,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(require_approved_gym),
    db: Session = Depends(get_db)
):
    """Record a new payment transaction."""
    member = db.query(Member).filter(
        Member.id == req.member_id,
        Member.gym_id == current_gym.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    invoice_number = f"INV-{now_utc.strftime('%Y%m%d')}-{member.id}-{int(now_utc.timestamp()) % 10000}"

    payment = Payment(
        gym_id=current_gym.id,
        member_id=member.id,
        membership_id=req.membership_id,
        amount=req.amount,
        payment_date=req.payment_date or datetime.date.today(),
        payment_method=req.payment_method or "cash",
        status=req.status or "completed",
        invoice_number=invoice_number,
        notes=req.notes
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    plan_name = None
    if payment.membership_id:
        mm = (
            db.query(MemberMembership, MembershipPlan)
            .join(MembershipPlan, MemberMembership.plan_id == MembershipPlan.id)
            .filter(MemberMembership.id == payment.membership_id)
            .first()
        )
        if mm:
            plan_name = mm[1].name

    return PaymentResponse(
        id=payment.id,
        gym_id=payment.gym_id,
        member_id=payment.member_id,
        member_name=member.full_name,
        membership_id=payment.membership_id,
        plan_name=plan_name,
        amount=payment.amount,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        status=payment.status,
        invoice_number=payment.invoice_number,
        receipt_url=payment.receipt_url,
        notes=payment.notes,
        created_at=payment.created_at
    )

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment_detail(
    payment_id: int,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.gym_id == current_gym.id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    member = db.query(Member).filter(Member.id == payment.member_id).first()
    plan_name = None
    if payment.membership_id:
        mm = (
            db.query(MemberMembership, MembershipPlan)
            .join(MembershipPlan, MemberMembership.plan_id == MembershipPlan.id)
            .filter(MemberMembership.id == payment.membership_id)
            .first()
        )
        if mm:
            plan_name = mm[1].name

    return PaymentResponse(
        id=payment.id,
        gym_id=payment.gym_id,
        member_id=payment.member_id,
        member_name=member.full_name if member else "Unknown",
        membership_id=payment.membership_id,
        plan_name=plan_name,
        amount=payment.amount,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        status=payment.status,
        invoice_number=payment.invoice_number,
        receipt_url=payment.receipt_url,
        notes=payment.notes,
        created_at=payment.created_at
    )

@router.get("/{payment_id}/receipt", response_class=HTMLResponse)
def get_payment_receipt_html(
    payment_id: int,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Render a printable, branded HTML invoice receipt."""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.gym_id == current_gym.id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    member = db.query(Member).filter(Member.id == payment.member_id).first()
    membership = None
    if payment.membership_id:
        membership = db.query(MemberMembership).filter(MemberMembership.id == payment.membership_id).first()

    html = ExportService.generate_receipt_html(current_gym, payment, member, membership)
    return HTMLResponse(content=html, status_code=200)
