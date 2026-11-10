import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogDestination, catalogInquiryItems, catalogNominalError, catalogPrice, isCatalogCheckProduct, needsCatalogInquiry } from "./catalog-checkout.ts";

const product = Object.freeze({ id: 1, sku: "GPC1", nama: "SALDO GOPAY CUSTOMER H2H 1.000", kategori_id: 9,
  kategori_nama: "E-Wallet", brand_id: 42, brand_nama: "GOPAY", tipe_harga: "OPEN_AMOUNT", harga_dasar_app: 1200,
  fee_master: 0, fee_agent: 100, fee_user: 200, fee_guest: 300, aktif: true });

test("catalog price includes the correct role fee without inventing a denomination", () => {
  assert.equal(catalogPrice(product, "user"), 1400);
  assert.equal(catalogPrice(product), 1500);
  assert.equal(catalogPrice({ ...product, tipe_harga: "FIXED", harga_user_final: 20850, nominal: null }, "user"), 20850);
  assert.equal(catalogPrice({ ...product, tipe_harga: "FIXED", nominal: null }, "user"), 1400);
  assert.equal(product.harga_dasar_app, 1200);
});

test("open amounts reject missing, unsafe and over-limit values", () => {
  for (const value of [0, -1, NaN, Infinity, 1.1, Number.MAX_SAFE_INTEGER + 1]) assert.ok(catalogNominalError(product, value));
  assert.equal(catalogNominalError(product, 10000), null);
  assert.ok(catalogNominalError({ ...product, maksimal_nominal: 50000 }, 50001));
  assert.equal(catalogNominalError({ ...product, maksimal_nominal: 50000 }, 50000), null);
  assert.equal(catalogNominalError({ ...product, tipe_harga: "FIXED", nominal: null }, 0), null);
});

test("destination fields match phone, bank and game formats", () => {
  assert.equal(catalogDestination(product).mobilePhoneRequired, true);
  assert.equal(catalogDestination({ ...product, kategori_nama: "Telepon & SMS" }).mobilePhoneRequired, true);
  assert.equal(catalogDestination({ ...product, kategori_nama: "Transfer Bank" }).destMaxLength, 32);
  assert.equal(catalogDestination({ ...product, kategori_nama: "Voucher Data" }).mobilePhoneRequired, false);
  assert.equal(catalogDestination({ ...product, kategori_nama: "Game", brand_nama: "Mobile Legends" }).destMode, "ml_id_server");
  assert.equal(catalogDestination({ ...product, kategori_nama: "Game", brand_nama: "Free Fire" }).destMode, "alphanumeric");
});

test("bills cannot be paid as though their catalog admin fee were the bill total", () => {
  assert.equal(needsCatalogInquiry(product), false);
  assert.equal(needsCatalogInquiry({ ...product, kategori_nama: "PLN", nama: "TOKEN PLN 20.000" }), false);
  for (const category of ["BPJS", "Asuransi", "Pascabayar", "Tagihan Air", "Tagihan Gas", "Pajak Daerah"]) {
    assert.equal(needsCatalogInquiry({ ...product, kategori_nama: category }), true);
  }
  assert.equal(needsCatalogInquiry({ ...product, kategori_nama: "TV & Streaming", nama: "BIZNETHOME PASKABAYAR" }), true);
});

test("only one explicit, active check SKU for the same brand and category can be paired", () => {
  const bill = { ...product, sku: "BPJS", kategori_nama: "BPJS", nama: "BPJS KESEHATAN" };
  const check = { ...bill, id: 2, sku: "CEKBPJS", harga_dasar_app: 1000 };
  assert.equal(isCatalogCheckProduct(check), true);
  assert.deepEqual(catalogInquiryItems(bill, [bill, check]), [check, bill]);
  assert.deepEqual(catalogInquiryItems(check, [bill, check]), [check]);
  assert.deepEqual(catalogInquiryItems(bill, [bill]), []);
  assert.deepEqual(catalogInquiryItems(bill, [{ ...check, aktif: false }]), []);
  assert.deepEqual(catalogInquiryItems(bill, [{ ...check, brand_id: 99 }]), []);
  assert.deepEqual(catalogInquiryItems(bill, [{ ...check, kategori_id: 99 }]), []);
  assert.deepEqual(catalogInquiryItems(bill, [{ ...check, sku: "CEKOTHER" }]), []);
  assert.deepEqual(catalogInquiryItems(bill, [check, { ...check, id: 3 }]), []);
});
