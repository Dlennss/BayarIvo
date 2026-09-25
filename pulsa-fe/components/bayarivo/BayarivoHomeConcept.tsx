import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bolt,
  Clock3,
  FileText,
  Gift,
  Grid2X2,
  Home,
  ReceiptText,
  Send,
  Smartphone,
  UserRound,
  WalletCards,
  Wifi,
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

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[18px] font-black leading-none text-[#062657]">{title}</h2>
      {href ? (
        <Link href={href} prefetch={false} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-black text-[#006fc4]">
          Lihat Semua
          <ArrowRight className="h-4 w-4" strokeWidth={2.7} />
        </Link>
      ) : null}
    </div>
  );
}

function ServiceTile({ item }: { item: ServiceItem }) {
  const { Icon } = item;

  return (
    <Link href={item.href} prefetch={false} className="group min-w-0 rounded-[16px] p-1 text-center transition hover:bg-[#f6fbff]">
      <span className={`mx-auto grid h-[58px] w-[58px] place-items-center rounded-[17px] ${item.tone} shadow-[0_12px_22px_rgba(7,44,92,0.08)] transition group-hover:-translate-y-0.5`}>
        <Icon className="h-7 w-7" strokeWidth={2.35} />
      </span>
      <span className="mt-2 block min-h-8 text-[11px] font-black leading-tight text-[#08295a]">{item.label}</span>
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
  const itemClass = "flex min-w-0 flex-col items-center gap-1 py-1 text-[#7a8fad] visited:text-[#7a8fad]";

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-[#dce8f3] bg-white/95 px-5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(9,42,89,0.12)] backdrop-blur-xl md:w-97.5">
      <div className="grid grid-cols-4">
        <Link href={homeHref} prefetch={false} className="flex min-w-0 flex-col items-center gap-1 py-1 text-[#0075bf] visited:text-[#0075bf]">
          <span className="grid h-9 min-w-[58px] place-items-center rounded-[14px] bg-[#e8f5ff] shadow-[inset_0_0_0_1px_rgba(0,117,191,0.06)]">
            <Home className="h-5 w-5" fill="currentColor" strokeWidth={2.2} />
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
    { label: "Paket Internet", href: userMode ? "/user/paket-data" : "/paket-data", Icon: Wifi, tone: "bg-[#e8f5ff] text-[#1677d2]" },
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
    <main className="min-h-svh bg-[#eef7fb] text-[#052656]">
      <div className="space-y-4 px-4 pb-4 pt-4">
        <section className="relative overflow-hidden rounded-[22px] bg-[#045a92] p-5 text-white shadow-[0_20px_38px_rgba(0,77,136,0.27)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#04395f_0%,#087ec3_58%,#004e83_100%)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(130deg,transparent_0%,rgba(255,255,255,0.12)_100%)]" />
          <div className="pointer-events-none absolute -right-12 bottom-4 h-28 w-44 rotate-[-18deg] rounded-[30px] border border-white/14" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-white/78">Saldo Utama</p>
                <p className="mt-2 text-[39px] font-black leading-none">Rp {rupiah(250000)}</p>
                <p className="mt-2 text-[13px] font-semibold text-white/78">Aktif dan siap bertransaksi</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white/85 ring-1 ring-white/15 backdrop-blur">
                <Bell className="h-6 w-6" strokeWidth={2.3} />
              </span>
            </div>

            <div className="my-5 h-px bg-white/25" />

            <div className="grid grid-cols-3 gap-3">
              <Link href={topupHref} prefetch={false} className="rounded-[18px] bg-white/10 px-2 py-3 text-center ring-1 ring-white/12 backdrop-blur transition hover:bg-white/15">
                <span className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-white text-[#e49b06] shadow-[0_10px_18px_rgba(4,40,70,0.18)]">
                  <WalletCards className="h-6 w-6" strokeWidth={2.35} />
                </span>
                <span className="mt-2 block text-[12px] font-black leading-none">Isi Saldo</span>
              </Link>
              <Link href={transferHref} prefetch={false} className="rounded-[18px] bg-white/10 px-2 py-3 text-center ring-1 ring-white/12 backdrop-blur transition hover:bg-white/15">
                <span className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-white text-[#e49b06] shadow-[0_10px_18px_rgba(4,40,70,0.18)]">
                  <Send className="h-6 w-6" fill="currentColor" strokeWidth={1.7} />
                </span>
                <span className="mt-2 block text-[12px] font-black leading-none">Transfer</span>
              </Link>
              <Link href={transactionHref} prefetch={false} className="rounded-[18px] bg-white/10 px-2 py-3 text-center ring-1 ring-white/12 backdrop-blur transition hover:bg-white/15">
                <span className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-white text-[#e49b06] shadow-[0_10px_18px_rgba(4,40,70,0.18)]">
                  <ReceiptText className="h-6 w-6" strokeWidth={2.35} />
                </span>
                <span className="mt-2 block text-[12px] font-black leading-none">Riwayat</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-[#dfeaf4] bg-white p-5 shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
          <div className="grid grid-cols-[1fr_106px] items-center gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#2f89d6]">Pulsa, Data & Pembayaran</p>
              <h2 className="mt-2 text-[22px] font-black leading-[1.08] text-[#062657]">Semua Kebutuhan Dalam Satu Aplikasi</h2>
              <p className="mt-2 text-[13px] font-semibold leading-5 text-[#60789d]">Top up dan bayar tagihan harian jadi lebih mudah.</p>
              <Link href={categoryHref} prefetch={false} className="mt-4 inline-flex h-11 items-center gap-3 rounded-[14px] bg-[#ffcd4a] px-5 text-[14px] font-black text-[#062657] shadow-[0_10px_18px_rgba(225,151,0,0.18)]">
                Mulai Sekarang
                <ArrowRight className="h-5 w-5" strokeWidth={2.6} />
              </Link>
            </div>
            <div className="relative h-[146px]">
              <span className="absolute left-0 top-7 grid h-[60px] w-[60px] -rotate-12 place-items-center rounded-[18px] bg-[#238fe1] text-white shadow-xl">
                <Smartphone className="h-7 w-7" />
              </span>
              <span className="absolute right-1 top-0 grid h-[60px] w-[60px] rotate-6 place-items-center rounded-[18px] bg-[#edf8ff] text-[#2478cf] shadow-xl">
                <Wifi className="h-7 w-7" />
              </span>
              <span className="absolute bottom-5 left-5 grid h-[60px] w-[60px] -rotate-6 place-items-center rounded-[18px] bg-[#32bf83] text-white shadow-xl">
                <WalletCards className="h-7 w-7" />
              </span>
              <span className="absolute bottom-2 right-0 grid h-[60px] w-[60px] rotate-12 place-items-center rounded-[18px] bg-[#ffc54c] text-white shadow-xl">
                <Bolt className="h-7 w-7" fill="currentColor" />
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#dfeaf4] bg-white p-4 shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
          <SectionHeader title="Layanan Favorit" href={categoryHref} />
          <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3">
            {services.map((item) => (
              <ServiceTile key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[#dfeaf4] bg-white p-4 shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
          <SectionHeader title="Aktivitas Terakhir" href={transactionHref} />
          <div className="mt-3 divide-y divide-[#e6eef6] rounded-[17px] border border-[#e3edf6] bg-[#fbfdff] px-3">
            {activities.map(({ Icon, ...item }) => (
              <Link key={item.title} href={transactionHref} prefetch={false} className="grid grid-cols-[46px_1fr_auto] items-center gap-3 py-3">
                <span className={`grid h-11 w-11 place-items-center rounded-full ${item.tone}`}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-black text-[#062657]">{item.title}</span>
                  <span className="block truncate text-[12px] font-semibold text-[#60789d]">{item.subtitle}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[13px] font-black text-[#062657]">{item.amount}</span>
                  <span className="block text-[11px] font-semibold text-[#60789d]">{item.time}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[#f5df9f] bg-[linear-gradient(110deg,#fff8e5_0%,#fff1c7_100%)] p-4 shadow-[0_14px_30px_rgba(145,105,23,0.08)]">
          <div className="grid grid-cols-[62px_1fr_auto] items-center gap-3">
            <span className="grid h-[62px] w-[62px] place-items-center rounded-[18px] bg-[#ffcf4d] text-[#075fa7] shadow-[0_12px_24px_rgba(214,144,0,0.20)]">
              <Gift className="h-8 w-8" strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#df8f00]">Promo Spesial</span>
              <span className="mt-1 block text-[19px] font-black leading-tight text-[#062657]">Cashback hingga <span className="text-[#e99700]">50%</span></span>
              <span className="mt-1 block text-[12px] font-semibold leading-5 text-[#60789d]">Untuk transaksi pilihan setiap minggu.</span>
            </span>
            <Link href={categoryHref} prefetch={false} aria-label="Lihat promo" className="grid h-10 w-10 place-items-center rounded-full bg-[#ffcd4a] text-[#062657] shadow-[0_10px_18px_rgba(225,151,0,0.18)]">
              <ArrowRight className="h-5 w-5" strokeWidth={2.7} />
            </Link>
          </div>
        </section>
      </div>

      <BottomNav homeHref={homeHref} transactionHref={transactionHref} balanceHref={balanceHref} accountHref={accountHref} />
    </main>
  );
}
