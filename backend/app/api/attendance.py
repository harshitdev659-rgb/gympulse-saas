import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_staff_or_above, require_approved_gym
from app.models.models import Gym, User, Member, Attendance
from app.schemas.schemas import CheckInRequest, CheckOutRequest, AttendanceResponse

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

@router.get("/today", response_model=List[AttendanceResponse])
def get_today_attendance(
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Retrieve all check-ins for today with member details and duration."""
    if not current_gym:
        return []
    today = datetime.date.today()
    today_start = datetime.datetime.combine(today, datetime.time.min)
    today_end = datetime.datetime.combine(today, datetime.time.max)

    records = (
        db.query(Attendance, Member)
        .join(Member, Attendance.member_id == Member.id)
        .filter(
            Attendance.gym_id == current_gym.id,
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time <= today_end
        )
        .order_by(Attendance.check_in_time.desc())
        .all()
    )

    return [
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
        for att, mem in records
    ]

@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in_member(
    req: CheckInRequest,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(require_approved_gym),
    db: Session = Depends(get_db)
):
    """Mark check-in for a member in the gym."""
    member = db.query(Member).filter(
        Member.id == req.member_id,
        Member.gym_id == current_gym.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Check if already checked in today without checking out
    today = datetime.date.today()
    today_start = datetime.datetime.combine(today, datetime.time.min)
    active_checkin = (
        db.query(Attendance)
        .filter(
            Attendance.gym_id == current_gym.id,
            Attendance.member_id == member.id,
            Attendance.check_in_time >= today_start,
            Attendance.check_out_time.is_(None)
        )
        .first()
    )
    if active_checkin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{member.full_name} is already checked in at {active_checkin.check_in_time.strftime('%I:%M %p')}."
        )

    attendance = Attendance(
        gym_id=current_gym.id,
        member_id=member.id,
        check_in_time=datetime.datetime.now(datetime.timezone.utc),
        method=req.method or "manual",
        notes=req.notes
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return AttendanceResponse(
        id=attendance.id,
        gym_id=attendance.gym_id,
        member_id=attendance.member_id,
        member_name=member.full_name,
        member_phone=member.phone,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        method=attendance.method,
        notes=attendance.notes
    )

@router.post("/check-out", response_model=AttendanceResponse)
def check_out_member(
    req: CheckOutRequest,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Mark check-out for a member attendance record."""
    attendance = db.query(Attendance).filter(
        Attendance.id == req.attendance_id,
        Attendance.gym_id == current_gym.id
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    if attendance.check_out_time:
        raise HTTPException(status_code=400, detail="Member has already checked out.")

    attendance.check_out_time = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(attendance)

    member = db.query(Member).filter(Member.id == attendance.member_id).first()

    return AttendanceResponse(
        id=attendance.id,
        gym_id=attendance.gym_id,
        member_id=attendance.member_id,
        member_name=member.full_name if member else "Unknown",
        member_phone=member.phone if member else None,
        check_in_time=attendance.check_in_time,
        check_out_time=attendance.check_out_time,
        method=attendance.method,
        notes=attendance.notes
    )

@router.get("/history", response_model=List[AttendanceResponse])
def get_attendance_history(
    member_id: Optional[int] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Retrieve searchable attendance history with date filters."""
    if not current_gym:
        return []
    query = (
        db.query(Attendance, Member)
        .join(Member, Attendance.member_id == Member.id)
        .filter(Attendance.gym_id == current_gym.id)
    )

    if member_id:
        query = query.filter(Attendance.member_id == member_id)

    if start_date:
        query = query.filter(Attendance.check_in_time >= datetime.datetime.combine(start_date, datetime.time.min))

    if end_date:
        query = query.filter(Attendance.check_in_time <= datetime.datetime.combine(end_date, datetime.time.max))

    records = query.order_by(Attendance.check_in_time.desc()).offset(skip).limit(limit).all()

    return [
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
        for att, mem in records
    ]
