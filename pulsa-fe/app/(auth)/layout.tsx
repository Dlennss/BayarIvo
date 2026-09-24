export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[#163d52] text-slate-950">
      {children}
    </div>
  );
}
