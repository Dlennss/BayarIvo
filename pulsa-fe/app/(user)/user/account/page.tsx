import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  ChevronRight,
  FileText,
  HelpCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import { getAppServerSession } from "@/lib/server-auth";
import { getUserProfile } from "@/lib/api.auth";
import { getInitials } from "@/components/user/helpers";
import type { UserSession } from "@/components/user/types";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { UserLogoutButton } from "@/components/user/UserLogoutButton";
import { UserProfilePhotoUploader } from "@/components/user/UserProfilePhotoUploader";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();
  return ["analyst", "operator", "operator kredit", "operator_kredit", "operator_credit", "operator-credit"].includes(value) ? "analis" : value;
}

function panelPathByRole(role: string) {
  if (role === "admin" || role === "staff") return "/dashboard/admin";
  if (role === "auditor") return "/dashboard/auditor";
  if (role === "member" || role === "agent_member" || role === "master_member") return "/dashboard/member";
  if (role === "analis") return "/dashboard/master/operator";
  if (role === "master" || role === "marketing") return "/dashboard/master";
  if (role === "operator_trx") return "/dashboard/operator";
  if (role === "operator_wallet") return "/dashboard/wallet";
  return "/user";
}

function panelDescriptionByRole(role: string) {
  if (role === "admin" || role === "staff") return "Masuk ke panel admin";
  if (role === "auditor") return "Masuk ke panel audit";
  if (role === "analis") return "Masuk ke panel operator kredit";
  if (role === "marketing") return "Menu kerja marketing tersedia di Akun";
  if (role === "master") return "Masuk ke panel master";
  if (role === "operator_trx") return "Masuk ke panel transaksi";
  if (role === "operator_wallet") return "Masuk ke panel wallet";
  if (role === "member" || role === "agent_member" || role === "master_member") return "Masuk ke panel H2H";
  return "Masuk ke aplikasi agent";
}

