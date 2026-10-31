import Link from "next/link";
import Header from "../../components/layout/Header";

export const metadata = { title: "Privacy · MealDeck" };

const CONTACT = "ritwik@mealdeck.in";

// Plain-language note on what MealDeck keeps about students and who sees it.
// Keep it in step with the code: if a new field is stored or shown to
// someone new, say so here.
function Section({ title, children }) {
  return (
    <section className="mb-7">
      <h2 className="font-display mb-2 text-lg font-bold">{title}</h2>
      <div className="space-y-2 text-gray-700">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-16 sm:px-6">
        <h1 className="font-display mb-1 text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mb-8 text-gray-500">What MealDeck keeps about you, why, and who can see it.</p>

        <Section title="What we keep">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="font-semibold">Your Bennett email</span>, to log you in and to email you sign-up and password-reset codes.</li>
            <li><span className="font-semibold">Your name</span>, and <span className="font-semibold">your phone number</span> if you give one (it&apos;s optional), so a stall knows whose order it is and can reach you about it.</li>
            <li><span className="font-semibold">Your password</span>, stored only as a one-way hash. Nobody, including us, can read it.</li>
            <li><span className="font-semibold">Your orders</span>: the stall, items, prices, pickup time and status.</li>
            <li><span className="font-semibold">Out-of-stock reports</span> you make, so one student can&apos;t hide an item on their own.</li>
          </ul>
          <p>We don&apos;t take payments online, so we never see card or UPI details. You pay the stall in person.</p>
        </Section>

        <Section title="Who sees it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="font-semibold">The stall you order from</span> sees your name and your phone number (or your email, if you didn&apos;t give a phone number) on that order. Stalls never see your orders at other stalls.</li>
            <li><span className="font-semibold">MealDeck admins</span> can see accounts and orders, to run the service and sort out problems.</li>
            <li><span className="font-semibold">Other students</span> see nothing about you. The live queue shows order numbers and status only, and nobody can see who reported an item.</li>
          </ul>
          <p>We don&apos;t sell your data, show ads, or use tracking or analytics tools.</p>
        </Section>

        <Section title="Services we use">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="font-semibold">Resend</span> sends the emails with your codes, so it receives your email address and the code.</li>
            <li><span className="font-semibold">Cloudflare</span> sits in front of the site for security and HTTPS, so your visits pass through it.</li>
          </ul>
        </Section>

        <Section title="Cookies and your browser">
          <p>One cookie keeps you logged in; it ends when you log out or after 30 minutes without using the site. Your bag is kept in this browser tab until you close it. Nothing is used to track you across other sites.</p>
        </Section>

        <Section title="Keeping and deleting it">
          <p>Your account stays until you delete it. Delete it yourself from <strong>Account → Delete my account</strong>: it&apos;s deleted for good 24 hours later, and you can cancel until then. The steps are at <Link href="/account/deletion" className="font-semibold text-[#3f6b3a] hover:underline">mealdeck.in/account/deletion</Link>. Or email <a href={`mailto:${CONTACT}`} className="font-semibold text-[#3f6b3a] hover:underline">{CONTACT}</a> from your Bennett address, which is also the address for any question about your data.</p>
          <p>Deleting your account removes your login, your account details, your Food passport and your reports. Orders you already placed stay in the stall&apos;s order history so its records still add up, but anonymised: your name and contact are removed from them.</p>
        </Section>

        <Link href="/" className="text-sm font-semibold text-[#3f6b3a] hover:underline">← Back to menu</Link>
      </main>
    </>
  );
}
