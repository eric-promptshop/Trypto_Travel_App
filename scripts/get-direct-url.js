// Your current pooler URL format:
// postgresql://postgres.[PROJECT-REF]:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres

// Extract project reference from your URL
const poolerUrl = 'postgresql://postgres.ntbelyooymjbqaiarlgb:zin5SwtwPWnCYF3J@aws-0-us-east-2.pooler.supabase.com:5432/postgres'

// The project ref is: ntbelyooymjbqaiarlgb
const projectRef = 'ntbelyooymjbqaiarlgb'

console.log('Your Supabase project reference:', projectRef)
console.log('\nTo get your direct connection URL:')
console.log('1. Go to https://app.supabase.com/project/' + projectRef + '/settings/database')
console.log('2. Look for "Connection string" section')
console.log('3. Toggle to "Direct connection" instead of "Connection pooling"')
console.log('4. Copy that URL and update your .env file')

console.log('\nThe direct URL format will be:')
console.log(`postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`)

console.log('\nAlternatively, in Supabase Dashboard:')
console.log('1. Go to Settings > Database')
console.log('2. Under "Connection Info", find "Host"')
console.log('3. Use that host instead of the pooler host')