export default async function UserAccountPage() {
  const session = (await getAppServerSession()) as SessionShape | null;

  if (!session?.backendToken) {
    redirect("/login");
  }

  const user = session.user ?? null;
  const profile = session.backendToken ? await getUserProfile(session.backendToken) : null;
  const displayName = profile?.nama || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "-";
  const profileWithPhone = profile as typeof profile & { phone?: string; no_hp?: string; nomor_hp?: string; telepon?: string };
  const phone = profileWithPhone?.phone || profileWithPhone?.no_hp || profileWithPhone?.nomor_hp || profileWithPhone?.telepon || "-";
  const username = displayEmail !== "-" ? `@${displayEmail.split("@")[0]}` : "@pulsakilat";
  const initials = getInitials(displayName, displayEmail);
  const profilePhotoURL = profile?.profile_photo_url || user?.image || "";
  const role = normalizeRole(profile?.role || user?.role);
  const canManageRetailNetwork = role === "master" || role === "agent";
  const canOpenWorkPanel = role !== "user" && role !== "agent" && role !== "marketing";

  const personalItems = [
    {
      label: "Nama lengkap",
      value: displayName,
      icon: UserRound,
    },
    {
      label: "Nomor handphone",
      value: phone,
      icon: Phone,
    },
    {
      label: "Email / Gmail",
      value: displayEmail,
      icon: Mail,
    },
  ];

  const settingItems = [
    ...(role === "marketing"
      ? [
          { href: "/user/account/tambah-agent", label: "Tambah Agent", desc: "Daftarkan agent baru dari lapangan", icon: UserPlus },
          { href: "/user/account/pengajuan-agent", label: "Pengajuan & Dokumen", desc: "Pantau dokumen pengajuan agent", icon: ClipboardList },
          { href: "/user/account/agent-binaan", label: "Agent Binaan", desc: "Lihat saldo dan aktivitas agent", icon: UsersRound },
        ]
      : []),
    ...(canOpenWorkPanel
      ? [
          {
            href: panelPathByRole(role),
            label: "Panel",
            desc: panelDescriptionByRole(role),
            icon: BriefcaseBusiness,
          },
        ]
      : []),
    ...(canManageRetailNetwork
      ? [
          {
            href: "/user/account/downline",
            label: role === "agent" ? "Tambah Member" : "Jaringan Retail",
            desc: role === "master" ? "Kelola agent dan user bawahan" : "Tambahkan member/user bawahan",
            icon: UsersRound,
          },
        ]
      : []),
    ...(role !== "marketing"
      ? [
          {
            href: "/user/account/security",
            label: "Keamanan Akun",
            desc: "Ganti password akun",
            icon: LockKeyhole,
          },
          {
            href: "/user/account",
            label: "Notifikasi",
            desc: "Atur informasi transaksi",
            icon: Bell,
          },
          {
            href: "/user/account",
            label: "Pusat Bantuan",
            desc: "FAQ dan layanan pelanggan",
            icon: HelpCircle,
          },
        ]
      : []),
    {
      href: "/kebijakan-privasi?from=account",
      label: "Syarat & Kebijakan",
      desc: "Ketentuan penggunaan Bayarivo",
      icon: FileText,
    },
  ];

  return (
    <main className="min-h-screen bg-[#eef7fb] pb-24 text-[#052656]">
      <section className="relative overflow-hidden rounded-b-[32px] bg-[#045a92] px-4 pb-8 pt-7 text-white shadow-[0_20px_44px_rgba(0,77,136,0.24)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#04395f_0%,#087ec3_58%,#004e83_100%)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(130deg,transparent_0%,rgba(255,255,255,0.12)_100%)]" />
        <div className="pointer-events-none absolute -right-12 bottom-4 h-28 w-44 rotate-[-18deg] rounded-[30px] border border-white/14" />
        <div className="relative mx-auto flex w-full max-w-md flex-col items-center text-center">
          <UserProfilePhotoUploader
            name={displayName}
            email={displayEmail}
            phone={phone}
            initials={initials}
            profilePhotoURL={profilePhotoURL}
          />
          <h1 className="mt-4 max-w-full truncate text-lg font-black tracking-tight">{displayName}</h1>
          <p className="mt-0.5 max-w-full truncate text-[11px] font-bold text-white/75">{username}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black text-white ring-1 ring-white/15 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
            Akun Bayarivo aktif
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-4 w-full max-w-md space-y-3.5 px-4">
        <section className="overflow-hidden rounded-[22px] border border-[#dfeaf4] bg-white shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <h2 className="text-sm font-black text-[#08295a]">Informasi Pribadi</h2>
            <Link href="/user/account/edit" className="rounded-full bg-[#eef7ff] px-3 py-1 text-[10px] font-black text-[#0875be]">Edit</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {personalItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e8f5ff] text-[#0875be]">
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-[#7f91ad]">{item.label}</p>
                    <p className="mt-0.5 truncate text-xs font-black text-[#08295a]">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-[#dfeaf4] bg-white shadow-[0_14px_30px_rgba(8,52,100,0.08)]">
          <div className="divide-y divide-slate-100">
            {settingItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f6fbff]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f0f7ff] text-[#0875be]">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-[#08295a]">{item.label}</span>
                    <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#6f83a2]">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8ba0bd]" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-[18px] border border-rose-200 bg-white p-3 shadow-[0_10px_24px_rgba(8,52,100,0.05)]">
          <UserLogoutButton className="h-12 w-full rounded-2xl border border-rose-200 bg-white text-xs font-black text-rose-600 shadow-none hover:bg-rose-50 hover:text-rose-700" />
        </section>

        <p className="pt-2 text-center text-[10px] font-semibold text-[#8ba0bd]">Bayarivo versi 1.0.0</p>
      </div>

      <UserBottomNav />
    </main>
  );
}
