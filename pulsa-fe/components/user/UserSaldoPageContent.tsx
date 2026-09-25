"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  Plus,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

type UserSaldoPageContentProps = {
  saldo: number;
  userCode: string;
  showCredit?: boolean;
};

function formatIDR(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;
}

export function UserSaldoPageContent({ saldo, userCode, showCredit = false }: UserSaldoPageContentProps) {
  const [revealed, setRevealed] = useState(true);
  const displaySaldo = revealed ? formatIDR(saldo) : "Rp ******";

  const actions = [
    { label: "Isi Saldo", sub: "Tambah dana", href: "/user/account/topup", icon: Plus, tone: "bg-[#fff2c7] text-[#d89300]" },
    { label: "Kirim", sub: "Ke pengguna", href: "/user/saldo/kirim", icon: ArrowUpRight, tone: "bg-[#e4f5ff] text-[#0875be]" },
    { label: "Tarik", sub: "Ke rekening", href: "/user/account/withdraw", icon: ArrowDownToLine, tone: "bg-[#e8fbf3] text-[#1aa875]" },
    ...(showCredit
      ? [{ label: "Tagihan", sub: "Pinjaman agent", href: "/user/saldo/tagihan", icon: ReceiptText, tone: "bg-[#efe9ff] text-[#6548d9]" }]
      : []),
  ];

  const topupMethods = [
    { title: "Transfer Bank", desc: "BCA, BRI, BNI, dan Mandiri", href: "/user/account/topup", icon: Landmark, tone: "bg-[#e8f5ff] text-[#0875be]" },
    { title: "Virtual Account", desc: "Verifikasi otomatis lebih cepat", href: "/user/account/topup", icon: WalletCards, tone: "bg-[#fff5d8] text-[#d89300]" },
  ];

  return (
    <div className="space-y-3.5">
      <section className="relative overflow-hidden rounded-[24px] bg-[#045a92] p-5 text-white shadow-[0_20px_38px_rgba(0,77,136,0.27)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#04395f_0%,#087ec3_58%,#004e83_100%)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(130deg,transparent_0%,rgba(255,255,255,0.12)_100%)]" />
        <div className="pointer-events-none absolute -right-12 bottom-4 h-28 w-44 rotate-[-18deg] rounded-[30px] border border-white/14" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold text-white/78">Saldo Utama</p>
                <button
                  type="button"
                  onClick={() => setRevealed((value) => !value)}
                  aria-label={revealed ? "Sembunyikan saldo" : "Tampilkan saldo"}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/85 ring-1 ring-white/15"
                >
                  {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <h1 className="mt-3 text-[39px] font-black leading-none tracking-tight">{displaySaldo}</h1>
              <p className="mt-2 text-[13px] font-semibold text-white/78">Aktif dan siap bertransaksi</p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white/85 ring-1 ring-white/15 backdrop-blur">
              <WalletCards className="h-6 w-6" strokeWidth={2.35} />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/25 pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/75">Bayarivo Saldo</p>
            <p className="max-w-[160px] truncate text-right text-[10px] font-black uppercase tracking-[0.18em] text-white/80">{userCode}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-[#dfeaf4] bg-white p-3 shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
        <div className={`grid gap-2 ${showCredit ? "grid-cols-4" : "grid-cols-3"}`}>
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="group min-w-0 rounded-[18px] px-1 py-3 text-center transition hover:bg-[#f6fbff]">
                <span className={`mx-auto grid h-12 w-12 place-items-center rounded-[18px] ${item.tone} shadow-[0_10px_18px_rgba(7,44,92,0.08)] transition group-hover:-translate-y-0.5`}>
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <span className="mt-2 block truncate text-[11px] font-black text-[#08295a]">{item.label}</span>
                <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#6f83a2]">{item.sub}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <Link href="/user/account/mutasi" className="flex items-center gap-3 rounded-[22px] border border-[#cfe7f7] bg-[#f3fbff] px-4 py-3 text-[#0875be] shadow-[0_10px_24px_rgba(8,52,100,0.07)]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#0875be] ring-1 ring-[#d8edf9]">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-black text-[#08295a]">Saldo aman dan terlindungi</span>
          <span className="mt-0.5 block text-[10px] font-semibold text-[#5f789d]">Setiap transaksi dijaga dengan PIN dan verifikasi.</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </Link>

      <section className="rounded-[22px] border border-[#dfeaf4] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[#e8f5ff] text-[#0875be]">
              <ArrowDownToLine className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#6f83a2]">Uang Masuk</p>
              <p className="mt-1 text-xl font-black tracking-tight text-[#08295a]">Rp0</p>
            </div>
          </div>

          <div className="h-14 w-px bg-slate-200" />

          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[#fff5d8] text-[#d89300]">
              <ArrowUpRight className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#6f83a2]">Uang Keluar</p>
              <p className="mt-1 text-xl font-black tracking-tight text-[#08295a]">Rp0</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-[#dfeaf4] bg-white shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <h2 className="text-sm font-black text-[#08295a]">Cara Isi Saldo</h2>
          <Link href="/user/account/topup" className="text-[10px] font-black text-[#0875be]">Lihat semua</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {topupMethods.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f6fbff]">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black text-[#08295a]">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#6f83a2]">{item.desc}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-[#dfeaf4] bg-white shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
        <div className="border-b border-slate-100 px-4 py-3.5">
          <h2 className="text-sm font-black text-[#08295a]">Aktivitas Dompet</h2>
        </div>
        <div className="grid min-h-[220px] place-items-center px-6 py-8 text-center">
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f5ff] text-[#0875be] ring-1 ring-[#d8edf9]">
              <WalletCards className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <p className="mt-4 text-sm font-black text-[#08295a]">Belum ada aktivitas</p>
            <p className="mx-auto mt-1 max-w-[240px] text-[11px] font-semibold leading-4 text-[#6f83a2]">Isi saldo atau lakukan transaksi pertamamu. Riwayat dompet akan muncul di sini.</p>
            <Link href="/user/account/topup" className="mt-5 inline-flex h-10 items-center justify-center rounded-[14px] bg-[#ffcd4a] px-4 text-xs font-black text-[#08295a] shadow-[0_10px_18px_rgba(225,151,0,0.18)]">
              Isi Saldo Sekarang
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
