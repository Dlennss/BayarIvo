import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';

const shared = '/home/mitra-p24/hit/Bayarivo/shared';
const paths = ['backend.env', 'frontend.env'].map(name => `${shared}/${name}`);
if (paths.some(existsSync)) throw new Error('Refusing to replace existing configuration');
const secret = () => randomBytes(32).toString('hex');
const adminToken = secret();
const backend = {
  DATABASE_URL: 'user=bayarivo dbname=bayarivo host=/var/run/postgresql sslmode=disable',
  HOST: '127.0.0.1',
  PORT: '8104',
  CORS_ORIGINS: 'http://localhost:33104,http://127.0.0.1:33104',
  JWT_SECRET: secret(),
  ADMIN_TOKEN: adminToken,
  PULSA_LOG_DIR: `${shared}/logs`,
  PULSA24JAM_API_KEY: '',
  PULSA24JAM_PIN: '',
  PULSA24JAM_BASE_URL: '',
  PULSA24JAM_CALLBACK_TOKEN: secret(),
};
const frontend = {
  NODE_ENV: 'production',
  HOSTNAME: '127.0.0.1',
  PORT: '33030',
  API_BASE: 'http://127.0.0.1:8104',
  NEXTAUTH_URL: 'http://localhost:33104',
  AUTH_SECRET: secret(),
  ADMIN_TOKEN: adminToken,
  GOOGLE_LOGIN_ENABLED: 'false',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  NEXT_TELEMETRY_DISABLED: '1',
};
for (const [index, values] of [backend, frontend].entries()) {
  const content = Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n');
  writeFileSync(paths[index], `${content}\n`, { mode: 0o600, flag: 'wx' });
}
console.log('Fresh configuration created; secret values withheld.');
