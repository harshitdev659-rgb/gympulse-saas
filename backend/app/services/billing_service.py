from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Gym, Member
from app.core.config import settings
from fastapi import HTTPException, status

TIER_CONFIG = {
    "starter": {
        "name": "Starter Plan (₹999/mo)",
        "max_members": 50,
        "ai_enabled": False,
        "features": [
            "Up to 50 active athletes",
            "Front desk check-ins & attendance",
            "Manual payment recording & invoicing",
            "Dedicated public gym website"
        ]
    },
    "free": {
        "name": "Starter Plan (₹999/mo)",
        "max_members": 50,
        "ai_enabled": False,
        "features": [
            "Up to 50 active athletes",
            "Front desk check-ins & attendance",
            "Manual payment recording & invoicing",
            "Dedicated public gym website"
        ]
    },
    "pro": {
        "name": "Pro Growth (₹2,499/mo)",
        "max_members": 250,
        "ai_enabled": True,
        "features": [
            "Up to 250 athletes",
            "AI Operations Copilot",
            "Automated check-ins & attendance",
            "Advanced analytics & trend charts",
            "CSV financial exports & receipts",
            "Personal trainer profiles"
        ]
    },
    "business": {
        "name": "Business Enterprise (₹5,999/mo)",
        "max_members": 10000,
        "ai_enabled": True,
        "features": [
            "Unlimited athletes & floor capacity",
            "Unlimited staff & trainer accounts",
            "Priority AI Assistant & insights",
            "Multi-trainer rosters & tracking",
            "Custom branding & priority support"
        ]
    }
}

class BillingService:
    @staticmethod
    def get_tier_status(gym: Gym, db: Session) -> Dict[str, Any]:
        """Return current billing tier status, usage, and available features."""
        tier = (gym.plan_tier or "pro").lower().strip()
        config = TIER_CONFIG.get(tier, TIER_CONFIG.get("pro"))
        
        member_count = db.query(Member).filter(Member.gym_id == gym.id).count()
        # Respect custom gym.max_members if set, otherwise default to tier config
        max_members = gym.max_members if (gym.max_members is not None and gym.max_members > 0) else config["max_members"]
        usage_pct = round((member_count / max_members) * 100, 1) if max_members > 0 else 0.0
        can_add_member = member_count < max_members
        
        return {
            "plan_tier": tier,
            "tier_name": config["name"],
            "subscription_status": gym.subscription_status,
            "member_count": member_count,
            "max_members": max_members,
            "usage_percentage": min(usage_pct, 100.0),
            "can_add_member": can_add_member,
            "ai_enabled": config["ai_enabled"],
            "features": config["features"],
            "requested_plan_tier": gym.requested_plan_tier,
            "tier_upgrade_status": gym.tier_upgrade_status or "none",
            "tier_upgrade_requested_at": gym.tier_upgrade_requested_at
        }

    @staticmethod
    def check_can_add_member(gym: Gym, db: Session):
        """Enforce subscription tier member limits before adding a new member."""
        status_info = BillingService.get_tier_status(gym, db)
        if not status_info["can_add_member"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Member limit reached for {status_info['tier_name']} ({status_info['member_count']}/{status_info['max_members']}). Please upgrade to add more members."
            )

    @staticmethod
    def request_upgrade(gym: Gym, target_tier: str, db: Session) -> Gym:
        """Submit SaaS tier upgrade request pending Super Admin payment verification."""
        import datetime
        target_tier = target_tier.lower()
        if target_tier not in TIER_CONFIG:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier '{target_tier}'. Choose from {list(TIER_CONFIG.keys())}"
            )
        gym.requested_plan_tier = target_tier
        gym.tier_upgrade_status = "pending"
        gym.tier_upgrade_requested_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(gym)
        return gym

    @staticmethod
    def approve_upgrade(gym: Gym, db: Session) -> Gym:
        """Super Admin confirms payment and applies tier upgrade."""
        target_tier = (gym.requested_plan_tier or "").lower()
        if not target_tier or target_tier not in TIER_CONFIG:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No valid pending upgrade request found for this gym."
            )
        gym.plan_tier = target_tier
        gym.max_members = TIER_CONFIG[target_tier]["max_members"]
        gym.tier_upgrade_status = "approved"
        gym.subscription_status = "active"
        db.commit()
        db.refresh(gym)
        return gym

    @staticmethod
    def upgrade_tier(gym: Gym, target_tier: str, db: Session) -> Gym:
        """Direct tier upgrade (used in admin overrides or tests)."""
        target_tier = target_tier.lower()
        if target_tier not in TIER_CONFIG:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier '{target_tier}'. Choose from {list(TIER_CONFIG.keys())}"
            )
        gym.plan_tier = target_tier
        gym.requested_plan_tier = target_tier
        gym.tier_upgrade_status = "approved"
        gym.max_members = TIER_CONFIG[target_tier]["max_members"]
        gym.subscription_status = "active"
        db.commit()
        db.refresh(gym)
        return gym
