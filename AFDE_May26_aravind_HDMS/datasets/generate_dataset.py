"""One-time script to generate historical tickets CSV for ETL testing."""
import csv
import random
from datetime import datetime, timedelta

random.seed(42)

EMPLOYEES = [
    ("Alice Johnson", "IT"), ("Bob Smith", "HR"), ("Carol Williams", "Finance"),
    ("David Brown", "Operations"), ("Emma Davis", "Marketing"), ("Frank Wilson", "Sales"),
    ("Grace Moore", "Engineering"), ("Henry Taylor", "Legal"), ("Isabella Anderson", "Customer Service"),
    ("James Thomas", "Management"), ("Karen Jackson", "IT"), ("Liam White", "HR"),
    ("Mia Harris", "Finance"), ("Noah Martin", "Operations"), ("Olivia Thompson", "Marketing"),
    ("Peter Garcia", "Sales"), ("Quinn Martinez", "Engineering"), ("Rachel Robinson", "Legal"),
    ("Samuel Clark", "Customer Service"), ("Tina Rodriguez", "Management"),
    ("Uma Lewis", "IT"), ("Victor Lee", "HR"), ("Wendy Walker", "Finance"),
    ("Xavier Hall", "Operations"), ("Yara Allen", "Marketing"), ("Zachary Young", "Sales"),
    ("Amy Hernandez", "Engineering"), ("Brian King", "Legal"), ("Cathy Wright", "Customer Service"),
    ("Derek Scott", "Management"),
]

CATEGORIES = [
    "VPN Issue", "Password Reset", "Software Installation",
    "Laptop Issue", "Email Access", "Network Connectivity", "Hardware Request", "Other",
]

PRIORITIES = ["Low", "Medium", "High", "Critical"]
PRIORITY_WEIGHTS = [0.30, 0.40, 0.20, 0.10]

STATUSES = ["Open", "In Progress", "Resolved", "Closed"]
STATUS_WEIGHTS = [0.20, 0.20, 0.30, 0.30]

DESCRIPTIONS = {
    "VPN Issue": [
        "Cannot connect to VPN from home office",
        "VPN client disconnects every 30 minutes",
        "VPN credentials not accepted after password change",
        "VPN client requires update to latest version",
        "Unable to access internal resources through VPN",
    ],
    "Password Reset": [
        "Account locked after multiple failed login attempts",
        "Forgot password for company email account",
        "Password expired and self-service reset not working",
        "New employee needs initial password configured",
        "SSO password sync issue after domain change",
    ],
    "Software Installation": [
        "Microsoft Office 365 not installed on new laptop",
        "Need Adobe Acrobat Reader for PDF forms",
        "Request to install Slack desktop application",
        "AutoCAD license needed for design work",
        "Python development environment setup required",
    ],
    "Laptop Issue": [
        "Laptop not booting up after Windows update",
        "Screen flickering and display artifacts present",
        "Keyboard keys intermittently not responding",
        "Battery draining too fast, less than 2 hours",
        "Laptop overheating and shutting down unexpectedly",
    ],
    "Email Access": [
        "Cannot send emails to external recipients",
        "Outlook not syncing new messages since Monday",
        "Email storage quota exceeded, cannot receive mail",
        "Distribution list access required for project team",
        "Email signature not displaying correctly in Outlook",
    ],
    "Network Connectivity": [
        "Cannot connect to office WiFi on floor 3",
        "Internet connection very slow at workstation",
        "Shared network drive not accessible from remote",
        "Network printer not discovered on local network",
        "Intermittent connection drops affecting video calls",
    ],
    "Hardware Request": [
        "Request for external 27-inch monitor for dual setup",
        "New wireless keyboard and mouse needed",
        "USB-C docking station required for laptop",
        "Headset required for customer service calls",
        "Ergonomic mouse requested due to wrist strain",
    ],
    "Other": [
        "Software license transfer from departing employee",
        "General IT policy question about BYOD",
        "System running slowly, suspected malware",
        "Backup job not completing successfully overnight",
        "Request for IT support for offsite team event",
    ],
}

START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2026, 5, 15)
DAYS_RANGE = (END_DATE - START_DATE).days


def random_date():
    return START_DATE + timedelta(days=random.randint(0, DAYS_RANGE))


rows = []
for i in range(1, 221):
    emp_name, dept = random.choice(EMPLOYEES)
    category = random.choices(CATEGORIES, weights=[15, 20, 15, 12, 13, 12, 8, 5])[0]
    priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0]
    status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
    description = random.choice(DESCRIPTIONS[category])
    created = random_date()

    resolved_at = ""
    if status in ("Resolved", "Closed"):
        res_days = random.randint(1, 14)
        resolved_at = (created + timedelta(days=res_days)).strftime("%Y-%m-%d %H:%M:%S")

    rows.append({
        "ticket_id": i,
        "employee_name": emp_name,
        "department": dept,
        "issue_category": category,
        "description": description,
        "priority": priority,
        "status": status,
        "created_at": created.strftime("%Y-%m-%d %H:%M:%S"),
        "resolved_at": resolved_at,
    })

# Add 10 intentional duplicates to test deduplication
for i in range(10):
    dup = rows[i].copy()
    rows.append(dup)

output_path = "tickets_historical.csv"
with open(output_path, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} rows ({len(rows) - 220} intentional duplicates) -> {output_path}")
