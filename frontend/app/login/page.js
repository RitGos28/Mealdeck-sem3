import AuthCard from "../../components/auth/AuthCard";
import StudentAuth from "../../components/auth/StudentAuth";

export const metadata = { title: "Log in · MealDeck" };

// Only same-site paths, so ?next= can't bounce someone to another site.
function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Student login" subtitle="Log in with your Bennett email to report stock and place pre-orders.">
      <StudentAuth next={safeNext(next)} />
    </AuthCard>
  );
}
