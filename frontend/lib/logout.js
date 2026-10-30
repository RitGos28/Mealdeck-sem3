import { api } from "./api";

// Ends the session and sends each role back to its own login page.
export async function logout(router, role) {
  await api("/api/auth/logout", { method: "POST" });
  router.push(role === "VENDOR" ? "/vendor/login" : role === "ADMIN" ? "/admin/login" : "/");
  router.refresh();
}
