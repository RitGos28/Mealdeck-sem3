import Header from "../layout/Header";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md px-6 py-10">
        <div className="rounded-2xl border border-[#e5e7e0] bg-white p-6 shadow-sm">
          <h1 className="font-display mb-1 text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mb-6 text-sm text-gray-500">{subtitle}</p>}
          {children}
        </div>
      </main>
    </>
  );
}
