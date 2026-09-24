import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_staff_or_above
from app.models.models import (
    Gym, User, Member, MemberMembership, MembershipPlan, Attendance, Payment
)
from app.services.export_service import ExportService

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_reports_summary(
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Overall analytical summary for reports dashboard."""
    if not current_gym:
        return {
            "total_revenue": 0.0,
            "this_month_revenue": 0.0,
            "total_members": 0,
            "active_members": 0,
            "expired_members": 0,
            "total_visits": 0,
            "currency": "INR"
        }
    today = datetime.date.today()
    this_month_start = today.replace(day=1)
    
    total_rev = db.query(func.sum(Payment.amount)).filter(
        Payment.gym_id == current_gym.id,
        Payment.status == "completed"
    ).scalar() or 0.0

    month_rev = db.query(func.sum(Payment.amount)).filter(
        Payment.gym_id == current_gym.id,
        Payment.status == "completed",
        Payment.payment_date >= this_month_start
    ).scalar() or 0.0

    total_members = db.query(Member).filter(Member.gym_id == current_gym.id).count()
    active_members = db.query(Member).filter(Member.gym_id == current_gym.id, Member.status == "active").count()
    expired_members = db.query(Member).filter(Member.gym_id == current_gym.id, Member.status == "expired").count()
    total_visits = db.query(Attendance).filter(Attendance.gym_id == current_gym.id).count()
    
    return {
        "total_revenue": round(total_rev, 2),
        "this_month_revenue": round(month_rev, 2),
        "total_members": total_members,
        "active_members": active_members,
        "expired_members": expired_members,
        "total_visits": total_visits,
        "currency": current_gym.currency
    }

@router.get("/revenue")
def get_revenue_report(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Detailed revenue breakdown by plan and payment method."""
    if not current_gym:
        return {
            "total_amount": 0.0,
            "count": 0,
            "by_method": {},
            "records": []
        }
    query = (
        db.query(Payment, Member)
        .join(Member, Payment.member_id == Member.id)
        .filter(Payment.gym_id == current_gym.id)
    )
    if start_date:
        query = query.filter(Payment.payment_date >= start_date)
    if end_date:
        query = query.filter(Payment.payment_date <= end_date)

    payments = query.order_by(Payment.payment_date.desc()).all()

    items = []
    total_amount = 0.0
    by_method = {}
    for p, m in payments:
        total_amount += p.amount
        by_method[p.payment_method] = by_method.get(p.payment_method, 0.0) + p.amount
        items.append({
            "id": p.id,
            "invoice_number": p.invoice_number,
            "member_name": m.full_name,
            "member_phone": m.phone,
            "amount": p.amount,
            "payment_date": p.payment_date.strftime("%Y-%m-%d"),
            "payment_method": p.payment_method,
            "status": p.status,
            "notes": p.notes or ""
        })

    return {
        "total_amount": round(total_amount, 2),
        "count": len(items),
        "by_method": {k: round(v, 2) for k, v in by_method.items()},
        "records": items
    }

@router.get("/revenue/export")
def export_revenue_csv(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Export revenue report as downloadable CSV."""
    report = get_revenue_report(start_date, end_date, current_user, current_gym, db)
    headers = ["Invoice #", "Member Name", "Phone", "Amount", "Currency", "Date", "Method", "Status", "Notes"]
    rows = [
        [
            r["invoice_number"],
            r["member_name"],
            r["member_phone"],
            r["amount"],
            current_gym.currency,
            r["payment_date"],
            r["payment_method"],
            r["status"],
            r["notes"]
        ]
        for r in report["records"]
    ]
    csv_data = ExportService.generate_csv(headers, rows)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=revenue_report_{datetime.date.today()}.csv"}
    )

@router.get("/members/export")
def export_members_csv(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Export member directory as downloadable CSV."""
    query = db.query(Member).filter(Member.gym_id == current_gym.id)
    if status_filter and status_filter != "all":
        query = query.filter(Member.status == status_filter)

    members = query.order_by(Member.created_at.desc()).all()
    headers = ["ID", "First Name", "Last Name", "Phone", "Email", "Status", "Join Date", "Gender", "Address", "Emergency Contact", "Emergency Phone"]
    rows = [
        [
            m.id,
            m.first_name,
            m.last_name,
            m.phone,
            m.email or "",
            m.status,
            m.join_date.strftime("%Y-%m-%d"),
            m.gender or "",
            m.address or "",
            m.emergency_contact_name or "",
            m.emergency_contact_phone or ""
        ]
        for m in members
    ]
    csv_data = ExportService.generate_csv(headers, rows)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=members_export_{datetime.date.today()}.csv"}
    )

@router.get("/attendance/export")
def export_attendance_csv(
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Export attendance history as downloadable CSV."""
    query = (
        db.query(Attendance, Member)
        .join(Member, Attendance.member_id == Member.id)
        .filter(Attendance.gym_id == current_gym.id)
    )
    if start_date:
        query = query.filter(Attendance.check_in_time >= datetime.datetime.combine(start_date, datetime.time.min))
    if end_date:
        query = query.filter(Attendance.check_in_time <= datetime.datetime.combine(end_date, datetime.time.max))

    records = query.order_by(Attendance.check_in_time.desc()).all()
    headers = ["Attendance ID", "Member Name", "Phone", "Check In Time", "Check Out Time", "Method", "Notes"]
    rows = [
        [
            att.id,
            mem.full_name,
            mem.phone,
            att.check_in_time.strftime("%Y-%m-%d %H:%M:%S"),
            att.check_out_time.strftime("%Y-%m-%d %H:%M:%S") if att.check_out_time else "In Progress",
            att.method,
            att.notes or ""
        ]
        for att, mem in records
    ]
    csv_data = ExportService.generate_csv(headers, rows)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_export_{datetime.date.today()}.csv"}
    )
