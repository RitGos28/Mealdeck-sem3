import Link from "next/link";
import Header from "../../components/layout/Header";
import NotOfficial from "../../components/layout/NotOfficial";

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
            <li><span className="font-semibold">Your Bennett email</span>, to log you in, to email you sign-up and password-reset codes, and to email you a notice if you ask to delete your account.</li>
            <li><span className="font-semibold">Your name</span>, and <span className="font-semibold">your phone number</span> if you give one (it&apos;s optional), so a stall knows whose order it is and can reach you about it.</li>
            <li><span className="font-semibold">Your password</span>, stored only as a one-way hash. Nobody, including us, can read it.</li>
            <li><span className="font-semibold">Your orders</span>: the stall, items, prices, pickup time and status.</li>
            <li><span className="font-semibold">Out-of-stock reports</span> you make, so one student can&apos;t hide an item on their own.</li>
            <li><span className="font-semibold">Your answers to the questionnaire</span> in Account, if you answer it: where you heard of us, where you stay (hostel or day scholar), how often you buy campus food, which parts of MealDeck you have used, how waits and pre-ordering would affect you, and what you would change. Every question is optional and you can change your answers. Admins see totals and your written words without your name, and your answers are removed if you delete your account.</li>
            <li><span className="font-semibold">&ldquo;Want to pre-order here?&rdquo; taps</span>: which menu-only stalls you said you would pre-order at. They are counted per stall and shown to admins, to show a stall how many students asked. Tap again to take one back; they are removed if you delete your account.</li>
            <li><span className="font-semibold">Mess menus you add, and &ldquo;this isn&apos;t correct&rdquo; flags</span> on the Mess today page. Other students see a menu as added by &ldquo;a student&rdquo;, never your name. Your flags are removed at the end of the day, and a menu you added stays for everyone without your number if you delete your account.</li>
            <li><span className="font-semibold">Your &ldquo;I only eat veg&rdquo; setting</span>, if you turn it on in Account. It only changes what the menu, Deal me a dish and your passport suggestions show first; you can still order anything.</li>
          </ul>
          <p>We don&apos;t take payments online, so we never see card or UPI details. You pay the stall in person.</p>
        </Section>

        <Section title="Who sees it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="font-semibold">The stall you order from</span> sees your name and your phone number (or your email, if you didn&apos;t give a phone number) on that order, plus your hostel and room if you filled that in. Stalls never see your orders at other stalls, only a count of recent uncollected pre-orders.</li>
            <li><span className="font-semibold">MealDeck admins</span> can see accounts and orders, to run the service and sort out problems.</li>
            <li><span className="font-semibold">Other students</span> see nothing about you. The live queue shows order numbers and status only, and nobody can see who reported an item. (The live queue only exists at stalls that take pre-orders on MealDeck. At a menu-only stall you can still report a dish as out of stock.)</li>
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
          <p>We also keep a simple activity log, to see how MealDeck is used and to look into problems: your account number (not your name or email) next to things like signing up, pre-ordering, reporting an item out of stock, and asking to delete or cancelling that. Its lines stay for up to a year, or until an admin clears the log. That includes after your account is deleted: the last line says the account was permanently deleted. A line doesn&apos;t name you, but it does show what that account number did.</p>
          <p>If you fill in the optional &ldquo;Hostel and room&rdquo; at checkout, the stall sees it on that order, and it is remembered on your own device for next time. It is removed from your orders when your account is deleted.</p>
          <p>A stall sees a count next to your order if you left pre-orders uncollected in the last 30 days (at any stall), for example &ldquo;2 orders not collected in the last 30 days&rdquo;. It is a number only, with no dates or stall names.</p>
          <p>So that deleting an account can&apos;t reset the limit on uncollected pre-orders, orders from the last 30 days keep a one-way code made from your email (not the email itself; it can&apos;t be turned back into it). It&apos;s wiped once each order is 30 days old. If an admin has flagged an email for abuse, that flag (the same kind of code and a partly hidden address, like ri•••@bennett.edu.in) stays until it expires or is removed, even after the account is deleted.</p>
        </Section>

        <Link href="/" className="text-sm font-semibold text-[#3f6b3a] hover:underline">← Back to menu</Link>
        <NotOfficial className="pb-4" />
      </main>
    </>
  );
}
