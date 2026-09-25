import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bolt,
  Clock3,
  FileText,
  Grid2X2,
  Home,
  ReceiptText,
  Send,
  Smartphone,
  UserRound,
  WalletCards,
  Wifi,
  Gift,
} from "lucide-react";

type BayarivoHomeConceptProps = {
  userMode?: boolean;
  isLoggedIn?: boolean;
};

type ServiceItem = {
  label: string;
  href: string;
  Icon: typeof Smartphone;
  tone: string;
};

function appHref(userMode: boolean, guestHref: string, userHref: string, isLoggedIn = false) {
  if (userMode) return userHref;
  if (guestHref === "/login" && isLoggedIn) return userHref;
  return guestHref;
}

function money(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[19px] font-black leading-tight text-[#062657]">{title}</h2>
      {href ? (
        <Link href={href} prefetch={false} className="inline-flex items-center gap-1 text-[12px] font-extrabold text-[#006bc8]">
          Lihat Semua
          <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
        </Link>
      ) : null}
    </div>
  );
}

function ServiceTile({ item }: { item: ServiceItem }) {
  const { Icon } = item;

  return (
    <Link href={item.href} prefetch={false} className="group min-w-0 text-center">
      <span className={`mx-auto grid h-[54px] w-[54px] place-items-center rounded-[14px] ${item.tone} shadow-[0_10px_22px_rgba(7,44,92,0.08)] transition group-hover:-translate-y-0.5`}>
        <Icon className="h-7 w-7" strokeWidth={2.35} />
      </span>
      <span className="mt-2 block min-h-8 text-[11px] font-extrabold leading-tight text-[#08295a]">{item.label}</span>
    </Link>
  );
}

function BottomNav({
  homeHref,
  transactionHref,
  balanceHref,
  accountHref,
}: {
  homeHref: string;
  transactionHref: string;
  balanceHref: string;
  accountHref: string;
}) {
  const itemClass = "flex min-w-0 flex-col items-center gap-1 py-1 text-[#7187a9] visited:text-[#7187a9]";
  const activeClass = "flex min-w-0 flex-col items-center gap-1 py-1 text-[#0075bf] visited:text-[#0075bf]";

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-[#dce8f3] bg-white/95 px-5 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(9,42,89,0.12)] backdrop-blur-xl md:w-97.5">
      <div className="grid grid-cols-4">
        <Link href={homeHref} prefetch={false} className={activeClass}>
          <span className="grid h-9 min-w-[52px] place-items-center rounded-[12px] bg-[#e8f5ff]">
            <Home className="h-5 w-5" fill="currentColor" strokeWidth={2.1} />
          </span>
          <span className="text-[11px] font-black leading-none">Beranda</span>
        </Link>
        <Link href={transactionHref} prefetch={false} className={itemClass}>
          <Clock3 className="h-6 w-6" strokeWidth={2} />
          <span className="text-[11px] font-bold leading-none">Riwayat</span>
        </Link>
        <Link href={balanceHref} prefetch={false} className={itemClass}>
          <WalletCards className="h-6 w-6" strokeWidth={2} />
          <span className="text-[11px] font-bold leading-none">Saldo</span>
        </Link>
        <Link href={accountHref} prefetch={false} className={itemClass}>
          <UserRound className="h-6 w-6" strokeWidth={2} />
          <span className="text-[11px] font-bold leading-none">Akun</span>
        </Link>
      </div>
    </nav>
  );
}

