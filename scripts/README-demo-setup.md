# Demo Account Setup Instructions

This directory contains scripts to set up demo accounts for both traveler and tour operator personas.

## Demo Accounts

### Traveler Account
- **Email:** demo@example.com
- **Password:** demo123
- **Features:** Pre-populated trips, access to AI trip planning

### Tour Operator Account
- **Email:** demo-operator@example.com
- **Password:** demo123
- **Features:** Pre-populated tours, leads management dashboard

## Setup Instructions

### Method 1: Run SQL Script in Supabase (Recommended)

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `setup-demo-accounts.sql`
4. Paste into the SQL editor
5. Click "Run" to execute the script
6. You should see a success message with counts of created records

### Method 2: Use Migration File

The migration file is located at:
```
prisma/migrations/20250115_add_demo_accounts/migration.sql
```

This will be applied automatically when you run:
```bash
npx prisma migrate deploy
```

## Verification

After running the setup script, verify the demo accounts work:

1. Go to your application's sign-in page
2. Click "Demo Traveler" button or use credentials:
   - Email: demo@example.com
   - Password: demo123
3. You should be redirected to /trips with pre-populated trips
4. Sign out and try the "Demo Tour Operator" button or use:
   - Email: demo-operator@example.com
   - Password: demo123
5. You should be redirected to /tour-operator with demo content

## Troubleshooting

If the demo accounts don't work:

1. Check that the script ran without errors
2. Verify the bcrypt hash is correct for your setup
3. Ensure your auth configuration supports credentials provider
4. Check that the hardcoded fallbacks in `/lib/auth/config.ts` are removed or updated

## Password Hash Details

The password hash used is for 'demo123' with bcrypt cost factor 10:
```
$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22
```

To generate a new hash if needed:
```bash
node scripts/generate-demo-hash.js
```