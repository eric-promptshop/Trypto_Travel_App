#!/bin/bash

# Script to add environment variables to Vercel production
# Make sure you have the Vercel CLI installed and are logged in

echo "Adding environment variables to Vercel production..."

# For production, we'll use the production Supabase values from .env.local
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< 'https://oskhjamluuwnvhgdwfyh.supabase.co'
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hqYW1sdXV3bnZoZ2R3ZnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTE2MTMsImV4cCI6MjA2NDA2NzYxM30.akdtSkuqP7D39fd9MIOKAskRtagHZUDYY7eV4VV1loo'
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hqYW1sdXV3bnZoZ2R3ZnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ5MTE2MTMsImV4cCI6MjA2NDA2NzYxM30.BMu6CV6bjPeLmv4TZFVQlURcwC1MYcrabOiCZDuKILE'

# OpenAI configuration
vercel env add OPENAI_API_KEY production <<< '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'
vercel env add MODEL production <<< 'gpt-4o-mini'

# NextAuth configuration
# You'll need to update NEXTAUTH_URL with your actual production domain
vercel env add NEXTAUTH_URL production <<< 'https://your-production-domain.vercel.app'
# Generate a secure random string for NEXTAUTH_SECRET in production
vercel env add NEXTAUTH_SECRET production <<< 'your-production-secret-please-generate-a-secure-random-string'

# Cloudinary configuration
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME production <<< 'dxiitzvim'
vercel env add CLOUDINARY_API_KEY production <<< '587426559158165'
vercel env add CLOUDINARY_API_SECRET production <<< 'pFL5EtXwdhIkmz_qFmyLmB1qKjw'

# Unsplash API
vercel env add UNSPLASH_ACCESS_KEY production <<< 'qiM3kTl2XHdwrJEJXblMosoNx5uo_13TIQuZwKOiM0w'

echo "Environment variables added to Vercel production!"
echo ""
echo "IMPORTANT: Please update the following variables with production values:"
echo "1. NEXTAUTH_URL - Set to your actual production domain (e.g., https://travel-itinerary-builder.vercel.app)"
echo "2. NEXTAUTH_SECRET - Generate a secure random string using: openssl rand -base64 32"
echo ""
echo "To generate a secure NEXTAUTH_SECRET, run:"
echo "openssl rand -base64 32"