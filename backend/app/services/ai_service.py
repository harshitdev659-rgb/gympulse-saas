import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.models.models import (
    Gym, Member, MemberMembership, MembershipPlan, 
    Attendance, Payment, Trainer
)
from app.core.config import settings

class GymDataRetriever:
    """Strictly tenant-scoped data retrieval for the AI engine."""
    
    @staticmethod
    def get_expiring_members(db: Session, gym_id: int, days: int = 7) -> List[Dict[str, Any]]:
        today = datetime.date.today()
        target_date = today + datetime.timedelta(days=days)
        
        results = (
            db.query(MemberMembership, Member, MembershipPlan)
            .join(Member, MemberMembership.member_id == Member.id)
            .join(MembershipPlan, MemberMembership.plan_id == MembershipPlan.id)
            .filter(
                MemberMembership.gym_id == gym_id,
                MemberMembership.status == "active",
                MemberMembership.end_date >= today,
                MemberMembership.end_date <= target_date
            )
            .order_by(MemberMembership.end_date.asc())
            .all()
        )
        
        return [
            {
                "member_id": m.id,
                "name": m.full_name,
                "phone": m.phone,
                "plan": p.name,
                "end_date": mm.end_date.strftime("%Y-%m-%d"),
                "days_left": (mm.end_date - today).days
            }
            for mm, m, p in results
        ]

    @staticmethod
    def get_inactive_members(db: Session, gym_id: int, days: int = 14) -> List[Dict[str, Any]]:
        today = datetime.date.today()
        cutoff_date = datetime.datetime.combine(today - datetime.timedelta(days=days), datetime.time.min)
        
        # Members of this gym with active status
        active_members = db.query(Member).filter(
            Member.gym_id == gym_id,
            Member.status == "active"
        ).all()
        
        inactive = []
        for m in active_members:
            latest_attendance = (
                db.query(Attendance)
                .filter(Attendance.gym_id == gym_id, Attendance.member_id == m.id)
                .order_by(Attendance.check_in_time.desc())
                .first()
            )
            if not latest_attendance:
                inactive.append({
                    "member_id": m.id,
                    "name": m.full_name,
                    "phone": m.phone,
                    "last_seen": "Never attended",
                    "days_inactive": (today - m.join_date).days
                })
            elif latest_attendance.check_in_time < cutoff_date:
                days_ago = (today - latest_attendance.check_in_time.date()).days
                inactive.append({
                    "member_id": m.id,
                    "name": m.full_name,
                    "phone": m.phone,
                    "last_seen": latest_attendance.check_in_time.strftime("%Y-%m-%d"),
                    "days_inactive": days_ago
                })
        return sorted(inactive, key=lambda x: x["days_inactive"], reverse=True)

    @staticmethod
    def get_revenue_metrics(db: Session, gym_id: int) -> Dict[str, Any]:
        today = datetime.date.today()
        first_of_month = today.replace(day=1)
        
        # Last month
        last_month_end = first_of_month - datetime.timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        
        this_month_rev = (
            db.query(func.sum(Payment.amount))
            .filter(
                Payment.gym_id == gym_id,
                Payment.status == "completed",
                Payment.payment_date >= first_of_month
            )
            .scalar() or 0.0
        )
        
        last_month_rev = (
            db.query(func.sum(Payment.amount))
            .filter(
                Payment.gym_id == gym_id,
                Payment.status == "completed",
                Payment.payment_date >= last_month_start,
                Payment.payment_date <= last_month_end
            )
            .scalar() or 0.0
        )
        
        total_all_time = (
            db.query(func.sum(Payment.amount))
            .filter(Payment.gym_id == gym_id, Payment.status == "completed")
            .scalar() or 0.0
        )
        
        pending_amount = (
            db.query(func.sum(Payment.amount))
            .filter(Payment.gym_id == gym_id, Payment.status == "pending")
            .scalar() or 0.0
        )
        
        return {
            "this_month": round(this_month_rev, 2),
            "last_month": round(last_month_rev, 2),
            "total_all_time": round(total_all_time, 2),
            "pending_amount": round(pending_amount, 2)
        }

    @staticmethod
    def get_popular_plans(db: Session, gym_id: int) -> List[Dict[str, Any]]:
        plans = db.query(MembershipPlan).filter(MembershipPlan.gym_id == gym_id).all()
        result = []
        for p in plans:
            count = db.query(MemberMembership).filter(
                MemberMembership.gym_id == gym_id,
                MemberMembership.plan_id == p.id
            ).count()
            result.append({
                "plan_id": p.id,
                "name": p.name,
                "price": p.price,
                "duration_days": p.duration_days,
                "active_subscriptions": count
            })
        return sorted(result, key=lambda x: x["active_subscriptions"], reverse=True)


