# Database Migrations

This directory contains SQL migration files for the database schema updates.

## How to Apply Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy the contents of the migration file
5. Paste into a new query
6. Click **Run** or press `Ctrl+Enter`

### Method 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db execute --file docs/migrations/MIGRATION_FILE.sql
```

## Available Migrations

### add-digest-id-to-conversation-states.sql

**Date:** 2025-10-30

**Purpose:** Add `digest_id` column to `conversation_states` table to support LinkedIn digest editing workflow via n8n.

**Changes:**
- Adds `digest_id BIGINT` column to `conversation_states` table
- Updates column comments to document the new field
- Safe to run multiple times (checks if column exists before adding)

**Required for:** n8n LinkedIn digest editing workflow to properly set conversation state when user clicks "Edit & Approve"

## Migration Status Tracking

After applying a migration, document it here:

- [x] `add-digest-id-to-conversation-states.sql` - Applied on: _PENDING_

## Notes

- Always test migrations in development/staging first
- Backup your database before applying migrations
- Migrations are designed to be idempotent (safe to run multiple times)
