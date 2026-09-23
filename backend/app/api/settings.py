import os
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user, get_current_gym, require_owner_or_admin
from app.models.models import Gym, User, GymSetting
from app.schemas.schemas import (
    GymResponse, GymUpdate, GymSettingResponse, GymSettingUpdate
)

router = APIRouter(prefix="/settings", tags=["Settings & Customization"])

@router.get("/gym", response_model=GymResponse)
def get_gym_profile(
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym)
):
    """Get gym business profile and branding."""
    return current_gym

@router.put("/gym", response_model=GymResponse)
def update_gym_profile(
    req: GymUpdate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Update gym business profile, currency, or branding."""
    if req.name is not None:
        current_gym.name = req.name.strip()
    if req.phone is not None:
        current_gym.phone = req.phone.strip()
    if req.address is not None:
        current_gym.address = req.address.strip()
    if req.currency is not None:
        current_gym.currency = req.currency.strip().upper()
    if req.logo_url is not None:
        current_gym.logo_url = req.logo_url.strip()

    db.commit()
    db.refresh(current_gym)
    return current_gym

@router.get("/config", response_model=GymSettingResponse)
def get_gym_settings(
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Get gym operational configurations."""
    settings_obj = db.query(GymSetting).filter(GymSetting.gym_id == current_gym.id).first()
    if not settings_obj:
        # Create default if missing
        settings_obj = GymSetting(gym_id=current_gym.id)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj

@router.put("/config", response_model=GymSettingResponse)
def update_gym_settings(
    req: GymSettingUpdate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Update operational configurations (business hours, alert days, receipts, theme)."""
    settings_obj = db.query(GymSetting).filter(GymSetting.gym_id == current_gym.id).first()
    if not settings_obj:
        settings_obj = GymSetting(gym_id=current_gym.id)
        db.add(settings_obj)

    if req.business_hours is not None:
        settings_obj.business_hours = req.business_hours
    if req.tax_percentage is not None:
        settings_obj.tax_percentage = req.tax_percentage
    if req.expiry_alert_days is not None:
        settings_obj.expiry_alert_days = req.expiry_alert_days
    if req.receipt_footer_text is not None:
        settings_obj.receipt_footer_text = req.receipt_footer_text
    if req.primary_color is not None:
        settings_obj.primary_color = req.primary_color

    db.commit()
    db.refresh(settings_obj)
    return settings_obj

class CloudUrlUpdate(BaseModel):
    cloud_url: str

@router.get("/network-info")
def get_network_info():
    """Retrieve local, cloud 24/7, and public website URLs and download links."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    tunnel_file = os.path.join(base_dir, "tunnel_url.txt")
    cloud_file = os.path.join(base_dir, "cloud_url.txt")

    cloud_url = os.environ.get("CLOUD_APP_URL", getattr(settings, "CLOUD_APP_URL", "https://gympulse-saas.onrender.com"))
    if os.path.exists(cloud_file):
        try:
            with open(cloud_file, "r", encoding="utf-8-sig") as f:
                c = f.read().strip().lstrip('\ufeff')
                if c.startswith("http"):
                    cloud_url = c
        except Exception:
            pass

    tunnel_url = None
    if os.path.exists(tunnel_file):
        try:
            with open(tunnel_file, "r", encoding="utf-8-sig") as f:
                content = f.read().strip().lstrip('\ufeff')
                if content.startswith("http"):
                    tunnel_url = content
        except Exception:
            pass

    local_url = "http://localhost:8000"
    lan_ip = "127.0.0.1"
    try:
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            lan_ip = s.getsockname()[0]
    except Exception:
        pass
    lan_url = f"http://{lan_ip}:8000"

    github_pages_url = "https://harshitdev659-rgb.github.io/gympulse-saas/"
    windows_release_url = "https://github.com/harshitdev659-rgb/gympulse-saas/releases/download/v1.0.0/GymPulse_Windows_Portable.zip"

    # The official 24/7 website for Apple, Android and worldwide access
    official_website = (cloud_url if os.path.exists(cloud_file) else None) or github_pages_url

    return {
        "local_url": local_url,
        "lan_ip": lan_ip,
        "lan_url": lan_url,
        "cloud_url": cloud_url,
        "tunnel_url": tunnel_url,
        "public_url": official_website,
        "github_pages_url": github_pages_url,
        "windows_release_url": windows_release_url,
        "download_url": "/api/download/windows",
        "full_download_url": windows_release_url
    }

@router.post("/cloud-url")
def update_cloud_url(req: CloudUrlUpdate):
    """Save user-configured permanent 24/7 cloud hosting URL."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    cloud_file = os.path.join(base_dir, "cloud_url.txt")
    clean_url = req.cloud_url.strip().rstrip("/")
    if clean_url and not clean_url.startswith("http"):
        clean_url = "https://" + clean_url
    with open(cloud_file, "w", encoding="utf-8") as f:
        f.write(clean_url)
    return {"status": "success", "cloud_url": clean_url}


