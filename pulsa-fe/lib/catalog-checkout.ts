import type { UserProductItem } from "../components/user/types";

export function isCatalogCheckProduct(item: UserProductItem) {
  return /^CEK/i.test(item.sku) || item.sku.toUpperCase() === "PLNC" || /\bCEK\b/i.test(item.nama);
}

export function needsCatalogInquiry(item: UserProductItem) {
  return isCatalogCheckProduct(item)
    || ["ASURANSI", "BPJS", "MULTIFINANCE", "PAJAK DAERAH", "PASCABAYAR", "SAMSAT", "TAGIHAN AIR", "TAGIHAN GAS", "INTERNET & TELCO", "PEMBAYARAN"].includes(item.kategori_nama.toUpperCase())
    || /PASCABAYAR|PASKABAYAR|TAGIHAN|PLNPOST|PLN POST/i.test(item.nama)
    || item.sku.toUpperCase() === "PLNB";
}

export function catalogInquiryItems(product: UserProductItem, items: UserProductItem[]) {
  if (isCatalogCheckProduct(product)) return [product];
  const sku = product.sku.toUpperCase();
  const candidates = new Set([`CEK${sku}`, `C${sku}`, ...(sku.endsWith("B") ? [`${sku.slice(0, -1)}C`] : [])]);
  const checks = items.filter(item => item.aktif && item.brand_id === product.brand_id
    && item.kategori_id === product.kategori_id && isCatalogCheckProduct(item) && candidates.has(item.sku.toUpperCase()));
  // Never substitute an arbitrary check SKU for the selected payment product.
  return checks.length === 1 ? [checks[0], product] : [];
}

export function catalogPrice(item: UserProductItem, role = "guest") {
  const fee = role === "master" ? item.fee_master : role === "agent" ? item.fee_agent : role === "user" ? item.fee_user : item.fee_guest;
  const final = role === "master" ? item.harga_master_final : role === "agent" ? item.harga_agent_final : role === "user" ? item.harga_user_final : item.harga_guest_final;
  return item.tipe_harga === "FIXED" && final != null ? Number(final) : Number(item.harga_dasar_app) + Number(fee || 0);
}

export function catalogDestination(product: UserProductItem) {
  const category = product.kategori_nama.toUpperCase();
  const game = category === "GAME" || /MOBILE LEGENDS|FREE FIRE|PUBG|GENSHIN|HONKAI|ACE REACER/i.test(product.brand_nama);
  if (game) return {
    destLabel: "ID pemain", destPlaceholder: "Masukkan ID pemain",
    destMode: /MOBILE LEGENDS/i.test(product.brand_nama) ? "ml_id_server" as const : "alphanumeric" as const,
    destMaxLength: 32, mobilePhoneRequired: false,
  };
  if (category === "TRANSFER BANK") return {
    destLabel: "Nomor rekening", destPlaceholder: "Masukkan nomor rekening",
    destMode: "single" as const, destMaxLength: 32, mobilePhoneRequired: false,
  };
  if (category === "VOUCHER DATA") return {
    destLabel: "Nomor tujuan / kode voucher", destPlaceholder: "Masukkan nomor atau kode voucher",
    destMode: "alphanumeric" as const, destMaxLength: 32, mobilePhoneRequired: false,
  };
  if (["PULSA", "PAKET DATA", "TELEPON & SMS", "E-WALLET", "E-MONEY"].includes(category)) return {
    destLabel: "Nomor tujuan", destPlaceholder: "08xxxxxxxxxx",
    destMode: "single" as const, destMaxLength: 13, mobilePhoneRequired: true,
  };
  return {
    destLabel: category === "PLN" ? "ID pelanggan / nomor meter" : "ID pelanggan / tujuan",
    destPlaceholder: "Masukkan ID tujuan", destMode: "alphanumeric" as const,
    destMaxLength: 32, mobilePhoneRequired: false,
  };
}

export function catalogNominalError(product: UserProductItem, nominal: number) {
  if (product.tipe_harga === "FIXED") return null;
  if (!Number.isSafeInteger(nominal) || nominal <= 0) return "Nominal harus berupa angka rupiah yang valid.";
  if (product.maksimal_nominal != null && product.maksimal_nominal > 0 && nominal > product.maksimal_nominal) {
    return `Nominal maksimum Rp ${new Intl.NumberFormat("id-ID").format(product.maksimal_nominal)}.`;
  }
  return null;
}
