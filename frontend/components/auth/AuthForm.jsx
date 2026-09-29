"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

// Posts the form's fields as JSON to `endpoint`; on success the backend has
// set the session cookie, so just navigate on.
export default function AuthForm({ endpoint, submitLabel, redirectTo, children }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api(endpoint, { method: "POST", body: Object.fromEntries(new FormData(event.currentTarget)) });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {children}
      {error && <p className="rounded-xl bg-[#fbe9e7] px-3.5 py-2.5 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
      <button className="rounded-xl bg-[#0f2419] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3827] disabled:opacity-60" disabled={submitting}>
        {submitting ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
