"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import Field from "./Field";

const RESEND_SECONDS = 60;
const errorClass = "rounded-xl bg-[#fbe9e7] px-3.5 py-2.5 text-sm text-[#9a4a3f]";
const buttonClass = "rounded-xl bg-[#0f2419] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3827] disabled:opacity-60";

// Two steps: the Bennett address gets a 6-digit code by email (checked for
// @bennett.edu.in before anything is sent), then the code plus account
// details create the account and log the student in.
export default function StudentSignup({ redirectTo }) {
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(address) {
    setBusy(true);
    setError(null);
    try {
      const { message } = await api("/api/auth/student/signup/code", { method: "POST", body: { email: address } });
      setEmail(address.trim().toLowerCase());
      setNotice(message);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function createAccount(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/student/signup", { method: "POST", body: { ...Object.fromEntries(new FormData(event.currentTarget)), email } });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!email) {
    return (
      <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); sendCode(new FormData(event.currentTarget).get("email")); }}>
        <Field label="Bennett email" name="email" type="email" autoComplete="email" pattern=".+@bennett\.edu\.in" title="Use your @bennett.edu.in address" hint="We'll email you a 6-digit code to confirm it's yours" required />
        {error && <p className={errorClass} role="alert">{error}</p>}
        <button className={buttonClass} disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={createAccount}>
      <div className="rounded-xl bg-[#f5faf3] px-3.5 py-2.5 text-sm text-[#3f6b3a]">
        {notice}
        <span className="mt-1 block font-semibold">{email}</span>
      </div>
      <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} title="The 6 digits from the email" required autoFocus />
      <Field label="Name" name="name" autoComplete="name" required />
      <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
      <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={6} hint="At least 6 characters" required />
      <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required />
      {error && <p className={errorClass} role="alert">{error}</p>}
      <button className={buttonClass} disabled={busy}>{busy ? "Please wait…" : "Create account"}</button>
      <div className="flex justify-between text-sm">
        <button type="button" className="font-semibold text-gray-500 hover:text-[#12180f]" onClick={() => { setEmail(null); setError(null); }}>← Different email</button>
        <button type="button" className="font-semibold text-[#3f6b3a] hover:underline disabled:text-gray-400 disabled:no-underline" disabled={busy || cooldown > 0} onClick={() => sendCode(email)}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
