from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import (
    get_current_gym, get_current_user, require_owner, 
    require_owner_or_admin, require_staff_or_above
)
from app.core.security import verify_password, inquiry_rate_limiter
from app.models.models import (
    Gym, User, MembershipPlan, Member, MemberMembership,
    Attendance, Payment, Trainer, GymInquiry, Notification, GymSetting
)
from app.schemas.schemas import (
    GymWebsiteUpdate, GymInquiryCreate, GymInquiryResponse, GymResponse,
    GymDecommissionRequest, GymDecommissionResponse
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
        "primary_color": settings.primary_color if settings else "#2563eb",
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
        "website_amenities": current_gym.website_amenities,
        "website_custom_domain": current_gym.website_custom_domain,
        "public_url": f"/facility/{current_gym.website_subdomain or current_gym.slug}"
    }

@router.put("/gym/website", response_model=GymResponse)
def update_gym_website_settings(
    req: GymWebsiteUpdate,
    current_gym: Gym = Depends(get_current_gym),
    current_user = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    """Update custom website subdomain, headline, about story, and amenities."""
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
