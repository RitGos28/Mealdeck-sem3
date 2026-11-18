"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import AuthForm from "./AuthForm";
import Field from "./Field";

// Admins have no password on the live site: each login is a 6-digit code
// emailed to the admin's real inbox. Local demo runs still accept the
// demo password (the server refuses it everywhere else).
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // email | code | password
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  async function sendCode(event) {
    event?.preventDefault();
    setSending(true);
    setError(null);
    try {
      const { message } = await api("/api/auth/admin/login/code", { method: "POST", body: { email } });
      setNotice(message);
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (step === "email") {
    return (
      <form className="flex flex-col gap-4" onSubmit={sendCode}>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#315c3d]">
          Admin email
          <input className="rounded-xl border border-[#d8e2d5] px-3.5 py-3 text-base font-normal text-ink outline-none focus:border-[#477355] focus:ring-2 focus:ring-[#dbead6]" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="rounded-xl bg-[#fbe9e7] px-3.5 py-2.5 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
        <button className="rounded-xl bg-[#0f2419] py-3 text-sm font-semibold text-white hover:bg-[#1a3827] disabled:opacity-60" disabled={sending}>
          {sending ? "Sending…" : "Email me a code"}
        </button>
        <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setStep("password")}>Local demo: use a password</button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {step === "code" && notice && <p className="rounded-xl bg-[#eef6ea] px-3.5 py-2.5 text-sm text-[#315c3d]" role="status">{notice}</p>}
      <AuthForm endpoint="/api/auth/admin/login" submitLabel="Log in" redirectTo="/admin">
        {step === "code" ? (
          <>
            <input type="hidden" name="email" value={email} />
            <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
          </>
        ) : (
          <>
            <Field label="Email" name="email" type="email" autoComplete="username" required defaultValue={email} />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          </>
        )}
      </AuthForm>
      <div className="flex justify-between text-xs text-gray-500">
        <button type="button" className="hover:underline" onClick={() => { setStep("email"); setNotice(null); setError(null); }}>Use a different email</button>
        {step === "code" && <button type="button" className="hover:underline disabled:opacity-60" disabled={sending} onClick={sendCode}>{sending ? "Sending…" : "Send a new code"}</button>}
      </div>
      {error && <p className="rounded-xl bg-[#fbe9e7] px-3.5 py-2.5 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
    </div>
  );
}
