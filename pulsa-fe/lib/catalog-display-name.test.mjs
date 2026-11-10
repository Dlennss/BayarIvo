import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogDisplayName } from "./catalog-display-name.ts";

test("removes supplier labels without changing brand, variant or nominal", () => {
  for (const [source, expected] of [
    ["SALDO GOPAY CUSTOMER H2H 1.000", "SALDO GOPAY CUSTOMER 1.000"],
    ["GOPAY CUSTOMER PROMO H2H 1.000", "GOPAY CUSTOMER PROMO 1.000"],
    ["Pulsa24Jam H2HR / E-Wallet", "E-Wallet"],
    ["P24 - Telkomsel 50.000", "Telkomsel 50.000"],
    ["DANA (H2H) 10.000", "DANA 10.000"],
    ["Pulsa 24 Jam H2R", "Bayarivo"],
    ["GoPay", "GoPay"],
    ["Tri 24GB / 30 Hari", "Tri 24GB / 30 Hari"],
    ["GOPAY CUSTOMER 1.000", "GOPAY CUSTOMER 1.000"],
    ["SP24GB", "SP24GB"],
  ]) assert.equal(catalogDisplayName(source), expected);
});

test("formatting is repeatable and does not mutate source product data", () => {
  const item = Object.freeze({ nama: "SALDO GOPAY H2H 1.000", sku: "GPC1", harga: 1200 });
  const display = catalogDisplayName(item.nama);
  assert.equal(catalogDisplayName(display), display);
  assert.deepEqual(item, { nama: "SALDO GOPAY H2H 1.000", sku: "GPC1", harga: 1200 });
});
