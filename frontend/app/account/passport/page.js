import PassportPage from "../../../components/student/passport/PassportPage";

export const metadata = { title: "Food passport · MealDeck" };

export default async function Page({ searchParams }) {
  const { stall } = await searchParams;
  return <PassportPage stallId={stall ?? null} />;
}
