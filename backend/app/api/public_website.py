from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import (
    get_current_gym, get_current_user, require_owner, 
    require_owner_or_admin, require_staff_or_above
)
from app.core.security import verify_password, inquiry_rate_limiter
import datetime
from datetime import date, timedelta
from app.models.models import (
    Gym, User, MembershipPlan, Member, MemberMembership,
    Attendance, Payment, Trainer, GymInquiry, Notification, GymSetting
)
from app.schemas.schemas import (
    GymWebsiteUpdate, GymInquiryCreate, GymInquiryResponse, GymResponse,
    GymDecommissionRequest, GymDecommissionResponse,
    PublicJoinRequest, PublicCheckInRequest
)

router = APIRouter(tags=["Gym Public Website & Lead Generator"])

# ----------------- Public Visitor Endpoints (No Auth) -----------------

@router.get("/public/facility/{slug}")
def get_public_facility_website(slug: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Publicly accessible endpoint rendering a gym's branded website.
    Searches by URL slug, custom subdomain, or custom domain.
    """
    clean_slug = slug.lower().strip()
    gym = db.query(Gym).filter(
        (Gym.slug == clean_slug) | 
        (Gym.website_subdomain == clean_slug) |
        (Gym.website_custom_domain == clean_slug)
    ).first()

    if not gym:
        # Flexible match by gym name or normalized slug
        normalized = clean_slug.replace("-", " ")
        gym = db.query(Gym).filter(Gym.name.ilike(normalized)).first()

    if not gym and clean_slug in ["gym-faculty", "gym-facility", "facility", "my-gym", "demo", "apex-fitness"]:
        gym = db.query(Gym).first()

    if not gym:
        raise HTTPException(status_code=404, detail=f"Gym facility website '{slug}' not found.")

    if not gym.website_enabled:
        raise HTTPException(status_code=403, detail="This gym website is currently private.")

    # Fetch active membership plans
    plans = db.query(MembershipPlan).filter(
        MembershipPlan.gym_id == gym.id,
        MembershipPlan.is_active == True
    ).order_by(MembershipPlan.price.asc()).all()

    # Fetch trainers
    trainers = db.query(Trainer).filter(
        Trainer.gym_id == gym.id,
        Trainer.is_active == True
    ).all()

    # Fetch business settings
    settings = db.query(GymSetting).filter(GymSetting.gym_id == gym.id).first()

    amenities_list = [a.strip() for a in (gym.website_amenities or "").split(",") if a.strip()]

    return {
        "id": gym.id,
        "name": gym.name,
        "slug": gym.slug,
        "website_subdomain": gym.website_subdomain or gym.slug,
        "headline": gym.website_headline or f"Welcome to {gym.name}",
        "tagline": gym.website_tagline or "Elevate Your Health & Athletic Potential",
        "about": gym.website_about or f"{gym.name} is dedicated to delivering premier coaching, top-tier strength equipment, and an encouraging fitness community.",
        "cover_image": gym.website_cover_image or "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80",
        "amenities": amenities_list,
        "currency": gym.currency or "INR",
        "logo_url": gym.logo_url,
        "phone": gym.phone,
        "email": gym.email,
        "address": gym.address,
        "business_hours": settings.business_hours if settings else "Mon-Sat: 6:00 AM - 10:00 PM",
        "primary_color": gym.website_primary_color or (settings.primary_color if settings else "#10b981"),
        "website_theme": gym.website_theme or "dark_power",
        "website_primary_color": gym.website_primary_color or (settings.primary_color if settings else "#10b981"),
        "website_hero_style": gym.website_hero_style or "split",
        "website_announcement": gym.website_announcement or "",
        "plans": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "duration_days": p.duration_days,
                "price": p.price,
                "billing_period": p.billing_period
            }
            for p in plans
        ],
        "trainers": [
            {
                "id": t.id,
                "name": t.name,
                "specialization": getattr(t, "specialty", None) or "Fitness Coach",
                "specialty": getattr(t, "specialty", None) or "Fitness Coach",
                "bio": t.bio
            }
            for t in trainers
        ]
    }

@router.post("/public/facility/{slug}/inquire")
def submit_public_membership_inquiry(
    slug: str,
    req: GymInquiryCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Prospective athlete inquiry form submitted directly from the gym's public website.
    Logs lead into the gym CRM and sends notification to the gym owner.
    AppSec: Rate-limited to prevent form spam and denial of service.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not inquiry_rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many inquiries submitted from your network. Please wait a minute."
        )

    clean_slug = slug.lower().strip()
    gym = db.query(Gym).filter(
        (Gym.slug == clean_slug) | 
        (Gym.website_subdomain == clean_slug)
    ).first()

    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility website not found or has been deleted.")

    if not gym.website_enabled:
        raise HTTPException(status_code=403, detail="This gym website is currently private.")

    inquiry = GymInquiry(
        gym_id=gym.id,
        full_name=req.full_name.strip(),
        email=req.email.strip().lower() if req.email else None,
        phone=req.phone.strip(),
        plan_name=req.plan_name.strip() if req.plan_name else None,
        message=req.message.strip() if req.message else None,
        status="new"
    )
    db.add(inquiry)

    # Add notification for the facility front desk / owner
    notif = Notification(
        gym_id=gym.id,
        title=f"New Website Lead: {inquiry.full_name}",
        message=f"{inquiry.full_name} submitted a joining inquiry via your public website for '{inquiry.plan_name or 'General Membership'}'. Phone: {inquiry.phone}",
        type="welcome"
    )
    db.add(notif)
    db.commit()
    db.refresh(inquiry)

    return {
        "success": True,
        "message": f"Thank you, {inquiry.full_name}! {gym.name} has received your inquiry and our team will get in touch shortly.",
        "inquiry_id": inquiry.id
    }

@router.post("/public/facility/{slug}/join")
def public_join_facility(
    slug: str,
    req: PublicJoinRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Direct online membership purchase & athlete registration from the gym's public website.
    Instantly creates member, activates plan, records payment, and returns digital pass.
    """
    clean_slug = slug.lower().strip()
    gym = db.query(Gym).filter(
        (Gym.slug == clean_slug) | 
        (Gym.website_subdomain == clean_slug)
    ).first()

    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found.")

    plan = db.query(MembershipPlan).filter(
        MembershipPlan.id == req.plan_id,
        MembershipPlan.gym_id == gym.id
    ).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Selected membership plan not found for this facility.")

    clean_phone = req.phone.strip()
    member = db.query(Member).filter(
        Member.gym_id == gym.id,
        Member.phone == clean_phone
    ).first()

    today = date.today()
    duration = plan.duration_days or 30
    end_date = today + timedelta(days=duration)

    if not member:
        member = Member(
            gym_id=gym.id,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            phone=clean_phone,
            email=req.email.strip().lower() if req.email else None,
            status="active",
            join_date=today,
            emergency_contact_phone=req.emergency_contact_phone
        )
        db.add(member)
        db.flush()
    else:
        member.status = "active"
        if req.email and not member.email:
            member.email = req.email.strip().lower()

    membership = MemberMembership(
        gym_id=gym.id,
        member_id=member.id,
        plan_id=plan.id,
        start_date=today,
        end_date=end_date,
        price_paid=plan.price,
        status="active"
    )
    db.add(membership)

    payment_status = "completed" if req.payment_method in ["upi", "card", "online"] else "pending"
    inv_num = f"INV-{int(datetime.datetime.now(datetime.UTC).timestamp())}"
    payment = Payment(
        gym_id=gym.id,
        member_id=member.id,
        amount=plan.price,
        payment_method=req.payment_method,
        status=payment_status,
        payment_date=today,
        receipt_number=inv_num,
        notes=f"Online website checkout - {plan.name} (Ref: {req.payment_ref or 'Direct Web'})"
    )
    db.add(payment)

    notif = Notification(
        gym_id=gym.id,
        title=f"New Member Joined Online: {member.first_name} {member.last_name}",
        message=f"{member.first_name} {member.last_name} enrolled into '{plan.name}' ({req.payment_method.upper()}: ₹{plan.price:.0f}). Digital Pass issued.",
        type="billing"
    )
    db.add(notif)
    db.commit()
    db.refresh(member)

    return {
        "success": True,
        "message": f"Welcome to {gym.name}! Your membership pass is active.",
        "member": {
            "id": member.id,
            "full_name": f"{member.first_name} {member.last_name}",
            "phone": member.phone,
            "email": member.email,
            "plan_name": plan.name,
            "start_date": str(today),
            "expiry_date": str(end_date),
            "status": member.status
        },
        "receipt_number": inv_num,
        "amount": plan.price,
        "payment_status": payment_status
    }

@router.post("/public/facility/{slug}/checkin")
def public_athlete_checkin(
    slug: str,
    req: PublicCheckInRequest,
    db: Session = Depends(get_db)
):
    """
    Self-service check-in for athletes scanning the front desk QR code kiosk from their phones.
    """
    clean_slug = slug.lower().strip()
    gym = db.query(Gym).filter(
        (Gym.slug == clean_slug) | 
        (Gym.website_subdomain == clean_slug)
    ).first()

    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found.")

    query_val = req.phone_or_id.strip()
    member = None
    if query_val.isdigit() and len(query_val) < 8:
        member = db.query(Member).filter(Member.gym_id == gym.id, Member.id == int(query_val)).first()
    
    if not member:
        digits = "".join(filter(str.isdigit, query_val))
        all_members = db.query(Member).filter(Member.gym_id == gym.id).all()
        for m in all_members:
            m_digits = "".join(filter(str.isdigit, m.phone or ""))
            if m_digits and (m_digits.endswith(digits) or digits.endswith(m_digits)):
                member = m
                break

    if not member:
        raise HTTPException(status_code=404, detail="No registered athlete found with that Phone Number or Member ID. Please speak with the front desk.")

    if member.status != "active":
        raise HTTPException(status_code=403, detail=f"Membership for {member.first_name} is currently {member.status.upper()}. Please renew at the front desk.")

    now = datetime.datetime.now(datetime.UTC)
    today = date.today()

    existing = db.query(Attendance).filter(
        Attendance.gym_id == gym.id,
        Attendance.member_id == member.id,
        Attendance.date == today
    ).order_by(Attendance.id.desc()).first()

    if existing and not existing.check_out_time:
        existing.check_out_time = now.time()
        db.commit()
        return {
            "success": True,
            "action": "check_out",
            "message": f"Checked out! Great workout today, {member.first_name}!",
            "member_name": f"{member.first_name} {member.last_name}",
            "time": now.strftime("%I:%M %p")
        }

    att = Attendance(
        gym_id=gym.id,
        member_id=member.id,
        date=today,
        check_in_time=now.time(),
        method="qr_kiosk"
    )
    db.add(att)
    db.commit()

    thirty_days_ago = today - timedelta(days=30)
    attended_count = db.query(Attendance).filter(
        Attendance.gym_id == gym.id,
        Attendance.member_id == member.id,
        Attendance.date >= thirty_days_ago
    ).count()

    return {
        "success": True,
        "action": "check_in",
        "message": f"Access Granted! Welcome to {gym.name}, {member.first_name}!",
        "member_name": f"{member.first_name} {member.last_name}",
        "member_id": member.id,
        "time": now.strftime("%I:%M %p"),
        "monthly_workouts": attended_count,
        "status": member.status
    }

@router.get("/public/facility/{slug}/portal")
def get_athlete_portal_data(
    slug: str,
    query: str,
    db: Session = Depends(get_db)
):
    """
    Public self-service athlete portal providing pass status, attendance streak, and receipts.
    """
    clean_slug = slug.lower().strip()
    gym = db.query(Gym).filter(
        (Gym.slug == clean_slug) | 
        (Gym.website_subdomain == clean_slug)
    ).first()

    if not gym:
        raise HTTPException(status_code=404, detail="Gym facility not found.")

    query_val = query.strip()
    member = None
    if query_val.isdigit() and len(query_val) < 8:
        member = db.query(Member).filter(Member.gym_id == gym.id, Member.id == int(query_val)).first()
    
    if not member:
        digits = "".join(filter(str.isdigit, query_val))
        all_members = db.query(Member).filter(Member.gym_id == gym.id).all()
        for m in all_members:
            m_digits = "".join(filter(str.isdigit, m.phone or ""))
            if m_digits and (m_digits.endswith(digits) or digits.endswith(m_digits)):
                member = m
                break

    if not member:
        raise HTTPException(status_code=404, detail="No athlete account found matching this Phone Number or Member ID.")

    active_m = db.query(MemberMembership).filter(
        MemberMembership.member_id == member.id,
        MemberMembership.status == "active"
    ).order_by(MemberMembership.end_date.desc()).first()

    plan_name = "Standard Pass"
    expiry_date = None
    days_remaining = 0
    if active_m:
        plan = db.query(MembershipPlan).filter(MembershipPlan.id == active_m.plan_id).first()
        if plan:
            plan_name = plan.name
        expiry_date = active_m.end_date
        days_remaining = max(0, (expiry_date - date.today()).days)

    attendances = db.query(Attendance).filter(
        Attendance.member_id == member.id
    ).order_by(Attendance.date.desc()).limit(30).all()

    payments = db.query(Payment).filter(
        Payment.member_id == member.id
    ).order_by(Payment.payment_date.desc()).limit(10).all()

    return {
        "gym_name": gym.name,
        "gym_logo": gym.logo_url,
        "gym_phone": gym.phone,
        "gym_address": gym.address,
        "member": {
            "id": member.id,
            "full_name": f"{member.first_name} {member.last_name}",
            "phone": member.phone,
            "email": member.email,
            "status": member.status,
            "join_date": str(member.join_date),
            "plan_name": plan_name,
            "expiry_date": str(expiry_date) if expiry_date else None,
            "days_remaining": days_remaining,
        },
        "attendance_count": len(attendances),
        "recent_attendances": [
            {
                "date": str(a.date),
                "check_in": a.check_in_time.strftime("%I:%M %p") if a.check_in_time else "Attended",
                "method": a.method
            }
            for a in attendances[:10]
        ],
        "payments": [
            {
                "id": p.id,
                "amount": p.amount,
                "receipt_number": p.receipt_number or f"INV-{p.id}",
                "payment_date": str(p.payment_date),
                "payment_method": p.payment_method,
                "status": p.status
            }
            for p in payments
        ]
    }

# ----------------- Gym Owner Website Management Endpoints (Auth Required) -----------------

@router.get("/gym/website")
def get_gym_website_settings(
    current_gym: Gym = Depends(get_current_gym)
) -> Dict[str, Any]:
    """Retrieve public website configuration for current gym."""
    if not current_gym:
        return {
            "website_subdomain": "my-gym",
            "website_enabled": True,
            "website_headline": "Welcome to Our Gym",
            "website_tagline": "Elevate Your Health & Athletic Potential",
            "website_about": "Premier strength training equipment and certified coaching.",
            "website_cover_image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80",
            "website_amenities": "Olympic Free Weights, Cardio Theatre, Strength Machines, Certified Trainers, Steam & Sauna, Lockers",
            "website_custom_domain": None,
            "public_url": "/facility/my-gym"
        }
    return {
        "website_subdomain": current_gym.website_subdomain or current_gym.slug,
        "website_enabled": current_gym.website_enabled,
        "website_headline": current_gym.website_headline,
        "website_tagline": current_gym.website_tagline,
        "website_about": current_gym.website_about,
        "website_cover_image": current_gym.website_cover_image,
        "website_theme": current_gym.website_theme or "dark_power",
        "website_primary_color": current_gym.website_primary_color or "#10b981",
        "website_hero_style": current_gym.website_hero_style or "split",
        "website_announcement": current_gym.website_announcement or "",
        "public_url": f"/facility/{current_gym.website_subdomain or current_gym.slug}"
    }

@router.put("/gym/website", response_model=GymResponse)
def update_gym_website_settings(
    req: GymWebsiteUpdate,
    current_gym: Gym = Depends(get_current_gym),
    current_user = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    """Update custom website subdomain, headline, about story, theme, and styling."""
    if not current_gym:
        raise HTTPException(status_code=400, detail="Gym context required")
    if req.website_subdomain is not None:
        new_sub = req.website_subdomain.lower().strip().replace(" ", "-")
        if new_sub != current_gym.website_subdomain:
            existing = db.query(Gym).filter(
                Gym.website_subdomain == new_sub,
                Gym.id != current_gym.id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This website subdomain is already taken. Please choose another unique name."
                )
            current_gym.website_subdomain = new_sub

    if req.website_enabled is not None:
        current_gym.website_enabled = req.website_enabled
    if req.website_headline is not None:
        current_gym.website_headline = req.website_headline.strip()
    if req.website_tagline is not None:
        current_gym.website_tagline = req.website_tagline.strip()
    if req.website_about is not None:
        current_gym.website_about = req.website_about.strip()
    if req.website_cover_image is not None:
        current_gym.website_cover_image = req.website_cover_image.strip()
    if req.website_amenities is not None:
        current_gym.website_amenities = req.website_amenities.strip()
    if req.website_custom_domain is not None:
        current_gym.website_custom_domain = req.website_custom_domain.strip().lower()
    if req.website_theme is not None:
        current_gym.website_theme = req.website_theme.strip().lower()
    if req.website_primary_color is not None:
        current_gym.website_primary_color = req.website_primary_color.strip()
    if req.website_hero_style is not None:
        current_gym.website_hero_style = req.website_hero_style.strip().lower()
    if req.website_announcement is not None:
        current_gym.website_announcement = req.website_announcement.strip()

    db.commit()
    db.refresh(current_gym)
    return GymResponse.model_validate(current_gym)

@router.get("/gym/inquiries", response_model=List[GymInquiryResponse])
def get_gym_inquiries(
    current_gym: Gym = Depends(get_current_gym),
    current_user = Depends(require_staff_or_above),
    db: Session = Depends(get_db)
):
    """List all leads received through the gym's public website."""
    if not current_gym:
        return []
    return db.query(GymInquiry).filter(
        GymInquiry.gym_id == current_gym.id
    ).order_by(GymInquiry.created_at.desc()).all()

@router.patch("/gym/inquiries/{inquiry_id}")
def update_inquiry_status(
    inquiry_id: int,
    status_val: str,
    current_gym: Gym = Depends(get_current_gym),
    current_user = Depends(require_staff_or_above),
    db: Session = Depends(get_db)
):
    """Update lead status: new, contacted, converted."""
    if not current_gym:
        raise HTTPException(status_code=400, detail="Gym context required")
    inq = db.query(GymInquiry).filter(
        GymInquiry.id == inquiry_id,
        GymInquiry.gym_id == current_gym.id
    ).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    inq.status = status_val
    db.commit()
    return {"success": True, "status": inq.status}

@router.delete("/gym/decommission", response_model=GymDecommissionResponse)
def decommission_gym(
    req: GymDecommissionRequest,
    current_gym: Gym = Depends(get_current_gym),
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """
    AppSec High-Assurance Gym Decommissioning:
    Permanently deletes a gym facility, all member records, attendance,
    payments, trainer rosters, and crucially, DELETES ITS DEDICATED HTTPS PUBLIC WEBSITE.
    Requires password re-authentication and facility name confirmation.
    """
    # 1. Password Verification (Mitigate unauthorized deletion & session hijacking)
    if not verify_password(req.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Facility decommissioning aborted for security."
        )

    # 2. Exact Confirmation Name Match
    if req.confirm_gym_name.strip().lower() != current_gym.name.strip().lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Confirmation name mismatch. Please type '{current_gym.name}' exactly to confirm deletion."
        )

    gym_name = current_gym.name
    gym_slug = current_gym.slug
    website_slug = current_gym.website_subdomain or current_gym.slug
    gym_id = current_gym.id

    # 3. Explicit Cascade Deletion across all dependent multi-tenant tables
    db.query(GymInquiry).filter(GymInquiry.gym_id == gym_id).delete()
    db.query(Notification).filter(Notification.gym_id == gym_id).delete()
    db.query(Payment).filter(Payment.gym_id == gym_id).delete()
    db.query(Attendance).filter(Attendance.gym_id == gym_id).delete()
    db.query(MemberMembership).filter(MemberMembership.gym_id == gym_id).delete()
    db.query(Member).filter(Member.gym_id == gym_id).delete()
    db.query(MembershipPlan).filter(MembershipPlan.gym_id == gym_id).delete()
    db.query(Trainer).filter(Trainer.gym_id == gym_id).delete()
    db.query(GymSetting).filter(GymSetting.gym_id == gym_id).delete()
    db.query(User).filter(User.gym_id == gym_id).delete()
    db.delete(current_gym)
    db.commit()

    return GymDecommissionResponse(
        success=True,
        message=f"Facility '{gym_name}' and its dedicated public website ('/facility/{website_slug}') have been permanently deleted.",
        deleted_slug=gym_slug
    )
