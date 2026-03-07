/**
 * ═══════════════════════════════════════════════════════════════
 * KAIZEN — Password Migration Script
 * ═══════════════════════════════════════════════════════════════
 *
 * This one-time script hashes all existing plain-text passwords
 * in the `users` table using bcrypt (10 salt rounds).
 *
 * Usage:
 *   node scripts/migrate-passwords.js
 *
 * It detects plain-text passwords by checking if the value does
 * NOT start with "$2a$" or "$2b$" (bcrypt hash prefixes).
 * Already-hashed passwords are skipped safely.
 * ═══════════════════════════════════════════════════════════════
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// ── Load env vars ────────────────────────────────────────────
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SALT_ROUNDS = 10;

async function migratePasswords() {
  console.log('🔐 Starting password migration...\n');

  // Fetch all users that have a password set
  const { data: users, error } = await supabase.from('users').select('id, email, password').not('password', 'is', null);

  if (error) {
    console.error('❌ Failed to fetch users:', error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('ℹ️  No users with passwords found. Nothing to migrate.');
    return;
  }

  console.log(`📋 Found ${users.length} user(s) with passwords.\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    // Skip already-hashed passwords (bcrypt hashes start with $2a$ or $2b$)
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log(`   ⏭️  ${user.email} — already hashed, skipping`);
      skipped++;
      continue;
    }

    try {
      const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);

      const { error: updateError } = await supabase.from('users').update({ password: hashed }).eq('id', user.id);

      if (updateError) {
        console.error(`   ❌ ${user.email} — update failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`   ✅ ${user.email} — password hashed successfully`);
        migrated++;
      }
    } catch (err) {
      console.error(`   ❌ ${user.email} — error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`🎯 Migration complete!`);
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Failed:   ${failed}`);
  console.log('═══════════════════════════════════════\n');
}

migratePasswords();
