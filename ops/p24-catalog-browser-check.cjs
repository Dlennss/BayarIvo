const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { catalogDisplayName } = require('../pulsa-fe/lib/catalog-display-name.ts');

(async () => {
  const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const base = process.env.CATALOG_URL || 'http://localhost:33104';
  const output = process.env.CATALOG_SCREENSHOTS || process.cwd();
  const categories = [...new Set(manifest.Products.map(p => p.Category))];
  const sample = manifest.Products.find(p => p.Brand === 'GOPAY' && p.PriceType === 'OPEN_AMOUNT' && /\bH2H\b/i.test(p.Name));
  assert.ok(sample, 'GoPay sample with supplier label');
  const fixedSample = manifest.Products.find(p => p.Category === 'Pulsa' && p.Brand === 'Telkomsel' && p.PriceType === 'FIXED');
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    for (const width of [390, 1366]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => {
        if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
      });
      const response = await page.goto(`${base}/kategori`, { waitUntil: 'networkidle', timeout: 90000 });
      assert.equal(response.status(), 200);
      for (const category of categories) assert.equal(await page.getByRole('link', { name: category, exact: true }).count(), 1, category);
      assert.equal(await page.getByRole('link', { name: 'eSIM & Roaming', exact: true }).count(), 0);
      await page.getByRole('textbox', { name: 'Cari layanan', exact: true }).fill('E-Wallet');
      await page.getByRole('link', { name: 'E-Wallet', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'E-Wallet', exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, `p24-brands-${width}.png`) });
      await page.getByRole('link', { name: 'Logo GoPay GOPAY', exact: true }).click();
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'GOPAY', exact: true }).waitFor();
      assert.doesNotMatch(await page.locator('main header').innerText(), /pulsa24jam|h2hr?/i);
      assert.match(await page.locator('main header').innerText(), /Bayarivo/i);
      assert.equal(await page.getByRole('button', { name: 'Beli', exact: true }).count(), 0);
      const next = page.getByRole('button', { name: 'Halaman berikutnya', exact: true });
      await next.click();
      assert.match(await page.getByRole('navigation', { name: 'Halaman produk' }).innerText(), /2\s*\//);
      await page.getByRole('textbox', { name: 'Cari nama atau SKU produk' }).fill(sample.SKU);
      const item = page.locator('main li').filter({ has: page.getByText(sample.SKU, { exact: true }) });
      await item.waitFor();
      assert.equal(await item.getByText(catalogDisplayName(sample.Name), { exact: true }).count(), 1);
      assert.equal(await item.getByText(sample.Name, { exact: true }).count(), 0);
      assert.equal(await item.getByText(`+ Rp ${new Intl.NumberFormat('id-ID').format(sample.Price)}`, { exact: true }).count(), 1);
      await page.getByRole('textbox', { name: 'Cari nama atau SKU produk' }).fill(catalogDisplayName(sample.Name));
      await item.waitFor();
      await page.getByRole('textbox', { name: 'Cari nama atau SKU produk' }).fill(sample.Name);
      await item.waitFor();
      await page.getByRole('textbox', { name: 'Cari nama atau SKU produk' }).fill('no-matching-sku-00000000');
      await page.getByText('Produk tidak ditemukan.', { exact: true }).waitFor();
      await page.getByRole('textbox', { name: 'Cari nama atau SKU produk' }).fill('');
      await page.getByRole('combobox', { name: 'Jenis harga' }).selectOption('OPEN_AMOUNT');
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        brokenImages: [...document.querySelectorAll('img')].filter(img => !img.complete || !img.naturalWidth).length,
      }));
      assert.equal(layout.overflow, false, 'horizontal overflow');
      assert.equal(layout.brokenImages, 0, 'broken images');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `p24-products-${width}.png`) });
      await page.goto(`${base}/kategori`, { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'Pulsa', exact: true }).click();
      await page.getByRole('link', { name: 'Logo Telkomsel Telkomsel', exact: true }).click();
      await page.getByRole('textbox', { name: 'Cari nama atau SKU produk' }).fill(fixedSample.SKU);
      const fixedItem = page.locator('main li').filter({ has: page.getByText(fixedSample.SKU, { exact: true }) });
      await fixedItem.waitFor();
      assert.equal(await fixedItem.getByText(catalogDisplayName(fixedSample.Name), { exact: true }).count(), 1);
      assert.equal(await fixedItem.getByText(`Rp ${new Intl.NumberFormat('id-ID').format(fixedSample.Price)}`, { exact: true }).count(), 1);
      await page.goto(`${base}/ewallet`, { waitUntil: 'networkidle' });
      assert.match(page.url(), /\/kategori\?q=E-Wallet/);
      await page.goto(`${base}/kategori?layanan=esim-roaming`, { waitUntil: 'networkidle' });
      assert.equal(await page.getByRole('heading', { name: 'Semua layanan', exact: true }).count(), 1);
      assert.deepEqual(errors, []);
      console.log(`Catalog browser checks passed: ${width}px`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
