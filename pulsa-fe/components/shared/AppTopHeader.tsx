import Link from "next/link";
import { Headset } from "lucide-react";

type AppTopHeaderProps = {
  isLoggedIn?: boolean;
  userName?: string | null;
  saldo?: number | null;
  role?: string | null;
};

export function AppTopHeader({ isLoggedIn = false, userName, saldo, role }: AppTopHeaderProps) {
  const normalizedRole = String(role || "").trim().toLowerCase();
  const isRetailLoggedIn = isLoggedIn && (normalizedRole === "user" || normalizedRole === "agent" || normalizedRole === "master");
  const homeHref = isRetailLoggedIn ? "/user" : "/";
  void userName;
  void saldo;

  return (
    <header className="brand-app-header sticky top-0 z-30 overflow-hidden border-b border-[#f1c75d] bg-white/96 px-4 pb-3 pt-3 text-[#062657] shadow-[0_10px_28px_rgba(8,52,100,0.08)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(90deg,#f6c64d_0%,#ffe7a4_45%,#f6c64d_100%)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-[linear-gradient(110deg,transparent_0%,#edf7ff_100%)]" />

      <div className="relative flex h-[52px] items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            href={homeHref}
            prefetch={false}
            className="flex min-w-0 items-center gap-2.5"
            aria-label="Bayarivo"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-[linear-gradient(135deg,#e9fff2_0%,#ffffff_52%,#e8f6ff_100%)] shadow-[0_10px_24px_rgba(5,92,145,0.13)] ring-1 ring-[#d8eaf6]">
              <img src="/brand/icon.svg" alt="" width={40} height={40} className="h-10 w-10" />
            </span>
            <span className="min-w-0">
              <span className="block text-[23px] font-black leading-5 tracking-normal">
                <span className="brand-wordmark">Bayarivo</span>
              </span>
              <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.14em] text-[#4f6d91]">
                Urus Bayar, Lebih Jelas
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#d9e6f2] bg-white text-[#062657] shadow-[0_8px_18px_rgba(8,52,100,0.12)] transition hover:bg-[#f5fbff]"
            aria-label="Hubungi bantuan via WhatsApp"
          >
            <Headset className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </a>
        </div>
      </div>
    </header>
  );
}
