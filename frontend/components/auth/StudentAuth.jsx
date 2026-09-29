"use client";

import Link from "next/link";
import { useState } from "react";
import AuthForm from "./AuthForm";
import Field from "./Field";

export default function StudentAuth({ next }) {
  const [mode, setMode] = useState("login");
  const tab = (value, label) => (
    <button
      type="button"
      className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === value ? "bg-white shadow-sm" : "text-gray-500"}`}
      onClick={() => setMode(value)}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="mb-5 flex gap-1 rounded-xl bg-[#f4f6f2] p-1">{tab("login", "Log in")}{tab("signup", "Sign up")}</div>
      {mode === "login" ? (
        <AuthForm key="login" endpoint="/api/auth/student/login" submitLabel="Log in" redirectTo={next}>
          <Field label="Bennett email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        </AuthForm>
      ) : (
        <AuthForm key="signup" endpoint="/api/auth/student/signup" submitLabel="Create account" redirectTo={next}>
          <Field label="Name" name="name" autoComplete="name" required />
          <Field label="Bennett email" name="email" type="email" autoComplete="email" hint="Must end in @bennett.edu.in" required />
          <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={6} hint="At least 6 characters" required />
          <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required />
        </AuthForm>
      )}
      <p className="mt-5 text-center text-sm text-gray-500">Run a stall? <Link href="/vendor/login" className="font-semibold text-[#3f6b3a] hover:underline">Vendor login</Link></p>
    </>
  );
}
