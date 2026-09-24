from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_owner_or_admin, require_staff_or_above
from app.core.security import get_password_hash
from app.models.models import Gym, User, Trainer, Member
from app.schemas.schemas import TrainerCreate, TrainerUpdate, TrainerResponse, MemberResponse
from app.api.members import enrich_member_response

router = APIRouter(prefix="/trainers", tags=["Trainers Management"])

@router.get("", response_model=List[TrainerResponse])
def list_trainers(
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """List all trainers in current gym with member count."""
    if not current_gym:
        return []
    trainers = db.query(Trainer).filter(Trainer.gym_id == current_gym.id).all()
    res = []
    for t in trainers:
        count = db.query(Member).filter(
            Member.gym_id == current_gym.id,
            Member.assigned_trainer_id == t.id
        ).count()
        res.append(
            TrainerResponse(
                id=t.id,
                gym_id=t.gym_id,
                user_id=t.user_id,
                name=t.name,
                email=t.email,
                phone=t.phone,
                specialty=t.specialty,
                bio=t.bio,
                hourly_rate=t.hourly_rate,
                is_active=t.is_active,
                assigned_members_count=count,
                created_at=t.created_at
            )
        )
    return res

@router.post("", response_model=TrainerResponse, status_code=status.HTTP_201_CREATED)
def create_trainer(
    req: TrainerCreate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Add a new trainer and optionally create a login user account."""
    user_id = None
    if req.create_user_account and req.email and req.password:
        existing = db.query(User).filter(
            User.gym_id == current_gym.id,
            User.email == req.email.lower().strip()
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists.")
        
        user = User(
            gym_id=current_gym.id,
            full_name=req.name.strip(),
            email=req.email.lower().strip(),
            password_hash=get_password_hash(req.password),
            role="trainer",
            phone=req.phone,
            is_active=True
        )
        db.add(user)
        db.flush()
        user_id = user.id

    trainer = Trainer(
        gym_id=current_gym.id,
        user_id=user_id,
        name=req.name.strip(),
        email=req.email.lower().strip() if req.email else None,
        phone=req.phone.strip(),
        specialty=req.specialty,
        bio=req.bio,
        hourly_rate=req.hourly_rate,
        is_active=req.is_active
    )
    db.add(trainer)
    db.commit()
    db.refresh(trainer)

    return TrainerResponse(
        id=trainer.id,
        gym_id=trainer.gym_id,
        user_id=trainer.user_id,
        name=trainer.name,
        email=trainer.email,
        phone=trainer.phone,
        specialty=trainer.specialty,
        bio=trainer.bio,
        hourly_rate=trainer.hourly_rate,
        is_active=trainer.is_active,
        assigned_members_count=0,
        created_at=trainer.created_at
    )

@router.get("/{trainer_id}/members", response_model=List[MemberResponse])
def get_trainer_assigned_members(
    trainer_id: int,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """List members assigned to this trainer."""
    trainer = db.query(Trainer).filter(
        Trainer.id == trainer_id,
        Trainer.gym_id == current_gym.id
    ).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    members = db.query(Member).filter(
        Member.gym_id == current_gym.id,
        Member.assigned_trainer_id == trainer_id
    ).all()

    return [enrich_member_response(m, db, current_gym.id) for m in members]

@router.put("/{trainer_id}", response_model=TrainerResponse)
def update_trainer(
    trainer_id: int,
    req: TrainerUpdate,
    current_user: User = Depends(require_owner_or_admin),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """Update trainer profile."""
    trainer = db.query(Trainer).filter(
        Trainer.id == trainer_id,
        Trainer.gym_id == current_gym.id
    ).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    if req.name is not None:
        trainer.name = req.name.strip()
    if req.email is not None:
        trainer.email = req.email.lower().strip() if req.email else None
    if req.phone is not None:
        trainer.phone = req.phone.strip()
    if req.specialty is not None:
        trainer.specialty = req.specialty
    if req.bio is not None:
        trainer.bio = req.bio
    if req.hourly_rate is not None:
        trainer.hourly_rate = req.hourly_rate
    if req.is_active is not None:
        trainer.is_active = req.is_active

    db.commit()
    db.refresh(trainer)

    count = db.query(Member).filter(
        Member.gym_id == current_gym.id,
        Member.assigned_trainer_id == trainer.id
    ).count()

    return TrainerResponse(
        id=trainer.id,
        gym_id=trainer.gym_id,
        user_id=trainer.user_id,
        name=trainer.name,
        email=trainer.email,
        phone=trainer.phone,
        specialty=trainer.specialty,
        bio=trainer.bio,
        hourly_rate=trainer.hourly_rate,
        is_active=trainer.is_active,
        assigned_members_count=count,
        created_at=trainer.created_at
    )
