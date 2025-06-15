const bcrypt = require('bcryptjs');

async function verifyDemoAccounts() {
  console.log('🔍 Demo Account Verification\n');
  
  // Test password hash
  const password = 'demo123';
  const storedHash = '$2b$10$cwIItpDtWF/zVPaRhnZX4uJcMOfZ12razp6ac/Rm8c.wpVUrxqI22';
  
  console.log('Testing password hash...');
  const isValid = await bcrypt.compare(password, storedHash);
  console.log(`✓ Password 'demo123' hash verification: ${isValid ? 'PASSED' : 'FAILED'}`);
  
  if (!isValid) {
    console.log('\n❌ Hash verification failed. Generating new hash...');
    const newHash = await bcrypt.hash(password, 10);
    console.log(`New hash for 'demo123': ${newHash}`);
    console.log('\nUpdate your SQL scripts with this new hash.');
  }
  
  console.log('\n📋 Demo Account Details:');
  console.log('------------------------');
  console.log('Traveler Account:');
  console.log('  Email: demo@example.com');
  console.log('  Password: demo123');
  console.log('  Role: USER');
  console.log('  User ID: demo-traveler-001');
  console.log('  Expected trips: 3 (Italy, Japan, Peru)');
  
  console.log('\nTour Operator Account:');
  console.log('  Email: demo-operator@example.com');
  console.log('  Password: demo123');
  console.log('  Role: TOUR_OPERATOR');
  console.log('  User ID: demo-operator-001');
  console.log('  Expected tours: 3 (Italy, Japan, Peru)');
  console.log('  Expected leads: 2');
  
  console.log('\n✅ Next Steps:');
  console.log('1. Run setup-demo-accounts.sql in Supabase SQL editor');
  console.log('2. Test login with both demo accounts');
  console.log('3. Verify trips/tours are visible');
}

verifyDemoAccounts().catch(console.error);