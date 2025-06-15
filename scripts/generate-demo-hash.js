const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'demo123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Password:', password);
  console.log('Bcrypt Hash:', hash);
  console.log('\nUse this hash in the SQL script for the refresh_token field.');
}

generateHash().catch(console.error);