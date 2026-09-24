import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.models import (
    Gym, User, MembershipPlan, Member, MemberMembership,
    Attendance, Payment, Trainer, GymSetting, Notification
)

def seed_database(reset: bool = True):
    print("Initializing clean GymPulse SaaS database...")
    db = SessionLocal()

    try:
        if reset:
            print("Purging all tables...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        # Platform Super Admin (Platform Owner)
        # Not linked to any dummy gym (gym_id=None)
        superadmin = User(
            gym_id=None,
            full_name="Platform Super Admin",
            email="admin@gympulse.com",
            password_hash=get_password_hash("SuperAdmin123!"),
            role="superadmin",
            is_superadmin=True,
            phone="+91 98000 00000",
            is_active=True
        )
        db.add(superadmin)
        db.commit()

        print("Clean platform initialization complete.")
        print("Super Admin created: admin@gympulse.com")
        print("0 dummy gyms, 0 dummy members, 0 dummy invoices, 0 dummy payments.")

    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(reset=True)
