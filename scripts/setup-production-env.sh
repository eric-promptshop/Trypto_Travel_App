#!/bin/bash

# Interactive script to set up production environment variables in Vercel

echo "=== Vercel Production Environment Setup ==="
echo ""
echo "This script will help you add environment variables to Vercel production."
echo "Make sure you have the Vercel CLI installed and are logged in."
echo ""

# Function to add env var
add_env_var() {
    local var_name=$1
    local var_value=$2
    local is_sensitive=$3
    
    if [ "$is_sensitive" = "true" ]; then
        echo "Adding $var_name (sensitive - value hidden)..."
    else
        echo "Adding $var_name = $var_value"
    fi
    
    vercel env add "$var_name" production <<< "$var_value"
    
    if [ $? -eq 0 ]; then
        echo "✓ $var_name added successfully"
    else
        echo "✗ Failed to add $var_name"
    fi
    echo ""
}

# Get production URL
echo "What is your Vercel production URL? (e.g., https://travel-itinerary-builder.vercel.app)"
read -p "Production URL: " PROD_URL

# Generate NEXTAUTH_SECRET
echo ""
echo "Generating secure NEXTAUTH_SECRET..."
NEXTAUTH_SECRET_VALUE=$(openssl rand -base64 32)
echo "Generated: $NEXTAUTH_SECRET_VALUE"
echo ""

# Confirm before proceeding
echo "=== Configuration Summary ==="
echo "Production URL: $PROD_URL"
echo "Environment: Production"
echo ""
echo "The following environment variables will be added:"
echo "- NEXT_PUBLIC_SUPABASE_URL (production)"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY (production)"
echo "- SUPABASE_SERVICE_ROLE_KEY (production)"
echo "- OPENAI_API_KEY"
echo "- NEXTAUTH_SECRET (generated)"
echo "- NEXTAUTH_URL = $PROD_URL"
echo "- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
echo "- CLOUDINARY_API_KEY"
echo "- CLOUDINARY_API_SECRET"
echo "- UNSPLASH_ACCESS_KEY"
echo "- MODEL"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Adding environment variables..."
echo ""

# Add Supabase production variables
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "https://oskhjamluuwnvhgdwfyh.supabase.co" false
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hqYW1sdXV3bnZoZ2R3ZnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTE2MTMsImV4cCI6MjA2NDA2NzYxM30.akdtSkuqP7D39fd9MIOKAskRtagHZUDYY7eV4VV1loo" true
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9za2hqYW1sdXV3bnZoZ2R3ZnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ5MTE2MTMsImV4cCI6MjA2NDA2NzYxM30.BMu6CV6bjPeLmv4TZFVQlURcwC1MYcrabOiCZDuKILE" true

# Add OpenAI configuration
add_env_var "OPENAI_API_KEY" "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" true
add_env_var "MODEL" "gpt-4o-mini" false

# Add NextAuth configuration
add_env_var "NEXTAUTH_URL" "$PROD_URL" false
add_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET_VALUE" true

# Add Cloudinary configuration
add_env_var "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" "dxiitzvim" false
add_env_var "CLOUDINARY_API_KEY" "587426559158165" true
add_env_var "CLOUDINARY_API_SECRET" "pFL5EtXwdhIkmz_qFmyLmB1qKjw" true

# Add Unsplash configuration
add_env_var "UNSPLASH_ACCESS_KEY" "qiM3kTl2XHdwrJEJXblMosoNx5uo_13TIQuZwKOiM0w" true

echo "=== Setup Complete ==="
echo ""
echo "All environment variables have been added to Vercel production."
echo ""
echo "To verify, run: vercel env ls production"
echo ""
echo "To deploy to production, run: vercel --prod"
echo ""
echo "Important: Keep the NEXTAUTH_SECRET value secure and store it in a password manager:"
echo "$NEXTAUTH_SECRET_VALUE"