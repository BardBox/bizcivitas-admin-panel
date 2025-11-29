# BizCivitas Commission System - Complete Explanation

**Date**: November 29, 2025
**Purpose**: Comprehensive documentation of the hierarchical commission distribution system

---

## 📊 Organizational Hierarchy

```
BizCivitas (Super Admin)
         ↓
┌────────────────────────────────────┐
│                                    │
│  GEOGRAPHIC STRUCTURE              │  MEMBERSHIP TYPES
│                                    │
├─ Country (e.g., India)             │  1. Flagship Member
│  └─ State (e.g., Maharashtra)      │     - Physical membership
│     └─ Zone/City                   │     - 12% commission pool
│        └─ Areas                    │
│                                    │  2. Digital Member
└─ Managed by MF/AF                  │     - Online membership
                                     │     - 40% commission pool
└────────────────────────────────────┘
```

---

## 👥 Role Definitions

### 1. **Master Franchise (MF)**
- **Manages**: Entire Zone (typically a city)
- **Responsibilities**:
  - Creates and manages multiple Areas within their Zone
  - Hires/assigns Area Franchises (AF)
  - Decides how many Areas to create in their Zone
  - Oversees all franchise activities in their Zone
- **Example**: MF manages "Mumbai Zone" and creates 5 areas (Andheri, Bandra, etc.)
- **Commission**: Highest percentage in the hierarchy

### 2. **Area Franchise (AF)**
- **Hired by**: Master Franchise (MF)
- **Manages**: Specific Area within a Zone
- **Responsibilities**:
  - Manages Core Groups within their Area
  - Assigns DCPs (Digital Chapter Partners)
  - Recruits members (both Flagship and Digital)
  - Local event management
- **Example**: AF manages "Andheri Area" under Mumbai Zone
- **Commission**: Mid-tier percentage

### 3. **Core Group Council (CGC)**
- **Definition**: 3 or more people who act as leaders of a Core Group
- **Responsibilities**:
  - Lead and manage a Core Group
  - Organize meetups and events
  - Recruit Flagship members
  - Foster community engagement
- **Example**: 5 business leaders form CGC for "Tech Entrepreneurs Core Group"
- **Membership**: Flagship members only

### 4. **Core Member**
- **Type**: Flagship Member (physical membership)
- **Activities**:
  - Attends in-person meetups
  - Part of a Core Group led by CGC
  - Gives/receives referrals (BizConnect)
  - Participates in TYFCB (Thank You For Business)
- **Commission**: Receives commission when they recruit new members

### 5. **Digital Chapter Partner (DCP)**
- **Type**: Digital Member (online membership)
- **Activities**:
  - Manages online community
  - Facilitates digital connections
  - Recruits Digital Members
  - Organizes virtual events
- **Commission**: Receives commission for Digital Member recruitment

### 6. **Digital Member (DM)**
- **Type**: Digital-only membership
- **Activities**:
  - Online networking
  - Virtual meetups
  - Digital business connections
- **No franchise role**: Just a member

---

## 💰 Commission Distribution Flow

### Flagship Member Registration (12% Pool)

When a **Flagship Member** joins through a Core Member:

```
New Flagship Member Payment (₹100,000)
              ↓
    12% Commission Pool = ₹12,000
              ↓
┌─────────────────────────────────────┐
│ Distribution Hierarchy:             │
├─────────────────────────────────────┤
│ 1. Super Admin (SA): 12% of pool    │ → ₹1,440
│    (12% × ₹12,000)                  │
├─────────────────────────────────────┤
│ 2. Master Franchise (MF): 12%       │ → ₹1,440
│    (who manages the Zone)           │
├─────────────────────────────────────┤
│ 3. Area Franchise (AF): 7%          │ → ₹840
│    (who manages the Area)           │
├─────────────────────────────────────┤
│ 4. Core Member: 4%                  │ → ₹480
│    (who recruited this member)      │
└─────────────────────────────────────┘
Total Distributed: ₹4,200 (35% of pool)
Remaining: ₹7,800 (65%) → Goes to organization
```

**Example Scenario**:
- Rajesh (Core Member in Andheri) recruits a new Flagship member for ₹100,000
- **SA** gets ₹1,440
- **Mumbai MF** gets ₹1,440 (manages Mumbai Zone)
- **Andheri AF** gets ₹840 (manages Andheri Area)
- **Rajesh** gets ₹480 (recruiter)

---

### Digital Member Registration (40% Pool)

When a **Digital Member** joins through a DCP:

