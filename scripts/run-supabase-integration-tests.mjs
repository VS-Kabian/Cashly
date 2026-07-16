import { spawnSync } from 'node:child_process';

if (process.env.CASHLY_RUN_SUPABASE_INTEGRATION !== '1') {
  console.error(
    'Supabase integration tests are not running. Set CASHLY_RUN_SUPABASE_INTEGRATION=1 and CASHLY_SUPABASE_TARGET=local.',
  );
  process.exit(2);
}

if (process.env.CASHLY_SUPABASE_TARGET !== 'local') {
  console.error(
    'Supabase integration tests only run against a disposable local database. Set CASHLY_SUPABASE_TARGET=local.',
  );
  process.exit(2);
}

function runSupabase(args) {
  const result = spawnSync('supabase', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(`Unable to start the Supabase CLI: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// None of these commands accepts a linked project or remote database URL.
runSupabase(['start']);
runSupabase(['db', 'reset', '--local']);
runSupabase(['test', 'db', '--local']);
