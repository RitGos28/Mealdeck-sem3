"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

// undefined while loading, null when logged out, else { role, email, stallId }.
export function useCurrentUser() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let active = true;
    api("/api/auth/me")
      .then((me) => active && setUser(me?.role ? me : null))
      .catch(() => active && setUser(null));
    return () => {
      active = false;
    };
  }, []);

  return [user, setUser];
}
