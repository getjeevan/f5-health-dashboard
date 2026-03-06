import type { InsertF5Settings } from '@shared/schema';

export function getF5SettingsFromEnv(): InsertF5Settings | null {
  const host = process.env.F5_HOST;
  const username = process.env.F5_USERNAME;
  const password = process.env.F5_PASSWORD;

  // If any required field is missing, return null
  if (!host || !username || !password) {
    return null;
  }

  return {
    host,
    port: process.env.F5_PORT ? parseInt(process.env.F5_PORT, 10) : 443,
    username,
    password,
    verifyTls: process.env.F5_VERIFY_TLS !== 'false', // Default to true
    partition: process.env.F5_PARTITION || 'Common',
    pollingInterval: process.env.F5_POLLING_INTERVAL 
      ? parseInt(process.env.F5_POLLING_INTERVAL, 10) 
      : 10,
  };
}
