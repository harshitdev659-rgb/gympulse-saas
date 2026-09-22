import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym
from app.models.models import (
    Gym, User, Member, MemberMembership, Attendance, Payment
)
from app.schemas.schemas import DashboardStatsResponse, AttendanceResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Aggregate real-time dashboard KPIs and charts data for the authenticated gym."""
    today = datetime.date.today()
    today_start = datetime.datetime.combine(today, datetime.time.min)
    today_end = datetime.datetime.combine(today, datetime.time.max)
    
    first_of_month = today.replace(day=1)
    
    # 1. Member stats
    total_members = db.query(Member).filter(Member.gym_id == current_gym.id).count()
    active_members = db.query(Member).filter(Member.gym_id == current_gym.id, Member.status == "active").count()
    expired_members = db.query(Member).filter(Member.gym_id == current_gym.id, Member.status == "expired").count()
    
    # Memberships expiring in 7 days
    expiring_soon_count = (
        db.query(MemberMembership)
        .filter(
            MemberMembership.gym_id == current_gym.id,
            MemberMembership.status == "active",
            MemberMembership.end_date >= today,
            MemberMembership.end_date <= today + datetime.timedelta(days=7)
        )
        .count()
    )

    # New members this month
    new_members_this_month = (
        db.query(Member)
        .filter(
            Member.gym_id == current_gym.id,
            Member.join_date >= first_of_month
        )
        .count()
    )

    # 2. Attendance stats
    today_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.gym_id == current_gym.id,
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time <= today_end
        )
        .count()
    )

    active_now = (
        db.query(Attendance)
        .filter(
            Attendance.gym_id == current_gym.id,
            Attendance.check_in_time >= today_start,
            Attendance.check_out_time.is_(None)
        )
        .count()
    )

    # Recent checkins
    recent_records = (
        db.query(Attendance, Member)
        .join(Member, Attendance.member_id == Member.id)
        .filter(Attendance.gym_id == current_gym.id)
        .order_by(Attendance.check_in_time.desc())
        .limit(6)
        .all()
    )
    
    recent_checkins = []
    for att, mem in recent_records:
        recent_checkins.append(
            AttendanceResponse(
                id=att.id,
                gym_id=att.gym_id,
                member_id=att.member_id,
                member_name=mem.full_name,
                member_phone=mem.phone,
                check_in_time=att.check_in_time,
                check_out_time=att.check_out_time,
                method=att.method,
                notes=att.notes
            )
        )

    # 3. Revenue stats
    this_month_rev = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.gym_id == current_gym.id,
            Payment.status == "completed",
            Payment.payment_date >= first_of_month
        )
        .scalar() or 0.0
    )

    last_month_end = first_of_month - datetime.timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)
    last_month_rev = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.gym_id == current_gym.id,
            Payment.status == "completed",
            Payment.payment_date >= last_month_start,
            Payment.payment_date <= last_month_end
        )
        .scalar() or 0.0
    )

    pending_payments_count = (
        db.query(Payment)
        .filter(Payment.gym_id == current_gym.id, Payment.status == "pending")
        .count()
    )
    pending_payments_amount = (
        db.query(func.sum(Payment.amount))
        .filter(Payment.gym_id == current_gym.id, Payment.status == "pending")
        .scalar() or 0.0
    )

    # 4. Monthly Charts data (Past 6 months)
    revenue_chart_data = []
    attendance_chart_data = []

    for i in range(5, -1, -1):
        # Calculate month date window
        # Approximation for past 6 months
        d = today - datetime.timedelta(days=i * 30)
        m_start = d.replace(day=1)
        # Next month start
        if m_start.month == 12:
            next_m = m_start.replace(year=m_start.year + 1, month=1)
        else:
            next_m = m_start.replace(month=m_start.month + 1)
        m_end = next_m - datetime.timedelta(days=1)
        label = m_start.strftime("%b %Y")

        # Monthly revenue
        m_rev = (
            db.query(func.sum(Payment.amount))
            .filter(
                Payment.gym_id == current_gym.id,
                Payment.status == "completed",
                Payment.payment_date >= m_start,
                Payment.payment_date <= m_end
            )
            .scalar() or 0.0
        )
        revenue_chart_data.append({"month": label, "revenue": round(m_rev, 2)})

        # Monthly attendance
        m_att = (
            db.query(Attendance)
            .filter(
                Attendance.gym_id == current_gym.id,
                Attendance.check_in_time >= datetime.datetime.combine(m_start, datetime.time.min),
                Attendance.check_in_time <= datetime.datetime.combine(m_end, datetime.time.max)
            )
            .count()
        )
        attendance_chart_data.append({"month": label, "visits": m_att})

    return DashboardStatsResponse(
        total_members=total_members,
        active_members=active_members,
        expired_members=expired_members,
        expiring_soon_members=expiring_soon_count,
        today_attendance=today_attendance,
        active_now=active_now,
        monthly_revenue=round(this_month_rev, 2),
        last_month_revenue=round(last_month_rev, 2),
        pending_payments_count=pending_payments_count,
        pending_payments_amount=round(pending_payments_amount, 2),
        new_members_this_month=new_members_this_month,
        recent_checkins=recent_checkins,
        attendance_chart_data=attendance_chart_data,
        revenue_chart_data=revenue_chart_data
    )
