from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_owner
from app.models.models import Gym, User
from app.schemas.schemas import BillingStatusResponse, UpgradePlanRequest
from app.services.billing_service import BillingService, TIER_CONFIG

router = APIRouter(prefix="/billing", tags=["SaaS Billing & Subscriptions"])

@router.get("/status", response_model=BillingStatusResponse)
def get_billing_status(
    current_user: User = Depends(get_current_user),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Retrieve current SaaS plan tier, limits, and feature availability."""
    return BillingService.get_tier_status(current_gym, db)

@router.post("/upgrade")
def upgrade_saas_plan(
    req: UpgradePlanRequest,
    current_user: User = Depends(require_owner),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """
    Submit SaaS tier upgrade request for this gym.
    Places tier upgrade in 'pending' status awaiting Super Admin payment verification.
    """
    updated_gym = BillingService.request_upgrade(current_gym, req.target_tier, db)
    return {
        "message": f"Upgrade request to {req.target_tier.upper()} tier submitted! Payment is pending Admin verification.",
        "requested_tier": updated_gym.requested_plan_tier,
        "current_tier": updated_gym.plan_tier,
        "upgrade_status": updated_gym.tier_upgrade_status,
        "status": updated_gym.subscription_status
    }
