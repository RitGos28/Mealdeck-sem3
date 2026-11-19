import { connection } from "next/server";
import Header from "../../components/layout/Header";
import NotOfficial from "../../components/layout/NotOfficial";
import DemoMessDownloads from "./DemoMessDownloads";
import { campusWeekday } from "../../lib/messScreenshot";

export const metadata = { title: "Sample mess screenshots · MealDeck" };

// Demo builds only: sample MyCamu-style screenshots (marked DEMO) that a
// visitor without MyCamu can save and feed to Mess → Fill from MyCamu
// screenshots. Made by showcase/tools/make_mess_screens.py.
export default async function DemoMess() {
  await connection(); // today's weekday, worked out per request
  const demo = process.env.NEXT_PUBLIC_DEMO_GUEST === "1";
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-16 sm:px-6">
        <h1 className="font-display mb-1 text-3xl font-bold tracking-tight">Sample mess screenshots</h1>
        {demo ? <DemoMessDownloads today={campusWeekday()} /> : <p className="text-gray-600">These are only on the demo, at demo.mealdeck.in/demo-mess.</p>}
        <NotOfficial />
      </main>
    </>
  );
}
