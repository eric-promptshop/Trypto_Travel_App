#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you set up environment variables for your Vercel deployment

echo "🚀 Vercel Environment Variables Setup"
echo "===================================="
echo ""
echo "This script will help you set up environment variables for your Vercel project."
echo "Make sure you have the Vercel CLI installed: npm i -g vercel"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm i -g vercel"
    exit 1
fi

# Function to set environment variable
set_vercel_env() {
    local key=$1
    local value=$2
    local env=$3
    
    echo "Setting $key for $env environment..."
    
    if [ "$env" = "all" ]; then
        vercel env add "$key" production < <(echo "$value")
        vercel env add "$key" preview < <(echo "$value")
        vercel env add "$key" development < <(echo "$value")
    else
        vercel env add "$key" "$env" < <(echo "$value")
    fi
}

echo "Which environment do you want to configure?"
echo "1) Production only"
echo "2) Preview (staging) only"
echo "3) Development only"
echo "4) All environments"
read -p "Select option (1-4): " env_choice

case $env_choice in
    1) ENV_TARGET="production" ;;
    2) ENV_TARGET="preview" ;;
    3) ENV_TARGET="development" ;;
    4) ENV_TARGET="all" ;;
    *) echo "Invalid option"; exit 1 ;;
esac

echo ""
echo "Setting up environment variables for: $ENV_TARGET"
echo ""

# Read values from .env.local if they exist
if [ -f .env.local ]; then
    echo "📋 Found .env.local file. Reading existing values..."
    source .env.local
fi

# Supabase Configuration
echo "🔧 Supabase Configuration"
echo "------------------------"

if [ "$ENV_TARGET" = "production" ] || [ "$ENV_TARGET" = "all" ]; then
    read -p "Supabase URL (production): " -i "$NEXT_PUBLIC_SUPABASE_URL_PRODUCTION" -e SUPABASE_URL
    read -p "Supabase Anon Key (production): " -i "$NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION" -e SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key (production): " -i "$SUPABASE_SERVICE_ROLE_KEY_PRODUCTION" -e SUPABASE_SERVICE_KEY
    read -p "Database URL (production): " -e DATABASE_URL_PROD
else
    read -p "Supabase URL (staging): " -i "$NEXT_PUBLIC_SUPABASE_URL_STAGING" -e SUPABASE_URL
    read -p "Supabase Anon Key (staging): " -i "$NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING" -e SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key (staging): " -i "$SUPABASE_SERVICE_ROLE_KEY_STAGING" -e SUPABASE_SERVICE_KEY
    read -p "Database URL (staging): " -i "$DATABASE_URL" -e DATABASE_URL_STAGING
fi

# OpenAI Configuration
echo ""
echo "🤖 OpenAI Configuration"
echo "---------------------"
read -p "OpenAI API Key: " -i "$OPENAI_API_KEY" -e OPENAI_KEY

# Cloudinary Configuration
echo ""
echo "🖼️  Cloudinary Configuration (Optional)"
echo "------------------------------------"
echo "Sign up for free at https://cloudinary.com"
read -p "Use Cloudinary? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Cloudinary Cloud Name: " CLOUDINARY_CLOUD
    read -p "Cloudinary API Key: " CLOUDINARY_KEY
    read -p "Cloudinary API Secret: " -s CLOUDINARY_SECRET
    echo
else
    echo "Skipping Cloudinary setup (will use demo mode)"
    CLOUDINARY_CLOUD=""
    CLOUDINARY_KEY=""
    CLOUDINARY_SECRET=""
fi

# Unsplash Configuration
echo ""
echo "📸 Unsplash Configuration (Optional)"
echo "-----------------------------------"
echo "Sign up for free at https://unsplash.com/developers"
read -p "Use Unsplash for location images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Unsplash Access Key: " -i "$UNSPLASH_ACCESS_KEY" -e UNSPLASH_KEY
else
    echo "Skipping Unsplash setup (will use fallback images)"
    UNSPLASH_KEY=""
fi

# NextAuth Configuration
echo ""
echo "🔐 NextAuth Configuration"
echo "-----------------------"
read -p "NextAuth URL (https://your-domain.com): " NEXTAUTH_URL_VALUE
read -p "Generate random NextAuth Secret? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    NEXTAUTH_SECRET_VALUE=$(openssl rand -base64 32)
    echo "Generated secret: $NEXTAUTH_SECRET_VALUE"
else
    read -p "NextAuth Secret: " -s NEXTAUTH_SECRET_VALUE
    echo
fi

# Set environment variables
echo ""
echo "📤 Setting environment variables in Vercel..."

# Set the appropriate environment variable based on selection
if [ "$ENV_TARGET" = "production" ] || [ "$ENV_TARGET" = "all" ]; then
    set_vercel_env "NEXT_PUBLIC_ENVIRONMENT" "production" "$ENV_TARGET"
    DB_URL="$DATABASE_URL_PROD"
else
    set_vercel_env "NEXT_PUBLIC_ENVIRONMENT" "staging" "$ENV_TARGET"
    DB_URL="$DATABASE_URL_STAGING"
fi

# Set common variables
set_vercel_env "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "$ENV_TARGET"
set_vercel_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "$ENV_TARGET"
set_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY" "$ENV_TARGET"
set_vercel_env "DATABASE_URL" "$DB_URL" "$ENV_TARGET"
set_vercel_env "OPENAI_API_KEY" "$OPENAI_KEY" "$ENV_TARGET"
set_vercel_env "NEXTAUTH_URL" "$NEXTAUTH_URL_VALUE" "$ENV_TARGET"
set_vercel_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET_VALUE" "$ENV_TARGET"

# Set Cloudinary variables if provided
if [ ! -z "$CLOUDINARY_CLOUD" ]; then
    set_vercel_env "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" "$CLOUDINARY_CLOUD" "$ENV_TARGET"
    set_vercel_env "CLOUDINARY_API_KEY" "$CLOUDINARY_KEY" "$ENV_TARGET"
    set_vercel_env "CLOUDINARY_API_SECRET" "$CLOUDINARY_SECRET" "$ENV_TARGET"
fi

# Set Unsplash variable if provided
if [ ! -z "$UNSPLASH_KEY" ]; then
    set_vercel_env "UNSPLASH_ACCESS_KEY" "$UNSPLASH_KEY" "$ENV_TARGET"
fi

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'vercel' to deploy your application"
echo "2. Or push to your Git repository to trigger automatic deployment"
echo ""
echo "To view your environment variables:"
echo "  vercel env ls"
echo ""
echo "To remove an environment variable:"
echo "  vercel env rm <variable-name>"