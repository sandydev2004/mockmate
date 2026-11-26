# MockMate Razorpay Integration & Testing Guide (Test Mode)

This document provides a comprehensive test procedure and checklist for verifying Razorpay payments in MockMate.

---

## 1. Environment & Key Configuration

MockMate uses standard Razorpay credentials configured in `.env.local` (local) and Vercel Project Settings (production):

| Environment Variable | Description | Example (Test Mode) |
|---|---|---|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client-accessible key to open Checkout | `rzp_test_U3e5hKQ3vUxgGa` |
| `RAZORPAY_KEY_ID` | Server key for creating orders | `rzp_test_U3e5hKQ3vUxgGa` |
| `RAZORPAY_KEY_SECRET` | Server secret for signing & verifying | `4ZrPbr...` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret for HMAC SHA256 verification | Configured in Razorpay Webhooks |

> **Switching to Live Keys in Production:**
> 1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
> 2. Switch mode from **Test Mode** to **Live Mode** in the top navigation bar.
> 3. Go to **Settings -> API Keys** -> Generate Live Key.
> 4. In Vercel (or `.env.production`), update `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` to your `rzp_live_...` key, and update `RAZORPAY_KEY_SECRET`.
> 5. Go to **Settings -> Webhooks** -> Create a live webhook for `https://<your-domain>/api/razorpay/webhook`, select event `payment.captured`, set a secret, and copy it to `RAZORPAY_WEBHOOK_SECRET`.

---

## 2. Credit Packs Configuration

Pricing and credits are resolved strictly **server-side** in `src/lib/razorpay.ts`:

- **Starter Pack**: ₹99 = **3 interview credits** (Cost per mock: ₹33)
- **Placement Pro Pack**: ₹249 = **10 interview credits** + Unlocks AI Resume Tailor & ATS Scanner (Cost per mock: ₹25)
- **Free Trial**: Every new candidate receives **1 free credit** upon registration.

---

## 3. Razorpay Test Credentials (Test Mode)

When the Razorpay Checkout modal appears, use any of the following simulated payment methods:

### Option A: Test Cards
- **Card Number**: `4111 1111 1111 1111` (or any valid test card)
- **Expiry Date**: Any future month/year (e.g., `12/28`)
- **CVV**: `123`
- **Cardholder Name**: Any name (e.g., `Rahul Sharma`)
- **OTP Screen**: Click the green **"Success"** button (or enter OTP `123456`).

### Option B: Test UPI
- **VPA / UPI ID**: `success@razorpay`
- Click **Pay Now** -> In the mock payment simulator, select **"Success"**.

### Option C: Netbanking
- Select any bank (e.g., HDFC, SBI, ICICI) -> Click **Pay** -> Click **"Success"**.

---

## 4. Verification & Testing Checklist

### Test 1: Successful Payment Credits Once
1. Sign in with a candidate account at `/login`.
2. Navigate to `/pricing`. Notice your current balance (e.g. 1 credit).
3. Click **"Get Starter Pack • ₹99"** or **"Get Pro Pack • ₹249"**.
4. Complete the checkout using the test card or UPI.
5. Verify:
   - You are redirected to `/dashboard?payment=success&pack=starter`.
   - The green success banner confirms: *"Payment Successful! 3 credits Added"*.
   - Your credit balance in the header increments from 1 to 4.
   - The transaction appears in the **Payment History** table with status `PAID`.

### Test 2: Failed or Cancelled Payment Adds No Credits
1. On `/pricing`, click **"Get Starter Pack • ₹99"**.
2. When the Razorpay Checkout modal opens, click the **"X"** (close) button or select **"Failure"** on the test authentication screen.
3. Verify:
   - The modal closes without taking payment.
   - No credits are added to the candidate's account.
   - If redirected with `?payment=failed`, a polite notice states: *"Payment Was Not Completed. No charges were made."*
   - Payment status remains `created` or transitions to `failed` in the database.

### Test 3: Unauthenticated Access is Blocked
1. Log out or open an Incognito window.
2. Go to `/pricing`.
3. Click either pack's Buy button.
4. Verify:
   - The application immediately redirects to `/login?redirect=%2Fpricing`.
   - Sending a direct `POST` to `/api/razorpay/order` without a session cookie returns `401 Unauthorized`.

### Test 4: Webhook Retry / Duplicate Delivery Does Not Double-Credit (Idempotency)
1. Send a simulated webhook payload with `payment.captured` for an existing order ID:
   ```bash
   curl -X POST http://localhost:3000/api/razorpay/webhook \
     -H "Content-Type: application/json" \
     -H "x-razorpay-signature: <computed-hmac-sha256>" \
     -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test123","order_id":"<order_id>","amount":9900}}}}'
   ```
2. Verify:
   - The first request fulfills the order, sets `status = 'paid'`, and increments credits.
   - Resending the exact same webhook payload returns `200 OK` with `{ status: "already_fulfilled" }`.
   - Credits are **NOT** added a second time.

### Test 5: Interview Start Credit Deduction & Zero-Credit Guard
1. Navigate to `/interview/setup`.
2. Configure a session and click **"Enter Interview Room"**.
3. Verify:
   - Exactly 1 credit is deducted atomically via `deduct_interview_credit(p_user_id)`.
   - When credits reach 0, the candidate cannot enter the interview room.
   - A clear warning banner displays: *"You have 0 interview credits remaining. Get a pack starting at ₹99 to practice."* linking directly to `/pricing`.
   - Admin accounts (`role = 'admin'`) remain completely exempt from credit deductions and see *"Admin: unlimited"*.

---

## 5. Security & Privacy Guarantees
- **Never Log Secrets**: Webhook secret and Razorpay key secret are never logged to console or included in client bundle.
- **Client Amounts Ignored**: The client only provides `packId` (`starter` | `pro`); amounts in paise (9900 and 24900) are resolved on the server.
- **Atomic Concurrency**: PostgreSQL `SELECT ... FOR UPDATE` prevents race conditions from simultaneous requests.
