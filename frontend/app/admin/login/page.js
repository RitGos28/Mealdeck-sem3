import AuthCard from "../../../components/auth/AuthCard";
import AdminLogin from "../../../components/auth/AdminLogin";

export const metadata = { title: "Admin login · MealDeck" };

export default function AdminLoginPage() {
  return (
    <AuthCard title="Admin login" subtitle="We email a one-time code to the admin's inbox. There's no admin password.">
      <AdminLogin />
    </AuthCard>
  );
}
