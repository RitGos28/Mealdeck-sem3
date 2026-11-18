"use client";

import Link from "next/link";
import NotOfficial from "../layout/NotOfficial";
import { useState } from "react";
import AuthForm from "./AuthForm";
import Field from "./Field";
import StudentSignup from "./StudentSignup";

// initialMode "reset" opens straight on "Forgot password" (/login?mode=forgot).
export default function StudentAuth({ next, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
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
      {mode === "login" && (
        <>
          <AuthForm key="login" endpoint="/api/auth/student/login" submitLabel="Log in" redirectTo={next}>
            <Field label="Bennett email" name="email" type="email" autoComplete="email" required />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          </AuthForm>
          <button type="button" className="mt-3 w-full text-center text-sm font-semibold text-[#3f6b3a] hover:underline" onClick={() => setMode("reset")}>Forgot password?</button>
        </>
      )}
      {mode === "signup" && <StudentSignup key="signup" redirectTo={next} />}
      {mode === "reset" && <StudentSignup key="reset" reset redirectTo={next} onBack={() => setMode("login")} />}
      <p className="mt-5 text-center text-sm text-gray-500">Run a stall? <Link href="/vendor/login" className="font-semibold text-[#3f6b3a] hover:underline">Vendor login</Link></p>
      <p className="mt-2 text-center text-xs text-gray-500"><Link href="/privacy" className="hover:underline">How we use your details</Link></p>
      <NotOfficial className="mt-4 text-gray-500" />
    </>
  );
}
