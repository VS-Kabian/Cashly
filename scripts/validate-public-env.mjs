import { loadEnv } from 'vite';

const REQUIRED_PUBLIC_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

export function isPlaceholderValue(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes('placeholder') ||
    normalized.includes('your_') ||
    normalized.includes('your-') ||
    normalized.includes('your ') ||
    normalized.includes('replace_me') ||
    normalized.includes('replace-me') ||
    /^<.+>$/.test(normalized)
  );
}

export function validatePublicEnv(environment) {
  for (const name of REQUIRED_PUBLIC_ENV) {
    if (!environment[name]?.trim()) {
      throw new Error(`${name} is required for production builds.`);
    }

    if (isPlaceholderValue(environment[name])) {
      throw new Error(`${name} contains a placeholder value.`);
    }
  }

  let supabaseUrl;
  try {
    supabaseUrl = new URL(environment.VITE_SUPABASE_URL);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS URL.');
  }

  if (supabaseUrl.protocol !== 'https:' || !supabaseUrl.hostname) {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS URL.');
  }
}

export function loadProductionPublicEnv(root = process.cwd()) {
  const viteEnvironment = loadEnv('production', root, 'VITE_');
  return Object.fromEntries(
    REQUIRED_PUBLIC_ENV.map((name) => [name, process.env[name] ?? viteEnvironment[name]]),
  );
}

if (process.argv[1] && import.meta.url === new URL(`file:${process.argv[1]}`).href) {
  try {
    validatePublicEnv(loadProductionPublicEnv());
    console.log('Public Supabase environment configuration is valid.');
  } catch (error) {
    console.error(`Public environment validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
