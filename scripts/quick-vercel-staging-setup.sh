#!/bin/bash

# Quick Vercel Staging Environment Setup

echo "🚀 Setting up Vercel staging environment variables..."

# Set environment variables for preview (staging)
vercel env add NEXT_PUBLIC_ENVIRONMENT preview < <(echo "staging")
vercel env add NEXT_PUBLIC_SUPABASE_URL preview < <(echo "https://ntbelyooymjbqaiarlgb.supabase.co")
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview < <(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YmVseW9veW1qYnFhaWFybGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTA1MDAsImV4cCI6MjA2NDA2NjUwMH0.ITs-0D63KUU58bzMghVnspaKDALp8w-i2QTRT4lCMyg")
vercel env add SUPABASE_SERVICE_ROLE_KEY preview < <(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YmVseW9veW1qYnFhaWFybGdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ5MDUwMCwiZXhwIjoyMDY0MDY2NTAwfQ.xurnq3nUTEh1hEbzxd_GKCsY0gb4fyj0zgsgz2ReWLs")
vercel env add DATABASE_URL preview < <(echo "postgresql://postgres:postgres@db.ntbelyooymjbqaiarlgb.supabase.co:5432/postgres")
vercel env add OPENAI_API_KEY preview < <(echo "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")
vercel env add NEXTAUTH_SECRET preview < <(echo "$(openssl rand -base64 32)")
vercel env add NEXTAUTH_URL preview < <(echo "https://travel-itinerary-builder.vercel.app")
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME preview < <(echo "dxiitzvim")
vercel env add CLOUDINARY_API_KEY preview < <(echo "587426559158165")
vercel env add CLOUDINARY_API_SECRET preview < <(echo "pFL5EtXwdhIkmz_qFmyLmB1qKjw")
vercel env add UNSPLASH_ACCESS_KEY preview < <(echo "qiM3kTl2XHdwrJEJXblMosoNx5uo_13TIQuZwKOiM0w")

echo "✅ Environment variables set successfully!"
echo ""
echo "Now run: vercel --yes"