import AuthCard from "../../../components/auth/AuthCard";
import AuthForm from "../../../components/auth/AuthForm";
import Field from "../../../components/auth/Field";

export const metadata = { title: "Admin login · MealDeck" };

export default function AdminLoginPage() {
  return (
    <AuthCard title="Admin login" subtitle="Manage stalls, menus, vendors, and student accounts.">
      <AuthForm endpoint="/api/auth/admin/login" submitLabel="Log in" redirectTo="/admin">
        <Field label="Email" name="email" type="email" autoComplete="username" required />
        <Field label="Pasword" name="password" type="password" autoComplete="current-password" required />
      </AuthForm>
    </AuthCard>
  );
}
  