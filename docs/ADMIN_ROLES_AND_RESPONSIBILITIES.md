# Admin Roles and Responsibilities

This document defines the administrative roles, responsibilities, and workflows for the CSIRO Low-Carb Diet App. These features are planned for **MVP-3 (Admin Portal)**.

---

## Table of Contents

1. [Role Definitions](#role-definitions)
2. [Food Management](#food-management)
3. [Plan Management](#plan-management)
4. [User Management](#user-management)
5. [Content Moderation](#content-moderation)
6. [Audit & Compliance](#audit--compliance)
7. [Future Considerations](#future-considerations)

---

## Role Definitions

### 1. Super Admin
**Access Level**: Full system access

| Capability | Description |
|------------|-------------|
| Manage admins | Create, edit, deactivate admin accounts |
| System configuration | App settings, feature flags |
| Data export | Full database exports for compliance |
| Audit log access | View all admin actions |
| All admin capabilities | Everything below |

### 2. Admin
**Access Level**: Content and user management

| Capability | Description |
|------------|-------------|
| Food management | Verify, edit, delete foods |
| Plan management | Create, edit system plans |
| User management | View users, reset accounts, export data |
| Recipe management | Create, edit, publish recipes |
| View audit logs | Own actions only |

### 3. Moderator (Future)
**Access Level**: Content review only

| Capability | Description |
|------------|-------------|
| Food verification | Review and verify user-submitted foods |
| Content flagging | Flag inappropriate content |
| Read-only user view | View user profiles (no edit) |

### 4. Dietician (B2B - Future)
**Access Level**: Client management

| Capability | Description |
|------------|-------------|
| Client management | View assigned clients only |
| Plan assignment | Assign/customize plans for clients |
| Create private plans | Plans visible only to their clients |
| Progress tracking | View client weight/glucose/meal history |

---

## Food Management

### User-Submitted Food Workflow

```
┌─────────────────┐
│  User creates   │
│  custom food    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Food saved with │
│ isVerified=false│
│ isPublic=false  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Appears in      │
│ Admin Queue     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Approve│ │Reject │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────────┐ ┌───────────┐
│isVerified │ │ Notify    │
│  =true    │ │ user with │
│isPublic   │ │ reason    │
│  =true    │ └───────────┘
└───────────┘
```

### Admin Food Actions

| Action | Description | Audit Log |
|--------|-------------|-----------|
| **Verify** | Mark food as verified, make public | Yes |
| **Edit & Verify** | Correct nutrition data, then verify | Yes |
| **Reject** | Remove from queue with reason | Yes |
| **Merge** | Combine duplicate foods | Yes |
| **Delete** | Remove food (soft delete) | Yes |
| **Bulk Import** | CSV upload of verified foods | Yes |

### Verification Checklist

Before verifying a user-submitted food, admin should confirm:

- [ ] Food name is appropriate and descriptive
- [ ] Category is correct
- [ ] Serving size is reasonable
- [ ] Calorie count is plausible (cross-reference if needed)
- [ ] Macros (protein, carbs, fat) add up correctly
- [ ] No duplicate exists in database
- [ ] No inappropriate content in name/description

### Food Quality Flags

| Flag | Meaning | Action |
|------|---------|--------|
| `needs_review` | Auto-flagged for unusual values | Admin review |
| `duplicate_suspected` | Similar food exists | Admin merge/reject |
| `reported` | User reported inaccuracy | Admin investigate |

---

## Plan Management

### System Plans vs Custom Plans

| Type | Created By | Visibility | Editable By |
|------|------------|------------|-------------|
| **System** | Admin | All users | Admin only |
| **Public** | Admin/Dietician | All users | Creator + Admin |
| **Private** | Dietician | Assigned clients only | Creator |

### Admin Plan Actions

| Action | Description |
|--------|-------------|
| **Create system plan** | New plan available to all users |
| **Edit plan** | Modify targets, rules, tips |
| **Archive plan** | Hide from new users, keep for existing |
| **Clone plan** | Duplicate as starting point |
| **Set as featured** | Highlight on plans page |

### CSIRO Plan Maintenance

The CSIRO-specific plans require special attention:

- [ ] Verify alignment with CSIRO book guidelines
- [ ] Update if CSIRO publishes new research
- [ ] Maintain source attribution
- [ ] Mark as `sourceAttribution: "CSIRO Low-Carb Diabetes Diet"`

---

## User Management

### Admin User Actions

| Action | Description | Requires |
|--------|-------------|----------|
| **View profile** | See user details and activity | Admin |
| **Export data** | Download user's data (GDPR) | Admin |
| **Reset password** | Trigger password reset email | Admin |
| **Deactivate account** | Soft-disable user access | Admin |
| **Delete account** | Permanent removal (GDPR) | Super Admin |
| **Impersonate** | View app as user (debug) | Super Admin |

### User Activity Metrics (Dashboard)

| Metric | Description |
|--------|-------------|
| Total users | Registered accounts |
| Active users (7d) | Logged in within 7 days |
| Active users (30d) | Logged in within 30 days |
| Meals logged (today) | Engagement metric |
| Foods pending review | Verification queue size |

### Data Export (GDPR Compliance)

When a user requests data export, include:

- Profile information
- Weight logs
- Glucose logs
- Meal logs with food items
- User-created foods
- Plan assignments

Format: JSON or CSV (user choice)

---

## Content Moderation

### Reportable Content

| Content Type | Report Reasons |
|--------------|----------------|
| Food item | Inaccurate nutrition, inappropriate name |
| Meal note | Offensive content |
| User profile | Inappropriate picture |

### Moderation Workflow

1. User reports content
2. Report appears in admin queue
3. Admin reviews report
4. Actions: Dismiss, Edit, Remove, Warn user, Ban user
5. Notify reporter of outcome (optional)

### Auto-Moderation (Future)

- Flag foods with implausible calorie values (e.g., <10 or >5000 per serving)
- Flag text containing profanity
- Flag duplicate food submissions

---

## Audit & Compliance

### Audit Log Fields

Every admin action is logged with:

```typescript
interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;           // 'FOOD_VERIFIED', 'USER_DEACTIVATED', etc.
  entityType: string;       // 'food', 'user', 'plan'
  entityId: string;
  previousValue?: object;   // State before change
  newValue?: object;        // State after change
  reason?: string;          // Admin's justification
  ipAddress: string;
  userAgent: string;
  timestamp: DateTime;
}
```

### Audited Actions

| Category | Actions |
|----------|---------|
| **Food** | verify, reject, edit, delete, merge, bulk_import |
| **Plan** | create, edit, archive, delete |
| **User** | view, export, deactivate, delete, impersonate |
| **Admin** | create, edit, deactivate |
| **System** | config_change, feature_flag_toggle |

### Audit Log Retention

- **Active logs**: 2 years
- **Archived logs**: 7 years (compliance)
- **Access**: Super Admin only for full history

---

## Future Considerations

### Dietician Portal (B2B)

```
Dietician Features:
├── Client Management
│   ├── Invite clients via email
│   ├── View client dashboard
│   ├── Track client progress
│   └── Message clients (in-app)
├── Plan Customization
│   ├── Clone system plan
│   ├── Adjust macros for client
│   ├── Add custom rules
│   └── Assign to specific clients
└── Reporting
    ├── Client progress reports
    ├── Compliance metrics
    └── Export for consultations
```

### Multi-Tenant Considerations

If the app scales to support multiple organizations:

| Feature | Description |
|---------|-------------|
| Organization accounts | Group dieticians under clinic |
| Branded experience | Custom logo, colors per org |
| Isolated data | Clients only visible within org |
| Org-level admins | Manage their own dieticians |

### API Access (Future)

| Tier | Rate Limit | Access |
|------|------------|--------|
| Admin | Unlimited | Full API |
| Dietician | 1000 req/day | Client data only |
| Integration | Custom | Approved partners |

---

## Implementation Priority

### MVP-3 (Admin Portal) - Must Have

- [ ] Admin authentication (separate from user auth)
- [ ] Food verification queue
- [ ] Food CRUD (create, edit, delete)
- [ ] User list with search
- [ ] User data export
- [ ] Basic audit log
- [ ] Admin dashboard with metrics

### MVP-3 (Admin Portal) - Nice to Have

- [ ] Bulk food import (CSV)
- [ ] Recipe management
- [ ] Plan creation UI
- [ ] Advanced user filtering

### Post-MVP-3 - Future

- [ ] Dietician portal
- [ ] Content moderation queue
- [ ] Multi-tenant support
- [ ] API access management
- [ ] Advanced analytics

---

## Access Control Matrix

| Action | User | Moderator | Admin | Super Admin |
|--------|:----:|:---------:|:-----:|:-----------:|
| Create own food | ✅ | ✅ | ✅ | ✅ |
| Verify foods | ❌ | ✅ | ✅ | ✅ |
| Edit any food | ❌ | ❌ | ✅ | ✅ |
| Delete food | ❌ | ❌ | ✅ | ✅ |
| Create system plan | ❌ | ❌ | ✅ | ✅ |
| View user list | ❌ | ❌ | ✅ | ✅ |
| Export user data | ❌ | ❌ | ✅ | ✅ |
| Delete user | ❌ | ❌ | ❌ | ✅ |
| Manage admins | ❌ | ❌ | ❌ | ✅ |
| View full audit log | ❌ | ❌ | ❌ | ✅ |

---

*Document created: January 25, 2026*
*Last updated: January 25, 2026*
*Next review: Before MVP-3 implementation*
