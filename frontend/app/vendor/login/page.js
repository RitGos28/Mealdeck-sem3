import AuthCard from "../../../components/auth/AuthCard";
import AuthForm from "../../../components/auth/AuthForm";
import Field from "../../../components/auth/Field";

export const metadata = { title: "Vendor login · MealDeck" };

export default function VendorLoginPage() {
  return (
    <AuthCard title="Vendor login" subtitle="See and manage today's pre-orders for your stall.">
      <AuthForm endpoint="/api/auth/vendor/login" submitLabel="Log in" redirectTo="/vendor">
        <Field label="Email" name="email" type="email" autoComplete="username" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      </AuthForm>
    </AuthCard>
  );
}
