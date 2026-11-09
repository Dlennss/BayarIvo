import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

process.loadEnvFile('/home/mitra-p24/hit/Bayarivo/shared/backend.env');
const backend = 'http://127.0.0.1:8104';
const frontend = 'http://127.0.0.1:33030';
const adminFile = '/root/bayarivo-admin.json';
const secret = () => randomBytes(24).toString('base64url');
async function request(base, path, body, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(`${path}: HTTP ${response.status}: ${data.error || 'request failed'}`);
  }
  return data;
}

if (!existsSync(adminFile)) {
  writeFileSync(adminFile, JSON.stringify({
    email: 'admin@bayarivo.local', password: secret(), nama: 'Admin Bayarivo',
  }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  const credentials = JSON.parse(readFileSync(adminFile, 'utf8'));
  await request(backend, '/v1/auth/register', { ...credentials, role: 'admin' }, {
    'X-Admin-Token': process.env.ADMIN_TOKEN,
  });
}
const credentials = JSON.parse(readFileSync(adminFile, 'utf8'));
const adminLogin = await request(frontend, '/api/auth/login', credentials);
assert.equal(adminLogin.role, 'admin');
const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` };
const adminMe = await request(frontend, '/api/auth/me', undefined, adminHeaders);
assert.equal(adminMe.nama, 'Admin Bayarivo');
assert.equal((await request(backend, '/v1/saldo', undefined, adminHeaders)).saldo, 0);
console.log(`Admin login verified; credentials stored privately at ${adminFile}`);

const email = `install-smoke-${randomBytes(8).toString('hex')}@bayarivo.invalid`;
const user = { email, password: secret(), nama: 'Uji Instalasi', phone: '080000000000' };
let created = false;
try {
  await request(frontend, '/api/auth/register', user);
  created = true;
  const login = await request(frontend, '/api/auth/login', user);
  assert.equal(login.role, 'user');
  const headers = { Authorization: `Bearer ${login.token}` };
  const me = await request(frontend, '/api/auth/me', undefined, headers);
  assert.equal(me.nama, user.nama);
  assert.equal(me.email, user.email);
  await request(frontend, '/api/me/profile', undefined, headers);
  assert.equal((await request(backend, '/v1/saldo', undefined, headers)).saldo, 0);
  const history = await request(backend, '/v1/history/transaksi', undefined, headers);
  assert.equal(history.total, 0);
  const page = await fetch(`${frontend}/user`, {
    headers: { Cookie: `pk_auth_token=${login.token}` },
    redirect: 'manual', signal: AbortSignal.timeout(15000),
  });
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes(user.nama));
  const catalog = await request(backend, '/v1/app/kategori');
  if (catalog.items.length > 0) {
    const category = catalog.items.find(item => item.nama === 'E-Wallet');
    assert.ok(category, 'H2HR E-Wallet category');
    const brands = await request(backend, `/v1/app/brand?kategori_id=${category.id}`);
    const brand = brands.items.find(item => item.nama === 'GOPAY');
    assert.ok(brand, 'H2HR GOPAY brand');
    const catalogPage = await fetch(`${frontend}/user/kategori/${category.id}/brand/${brand.id}`, {
      headers: { Cookie: `pk_auth_token=${login.token}` },
      redirect: 'manual', signal: AbortSignal.timeout(30000),
    });
    assert.equal(catalogPage.status, 200);
    const html = await catalogPage.text();
    assert.ok(html.includes('GOPAY') && html.includes('Pembelian belum aktif.'));
    console.log('Authenticated H2HR catalog page verified; purchases remain disabled.');
  }
  const providers = await request(frontend, '/api/auth/providers');
  assert.ok(providers.credentials);
  assert.equal(providers.google, undefined);
  console.log('Registration, login, profile, user page/name, zero balance and empty history verified.');
} finally {
  if (created) {
    const result = execFileSync('runuser', ['-u', 'bayarivo', '--', 'psql', '-X', '-v',
      'ON_ERROR_STOP=1', '-v', `email=${email}`, '-d', 'bayarivo'], {
      input: "DELETE FROM public.member WHERE email = :'email' AND role = 'user' AND NOT EXISTS (SELECT 1 FROM public.dompet_member WHERE member_id = member.id AND saldo <> 0) RETURNING id;\n",
      encoding: 'utf8',
    });
    assert.ok(result.includes('DELETE 1'), 'Smoke user cleanup must delete exactly one test account');
    console.log('Temporary test account removed; no payment transactions created.');
  }
}
