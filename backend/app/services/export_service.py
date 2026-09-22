import csv
import io
from typing import List, Dict, Any
from app.models.models import Gym, Payment, Member, MemberMembership

class ExportService:
    @staticmethod
    def generate_csv(headers: List[str], rows: List[List[Any]]) -> str:
        """Generate a clean CSV string from headers and row data."""
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)
        return output.getvalue()

    @staticmethod
    def generate_receipt_html(gym: Gym, payment: Payment, member: Member, membership: MemberMembership = None) -> str:
        """Generate a printable, self-contained HTML invoice receipt."""
        plan_name = membership.plan.name if (membership and membership.plan) else "General Fitness / Services"
        currency = "₹" if (not gym.currency or gym.currency == "INR") else gym.currency
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Receipt #{payment.invoice_number}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1f2937;
            margin: 0;
            padding: 30px;
            background-color: #f9fafb;
        }}
        .receipt-card {{
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
            margin-bottom: 25px;
        }}
        .gym-name {{
            font-size: 24px;
            font-weight: 800;
            color: #111827;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            border-radius: 9999px;
            background-color: #ecfdf5;
            color: #059669;
        }}
        .details-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}
        .section-title {{
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 6px;
        }}
        .info-value {{
            font-size: 14px;
            color: #1f2937;
            font-weight: 500;
            line-height: 1.5;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }}
        .table th {{
            text-align: left;
            padding: 12px;
            background: #f9fafb;
            font-size: 12px;
            font-weight: 600;
            color: #4b5563;
            border-bottom: 1px solid #e5e7eb;
        }}
        .table td {{
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }}
        .total-row td {{
            font-weight: 700;
            font-size: 16px;
            color: #111827;
            border-top: 2px solid #e5e7eb;
        }}
        .footer {{
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            margin-top: 30px;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
        }}
        @media print {{
            body {{
                background: none;
                padding: 0;
            }}
            .receipt-card {{
                box-shadow: none;
                border: none;
                padding: 0;
            }}
            .no-print {{
                display: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="text-align: center; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Print / Save as PDF
        </button>
    </div>
    <div class="receipt-card">
        <div class="header">
            <div>
                <div class="gym-name">{gym.name}</div>
                <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">{gym.address or ''} {gym.phone or ''}</div>
            </div>
            <div style="text-align: right;">
                <span class="badge">{payment.status}</span>
                <div style="font-size: 13px; color: #6b7280; margin-top: 6px;">Invoice: <strong>#{payment.invoice_number}</strong></div>
            </div>
        </div>

        <div class="details-grid">
            <div>
                <div class="section-title">Billed To</div>
                <div class="info-value"><strong>{member.full_name}</strong></div>
                <div class="info-value">{member.phone}</div>
                <div class="info-value">{member.email or ''}</div>
            </div>
            <div style="text-align: right;">
                <div class="section-title">Payment Details</div>
                <div class="info-value">Date: {payment.payment_date.strftime('%b %d, %Y')}</div>
                <div class="info-value">Method: {payment.payment_method.capitalize()}</div>
            </div>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Period / Notes</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>{plan_name}</strong></td>
                    <td style="color: #6b7280;">{payment.notes or 'Membership dues'}</td>
                    <td style="text-align: right;">{currency} {payment.amount:,.2f}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="2" style="text-align: right;">Total Paid</td>
                    <td style="text-align: right;">{currency} {payment.amount:,.2f}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <p>Thank you for training with {gym.name}! This receipt was electronically generated.</p>
        </div>
    </div>
</body>
</html>"""
