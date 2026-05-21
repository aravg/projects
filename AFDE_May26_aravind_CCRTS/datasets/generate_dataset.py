import csv
import random
from datetime import datetime, timedelta
import os

CATEGORIES = [
    'Billing Issues', 'Service Disruption', 'Product Defects',
    'Technical Problems', 'Delivery Delays', 'Account Issues', 'Customer Service'
]
PRIORITIES = ['low', 'medium', 'high', 'critical']
STATUSES = ['open', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed']
AGENTS = ['Mike Chen', 'Priya Sharma', 'James Wilson', 'Sarah Johnson', 'David Lee']
REGIONS = ['North', 'South', 'East', 'West', 'Central']

CUSTOMERS = [
    ('John Doe', 'john.doe@email.com'),
    ('Alice Brown', 'alice.brown@email.com'),
    ('Bob Smith', 'bob.smith@email.com'),
    ('Carol White', 'carol.white@email.com'),
    ('David Miller', 'david.miller@email.com'),
    ('Emma Wilson', 'emma.wilson@email.com'),
    ('Frank Garcia', 'frank.garcia@email.com'),
    ('Grace Lee', 'grace.lee@email.com'),
    ('Henry Taylor', 'henry.taylor@email.com'),
    ('Iris Johnson', 'iris.johnson@email.com'),
    ('Jason Park', 'jason.park@email.com'),
    ('Kate Robinson', 'kate.robinson@email.com'),
]

COMPLAINT_TEMPLATES = {
    'Billing Issues': [
        ('Incorrect invoice amount', 'Charged incorrect amount on monthly invoice. Expected amount does not match the bill.'),
        ('Double billing charge', 'Billed twice for the same service this month. Duplicate transaction detected.'),
        ('Unauthorized charges', 'Unfamiliar charges appearing on account without consent or authorization.'),
        ('Refund not processed', 'Requested refund has not been credited to account after 10 business days.'),
        ('Subscription price discrepancy', 'Charged more than the agreed subscription price. Contract rate not honored.'),
        ('Late payment fee wrongly applied', 'Late payment fee applied despite payment being made before due date.'),
        ('Pro-rated billing error', 'Incorrect pro-rated amount charged after plan upgrade mid-cycle.'),
    ],
    'Service Disruption': [
        ('Internet service down', 'Unable to connect to internet for several hours. All devices affected.'),
        ('Service outage in area', 'Complete service outage affecting my entire region with no notification.'),
        ('Frequent disconnections', 'Service disconnecting multiple times per day causing work disruption.'),
        ('Slow service performance', 'Service running at significantly reduced speed, affecting productivity.'),
        ('Intermittent connectivity issues', 'Connection drops randomly every few minutes throughout the day.'),
        ('Planned maintenance not notified', 'Service went down during business hours without prior warning.'),
        ('TV service signal loss', 'Cable TV signal lost intermittently throughout the day.'),
    ],
    'Product Defects': [
        ('Product arrived damaged', 'Item received with visible physical damage, dents and scratches present.'),
        ('Defective product functionality', 'Product not working as advertised. Core features non-functional.'),
        ('Missing product components', 'Received product with missing parts. Accessories not included.'),
        ('Quality does not match description', 'Product quality far below what was shown in listing photos.'),
        ('Product stopped working', 'Product failed completely within the first week of normal use.'),
        ('Manufacturing defect visible', 'Clear manufacturing defect - uneven finish and structural issues.'),
        ('Wrong product delivered', 'Received completely different product than what was ordered.'),
    ],
    'Technical Problems': [
        ('Mobile app crashes', 'Application crashes on startup every time. Cannot access any features.'),
        ('Cannot login to account', 'Login page returns error 500 after entering correct credentials.'),
        ('Website not loading', 'Website times out and fails to load on all browsers and devices.'),
        ('Password reset not working', 'Reset email never received after multiple attempts over two days.'),
        ('Two-factor authentication failure', '2FA codes not being accepted by system despite being correct.'),
        ('Data sync issue', 'Data not syncing between mobile and desktop applications.'),
        ('Payment processing error', 'Error occurs every time attempting to process payment online.'),
    ],
    'Delivery Delays': [
        ('Package not delivered on time', 'Expected delivery date passed with no delivery or communication.'),
        ('Order status not updating', 'Tracking shows no movement for 5 consecutive business days.'),
        ('Wrong item delivered', 'Received completely different item than what was ordered and paid for.'),
        ('Package marked delivered but not received', 'Tracking system shows delivered but nothing arrived at address.'),
        ('Shipment stuck in transit', 'Package has been in transit hub for over two weeks with no update.'),
        ('Delivery to wrong address', 'Package delivered to wrong address despite correct address on order.'),
        ('Customs hold not communicated', 'Package held in customs for weeks without any notification.'),
    ],
    'Account Issues': [
        ('Unable to access account', 'Account locked after multiple failed login attempts, cannot recover.'),
        ('Account settings not saving', 'Profile changes being automatically reverted after saving.'),
        ('Account suspended without notice', 'Account suspended without prior notification or explanation.'),
        ('Cannot update payment method', 'Error message appears every time attempting to update credit card.'),
        ('Account data loss', 'Account history and saved preferences disappeared after system update.'),
        ('Email address change failing', 'Unable to update registered email address on account profile.'),
        ('Two accounts merged incorrectly', 'Account merge resulted in data loss and wrong profile information.'),
    ],
    'Customer Service': [
        ('Rude customer service representative', 'Agent was dismissive and unprofessional during support interaction.'),
        ('Long wait times on support', 'Waited over 2 hours on hold to speak with a support agent.'),
        ('Issue not resolved after contact', 'Problem still persists after previous support interaction and closure.'),
        ('Misinformation from support agent', 'Given incorrect information about policy that led to financial loss.'),
        ('No response to previous complaint', 'Submitted complaint 5 days ago with no acknowledgment or response.'),
        ('Callback not received', 'Promised a callback within 24 hours but never received contact.'),
        ('Support agent disconnected call', 'Support agent ended call without resolving the issue mid-conversation.'),
    ],
}

SLA_HOURS = {'critical': 4, 'high': 24, 'medium': 48, 'low': 72}


def generate_complaint(complaint_id, created_at):
    category = random.choice(CATEGORIES)
    priority = random.choices(PRIORITIES, weights=[25, 40, 25, 10])[0]
    template = random.choice(COMPLAINT_TEMPLATES[category])

    if priority == 'critical':
        status = random.choices(STATUSES, weights=[5, 8, 8, 15, 38, 26])[0]
    elif priority == 'high':
        status = random.choices(STATUSES, weights=[10, 12, 15, 10, 33, 20])[0]
    elif priority == 'medium':
        status = random.choices(STATUSES, weights=[18, 15, 18, 8, 27, 14])[0]
    else:
        status = random.choices(STATUSES, weights=[25, 15, 18, 5, 25, 12])[0]

    assigned_agent = ''
    if status in ['assigned', 'in_progress', 'escalated', 'resolved', 'closed']:
        assigned_agent = random.choice(AGENTS)

    sla_limit = SLA_HOURS[priority]
    resolved_at = ''
    resolution_time_hours = ''

    if status in ['resolved', 'closed']:
        if random.random() < 0.62:
            resolution_hours = random.uniform(0.5, sla_limit * 0.9)
        else:
            resolution_hours = random.uniform(sla_limit * 1.05, sla_limit * 3.5)
        resolution_time_hours = round(resolution_hours, 2)
        resolved_at = (created_at + timedelta(hours=resolution_hours)).strftime('%Y-%m-%d %H:%M:%S')

    customer = random.choice(CUSTOMERS)
    region = random.choice(REGIONS)

    customer_rating = ''
    if status in ['resolved', 'closed'] and random.random() < 0.72:
        customer_rating = random.randint(1, 5)

    return {
        'complaint_id': complaint_id,
        'complaint_number': f'CMP-2024-{complaint_id:05d}',
        'customer_name': customer[0],
        'customer_email': customer[1],
        'category': category,
        'priority': priority,
        'status': status,
        'title': template[0],
        'description': template[1],
        'created_at': created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'resolved_at': resolved_at,
        'assigned_agent': assigned_agent,
        'customer_rating': customer_rating,
        'region': region,
    }


def generate_dataset(num_records=210, output_path=None):
    if output_path is None:
        output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'complaints_dataset.csv')

    records = []
    base_date = datetime(2024, 1, 1, 8, 0, 0)

    for i in range(1, num_records + 1):
        days_offset = int((i / num_records) * 480)
        created_at = base_date + timedelta(
            days=days_offset,
            hours=random.randint(0, 22),
            minutes=random.randint(0, 59)
        )
        records.append(generate_complaint(i, created_at))

    fieldnames = [
        'complaint_id', 'complaint_number', 'customer_name', 'customer_email',
        'category', 'priority', 'status', 'title', 'description',
        'created_at', 'resolved_at', 'assigned_agent', 'customer_rating', 'region'
    ]

    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {num_records} complaint records -> {output_path}")
    return len(records)


if __name__ == '__main__':
    random.seed(42)
    count = generate_dataset(210)
    print(f"Dataset generation complete: {count} records")
