# Vercel + Supabase Setup Guide

## Step 1: Add Environment Variables to Vercel

Go to: https://vercel.com/cemroots-projects/my-portfolio/settings/environment-variables

Add these variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL (from Supabase dashboard)
   - Environment: Production, Preview, Development

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: (from .env file)
   - Environment: Production, Preview, Development

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: (from .env file)
   - Environment: Production, Preview, Development

4. **GROQ_API_KEY**
   - Value: (from .env file)
   - Environment: Production, Preview, Development

5. **FIRECRAWL_API_KEY**
   - Value: (from .env file)
   - Environment: Production, Preview, Development

## Step 2: Verify Supabase Table

Go to: Supabase Dashboard → Your Project → Table Editor

Run the SQL from: `docs/supabase-schema.sql`

## Step 3: Redeploy

After adding env vars, redeploy:
- Vercel Dashboard → Deployments → Latest → "..." → Redeploy
- Or run: `vercel --prod`

## Step 4: Test Newsletter

Visit your live site and try subscribing to the newsletter.

Check Supabase Table Editor to see if the email was added.

