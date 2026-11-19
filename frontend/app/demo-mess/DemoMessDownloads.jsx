import Link from "next/link";
import { DAY_NAMES } from "../../lib/messScreenshot";

// Today's pair first: the import only accepts today's menu.
export default function DemoMessDownloads({ today }) {
  const day = DAY_NAMES[today];
  const files = [1, 2].map((n) => `/demo-mess/${day.toLowerCase()}-${n}.png`);
  return (
    <>
      <p className="mb-6 text-gray-600">
        No MyCamu? Save these two, then open <Link href="/mess" className="font-semibold text-deck underline">Mess</Link> and
        tap <b>Fill from MyCamu screenshots</b>. They&apos;re made-up {day} menus, marked DEMO.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {files.map((src, i) => (
          <a key={src} href={src} download={`mealdeck-demo-${day.toLowerCase()}-${i + 1}.png`} className="block overflow-hidden rounded-xl border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Sample ${day} mess menu, part ${i + 1}`} className="w-full" />
            <span className="block py-2 text-center text-sm font-semibold text-deck">Save {i === 0 ? "breakfast & lunch" : "snacks & dinner"}</span>
          </a>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-500">On iPhone, if tapping opens the picture instead: press and hold it, then Save to Photos.</p>
    </>
  );
}