```
New Digital Member Payment (₹25,000)
              ↓
    40% Commission Pool = ₹10,000
              ↓
┌─────────────────────────────────────┐
│ Distribution Hierarchy:             │
├─────────────────────────────────────┤
│ 1. Super Admin (SA): 40% of pool    │ → ₹4,000
│    (40% × ₹10,000)                  │
├─────────────────────────────────────┤
│ 2. Master Franchise (MF): 40%       │ → ₹4,000
│    (oversees digital operations)    │
├─────────────────────────────────────┤
│ 3. Area Franchise (AF): 30%         │ → ₹3,000
│    (manages digital area)           │
├─────────────────────────────────────┤
│ 4. DCP: 20%                         │ → ₹2,000
│    (who recruited this member)      │
└─────────────────────────────────────┘
Total Distributed: ₹13,000 (130% of pool)
```

**Example Scenario**:
- Priya (DCP in Pune Area) recruits a Digital Member for ₹25,000
- **SA** gets ₹4,000
- **Pune MF** gets ₹4,000 (manages Pune Zone)
- **Pune Central AF** gets ₹3,000 (manages Pune Central Area)
- **Priya** gets ₹2,000 (recruiter)

---

## 🔄 Commission Workflow in Admin Panel

### 1. **Commission Calculation** (Automatic)

When a payment is received:

```javascript
POST /api/v1/commissions/calculate
{
  "paymentId": "payment_123",
  "sourceMemberId": "user_456", // The recruiter
  "transactionType": "registration" // or "renewal" or "upgrade"
}
```

**Backend automatically**:
- Identifies member type (Flagship/Digital)
- Calculates pool percentage (12% or 40%)
- Traces hierarchy: SA → MF → AF → Core/DCP
- Creates commission record with distribution object
- Sets all statuses to "pending"
- Overall status: "pending"

---

### 2. **Commission Dashboard View** (Admin Panel)

**File**: `src/pages/Finance/CommissionDashboard.tsx`

**Features**:
- **4 Stat Cards**:
  - Total Commissions (count & amount)
  - Flagship Commissions (count & amount)
  - Digital Commissions (count & amount)
  - Pending Count vs Completed Count

- **Filters**:
  - Membership Type: Flagship / Digital / All
  - Status: Pending / Partially Paid / Completed / All

- **Table Columns**:
  - Source Member (who joined)
  - Membership Type (Flagship/Digital badge)
  - Total Commission Pool (₹)
  - Base Amount (original payment)
  - Overall Status (badge)
  - Date
  - Actions (View Details button)

- **Details Modal** shows:
  ```
  Source Member Info
  ├─ Name, Email, Membership Type

  Amount Breakdown
  ├─ Base Amount: ₹100,000
  └─ Total Pool: ₹12,000 (12% for Flagship)

  Distribution Hierarchy
  ├─ Master Franchise (MF)
  │  ├─ Name: Amit Sharma
  │  ├─ Amount: ₹1,440 (12%)
  │  └─ Status: [pending/done badge]
  │
  ├─ Area Franchise (AF)
  │  ├─ Name: Neha Patel
  │  ├─ Amount: ₹840 (7%)
  │  └─ Status: [pending/done badge]
  │
  └─ Core Member
     ├─ Name: Rajesh Kumar
     ├─ Amount: ₹480 (4%)
     └─ Status: [pending/done badge]

  Payment Information
  └─ Payment ID, Transaction Type, Date
  ```

---

### 3. **Payout Creation** (Admin Panel)

**File**: `src/pages/Finance/PayoutManagement.tsx`

**Process**:

1. **Create Payout** button opens modal:
   ```
   Fields:
   - Recipient User ID (MF/AF/Core/DCP)
   - Period Start Date
   - Period End Date
   - Scheduled Payment Date
   - TDS Percentage (default: 10%)
   ```

2. **Backend Process** (`POST /api/v1/payouts/create`):
   - Fetches all "pending" or "partially_paid" commissions for that user
   - Filters commissions within date range
   - Sums up all amounts (separates Flagship vs Digital)
   - Calculates TDS deduction
   - Creates payout record with status: "pending"
   - Links all commission IDs
   - Sets scheduled date

3. **Payout Record Created**:
   ```typescript
   {
     recipient: { name, email, role },
     recipientRole: "master-franchise",
     amount: 45000, // Gross
     taxDetails: {
       tdsPercentage: 10,
       tdsAmount: 4500,
       netAmount: 40500 // What user receives
     },
     breakdown: {
       flagship: { amount: 30000, count: 25 },
       digital: { amount: 15000, count: 10 }
     },
     commissions: ["comm_1", "comm_2", ...], // 35 IDs
     commissionCount: 35,
     payoutPeriod: {
       startDate: "2025-10-01",
       endDate: "2025-10-31"
     },
     scheduledDate: "2025-11-05",
     status: "pending"
   }
   ```

