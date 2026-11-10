const assert = require('node:assert/strict');
const { readFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const base = process.env.CATALOG_URL || 'http://localhost:33105';
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Use the SSH preview tunnel');
  const credentials = JSON.parse(readFileSync(process.env.CHECKOUT_TEST_CREDENTIALS, 'utf8'));
  const loginResponse = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(loginResponse.status, 200, 'Tester login');
  const login = await loginResponse.json();
  assert.equal(login.role, 'user');
  assert.ok(login.token);
  const output = process.env.CATALOG_SCREENSHOTS || process.env.TEMP || process.cwd();
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1366]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      await context.addCookies([{ name: 'pk_auth_token', value: login.token, url: base, httpOnly: true, sameSite: 'Lax' }]);
      const creates = [];
      const pays = [];
      const checks = [];
      const blocked = [];
      const pageErrors = [];
      let scenario = 'price-change';
      let mockOrder;
      let mockCheck;
      // No mutating request from the browser may reach Bayarivo or a provider.
      await context.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        const pathname = url.pathname;
        const reply = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        if (request.method() === 'POST' && pathname === '/api/app/orders') {
          assert.equal(url.origin, new URL(base).origin);
          const payload = request.postDataJSON();
          creates.push(payload);
          await new Promise(resolve => setTimeout(resolve, 200));
          mockOrder = { id: 999999, invoice_id: 'TEST-CHECKOUT-NOT-A-REAL-ORDER', produk_id: payload.produk_id,
            produk_sku_snapshot: 'GPC1', produk_nama_snapshot: 'SALDO GOPAY CUSTOMER H2H 1.000',
            dest: payload.dest, qty: payload.qty, nominal: payload.qty, buyer_type: 'user', status: 'pending_payment',
            harga_final: scenario === 'price-change' ? 12200 : 11200, fee: 0 };
          return reply({ ok: true, item: mockOrder });
        }
        if (request.method() === 'POST' && pathname === '/api/app/orders/TEST-CHECKOUT-NOT-A-REAL-ORDER/pay') {
          pays.push(request.postDataJSON());
          if (scenario === 'pay-error') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Simulated uncertain response' }) });
          return reply({ ok: true, item: { payment_type: 'wallet', transaction_status: 'settlement', gross_amount: 0,
            raw_request: JSON.stringify({ wallet_debit: 11200, total_amount: 11200 }) } });
        }
        if (request.method() === 'GET' && pathname === '/api/app/orders/TEST-CHECKOUT-NOT-A-REAL-ORDER') {
          return reply({ ok: true, item: { ...mockOrder, status: scenario === 'pay-error' ? 'pending_payment' : 'success', sn: 'MOCK-NOT-A-PURCHASE' } });
        }
        if (request.method() === 'POST' && pathname === '/api/app/billing-checks') {
          checks.push(request.postDataJSON());
          mockCheck = { ref_id: 'TEST-INQUIRY-NOT-REAL', status: 'success', dest: '1234567890123',
            billing_inquiry: { can_pay: true, total_amount: 50000, bill_amount: 48000, admin_amount: 2000, customer_name: 'SIMULASI' } };
          return reply({ ok: true, item: mockCheck });
        }
        if (request.method() === 'GET' && pathname === '/api/app/billing-checks/TEST-INQUIRY-NOT-REAL') {
          return reply({ ok: true, item: mockCheck });
        }
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
          blocked.push(`${request.method()} ${pathname}`);
          return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.goto(`${base}/user/kategori/9/brand/42`, { waitUntil: 'networkidle', timeout: 90000 });
      assert.equal(await page.getByText('Katalog tersedia. Pembelian belum aktif.', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Pilih SALDO GOPAY CUSTOMER 1.000 (GPC1)', exact: true }).click();
      const modal = page.getByRole('dialog', { name: 'Checkout', exact: true });
      await modal.waitFor();
      assert.equal(await modal.getByRole('heading', { name: 'SALDO GOPAY CUSTOMER 1.000', exact: true }).count(), 1);
      await modal.getByRole('button', { name: 'Bayar', exact: true }).click();
      await modal.getByText('Nomor tujuan wajib diisi.', { exact: true }).waitFor();
      assert.equal(creates.length, 0);
      await modal.getByLabel('Nomor tujuan', { exact: true }).fill('081234567890');
      await modal.getByLabel('Nominal', { exact: true }).fill('10000');
      assert.ok(await modal.getByText('Rp 11.200', { exact: true }).count() > 0);
      assert.equal(await modal.getByRole('button', { name: 'Isi Saldo', exact: true }).count(), 0);
      await page.screenshot({ path: path.join(output, `catalog-checkout-${width}.png`) });
      await modal.getByRole('button', { name: 'Bayar', exact: true }).click();
      await modal.getByText(/Harga terbaru adalah Rp 12.200/).waitFor();
      assert.equal(creates.length, 1);
      assert.equal(pays.length, 0, 'Changed price must not be paid automatically');
      assert.deepEqual(creates[0], { produk_id: 5040, dest: '081234567890', qty: 10000 });
      await modal.getByRole('button', { name: 'Tutup modal', exact: true }).click();
      scenario = 'normal';
      await page.getByRole('button', { name: 'Pilih SALDO GOPAY CUSTOMER 1.000 (GPC1)', exact: true }).click();
      await modal.getByLabel('Nomor tujuan', { exact: true }).fill('081234567890');
      await modal.getByLabel('Nominal', { exact: true }).fill('10000');
      await modal.getByRole('button', { name: 'Bayar', exact: true }).waitFor();
      await modal.locator('form').evaluate(form => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      await modal.getByText('Transaksi berhasil', { exact: true }).first().waitFor();
      assert.equal(creates.length, 2, 'Double submit creates only one new order');
      assert.equal(pays.length, 1, 'Double submit pays only once');
      await modal.getByRole('button', { name: 'Tutup modal', exact: true }).click();
      scenario = 'pay-error';
      await page.getByRole('button', { name: 'Pilih SALDO GOPAY CUSTOMER 1.000 (GPC1)', exact: true }).click();
      await modal.getByLabel('Nomor tujuan', { exact: true }).fill('081234567890');
      await modal.getByLabel('Nominal', { exact: true }).fill('10000');
      await modal.getByRole('button', { name: 'Bayar', exact: true }).click();
      await modal.getByRole('button', { name: 'Periksa Transaksi', exact: true }).waitFor();
      await modal.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      assert.equal(creates.length, 3);
      assert.equal(pays.length, 2, 'Uncertain payment must not send another purchase');
      assert.equal(await modal.getByRole('button', { name: 'Bayar', exact: true }).count(), 0);
      await modal.getByRole('button', { name: 'Tutup modal', exact: true }).click();

      await page.goto(`${base}/kategori`, { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'Pulsa', exact: true }).click();
      await page.getByRole('link', { name: 'Logo Telkomsel Telkomsel', exact: true }).click();
      await page.getByRole('textbox', { name: 'Cari nama atau SKU produk' }).fill('SPS20');
      await page.getByRole('button', { name: /\(SPS20\)$/ }).click();
      await modal.waitFor();
      assert.equal(await modal.getByLabel('Nominal', { exact: true }).count(), 0, 'Fixed product does not request a nominal');
      assert.ok(await modal.getByText('Rp 20.850', { exact: true }).count() > 0);
      await modal.getByRole('button', { name: 'Tutup modal', exact: true }).click();

      await page.goto(`${base}/kategori`, { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'BPJS', exact: true }).click();
      await page.locator('main a[href*="/brand/"]').first().click();
      await page.getByRole('button', { name: 'Pilih BPJS KESEHATAN (BPJS)', exact: true }).click();
      const billing = page.getByRole('dialog', { name: 'Cek tagihan', exact: true });
      await billing.waitFor();
      assert.equal(await billing.getByRole('button', { name: 'Bayar', exact: true }).count(), 0);
      await billing.getByPlaceholder('Masukkan ID pelanggan', { exact: true }).fill('1234567890123');
      await billing.getByRole('button', { name: 'Cek Tagihan', exact: true }).click();
      await modal.waitFor();
      assert.equal(checks.length, 1);
      assert.ok(checks[0].produk_id !== 5040);
      assert.ok(await modal.getByText('Rp 52.600', { exact: true }).count() > 0, 'Provider bill plus catalog fee, not catalog fee alone');
      assert.equal(await modal.getByText('Detail tagihan PLN', { exact: true }).count(), 0);
      assert.equal(await modal.getByText('Nomor peserta', { exact: true }).count(), 1);
      assert.equal(await modal.getByText('Rp 2.600', { exact: true }).count(), 1, 'Service fee excludes the admin already included in the bill');
      assert.equal(await modal.getByRole('button', { name: 'Isi Saldo', exact: true }).count(), 1);
      assert.equal(await modal.getByRole('button', { name: 'Bayar', exact: true }).count(), 0, 'Insufficient wallet balance cannot be submitted');
      assert.equal(pays.length, 2, 'Inquiry does not auto-pay');
      await page.screenshot({ path: path.join(output, `catalog-billing-${width}.png`) });
      assert.deepEqual(blocked, [], 'No unexpected mutating requests');
      assert.deepEqual(pageErrors, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      console.log(`Checkout passed ${width}px: inputs, prices, double-submit guard, billing inquiry; all order/payment requests mocked.`);
      await context.close();
    }

    const guest = await browser.newContext();
    await guest.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
    const page = await guest.newPage();
    await page.goto(`${base}/kategori/9/brand/42`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Pilih SALDO GOPAY CUSTOMER 1.000 (GPC1)', exact: true }).click();
    await page.waitForURL('**/login?callbackUrl=*');
    assert.equal(new URL(page.url()).searchParams.get('callbackUrl'), '/kategori/9/brand/42');
    await guest.close();
    console.log('Guest is redirected to login with the catalog return URL.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
