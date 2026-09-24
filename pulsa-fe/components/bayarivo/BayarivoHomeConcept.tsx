import Link from "next/link";
import Image from "next/image";

const assetBase = "/bayarivo-assets";

type BayarivoHomeConceptProps = {
  userMode?: boolean;
  isLoggedIn?: boolean;
};

function appHref(userMode: boolean, guestHref: string, userHref: string, isLoggedIn = false) {
  if (userMode) {
    return userHref;
  }

  if (guestHref === "/login" && isLoggedIn) {
    return userHref;
  }

  return guestHref;
}

function Hotspot({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`absolute rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-[#f7bd20] focus-visible:ring-offset-2 ${className}`}
      prefetch={false}
    >
      <span className="sr-only">{label}</span>
    </Link>
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

  return (
    <main className="min-h-screen bg-[#f6fbff] text-[#052656]">
      <div className="mx-auto min-h-screen w-full max-w-[441px] bg-[#f7fbff] shadow-[0_24px_80px_rgba(4,57,104,0.14)]">
        <div className="pb-[calc(45px+env(safe-area-inset-bottom))]">
          <section className="relative">
            <Image
              src={`${assetBase}/09_section_blocks/top_block_with_balance.png`}
              alt="Bayarivo saldo utama"
              width={882}
              height={609}
              priority
              className="block h-auto w-full select-none"
              draggable={false}
            />
            <Hotspot href={accountHref} label="Buka akun" className="right-[4.8%] top-[3%] h-[9%] w-[12%]" />
            <Hotspot href={topupHref} label="Top up saldo" className="right-[8%] top-[48%] h-[9%] w-[23%]" />
            <Hotspot href={topupHref} label="Isi saldo" className="left-[12%] top-[74%] h-[14%] w-[16%]" />
            <Hotspot href={transferHref} label="Transfer saldo" className="left-[42%] top-[74%] h-[14%] w-[16%]" />
            <Hotspot href={transactionHref} label="Riwayat transaksi" className="right-[12%] top-[74%] h-[14%] w-[16%]" />
          </section>

          <section className="relative">
            <Image
              src={`${assetBase}/09_section_blocks/hero_plus_services.png`}
              alt="Pulsa, data, dan pembayaran digital Bayarivo"
              width={824}
              height={639}
              className="block h-auto w-full select-none"
              draggable={false}
            />
            <Hotspot href={categoryHref} label="Mulai transaksi" className="left-[8%] top-[33%] h-[9%] w-[31%]" />
            <Hotspot href={categoryHref} label="Lihat semua layanan" className="right-[6%] top-[53%] h-[8%] w-[25%]" />
            <Hotspot href={userMode ? "/user/pulsa-data" : "/pulsa-data"} label="Pulsa dan data" className="left-[6%] top-[71%] h-[21%] w-[13%]" />
            <Hotspot href={userMode ? "/user/paket-data" : "/paket-data"} label="Paket internet" className="left-[21%] top-[71%] h-[21%] w-[15%]" />
            <Hotspot href={userMode ? "/user/listrik/token" : "/listrik/token"} label="Token listrik" className="left-[39%] top-[71%] h-[21%] w-[14%]" />
            <Hotspot href={userMode ? "/user/ewallet" : "/ewallet"} label="E-Wallet" className="left-[55%] top-[71%] h-[21%] w-[14%]" />
            <Hotspot href={userMode ? "/user/listrik/tagihan" : "/listrik/tagihan"} label="Tagihan" className="left-[72%] top-[71%] h-[21%] w-[12%]" />
            <Hotspot href={categoryHref} label="Layanan lainnya" className="right-[6%] top-[71%] h-[21%] w-[12%]" />
          </section>

          <section className="relative">
            <Image
              src={`${assetBase}/09_section_blocks/activities_plus_promo.png`}
              alt="Aktivitas terakhir dan promo spesial Bayarivo"
              width={822}
              height={480}
              className="block h-auto w-full select-none"
              draggable={false}
            />
            <Hotspot href={transactionHref} label="Lihat semua aktivitas" className="right-[6%] top-[4%] h-[10%] w-[26%]" />
            <Hotspot href={transactionHref} label="Detail pembelian pulsa" className="left-[6%] top-[17%] h-[15%] w-[88%]" />
            <Hotspot href={transactionHref} label="Detail token listrik" className="left-[6%] top-[34%] h-[15%] w-[88%]" />
            <Hotspot href={transactionHref} label="Detail top up DANA" className="left-[6%] top-[51%] h-[15%] w-[88%]" />
            <Hotspot href={categoryHref} label="Lihat promo" className="right-[7%] bottom-[9%] h-[14%] w-[24%]" />
          </section>
        </div>

        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[441px] -translate-x-1/2 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_40px_rgba(4,57,104,0.10)]">
          <div className="relative">
            <Image
              src={`${assetBase}/08_bottom_nav/bottom_nav_full.png`}
              alt="Navigasi Bayarivo"
              width={882}
              height={90}
              className="block h-auto w-full select-none"
              draggable={false}
            />
            <Hotspot href={homeHref} label="Beranda" className="left-[6%] top-[10%] h-[80%] w-[18%]" />
            <Hotspot href={transactionHref} label="Riwayat" className="left-[31%] top-[10%] h-[80%] w-[14%]" />
            <Hotspot href={balanceHref} label="Saldo" className="left-[57%] top-[10%] h-[80%] w-[12%]" />
            <Hotspot href={accountHref} label="Akun" className="right-[7%] top-[10%] h-[80%] w-[13%]" />
          </div>
        </nav>
      </div>
    </main>
  );
}