---

### 4. **Payout Processing** (Admin Panel)

**Workflow States**:

```
┌──────────┐  Mark as      ┌────────────┐
│ pending  │─────────────→│ processing │
└──────────┘  Processing   └────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ↓                         ↓
              ┌──────────┐              ┌──────────┐
              │   done   │              │  failed  │
              └──────────┘              └──────────┘
                                             │
                                             ↓ Retry
                                        (back to processing)
```

**Actions by Status**:

- **Pending**:
  - ✅ Mark as Processing
  - ✅ Cancel Payout (with reason)

- **Processing**:
  - ✅ Mark as Done (requires payment details):
    ```
    Payment Method: Bank Transfer/UPI/Cheque/Cash/Wallet
    Transaction ID: TXN123456789
    Transaction Date: 2025-11-05

    If UPI: UPI ID
    If Cheque: Cheque Number
    If Bank: Account details (optional)
    ```
  - ✅ Mark as Failed (requires failure reason)

- **Done**:
  - No actions (final state)
  - Shows payment details in modal

- **Failed**:
  - ✅ Retry → goes back to Processing
  - Shows failure reason

- **Cancelled**:
  - No actions (final state)
  - Shows cancellation reason

---

### 5. **Payout Dashboard View**

**Features**:
- **4 Stat Cards**:
  - Total Payouts (count)
  - Pending (count)
  - Completed (count)
  - Failed (count)

- **Filters**:
  - Status: Pending / Processing / Done / Failed / Cancelled / All
  - Recipient Role: MF / AF / Core / DCP / CGC / All
  - Overdue Only toggle (for pending past scheduled date)

- **Table Columns**:
  - Recipient (name, email, role badge)
  - Amount (Gross, Net after TDS, TDS amount)
  - Breakdown (Flagship vs Digital counts & amounts)
  - Payment Period (start - end dates)
  - Scheduled Date (with OVERDUE badge if late)
  - Status (icon + badge)
  - Actions (View Details)

- **Details Modal** shows:
  ```
  Recipient Info
  ├─ Name, Email, Phone, Role

  Amount Breakdown
  ├─ Gross Amount: ₹45,000
  ├─ TDS (10%): ₹4,500
  └─ Net Payable: ₹40,500

  Commission Breakdown
  ├─ Flagship: ₹30,000 (25 commissions)
  └─ Digital: ₹15,000 (10 commissions)

  Payment Period
  ├─ Start: Oct 1, 2025
  ├─ End: Oct 31, 2025
  └─ Scheduled: Nov 5, 2025

  Payment Details (if done)
  ├─ Method: Bank Transfer
  ├─ Transaction ID: TXN123456789
  └─ Date: Nov 5, 2025

  Status Info
  ├─ Status: Processing
  ├─ Retry Count: 0
  └─ Notes: (if any)

  Action Buttons (based on status)
  ```

---

## 🎯 Real-World Example: Complete Flow

### Scenario: New Flagship Member Joins

**Setup**:
- Zone: Mumbai (MF: Amit Sharma)
- Area: Andheri (AF: Neha Patel)
- Core Group: Tech Entrepreneurs
- Recruiter: Rajesh Kumar (Core Member)
- New Member: Vikram Singh (joins as Flagship)
- Payment: ₹100,000

---

**Step 1: Payment Received**

```javascript
// Backend automatically triggers
POST /commissions/calculate
{
  "paymentId": "pay_vikram_flagship",
  "sourceMemberId": "rajesh_kumar_id",
  "transactionType": "registration"
}
```

**Commission Record Created**:
```javascript
{
  _id: "comm_001",
  sourceMember: {
    _id: "vikram_singh_id",
    name: "Vikram Singh",
    email: "vikram@example.com",
    membershipType: "flagship"
  },
  membershipType: "flagship",
  baseAmount: 100000,
  totalCommissionPool: 12000, // 12% of 100k

  distribution: {
    sa: {
      userId: "super_admin_id",
      percentage: 12,
      amount: 1440, // 12% of 12k
      status: "pending"
    },
    mf: {
      userId: {
        _id: "amit_sharma_id",
        name: "Amit Sharma",
        email: "amit@example.com"
      },
      percentage: 12,
      amount: 1440,
      status: "pending"
    },
    af: {
      userId: {
        _id: "neha_patel_id",
        name: "Neha Patel",
        email: "neha@example.com"
      },
      percentage: 7,
      amount: 840,
      status: "pending"
    },
    final: {
      userId: {
        _id: "rajesh_kumar_id",
        name: "Rajesh Kumar",
        email: "rajesh@example.com"
      },
      userType: "core-member",
      percentage: 4,
      amount: 480,
      status: "pending"
    }
  },

  overallStatus: "pending",
  transactionType: "registration",
  calculatedAt: "2025-11-01T10:00:00Z"
}
```

