"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { UserCategoryItem } from "@/components/user/types";
import { catalogDisplayName } from "@/lib/catalog-display-name";

const icons: Record<string, string> = {
  Pulsa: "pulsa", "Paket Data": "paket-data", "Voucher Data": "paket-data",
  "Telepon & SMS": "pulsa", Pascabayar: "hp-pascabayar",
  "E-Wallet": "ewallet", "E-Money": "uang-elektronik", "Transfer Bank": "transfer-bank",
  PLN: "token-pln", "Tagihan Air": "pdam", "Tagihan Gas": "gas-pgn",
  "Internet & Telco": "internet-wifi", "TV & Streaming": "tv-kabel", Game: "voucher-game",
  BPJS: "bpjs", Asuransi: "asuransi", Multifinance: "cicilan-multifinance",
  "Pajak Daerah": "pbb", Samsat: "pajak-negara", "Voucher Digital": "voucher-digital",
};

export function ServiceDirectory({ mode = "guest", categories, initialQuery = "" }: {
  mode?: "guest" | "user"; categories: UserCategoryItem[]; initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const visible = categories.filter(item => item.aktif && `${item.nama} ${catalogDisplayName(item.nama)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const prefix = mode === "user" ? "/user/kategori" : "/kategori";
  return <section>
    <label className="mb-4 flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-700" />
      <input aria-label="Cari layanan" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari layanan" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
    </label>
    <p className="mb-3 text-xs text-slate-500" aria-live="polite">{visible.length} layanan</p>
    <div className="divide-y divide-slate-200">
      {visible.map(item => <Link key={item.id} href={`${prefix}/${item.id}`} prefetch={false} className="flex min-h-20 items-center gap-3 py-3">
        <Image src={`/service-icons/${icons[item.nama] || "voucher-digital"}.png`} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
        <span className="min-w-0 flex-1 break-words text-sm font-semibold">{catalogDisplayName(item.nama)}</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
      </Link>)}
    </div>
    {!visible.length && <p className="py-8 text-center text-sm text-slate-500">Layanan tidak ditemukan.</p>}
  </section>;
}