export function BayarivoHomeConcept({ userMode = false, isLoggedIn = false }: BayarivoHomeConceptProps) {
  const homeHref = userMode ? "/user" : "/";
  const categoryHref = userMode ? "/user/kategori" : "/kategori";
  const transactionHref = userMode ? "/user/transaksi" : "/transaksi";
  const balanceHref = appHref(userMode, "/login", "/user/saldo", isLoggedIn);
  const topupHref = appHref(userMode, "/login", "/user/account/topup", isLoggedIn);
  const accountHref = appHref(userMode, "/login", "/user/account", isLoggedIn);
  const transferHref = appHref(userMode, "/login", "/user/saldo/kirim", isLoggedIn);

  const services: ServiceItem[] = [
    { label: "Pulsa & Data", href: userMode ? "/user/pulsa-data" : "/pulsa-data", Icon: Smartphone, tone: "bg-[#fff0ed] text-[#f16651]" },
    { label: "Paket Internet", href: userMode ? "/user/paket-data" : "/paket-data", Icon: Wifi, tone: "bg-[#eaf6ff] text-[#1677d2]" },
    { label: "Token Listrik", href: userMode ? "/user/listrik/token" : "/listrik/token", Icon: Bolt, tone: "bg-[#fff5d8] text-[#e39a05]" },
    { label: "E-Wallet", href: userMode ? "/user/ewallet" : "/ewallet", Icon: WalletCards, tone: "bg-[#efe9ff] text-[#6548d9]" },
    { label: "Tagihan", href: userMode ? "/user/listrik/tagihan" : "/listrik/tagihan", Icon: FileText, tone: "bg-[#e6fbf4] text-[#1fad7a]" },
    { label: "Lainnya", href: categoryHref, Icon: Grid2X2, tone: "bg-[#eef2f6] text-[#718197]" },
  ];

  const activities = [
    { title: "Pembelian Pulsa", subtitle: "Telkomsel 50.000", amount: "- Rp 50.000", time: "Hari ini, 10:24", Icon: Smartphone, tone: "bg-[#e7f5ff] text-[#1680cf]" },
    { title: "Token Listrik", subtitle: "PLN 20.000", amount: "- Rp 20.000", time: "Kemarin, 18:41", Icon: Bolt, tone: "bg-[#e7faec] text-[#20aa63]" },
    { title: "Top Up DANA", subtitle: "via Virtual Account", amount: "- Rp 100.000", time: "12 Apr 2025, 14:30", Icon: WalletCards, tone: "bg-[#f0eaff] text-[#694ce1]" },
  ];

  return (
    <main className="min-h-svh bg-[#f5fbff] text-[#052656]">
      <div className="space-y-4 px-4 pb-4 pt-4">
        <section className="relative overflow-hidden rounded-[24px] bg-[#f9fdff] p-1">
          <div className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-[#fff2bf]" />
          <div className="pointer-events-none absolute -right-2 top-3 h-20 w-20 rounded-full bg-[#e5f3ff]" />
          <div className="relative flex items-start justify-between gap-3 px-1 pb-3">
            <div className="pt-2">
              <p className="text-[15px] font-semibold text-[#526f9c]">Halo,</p>
              <h1 className="text-[24px] font-black leading-tight text-[#062657]">Selamat datang kembali!</h1>
              <p className="mt-1 max-w-[270px] text-[13px] font-semibold leading-5 text-[#5c76a0]">
                Semua kebutuhan pembayaran, dalam satu aplikasi.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={transactionHref} prefetch={false} aria-label="Notifikasi" className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_8px_22px_rgba(9,42,89,0.10)]">
                <Bell className="h-5 w-5 text-[#062657]" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ff3e3e]" />
              </Link>
              <Link href={accountHref} prefetch={false} aria-label="Akun" className="grid h-11 w-11 place-items-center rounded-full bg-[#e5f0fb] shadow-[0_8px_22px_rgba(9,42,89,0.08)]">
                <UserRound className="h-6 w-6 text-[#0f4c80]" fill="currentColor" />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[18px] bg-[#006cad] p-5 text-white shadow-[0_18px_34px_rgba(0,77,136,0.25)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#00497f_0%,#087dc2_55%,#005b98_100%)]" />
          <div className="pointer-events-none absolute -right-12 top-8 h-40 w-52 rounded-full border border-white/12" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-44 w-56 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-[15px] font-bold text-white/78">
                  Saldo Utama
                </p>
                <p className="mt-2 text-[38px] font-black leading-none tracking-normal">Rp {money(250000)}</p>
                <p className="mt-2 text-[14px] font-semibold text-white/78">Aktif dan siap bertransaksi</p>
              </div>
              <Link href={topupHref} prefetch={false} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#ffcf4d] px-5 text-[14px] font-black text-[#062657] shadow-[0_10px_20px_rgba(7,38,88,0.18)]">
                <span className="text-lg leading-none">+</span>
                Top Up
              </Link>
            </div>

            <div className="my-5 h-px bg-white/30" />

            <div className="grid grid-cols-3 gap-4">
              <Link href={topupHref} prefetch={false} className="flex flex-col items-center gap-2">
                <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-white text-[#e49b06] shadow-lg">
                  <WalletCards className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <span className="text-[13px] font-black">Isi Saldo</span>
              </Link>
              <Link href={transferHref} prefetch={false} className="flex flex-col items-center gap-2">
                <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-white text-[#e49b06] shadow-lg">
                  <Send className="h-7 w-7" fill="currentColor" strokeWidth={1.8} />
                </span>
                <span className="text-[13px] font-black">Transfer</span>
              </Link>
              <Link href={transactionHref} prefetch={false} className="flex flex-col items-center gap-2">
                <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-white text-[#e49b06] shadow-lg">
                  <ReceiptText className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <span className="text-[13px] font-black">Riwayat</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[18px] border border-[#dfeaf4] bg-[linear-gradient(120deg,#ffffff_0%,#eef8ff_52%,#e3f4ff_100%)] p-5 shadow-[0_12px_28px_rgba(8,52,100,0.08)]">
          <div className="grid grid-cols-[1fr_128px] items-center gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#2f89d6]">Pulsa, Data & Pembayaran Digital</p>
              <h2 className="mt-2 text-[22px] font-black leading-[1.08] text-[#062657]">Semua Kebutuhan Dalam Satu Aplikasi</h2>
              <p className="mt-2 text-[13px] font-semibold leading-5 text-[#60789d]">Top up, bayar tagihan, dan transaksi harian jadi lebih mudah.</p>
              <Link href={categoryHref} prefetch={false} className="mt-4 inline-flex h-11 items-center gap-3 rounded-[14px] bg-[#ffcd4a] px-5 text-[14px] font-black text-[#062657] shadow-[0_10px_18px_rgba(225,151,0,0.18)]">
                Mulai Sekarang
                <ArrowRight className="h-5 w-5" strokeWidth={2.6} />
              </Link>
            </div>
            <div className="relative h-[154px]">
              <div className="absolute left-2 top-5 grid h-16 w-16 -rotate-12 place-items-center rounded-[18px] bg-[#238fe1] text-white shadow-xl">
                <Smartphone className="h-8 w-8" />
              </div>
              <div className="absolute right-7 top-0 grid h-16 w-16 rotate-6 place-items-center rounded-[18px] bg-white text-[#2478cf] shadow-xl">
                <Wifi className="h-8 w-8" />
              </div>
              <div className="absolute bottom-8 left-10 grid h-16 w-16 -rotate-6 place-items-center rounded-[18px] bg-[#32bf83] text-white shadow-xl">
                <WalletCards className="h-8 w-8" />
              </div>
              <div className="absolute bottom-10 right-0 grid h-16 w-16 rotate-12 place-items-center rounded-[18px] bg-[#ffc54c] text-white shadow-xl">
                <Bolt className="h-8 w-8" fill="currentColor" />
              </div>
              <span className="absolute bottom-0 right-2 text-right text-[17px] font-black italic leading-tight text-[#062657]">Praktis<br />Aman<br />Terpercaya</span>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#dfeaf4] bg-white p-4 shadow-[0_12px_28px_rgba(8,52,100,0.08)]">
          <SectionTitle title="Layanan Favorit" href={categoryHref} />
          <div className="mt-4 grid grid-cols-6 gap-2">
            {services.map((item) => (
              <ServiceTile key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[#dfeaf4] bg-white p-4 shadow-[0_12px_28px_rgba(8,52,100,0.08)]">
          <SectionTitle title="Aktivitas Terakhir" href={transactionHref} />
          <div className="mt-3 divide-y divide-[#e6eef6] rounded-[14px] border border-[#e3edf6] bg-white px-4">
            {activities.map(({ Icon, ...item }) => (
              <Link key={item.title} href={transactionHref} prefetch={false} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 py-3">
                <span className={`grid h-12 w-12 place-items-center rounded-full ${item.tone}`}>
                  <Icon className="h-6 w-6" strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-black text-[#062657]">{item.title}</span>
                  <span className="block truncate text-[13px] font-semibold text-[#60789d]">{item.subtitle}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[14px] font-black text-[#062657]">{item.amount}</span>
                  <span className="block text-[12px] font-semibold text-[#60789d]">{item.time}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[#f5df9f] bg-[linear-gradient(110deg,#fff8e5_0%,#fff1c7_100%)] p-4 shadow-[0_12px_28px_rgba(145,105,23,0.08)]">
          <div className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
            <span className="grid h-[72px] w-[72px] place-items-center rounded-[18px] bg-[#ffcf4d] text-[#075fa7] shadow-[0_12px_24px_rgba(214,144,0,0.20)]">
              <Gift className="h-10 w-10" strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-[#df8f00]">Promo Spesial</span>
              <span className="mt-1 block text-[20px] font-black leading-tight text-[#062657]">Cashback hingga <span className="text-[#e99700]">50%</span></span>
              <span className="mt-1 block text-[13px] font-semibold leading-5 text-[#60789d]">Untuk berbagai transaksi pilihan setiap minggu.</span>
            </span>
            <Link href={categoryHref} prefetch={false} aria-label="Lihat promo" className="grid h-11 w-11 place-items-center rounded-full bg-[#ffcd4a] text-[#062657] shadow-[0_10px_18px_rgba(225,151,0,0.18)]">
              <ArrowRight className="h-5 w-5" strokeWidth={2.7} />
            </Link>
          </div>
        </section>
      </div>

      <BottomNav
        homeHref={homeHref}
        transactionHref={transactionHref}
        balanceHref={balanceHref}
        accountHref={accountHref}
      />
    </main>
  );
}