---

**Step 2: Admin Views Commission Dashboard**

Admin sees in table:
```
| Source Member  | Type     | Pool    | Status  |
|---------------|----------|---------|---------|
| Vikram Singh  | FLAGSHIP | ₹12,000 | PENDING |
```

Clicks "View Details" → Modal shows full breakdown with all 4 recipients

---

**Step 3: End of Month - Create Payouts**

Admin creates separate payouts for each recipient:

**For Amit Sharma (MF)**:
```javascript
POST /payouts/create
{
  "recipientId": "amit_sharma_id",
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "scheduledDate": "2025-12-05",
  "tdsPercentage": 10
}
```

Backend finds all Amit's pending commissions for November:
- 50 commissions total
- 30 Flagship (₹43,200)
- 20 Digital (₹80,000)
- Gross: ₹123,200

Creates payout:
```javascript
{
  recipient: { name: "Amit Sharma", ... },
  recipientRole: "master-franchise",
  amount: 123200,
  taxDetails: {
    tdsPercentage: 10,
    tdsAmount: 12320,
    netAmount: 110880
  },
  breakdown: {
    flagship: { amount: 43200, count: 30 },
    digital: { amount: 80000, count: 20 }
  },
  commissions: ["comm_001", "comm_002", ...], // 50 IDs
  commissionCount: 50,
  status: "pending",
  scheduledDate: "2025-12-05"
}
```

Repeats for Neha (AF), Rajesh (Core), and all other recipients.

---

**Step 4: Process Payout**

**On Dec 5, 2025**:

1. Admin opens Payout Management
2. Sees Amit's payout in "Pending" status
3. Clicks "View Details"
4. Clicks "Mark as Processing"
5. Status → "processing"
6. Admin makes bank transfer
7. Clicks "Mark as Done"
8. Enters payment details:
   ```
   Method: Bank Transfer
   Transaction ID: TXN9876543210
   Date: 2025-12-05
   ```
9. Status → "done"
10. Backend updates all 50 linked commissions:
    - `distribution.mf.status` → "done"
    - If all recipients marked done → `overallStatus` → "completed"

---

**Step 5: Commission Record Updated**

Original commission (comm_001) now shows:
```javascript
{
  // ... same as before
  distribution: {
    sa: { ..., status: "done" }, // marked separately
    mf: { ..., status: "done" }, // UPDATED from payout
    af: { ..., status: "done" }, // marked separately
    final: { ..., status: "done" } // marked separately
  },
  overallStatus: "completed" // All done!
}
```

---

## 📋 Summary Table

| Role | Manages | Flagship % | Digital % | Reports To |
|------|---------|-----------|-----------|------------|
| **Super Admin (SA)** | Entire platform | 12% | 40% | N/A |
| **Master Franchise (MF)** | Zone (City) | 12% | 40% | SA |
| **Area Franchise (AF)** | Area (Locality) | 7% | 30% | MF |
| **Core Member** | Recruits Flagship | 4% | - | AF |
| **DCP** | Recruits Digital | - | 20% | AF |
| **CGC** | Leads Core Group | (Core Member) | - | AF |

---

## 🔑 Key Points

1. **Hierarchical**: Commissions flow through geographic hierarchy (Zone → Area)
2. **Two Tracks**: Flagship (12% pool) vs Digital (40% pool)
3. **Automatic Calculation**: Backend calculates on payment receipt
4. **Batch Payouts**: Admin creates monthly payouts aggregating all commissions
5. **TDS Deduction**: Tax deducted at source (default 10%)
6. **Status Tracking**: Individual distribution status + overall status
7. **Workflow Management**: Pending → Processing → Done/Failed
8. **Full Audit Trail**: All actions tracked with dates and users

---

## 🚀 Admin Panel Capabilities

### Commission Dashboard (`/finance/commissions`):
- ✅ View all commission records
- ✅ Filter by type and status
- ✅ See detailed distribution breakdown
- ✅ Track individual recipient statuses
- ✅ View commission statistics

### Payout Management (`/finance/payouts`):
- ✅ Create payouts from pending commissions
- ✅ Process payment workflows
- ✅ Enter payment details
- ✅ Handle failures and retries
- ✅ Track TDS deductions
- ✅ Filter by status and role
- ✅ View overdue payouts

---

**Last Updated**: November 29, 2025
**Version**: 1.0
**Status**: Complete documentation of implemented system
