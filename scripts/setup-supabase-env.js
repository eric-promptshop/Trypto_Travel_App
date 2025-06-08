#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '..', '.env.local');

console.log('🚀 Supabase Environment Setup\n');

const questions = [
  {
    key: 'environment',
    question: 'Which environment do you want to configure? (staging/production): ',
    default: 'staging'
  },
  {
    key: 'url',
    question: 'Enter your Supabase project URL: ',
    validate: (value) => value.startsWith('https://') && value.includes('.supabase.co')
  },
  {
    key: 'anonKey',
    question: 'Enter your Supabase anon/public key: ',
    validate: (value) => value.length > 50
  },
  {
    key: 'serviceRoleKey',
    question: 'Enter your Supabase service role key: ',
    validate: (value) => value.length > 50
  },
  {
    key: 'databaseUrl',
    question: 'Enter your database URL (postgresql://...): ',
    validate: (value) => value.startsWith('postgresql://')
  }
];

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.question, (answer) => {
      const value = answer || question.default;
      if (question.validate && !question.validate(value)) {
        console.log('❌ Invalid input. Please try again.');
        resolve(askQuestion(question));
      } else {
        resolve(value);
      }
    });
  });
}

async function setupEnvironment() {
  const answers = {};
  
  for (const q of questions) {
    answers[q.key] = await askQuestion(q);
  }
  
  // Read current .env.local
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update environment variables
  const envVars = {
    [`NEXT_PUBLIC_SUPABASE_URL_${answers.environment.toUpperCase()}`]: answers.url,
    [`NEXT_PUBLIC_SUPABASE_ANON_KEY_${answers.environment.toUpperCase()}`]: answers.anonKey,
    [`SUPABASE_SERVICE_ROLE_KEY_${answers.environment.toUpperCase()}`]: answers.serviceRoleKey,
    'NEXT_PUBLIC_ENVIRONMENT': answers.environment,
    'DATABASE_URL': answers.databaseUrl
  };
  
  // If setting active environment, also update the main vars
  if (answers.environment === process.env.NEXT_PUBLIC_ENVIRONMENT || !process.env.NEXT_PUBLIC_ENVIRONMENT) {
    envVars['NEXT_PUBLIC_SUPABASE_URL'] = answers.url;
    envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = answers.anonKey;
    envVars['SUPABASE_SERVICE_ROLE_KEY'] = answers.serviceRoleKey;
  }
  
  // Update or add each variable
  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }
  
  // Write back to file
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  
  console.log(`\n✅ Supabase ${answers.environment} environment configured successfully!`);
  console.log('\nNext steps:');
  console.log('1. Run "npm run db:generate" to generate Prisma client');
  console.log('2. Run "npm run db:push" to push schema to Supabase');
  console.log('3. Run "npm run db:seed" to seed initial data');
  
  rl.close();
}

setupEnvironment().catch(console.error);