class AIAssistantService:
    """Intelligent gym assistant that strictly isolates tenant data."""

    @classmethod
    def query(cls, query_str: str, gym: Gym, db: Session) -> Dict[str, Any]:
        q = query_str.lower().strip()
        currency = "₹" if (not gym.currency or gym.currency == "INR") else gym.currency

        # 1. Expiring memberships check
        if any(term in q for term in ["expire", "expiring", "due to end", "renewal"]):
            expiring = GymDataRetriever.get_expiring_members(db, gym.id, days=7)
            if not expiring:
                return {
                    "query": query_str,
                    "answer": f"Good news! You have 0 memberships expiring in the next 7 days for {gym.name}.",
                    "suggested_actions": [{"label": "View All Members", "action": "NAVIGATE_MEMBERS"}],
                    "data": []
                }
            names = ", ".join([f"{item['name']} ({item['days_left']}d left)" for item in expiring[:5]])
            more_text = f" and {len(expiring) - 5} more" if len(expiring) > 5 else ""
            return {
                "query": query_str,
                "answer": f"You currently have {len(expiring)} membership(s) expiring within the next 7 days: {names}{more_text}. Would you like to send them renewal reminders?",
                "suggested_actions": [
                    {"label": "Send Renewal Alerts", "action": "TRIGGER_REMINDERS"},
                    {"label": "View Expiring Members", "action": "NAVIGATE_EXPIRING"}
                ],
                "data": expiring
            }

        # 2. Inactive / absent members check
        if any(term in q for term in ["not attended", "inactive", "absent", "haven't seen", "not visited", "14 days", "attendance"]):
            inactive = GymDataRetriever.get_inactive_members(db, gym.id, days=14)
            if not inactive:
                return {
                    "query": query_str,
                    "answer": f"Member retention looks great! All active members have attended {gym.name} within the last 14 days.",
                    "suggested_actions": [{"label": "View Attendance Log", "action": "NAVIGATE_ATTENDANCE"}],
                    "data": []
                }
            top_inactive = inactive[:5]
            list_desc = ", ".join([f"{item['name']} ({item['days_inactive']} days inactive)" for item in top_inactive])
            return {
                "query": query_str,
                "answer": f"Found {len(inactive)} active member(s) who have not attended in 14+ days. Notable: {list_desc}. Consider sending a motivational check-in!",
                "suggested_actions": [
                    {"label": "View Members", "action": "NAVIGATE_MEMBERS"},
                    {"label": "Record Attendance", "action": "NAVIGATE_ATTENDANCE"}
                ],
                "data": inactive
            }

        # 3. Revenue & payments queries
        if any(term in q for term in ["revenue", "earned", "income", "sales", "money", "collections"]):
            rev = GymDataRetriever.get_revenue_metrics(db, gym.id)
            growth = ""
            if rev["last_month"] > 0:
                diff = rev["this_month"] - rev["last_month"]
                pct = round((diff / rev["last_month"]) * 100, 1)
                growth = f" ({'+' if pct >= 0 else ''}{pct}% compared to last month's {currency} {rev['last_month']:,.2f})"

            return {
                "query": query_str,
                "answer": f"For {gym.name}: Revenue this month is {currency} {rev['this_month']:,.2f}{growth}. Total all-time revenue collected is {currency} {rev['total_all_time']:,.2f}. Pending unpaid dues: {currency} {rev['pending_amount']:,.2f}.",
                "suggested_actions": [
                    {"label": "View Revenue Report", "action": "NAVIGATE_REPORTS"},
                    {"label": "View Payments Log", "action": "NAVIGATE_PAYMENTS"}
                ],
                "data": rev
            }

        # 4. Popular plans
        if any(term in q for term in ["popular", "best plan", "top plan", "plans", "packages"]):
            popular = GymDataRetriever.get_popular_plans(db, gym.id)
            if not popular:
                return {
                    "query": query_str,
                    "answer": f"No membership plans have been created yet for {gym.name}.",
                    "suggested_actions": [{"label": "Create Membership Plan", "action": "NAVIGATE_PLANS"}],
                    "data": []
                }
            top = popular[0]
            summary = f"Your most popular plan is '{top['name']}' ({currency} {top['price']:,.2f} for {top['duration_days']} days) with {top['active_subscriptions']} subscriber(s)."
            return {
                "query": query_str,
                "answer": summary,
                "suggested_actions": [{"label": "Manage Plans", "action": "NAVIGATE_PLANS"}],
                "data": popular
            }

        # 5. Total members / overview
        if any(term in q for term in ["how many members", "total members", "member count", "gym overview", "status"]):
            total = db.query(Member).filter(Member.gym_id == gym.id).count()
            active = db.query(Member).filter(Member.gym_id == gym.id, Member.status == "active").count()
            expired = db.query(Member).filter(Member.gym_id == gym.id, Member.status == "expired").count()
            return {
                "query": query_str,
                "answer": f"{gym.name} currently has {total} total members: {active} active, {expired} expired, and {total - active - expired} in other statuses.",
                "suggested_actions": [{"label": "Add New Member", "action": "OPEN_ADD_MEMBER"}],
                "data": {"total": total, "active": active, "expired": expired}
            }

        # Default fallback with helpful prompts
        return {
            "query": query_str,
            "answer": f"I am your AI Gym Assistant for {gym.name}. I can analyze your gym's data in real-time! Try asking:\n• 'How many memberships expire this week?'\n• 'Which members have not attended in 14 days?'\n• 'What was our revenue this month?'\n• 'Which membership plan is most popular?'\n• 'How many total members do we have?'",
            "suggested_actions": [
                {"label": "Expiring This Week?", "prompt": "How many memberships expire this week?"},
                {"label": "Inactive Members?", "prompt": "Which members have not attended in 14 days?"},
                {"label": "Revenue This Month?", "prompt": "What was our revenue this month?"}
            ],
            "data": None
        }
