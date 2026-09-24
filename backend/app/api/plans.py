from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_owner_or_admin, require_staff_or_above
from app.models.models import Gym, User, MembershipPlan, MemberMembership
from app.schemas.schemas import PlanCreate, PlanUpdate, PlanResponse

router = APIRouter(prefix="/plans", tags=["Membership Plans"])

@router.get("", response_model=List[PlanResponse])
def list_plans(
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """List all membership plans created for this gym."""
    if not current_gym:
        return []
    return db.query(MembershipPlan).filter(
        MembershipPlan.gym_id == current_gym.id
    ).order_by(MembershipPlan.price.asc()).all()

@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    req: PlanCreate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Create a new customizable membership plan."""
    plan = MembershipPlan(
        gym_id=current_gym.id,
        name=req.name.strip(),
        description=req.description,
        duration_days=req.duration_days,
        price=req.price,
        billing_period=req.billing_period,
        is_active=req.is_active
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    req: PlanUpdate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Update an existing membership plan."""
    plan = db.query(MembershipPlan).filter(
        MembershipPlan.id == plan_id,
        MembershipPlan.gym_id == current_gym.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if req.name is not None:
        plan.name = req.name.strip()
    if req.description is not None:
        plan.description = req.description
    if req.duration_days is not None:
        plan.duration_days = req.duration_days
    if req.price is not None:
        plan.price = req.price
    if req.billing_period is not None:
        plan.billing_period = req.billing_period
    if req.is_active is not None:
        plan.is_active = req.is_active

    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: int,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Soft-deactivate or delete a plan."""
    plan = db.query(MembershipPlan).filter(
        MembershipPlan.id == plan_id,
        MembershipPlan.gym_id == current_gym.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # If already referenced in memberships, deactivate rather than delete to preserve foreign integrity
    has_subscriptions = db.query(MemberMembership).filter(
        MemberMembership.plan_id == plan.id
    ).first()
    if has_subscriptions:
        plan.is_active = False
        db.commit()
        return None

    db.delete(plan)
    db.commit()
    return None
