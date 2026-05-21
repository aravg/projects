from .database import SessionLocal
from . import models
from .auth import hash_password
from datetime import datetime, timedelta

def seed_data():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return

        # Create categories
        categories = [
            models.Category(name="Billing Issues", description="Payment and billing problems"),
            models.Category(name="Service Disruption", description="Service outages and interruptions"),
            models.Category(name="Product Defects", description="Defective or damaged products"),
            models.Category(name="Technical Problems", description="Technical issues and bugs"),
            models.Category(name="Delivery Delays", description="Shipping and delivery problems"),
            models.Category(name="Account Issues", description="Account access and management"),
            models.Category(name="Customer Service", description="Support experience complaints"),
        ]
        for c in categories:
            db.add(c)
        db.flush()

        # Create users
        admin = models.User(name="Admin User", email="admin@ccrts.com", password_hash=hash_password("admin123"), role="admin")
        supervisor = models.User(name="Sarah Johnson", email="supervisor@ccrts.com", password_hash=hash_password("super123"), role="supervisor")
        agent1 = models.User(name="Mike Chen", email="agent1@ccrts.com", password_hash=hash_password("agent123"), role="agent")
        agent2 = models.User(name="Priya Sharma", email="agent2@ccrts.com", password_hash=hash_password("agent123"), role="agent")
        customer1 = models.User(name="John Doe", email="customer@ccrts.com", password_hash=hash_password("cust123"), role="customer")
        customer2 = models.User(name="Alice Brown", email="alice@ccrts.com", password_hash=hash_password("cust123"), role="customer")

        for u in [admin, supervisor, agent1, agent2, customer1, customer2]:
            db.add(u)
        db.flush()

        # Create sample complaints
        complaints_data = [
            {"title": "Invoice amount incorrect", "description": "My monthly invoice shows wrong charges for services I didn't use.", "priority": "high", "status": "open", "category_id": categories[0].id, "customer_id": customer1.id},
            {"title": "Internet service down", "description": "My internet connection has been down for 2 days. Very urgent!", "priority": "critical", "status": "assigned", "category_id": categories[1].id, "customer_id": customer1.id, "assigned_to": agent1.id},
            {"title": "Product arrived damaged", "description": "The product I ordered arrived in a damaged box and is not working.", "priority": "medium", "status": "in_progress", "category_id": categories[2].id, "customer_id": customer2.id, "assigned_to": agent2.id},
            {"title": "Cannot login to account", "description": "I am unable to login to my account despite using correct credentials.", "priority": "high", "status": "resolved", "category_id": categories[5].id, "customer_id": customer1.id, "assigned_to": agent1.id},
            {"title": "Delivery delayed by 2 weeks", "description": "My order was supposed to arrive 2 weeks ago but still not delivered.", "priority": "medium", "status": "escalated", "category_id": categories[4].id, "customer_id": customer2.id},
            {"title": "Rude customer support agent", "description": "The support agent was very rude and unhelpful during my call.", "priority": "low", "status": "closed", "category_id": categories[6].id, "customer_id": customer1.id},
            {"title": "Technical issue with mobile app", "description": "The mobile app crashes every time I try to open the payment section.", "priority": "medium", "status": "open", "category_id": categories[3].id, "customer_id": customer2.id},
            {"title": "Double charged for subscription", "description": "I was charged twice for my subscription this month.", "priority": "high", "status": "in_progress", "category_id": categories[0].id, "customer_id": customer1.id, "assigned_to": agent2.id},
        ]

        for i, cd in enumerate(complaints_data):
            hours = {"low": 72, "medium": 48, "high": 24, "critical": 4}.get(cd["priority"], 48)
            complaint = models.Complaint(
                complaint_number=f"CMP-2024-{str(i+1).zfill(5)}",
                title=cd["title"],
                description=cd["description"],
                priority=cd["priority"],
                status=cd["status"],
                category_id=cd["category_id"],
                customer_id=cd["customer_id"],
                assigned_to=cd.get("assigned_to"),
                sla_deadline=datetime.utcnow() + timedelta(hours=hours),
                is_escalated=cd["status"] == "escalated",
                resolved_at=datetime.utcnow() if cd["status"] in ["resolved", "closed"] else None
            )
            db.add(complaint)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Seeding error: {e}")
    finally:
        db.close()
