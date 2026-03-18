---
name: crm-lifecycle
description: Build or modify CRM features including lead management, email sequences, user lifecycle, churn detection, support tickets, affiliate payouts, admin panel, or partner management. Use when working on src/lib/crm/, src/lib/mlm/, src/lib/email/, src/app/admin/, or any user lifecycle feature.
---

# CRM & User Lifecycle

## Lead Status Flow
```
visitor → registered → trial → active → churned/paused
                                 ↓
                          upgrade/downgrade
```

## Lead Scoring (0-100)
| Action | Points |
|--------|--------|
| Signup | +20 |
| Payment | +30 |
| Copier Start | +25 |
| Mentor Chat | +10 |
| Login | +5 |
| 10+ Logins | +10 |
| Pro/Unlimited Plan | +15 |
| Inactive >7 days | -10 |
| Inactive >30 days | -20 |

## Email Sequences
**Welcome (auto):** Tag 0→1→3→7→14→30
**Win-Back:** 7/14/30 Tage Inaktivität
**Upgrade:** Copier → Signal Suite (nach 30 Tagen aktiv)
**Performance:** Monatlicher Report mit echten Zahlen
**Partner:** Upline Push bei inaktiven Referrals

## Partner Tiers
| Tier | Min Partners | L1 | L2 | L3 |
|------|-------------|-----|-----|-----|
| Bronze | 1 | 30% | — | — |
| Silber | 5 | 35% | 10% | — |
| Gold | 15 | 40% | 12% | 5% |
| Diamond | 50 | 50% | 15% | 8% |

## Supabase Tables
- `crm_leads` — Score, Status, Churn Risk, Source, Tags
- `crm_activities` — type: page_view, login, trade, email_open, etc.
- `crm_campaigns` — Email Templates + Segmente
- `crm_email_queue` — pending → sent → opened → clicked
- `support_tickets` + `ticket_messages`
- `affiliate_payouts` — pending → processing → paid

## Admin Panel (src/app/admin/)
Auth check: `profiles.role === "admin"`
Pages: Dashboard, Users, Partners, Tickets, System Health
