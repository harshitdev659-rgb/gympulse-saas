import os
import sys
import datetime
import random

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.models import (
    Gym, User, MembershipPlan, Member, MemberMembership,
    Attendance, Payment, Trainer, GymSetting, Notification
)

def seed_database(reset: bool = True):
    print("Seeding GymPulse SaaS database...")
    db = SessionLocal()

    try:
        if reset:
            print("Resetting existing database tables...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        today = datetime.date.today()

        # ==========================================
        # TENANT 1: Apex Fitness Club
        # ==========================================
        print("Creating Tenant 1: Apex Fitness Club...")
        gym1 = Gym(
            name="Apex Fitness Club",
            slug="apex-fitness",
            email="contact@apexfitness.com",
            phone="+91 98765 12345",
            address="Plot 42, Bandra Kurla Complex, Mumbai, MH",
            currency="INR",
            logo_url="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80",
            plan_tier="pro",
            subscription_status="active",
            approval_status="approved",
            is_approved=True,
            payment_verified=True,
            website_subdomain="apex-fitness",
            website_enabled=True,
            website_headline="Welcome to Apex Fitness Club",
            website_tagline="Elevate Your Athletic Potential & Peak Health",
            website_about="Apex Fitness Club is a premier fitness center featuring Olympic lifting platforms, state-of-the-art cardio theatres, dedicated strength circuits, and certified personal trainers.",
            website_cover_image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80",
            website_amenities="Olympic Free Weights, Cardio Theatre, Certified Trainers, Steam & Sauna, Luxury Locker Rooms, Protein Smoothie Bar, Nutrition Consultation",
            max_members=250
        )
        db.add(gym1)
        db.flush()

        # Platform Super Admin (Platform Owner)
        superadmin = User(
            gym_id=gym1.id,
            full_name="Platform Super Admin (Owner)",
            email="admin@gympulse.com",
            password_hash=get_password_hash("SuperAdmin123!"),
            role="superadmin",
            is_superadmin=True,
            phone="+91 98000 00000",
            is_active=True
        )

        # Users for Gym 1
        owner1 = User(
            gym_id=gym1.id,
            full_name="Alex Vance (Owner)",
            email="owner@apexfitness.com",
            password_hash=get_password_hash("ApexAdmin123!"),
            role="owner",
            is_superadmin=False,
            phone="+91 98765 12346",
            is_active=True
        )
        staff1 = User(
            gym_id=gym1.id,
            full_name="Sarah Miller (Front Desk)",
            email="staff@apexfitness.com",
            password_hash=get_password_hash("Staff123!"),
            role="staff",
            is_superadmin=False,
            phone="+91 98765 12347",
            is_active=True
        )
        db.add_all([superadmin, owner1, staff1])


        # Settings for Gym 1
        setting1 = GymSetting(
            gym_id=gym1.id,
            business_hours="Mon-Fri: 5:30 AM - 11:00 PM, Sat-Sun: 7:00 AM - 8:00 PM",
            tax_percentage=18.0,
            expiry_alert_days=7,
            receipt_footer_text="Thank you for training with Apex Fitness Club. Greatness is earned daily!",
            primary_color="#2563eb"
        )
        db.add(setting1)

        # Plans for Gym 1 (in INR)
        p_monthly = MembershipPlan(
            gym_id=gym1.id,
            name="Monthly Flex Pass",
            description="Full gym floor & locker room access. Renews monthly.",
            duration_days=30,
            price=1499.0,
            billing_period="monthly",
            is_active=True
        )
        p_quarterly = MembershipPlan(
            gym_id=gym1.id,
            name="Quarterly Power Plan",
            description="3 months access + 1 free personal training session.",
            duration_days=90,
            price=3999.0,
            billing_period="quarterly",
            is_active=True
        )
        p_annual = MembershipPlan(
            gym_id=gym1.id,
            name="Annual Champion Pass",
            description="365 days VIP access with sauna, nutrition plan, and guest passes.",
            duration_days=365,
            price=12999.0,
            billing_period="yearly",
            is_active=True
        )
        p_student = MembershipPlan(
            gym_id=gym1.id,
            name="Student & Off-Peak Pass",
            description="Access between 9:00 AM and 4:00 PM on weekdays.",
            duration_days=30,
            price=999.0,
            billing_period="monthly",
            is_active=True
        )
        db.add_all([p_monthly, p_quarterly, p_annual, p_student])
        db.flush()

        # Trainers for Gym 1
        t1 = Trainer(
            gym_id=gym1.id,
            name="Marcus Stone",
            email="marcus@apexfitness.com",
            phone="+1 (555) 777-1001",
            specialty="Strength & Hypertrophy",
            bio="CSCS certified with 10+ years helping athletes build strength and functional muscle.",
            hourly_rate=65.0,
            is_active=True
        )
        t2 = Trainer(
            gym_id=gym1.id,
            name="Elena Rostova",
            email="elena@apexfitness.com",
            phone="+1 (555) 777-1002",
            specialty="HIIT & Fat Loss Conditioning",
            bio="Former track athlete specializing in metabolic conditioning and core stability.",
            hourly_rate=60.0,
            is_active=True
        )
        t3 = Trainer(
            gym_id=gym1.id,
            name="David Chen",
            email="david@apexfitness.com",
            phone="+1 (555) 777-1003",
            specialty="Mobility, Yoga & Rehab",
            bio="Specialist in injury rehabilitation, joint health, and restorative flexibility.",
            hourly_rate=55.0,
            is_active=True
        )
        db.add_all([t1, t2, t3])
        db.flush()

        # Seed realistic members for Gym 1
        members_data = [
            ("James", "Wilson", "james.w@example.com", "+1 555-101-0001", "1992-05-14", "Male", "active", t1.id, p_annual, 180, 185), # active annual
            ("Emma", "Watson", "emma.w@example.com", "+1 555-101-0002", "1995-11-20", "Female", "active", t2.id, p_quarterly, 60, 30), # active quarterly
            ("Michael", "Jordan", "m.jordan@example.com", "+1 555-101-0003", "1988-02-17", "Male", "active", t1.id, p_monthly, 25, 5), # expiring in 5 days!
            ("Sophia", "Martinez", "sophia.m@example.com", "+1 555-101-0004", "1998-09-08", "Female", "active", t2.id, p_monthly, 28, 2), # expiring in 2 days!
            ("Lucas", "Scott", "lucas.s@example.com", "+1 555-101-0005", "2001-04-12", "Male", "expired", t1.id, p_monthly, 45, -15), # expired 15 days ago
            ("Olivia", "Taylor", "olivia.t@example.com", "+1 555-101-0006", "1994-07-25", "Female", "active", t3.id, p_annual, 90, 275),
            ("Daniel", "Craig", "daniel.c@example.com", "+1 555-101-0007", "1985-03-02", "Male", "active", t1.id, p_quarterly, 40, 50),
            ("Ava", "Johnson", "ava.j@example.com", "+1 555-101-0008", "1999-12-30", "Female", "active", t2.id, p_student, 10, 20),
            ("Ethan", "Brown", "ethan.b@example.com", "+1 555-101-0009", "1996-06-18", "Male", "expired", None, p_monthly, 60, -30), # expired 30 days ago
            ("Isabella", "Garcia", "isabella.g@example.com", "+1 555-101-0010", "1997-08-14", "Female", "active", t3.id, p_monthly, 15, 15),
            ("William", "Davies", "will.d@example.com", "+1 555-101-0011", "1990-10-05", "Male", "active", t1.id, p_annual, 120, 245),
            ("Mia", "Hernandez", "mia.h@example.com", "+1 555-101-0012", "2000-01-22", "Female", "active", t2.id, p_monthly, 26, 4), # expiring in 4 days!
            ("Benjamin", "White", "ben.w@example.com", "+1 555-101-0013", "1993-04-19", "Male", "active", t1.id, p_quarterly, 30, 60),
            ("Charlotte", "Lee", "charlotte.l@example.com", "+1 555-101-0014", "1998-03-11", "Female", "active", t3.id, p_student, 5, 25),
            ("Henry", "Clark", "henry.c@example.com", "+1 555-101-0015", "1989-11-29", "Male", "active", t1.id, p_monthly, 12, 18),
            ("Amelia", "Lewis", "amelia.l@example.com", "+1 555-101-0016", "2002-05-09", "Female", "active", t2.id, p_quarterly, 15, 75),
            ("Alexander", "Hall", "alex.h@example.com", "+1 555-101-0017", "1991-08-03", "Male", "active", t1.id, p_annual, 200, 165),
            ("Harper", "Allen", "harper.a@example.com", "+1 555-101-0018", "1996-09-15", "Female", "active", t3.id, p_monthly, 27, 3), # expiring in 3 days!
            ("Sebastian", "Young", "seb.y@example.com", "+1 555-101-0019", "1994-12-01", "Male", "expired", t1.id, p_monthly, 50, -20),
            ("Evelyn", "King", "evelyn.k@example.com", "+1 555-101-0020", "1999-06-27", "Female", "active", t2.id, p_monthly, 14, 16),
        ]

        created_members = []
        for fn, ln, em, ph, dob, gender, status_val, trainer_id, plan_obj, days_ago_start, days_until_end in members_data:
            join_dt = today - datetime.timedelta(days=days_ago_start)
            mem = Member(
                gym_id=gym1.id,
                first_name=fn,
                last_name=ln,
                email=em,
                phone=ph,
                date_of_birth=datetime.datetime.strptime(dob, "%Y-%m-%d").date(),
                gender=gender,
                address=f"{random.randint(100, 999)} Fitness Blvd, Metro City",
                emergency_contact_name=f"Contact for {fn}",
                emergency_contact_phone="+1 555-999-0000",
                notes="Consistently trains in the morning." if "Male" in gender else "Prefers group workouts.",
                status=status_val,
                join_date=join_dt,
                assigned_trainer_id=trainer_id
            )
            db.add(mem)
            db.flush()
            created_members.append(mem)

            # Assign membership
            start_d = today - datetime.timedelta(days=days_ago_start)
            end_d = today + datetime.timedelta(days=days_until_end)
            m_status = "active" if days_until_end >= 0 else "expired"
            
            sub = MemberMembership(
                gym_id=gym1.id,
                member_id=mem.id,
                plan_id=plan_obj.id,
                start_date=start_d,
                end_date=end_d,
                price_paid=plan_obj.price,
                status=m_status,
                notes="Initial subscription"
            )
            db.add(sub)
            db.flush()

            # Payment record
            inv = f"INV-2026{random.randint(1000, 9999)}-{mem.id}"
            pay = Payment(
                gym_id=gym1.id,
                member_id=mem.id,
                membership_id=sub.id,
                amount=plan_obj.price,
                payment_date=start_d,
                payment_method=random.choice(["card", "cash", "bank_transfer"]),
                status="completed",
                invoice_number=inv,
                notes=f"Payment for {plan_obj.name}"
            )
            db.add(pay)

            # Attendance records
            # If active, generate between 3 and 15 past attendances
            if status_val == "active":
                num_visits = random.randint(3, 12)
                for v in range(num_visits):
                    visit_day = today - datetime.timedelta(days=random.randint(0, min(days_ago_start, 25)))
                    checkin_hour = random.choice([6, 7, 8, 12, 17, 18, 19])
                    checkin_time = datetime.datetime.combine(
                        visit_day,
                        datetime.time(hour=checkin_hour, minute=random.randint(0, 50))
                    )
                    checkout_time = checkin_time + datetime.timedelta(minutes=random.randint(45, 90))
                    
                    # If visit is today and random check-in, maybe they are active now!
                    is_active_now = (visit_day == today and v == 0 and random.random() > 0.5)
                    att = Attendance(
                        gym_id=gym1.id,
                        member_id=mem.id,
                        check_in_time=checkin_time,
                        check_out_time=None if is_active_now else checkout_time,
                        method="manual" if random.random() > 0.3 else "qr",
                        notes="Chest & Triceps" if v % 2 == 0 else "Cardio session"
                    )
                    db.add(att)

        # Ensure at least 3 members are actively checked in RIGHT NOW today
        for mem in created_members[:3]:
            now = datetime.datetime.now(datetime.timezone.utc)
            checkin_now = now - datetime.timedelta(minutes=random.randint(15, 60))
            att_active = Attendance(
                gym_id=gym1.id,
                member_id=mem.id,
                check_in_time=checkin_now,
                check_out_time=None,
                method="manual",
                notes="Currently on floor"
            )
            db.add(att_active)

        # ==========================================
        # TENANT 2: IronForge Strength Studio
        # Demonstrating strict multi-tenant isolation!
        # ==========================================
        print("Creating Tenant 2: IronForge Strength Studio (Multi-tenancy test)...")
        gym2 = Gym(
            name="IronForge Strength Studio",
            slug="ironforge-studio",
            email="support@ironforgegym.com",
            phone="+91 98888 99990",
            address="101 Barbell Way, Indiranagar, Bengaluru, KA",
            currency="INR",
            plan_tier="free",
            subscription_status="active",
            approval_status="approved",
            is_approved=True,
            payment_verified=True,
            website_subdomain="ironforge",
            website_enabled=True,
            website_headline="IronForge Strength Studio",
            website_tagline="Raw Power, Calibrated Plates & Heavy Lifting",
            website_about="Dedicated strength training sanctuary for lifters, powerlifters, and athletes seeking serious strength adaptations.",
            website_amenities="Competition Power Racks, Deadlift Platforms, Calibrated Steel Plates, Chalk Friendly, Strongman Implements",
            max_members=25
        )
        db.add(gym2)
        db.flush()

        owner2 = User(
            gym_id=gym2.id,
            full_name="Brock Lesnar (Owner)",
            email="admin@ironforge.com",
            password_hash=get_password_hash("IronAdmin123!"),
            role="owner",
            is_superadmin=False,
            phone="+91 98888 99991",
            is_active=True
        )
        db.add(owner2)

        setting2 = GymSetting(
            gym_id=gym2.id,
            business_hours="24/7 Keycard Access",
            tax_percentage=18.0,
            expiry_alert_days=5,
            receipt_footer_text="IronForge: Heavy weights only.",
            primary_color="#dc2626"
        )
        db.add(setting2)

        plan2 = MembershipPlan(
            gym_id=gym2.id,
            name="Iron Lifter Membership",
            description="Unlimited powerlifting and Olympic lifting access.",
            duration_days=30,
            price=1999.0,
            billing_period="monthly",
            is_active=True
        )
        db.add(plan2)
        db.flush()

        member2 = Member(
            gym_id=gym2.id,
            first_name="Thor",
            last_name="Odinson",
            email="thor@asgard.com",
            phone="+91 98777 99999",
            date_of_birth=datetime.date(1983, 8, 11),
            gender="Male",
            status="active",
            join_date=today - datetime.timedelta(days=10)
        )
        db.add(member2)
        db.flush()

        sub2 = MemberMembership(
            gym_id=gym2.id,
            member_id=member2.id,
            plan_id=plan2.id,
            start_date=today - datetime.timedelta(days=10),
            end_date=today + datetime.timedelta(days=20),
            price_paid=1999.0,
            status="active"
        )
        db.add(sub2)

        pay2 = Payment(
            gym_id=gym2.id,
            member_id=member2.id,
            membership_id=sub2.id,
            amount=1999.0,
            payment_date=today - datetime.timedelta(days=10),
            payment_method="upi",
            status="completed",
            invoice_number="INV-IRON-0001",
            notes="IronForge monthly pass"
        )
        db.add(pay2)

        # ==========================================
        # TENANT 3: Olympus Gold Gym (Pending Approval)
        # Demonstrating Platform Super Admin Approval Gate!
        # ==========================================
        print("Creating Tenant 3: Olympus Gold Gym (Pending Platform Approval)...")
        gym3 = Gym(
            name="Olympus Gold Fitness",
            slug="olympus-gold",
            email="contact@olympusgold.com",
            phone="+91 98111 22334",
            address="Sector 29, Cyber City, Gurugram, HR",
            currency="INR",
            plan_tier="pro",
            subscription_status="active",
            approval_status="pending",  # PENDING APPROVAL!
            is_approved=False,
            payment_verified=True,  # Paid ₹2,499/mo Pro Plan, awaiting platform owner approval!
            website_subdomain="olympus-gold",
            website_enabled=True,
            website_headline="Welcome to Olympus Gold Fitness",
            website_tagline="The Pinnacle of Athletic Excellence",
            website_about="Olympus Gold is an elite fitness center built for champions, offering luxury amenities and expert body transformation coaching.",
            website_amenities="Olympic Weightlifting, Hydrotherapy Spa, Personal Training, Cardio Deck, Executive Locker Rooms",
            max_members=250
        )
        db.add(gym3)
        db.flush()

        owner3 = User(
            gym_id=gym3.id,
            full_name="Vikram Malhotra (Applicant)",
            email="owner@olympusgold.com",
            password_hash=get_password_hash("Olympus123!"),
            role="owner",
            is_superadmin=False,
            phone="+91 98111 22335",
            is_active=True
        )
        db.add(owner3)

        setting3 = GymSetting(
            gym_id=gym3.id,
            business_hours="Mon-Sun: 5:00 AM - Midnight",
            tax_percentage=18.0,
            expiry_alert_days=7,
            receipt_footer_text="Olympus Gold: Rule Your Strength.",
            primary_color="#eab308"
        )
        db.add(setting3)

        plan3 = MembershipPlan(
            gym_id=gym3.id,
            name="Olympus Gold VIP Pass",
            description="Full facility & spa access with personal training.",
            duration_days=30,
            price=2499.0,
            billing_period="monthly",
            is_active=True
        )
        db.add(plan3)

        db.commit()
        print("Successfully seeded all database tables with realistic demo data!")
        print("Demo Credentials:")
        print("  PLATFORM OWNER (Super Admin):")
        print("    Email:    admin@gympulse.com")
        print("    Password: SuperAdmin123!")
        print("  TENANT 1 (Apex Fitness Club - Pro Tier - Approved):")
        print("    Owner Email: owner@apexfitness.com")
        print("    Password:    ApexAdmin123!")
        print("    Staff Email: staff@apexfitness.com")
        print("    Password:    Staff123!")
        print("  TENANT 2 (IronForge Strength Studio - Free Tier - Approved):")
        print("    Owner Email: admin@ironforge.com")
        print("    Password:    IronAdmin123!")
        print("  TENANT 3 (Olympus Gold Fitness - Pro Tier - PENDING APPROVAL):")
        print("    Owner Email: owner@olympusgold.com")
        print("    Password:    Olympus123!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    reset_flag = "--no-reset" not in sys.argv
    seed_database(reset=reset_flag)

