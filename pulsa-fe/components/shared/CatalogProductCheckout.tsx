"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { UserProductItem } from "@/components/user/types";
import { UserCheckoutModal } from "@/components/user/UserCheckoutModal";
import { RetailBillingEntryFlow } from "./RetailBillingEntryFlow";
import { catalogDestination, catalogInquiryItems, isCatalogCheckProduct, needsCatalogInquiry } from "@/lib/catalog-checkout";
import { catalogDisplayName } from "@/lib/catalog-display-name";

export function CatalogProductCheckout({ product, items, authToken, buyerRole, onClose }: {
  product: UserProductItem; items: UserProductItem[]; authToken: string; buyerRole?: string; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inquiry = needsCatalogInquiry(product);
  useEffect(() => {
    if (!inquiry) return;
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, [inquiry]);

  if (!inquiry) return <UserCheckoutModal open product={product} authToken={authToken} buyerRole={buyerRole}
    {...catalogDestination(product)} onClose={onClose} />;

  const checkItems = catalogInquiryItems(product, items);
  return <dialog ref={dialog} onCancel={onClose} aria-label="Cek tagihan"
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/40">
    <div className="mb-4 flex items-start justify-between gap-3">
      <h2 className="min-w-0 break-words text-base font-bold">{catalogDisplayName(product.nama)}</h2>
      <button type="button" onClick={onClose} aria-label="Tutup cek tagihan" title="Tutup" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100"><X className="h-4 w-4" /></button>
    </div>
    {checkItems.length ? <RetailBillingEntryFlow title={catalogDisplayName(product.brand_nama)}
      description="" placeholder="Masukkan ID pelanggan" items={checkItems} mode="user" authToken={authToken} buyerRole={buyerRole}
      checkProductId={checkItems[0].id} allowCheckOnly={isCatalogCheckProduct(product)} />
      : <p role="status" className="text-sm leading-relaxed text-slate-600">Produk ini memerlukan cek tagihan. Pasangan produk cek belum tersedia, sehingga pembayaran belum dapat dilanjutkan. Saldo tidak dipotong.</p>}
  </dialog>;
}
