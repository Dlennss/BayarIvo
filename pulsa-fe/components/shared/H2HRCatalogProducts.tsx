"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { UserProductItem } from "@/components/user/types";
import { catalogDisplayName } from "@/lib/catalog-display-name";

const rupiah = (value: number) => `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
const pageSize = 30;

export function H2HRCatalogProducts({ items }: { items: UserProductItem[] }) {
  const [query, setQuery] = useState("");
  const [priceType, setPriceType] = useState("ALL");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id-ID");
    return items.filter(item =>
      (priceType === "ALL" || item.tipe_harga === priceType) &&
      `${item.sku} ${item.nama} ${catalogDisplayName(item.nama)}`.toLocaleLowerCase("id-ID").includes(needle));
  }, [items, query, priceType]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);

  return (
    <section className="space-y-4">
      <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Katalog tersedia. Pembelian belum aktif.</p>
      <div className="space-y-2">
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-700" />
          <input aria-label="Cari nama atau SKU produk" placeholder="Cari nama atau SKU produk" value={query}
            onChange={event => { setQuery(event.target.value); setPage(0); }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-600" aria-live="polite">{filtered.length.toLocaleString("id-ID")} produk</p>
          <select aria-label="Jenis harga" value={priceType} onChange={event => { setPriceType(event.target.value); setPage(0); }} className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs">
            <option value="ALL">Semua harga</option>
            <option value="FIXED">Harga tetap</option>
            <option value="OPEN_AMOUNT">Bebas nominal</option>
          </select>
        </div>
      </div>
      <ul className="divide-y divide-slate-200">
        {filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => (
          <li key={item.id} className="py-4 first:pt-0">
            <p className="break-words text-sm font-bold leading-relaxed text-slate-900">{catalogDisplayName(item.nama)}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{item.sku}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
              <span className="text-[11px] text-slate-500">{item.group_name ? `${catalogDisplayName(item.group_name)} / ` : ""}{item.tipe_harga === "FIXED" ? "Harga tetap" : "Bebas nominal"}</span>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">{item.tipe_harga === "OPEN_AMOUNT" ? "Biaya tambahan" : "Harga katalog"}</p>
                <p className="text-sm font-bold text-sky-800">{item.tipe_harga === "OPEN_AMOUNT" ? "+ " : ""}{rupiah(item.harga_dasar_app)}</p>
              </div>
            </div>
            {item.maksimal_nominal != null && <p className="mt-2 text-xs text-slate-500">Maksimum nominal {rupiah(item.maksimal_nominal)}</p>}
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Produk tidak ditemukan.</p>}
      {pageCount > 1 && <nav aria-label="Halaman produk" className="flex items-center justify-between border-t border-slate-200 pt-3">
        <button type="button" aria-label="Halaman sebelumnya" title="Halaman sebelumnya" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-xs text-slate-600">{currentPage + 1} / {pageCount}</span>
        <button type="button" aria-label="Halaman berikutnya" title="Halaman berikutnya" disabled={currentPage + 1 === pageCount} onClick={() => setPage(currentPage + 1)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </nav>}
    </section>
  );
}
