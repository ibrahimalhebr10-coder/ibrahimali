# 🚀 Smart Account Button - Quick Reference

---

## 🎯 Overview

Single "My Account" button with intelligent routing based on account types.

---

## 📦 Components

### 1. AccountLoginSelector
```typescript
// Pre-login screen (not authenticated)
<AccountLoginSelector
  onLogin={() => {}}      // Shows login form
  onRegister={() => {}}   // Shows registration
  onClose={() => {}}
/>
```

### 2. DualAccountSelector
```typescript
// For users with both accounts
<DualAccountSelector
  onSelectRegular={() => {}}  // Opens regular account
  onSelectPartner={() => {}}  // Opens partner account
/>
```

### 3. AccountTypeIndicator
```typescript
// One-time guidance banner
<AccountTypeIndicator
  accountType="regular" | "partner"
  onClose={() => {}}
/>
```

### 4. QuickAccountAccess (Smart Router)
```typescript
// Main component with routing logic
<QuickAccountAccess
  onLogin={() => {}}              // Not logged in
  onRegister={() => {}}           // New user
  onOpenRegularAccount={() => {}} // Has regular account
  onOpenPartnerAccount={() => {}} // Has partner account
  onClose={() => {}}
/>
```

---

## 🗄️ Database

### RPC Function
```sql
-- Returns account types for current user
get_user_account_types()

Returns:
{
  has_regular_account: boolean,
  has_partner_account: boolean,
  account_type: 'none' | 'regular' | 'partner' | 'both'
}

Logic:
- has_regular: CHECK reservations table
- has_partner: CHECK influencer_partners table
                WHERE status = 'active'
                AND is_active = true
```

---

## 🔄 Routing Logic

```typescript
if (!user) {
  return <AccountLoginSelector />
}

const { account_type } = await get_user_account_types()

switch (account_type) {
  case 'regular':
    // Auto-open regular account
    onOpenRegularAccount()
    break

  case 'partner':
    // Auto-open partner account
    onOpenPartnerAccount()
    break

  case 'both':
    // Show dual selector
    return <DualAccountSelector />

  case 'none':
    // Show login
    return <AccountLoginSelector />
}
```

---

## 📝 Integration in App.tsx

```typescript
// State
const [showQuickAccountAccess, setShowQuickAccountAccess] = useState(false)
const [showAccountIndicator, setShowAccountIndicator] = useState(false)
const [accountIndicatorType, setAccountIndicatorType] = useState<'regular' | 'partner'>('regular')

// Handlers
const handleOpenRegularAccount = () => {
  setShowAccountProfile(true)
  setAccountIndicatorType('regular')
  setShowAccountIndicator(true)
}

const handleOpenPartnerAccount = () => {
  setShowAccountProfile(true)
  setAccountIndicatorType('partner')
  setShowAccountIndicator(true)
}

// Render
<QuickAccountAccess
  isOpen={showQuickAccountAccess}
  onLogin={handleQuickAccessLogin}
  onRegister={handleQuickAccessRegister}
  onOpenRegularAccount={handleOpenRegularAccount}
  onOpenPartnerAccount={handleOpenPartnerAccount}
  onClose={() => setShowQuickAccountAccess(false)}
/>

<AccountTypeIndicator
  accountType={accountIndicatorType}
  onClose={() => setShowAccountIndicator(false)}
/>
```

---

## 🎨 Design Specs

### Colors
```css
Regular Account:
- Primary: #10b981 (emerald-500)
- Secondary: #059669 (emerald-600)
- Background: rgba(16, 185, 129, 0.1)

Partner Account:
- Primary: #f59e0b (amber-500)
- Secondary: #d97706 (amber-600)
- Background: rgba(251, 191, 36, 0.1)
```

### Animations
```css
- Hover: scale(1.05)
- Active: scale(0.95)
- Fade in: 0.3s ease-out
- Slide up: 0.4s ease-out
```

---

## 🧪 Testing

### Test 1: Not Logged In
```
Click "My Account" → AccountLoginSelector appears
```

### Test 2: Regular User Only
```
Login (has reservations) → Auto-opens regular account → Banner shows once
```

### Test 3: Partner Only
```
Login (is active partner) → Auto-opens partner dashboard → Banner shows once
```

### Test 4: Both Accounts
```
Login (has both) → DualAccountSelector appears → User chooses → Banner shows
```

---

## 📊 Account Type Detection

```sql
-- Regular account: Has confirmed reservations
SELECT COUNT(*) > 0
FROM reservations
WHERE user_id = auth.uid()

-- Partner account: Is active success partner
SELECT COUNT(*) > 0
FROM influencer_partners
WHERE user_id = auth.uid()
  AND status = 'active'
  AND is_active = true
```

---

## 🔑 Key Files

```
Components:
✓ src/components/AccountLoginSelector.tsx
✓ src/components/DualAccountSelector.tsx
✓ src/components/AccountTypeIndicator.tsx
✓ src/components/QuickAccountAccess.tsx

Integration:
✓ src/App.tsx

Database:
✓ supabase/migrations/*_create_account_type_checker.sql
```

---

## 💡 Tips

1. **Always use QuickAccountAccess** - Never manually route users
2. **Trust the RPC function** - It knows what accounts user has
3. **Banner is one-time** - Uses localStorage
4. **Design is equal** - No preference for either account
5. **Smart routing is automatic** - User never has to choose (unless has both)

---

## ⚡ Quick Commands

```bash
# Build
npm run build

# Check account type for user
SELECT * FROM get_user_account_types();

# Check if user is partner
SELECT * FROM influencer_partners WHERE user_id = 'xxx';

# Check if user has reservations
SELECT * FROM reservations WHERE user_id = 'xxx';
```

---

**Result:** Zero cognitive load, maximum intelligence! 🧠✨
