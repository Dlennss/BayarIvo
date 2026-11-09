import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const query = (sql) => JSON.parse(execFileSync('sudo', ['-u', 'bayarivo', 'psql', '-X', '-d', 'bayarivo', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
const rows = query(`SELECT coalesce(json_agg(r), '[]') FROM (
 SELECT p.sku, p.nama, p.group_name, p.tipe_harga, p.nominal, p.maksimal_nominal,
 k.nama AS category, b.nama AS brand, a.provider, a.harga, a.harga_dasar,
 m.kode_provider, m.fee_rp, m.minimal_nominal
 FROM produk p JOIN kategori k ON k.id=p.kategori_id JOIN brand b ON b.id=p.brand_id
 JOIN produk_app_pricing a ON a.produk_id=p.id AND a.aktif
 JOIN produk_provider_map m ON m.produk_id=p.id AND m.aktif
 WHERE p.aktif
) r`);
assert.equal(rows.length, manifest.Products.length, 'catalog/mapping count');
const bySKU = new Map(rows.map((row) => [row.sku, row]));
assert.equal(bySKU.size, rows.length, 'duplicate SKU/mapping');
for (const p of manifest.Products) {
  const row = bySKU.get(p.SKU);
  assert.ok(row, `missing ${p.SKU}`);
  assert.deepEqual(row, {
    sku: p.SKU, nama: p.Name, group_name: p.GroupName, tipe_harga: p.PriceType,
    nominal: null, maksimal_nominal: p.MaximumNominal ? Number(p.MaximumNominal) : null,
    category: p.Category, brand: p.Brand, provider: 'pulsa24jam', harga: p.Price,
    harga_dasar: p.Price, kode_provider: p.SKU, fee_rp: 0, minimal_nominal: null,
  }, p.SKU);
}
assert.equal(query(`SELECT count(*) FROM produk_app_pricing WHERE aktif AND provider <> 'pulsa24jam'`), 0);
assert.equal(query(`SELECT count(*) FROM produk_provider_map WHERE aktif AND provider <> 'pulsa24jam'`), 0);
assert.equal(query(`SELECT count(*) FROM kategori_fee_app WHERE aktif AND (fee_master <> 0 OR fee_agent <> 0 OR fee_user <> 0 OR fee_non_user <> 0)`), 0, 'unexpected markup');
async function api(path) {
  const response = await fetch(`http://127.0.0.1:8104/v1/app/${path}`, { signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200, path);
  const body = await response.json();
  assert.equal(body.ok, true, path);
  return body.items;
}
const products = await api('produk');
assert.equal(products.length, rows.length, 'API catalog count');
assert.equal(new Set(products.map(p => p.sku)).size, rows.length, 'API duplicate SKU');
for (const p of products) {
  const row = bySKU.get(p.sku);
  assert.ok(row, `unexpected API SKU ${p.sku}`);
  for (const [field, expected] of Object.entries({ aktif: true, nama: row.nama, group_name: row.group_name,
    kategori_nama: row.category, brand_nama: row.brand, tipe_harga: row.tipe_harga,
    harga_dasar_app: row.harga })) assert.equal(p[field], expected, `${p.sku}.${field}`);
}
const categories = await api('kategori');
assert.deepEqual(categories.map(c => c.nama).sort(), [...new Set(rows.map(r => r.category))].sort(), 'API categories');
let brandCategoryPairs = 0;
for (const category of categories) {
  const brands = await api(`brand?kategori_id=${category.id}`);
  const expected = new Set(rows.filter(r => r.category === category.nama).map(r => r.brand));
  assert.deepEqual(brands.map(b => b.nama).sort(), [...expected].sort(), `${category.nama} brands`);
  brandCategoryPairs += brands.length;
}
console.log(JSON.stringify({ verified: rows.length, categories: new Set(rows.map(r => r.category)).size,
  brands: new Set(rows.map(r => r.brand)).size, sourceSHA256: manifest.SourceSHA256, api: 'matched',
  brandCategoryPairs,
  fixed: rows.filter(r => r.tipe_harga === 'FIXED').length,
  openAmount: rows.filter(r => r.tipe_harga === 'OPEN_AMOUNT').length }, null, 2));
