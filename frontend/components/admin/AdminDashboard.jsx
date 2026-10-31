"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../layout/Header";
import { api } from "../../lib/api";

const input = "w-full rounded-xl border border-[#e0e8dc] bg-white px-3 py-2 text-sm outline-none focus:border-[#477355] focus:ring-2 focus:ring-[#dbead6]";
const button = "rounded-xl bg-[#173725] px-3 py-2 text-sm font-semibold text-white hover:bg-[#28543a] disabled:opacity-50";
const subtle = "rounded-xl border border-[#d8e2d5] px-3 py-2 text-sm font-semibold text-[#315c3d] hover:bg-[#f3f7f1]";

function Notice({ error, children }) {
  return error ? <p className="mb-4 rounded-xl bg-[#fbe9e7] px-4 py-3 text-sm text-[#9a4a3f]" role="alert">{error}</p> : children;
}

function SectionTitle({ title, description }) {
  return <div className="mb-5"><h2 className="font-display text-2xl font-bold">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("stalls");
  const [data, setData] = useState({ stalls: [], vendors: [], students: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [stalls, vendors, students] = await Promise.all([api("/api/admin/stalls"), api("/api/admin/vendors"), api("/api/admin/students")]);
      setData({ stalls, vendors, students }); setError(null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) { router.replace("/admin/login"); return; }
      setError(err.message);
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    // Defer the first fetch past effect setup; the cleanup also prevents a
    // scheduled load from running after this page has unmounted.
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  const refresh = async () => { setLoading(true); await load(); };
  const tabs = [["stalls", "Stalls & menu"], ["vendors", "Vendors"], ["students", "Students"]];

  return <><Header /><main className="mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#5d8764]">Administration</p><h1 className="font-display text-3xl font-bold tracking-tight">MealDeck control room</h1><p className="mt-1 text-sm text-gray-500">Manage the people and menu behind today&apos;s service.</p></div><button className={subtle} onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh data"}</button></div>
    <Notice error={error} />
    <nav className="mb-7 flex flex-wrap gap-2" aria-label="Admin sections">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-[#173725] text-white" : "bg-white text-[#477355] ring-1 ring-[#dce6d8] hover:bg-[#f3f7f1]"}`}>{label}</button>)}</nav>
    {!loading && tab === "stalls" && <Stalls stalls={data.stalls} vendors={data.vendors} onChange={refresh} />}
    {!loading && tab === "vendors" && <Vendors vendors={data.vendors} onChange={refresh} />}
    {!loading && tab === "students" && <Students students={data.students} onChange={refresh} />}
  </main></>;
}

function Stalls({ stalls, vendors, onChange }) {
  const [error, setError] = useState(null);
  const [newStall, setNewStall] = useState({ stallName: "", vendorEmail: "", vendorPassword: "", vendorRealEmail: "" });
  const [newItem, setNewItem] = useState({});
  async function submitStall(event) { event.preventDefault(); try { await api("/api/admin/stalls", { method: "POST", body: newStall }); setNewStall({ stallName: "", vendorEmail: "", vendorPassword: "", vendorRealEmail: "" }); await onChange(); } catch (err) { setError(err.message); } }
  async function updateStall(id, values) { try { await api(`/api/admin/stalls/${id}`, { method: "PATCH", body: values }); await onChange(); } catch (err) { setError(err.message); } }
  async function addItem(event, stallId) { event.preventDefault(); const values = newItem[stallId] ?? {}; try { await api(`/api/admin/stalls/${stallId}/menu-items`, { method: "POST", body: { ...values, price: Number(values.price), veg: values.veg !== false } }); setNewItem((current) => ({ ...current, [stallId]: {} })); await onChange(); } catch (err) { setError(err.message); } }
  async function updateItem(stallId, item, values) { try { await api(`/api/admin/stalls/${stallId}/menu-items/${item.id}`, { method: "PATCH", body: values }); await onChange(); } catch (err) { setError(err.message); } }
  async function deleteItem(stallId, item) { if (!window.confirm(`Delete ${item.name}?`)) return; try { await api(`/api/admin/stalls/${stallId}/menu-items/${item.id}`, { method: "DELETE" }); await onChange(); } catch (err) { setError(err.message); } }
  return <section><SectionTitle title="Stalls and menus" description="Create a stall with its vendor account, set availability, and curate every menu item." /><Notice error={error} />
    
    <form onSubmit={submitStall} className="mb-7 grid gap-3 rounded-2xl border border-[#dce6d8] bg-[#f7faf5] p-5 md:grid-cols-4">
      <h3 className="md:col-span-4 font-display text-lg font-bold">Add a stall and vendor</h3>
      <input className={input} required placeholder="Stall name" value={newStall.stallName} onChange={(e) => setNewStall({ ...newStall, stallName: e.target.value })} />
      <input className={input} required type="email" placeholder="Vendor login (@mealdeck.in)" value={newStall.vendorEmail} onChange={(e) => setNewStall({ ...newStall, vendorEmail: e.target.value })} />
      <input className={input} required minLength="6" type="password" placeholder="Temporary password" value={newStall.vendorPassword} onChange={(e) => setNewStall({ ...newStall, vendorPassword: e.target.value })} />
      <div className="flex gap-2">
        <input className={input} placeholder="Contact email (optional)" value={newStall.vendorRealEmail} onChange={(e) => setNewStall({ ...newStall, vendorRealEmail: e.target.value })} />
        <button className={button}>Create</button></div></form>

    <div className="space-y-6">{stalls.map((stall) => <article key={stall.id} className="rounded-2xl border border-[#e1e8dd] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-display text-xl font-bold">{stall.name}</h3>
        <p className="text-sm text-gray-500">
          {vendors.find((vendor) => vendor.stallId === stall.id)?.email ?? "No vendor assigned"}</p>
          </div><StallSettings stall={stall} onSave={updateStall} />
          </div><div className="space-y-2">
            {stall.items.map((item) => <ItemRow key={item.id} item={item} onSave={(values) => updateItem(stall.id, item, values)} onDelete={() => deleteItem(stall.id, item)} />)}</div>
            <form onSubmit={(event) => addItem(event, stall.id)} className="mt-4 grid gap-2 border-t border-[#edf1ea] pt-4 sm:grid-cols-[1fr_140px_110px_90px_auto]">
              <input className={input} required placeholder="New menu item" value={newItem[stall.id]?.name ?? ""} onChange={(e) => setNewItem({ ...newItem, [stall.id]: { ...newItem[stall.id], name: e.target.value } })} />
              <input className={input} maxLength={40} placeholder="Category" value={newItem[stall.id]?.category ?? ""} onChange={(e) => setNewItem({ ...newItem, [stall.id]: { ...newItem[stall.id], category: e.target.value } })} />
              <input className={input} required min="1" step="1" type="number" placeholder="Price" value={newItem[stall.id]?.price ?? ""} onChange={(e) => setNewItem({ ...newItem, [stall.id]: { ...newItem[stall.id], price: e.target.value } })} />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={newItem[stall.id]?.veg !== false} onChange={(e) => setNewItem({ ...newItem, [stall.id]: { ...newItem[stall.id], veg: e.target.checked } })} />
                Veg</label><button className={button}>Add item</button></form></article>)}</div>
  </section>;
}

function StallSettings({ stall, onSave }) {
  const [openTime, setOpenTime] = useState(stall.openTime?.slice(0, 5) ?? ""); const [closeTime, setCloseTime] = useState(stall.closeTime?.slice(0, 5) ?? ""); const [closedToday, setClosedToday] = useState(stall.closedToday); const [slotCapacity, setSlotCapacity] = useState(String(stall.slotCapacity ?? 15));
  return <form onSubmit={(e) => { e.preventDefault(); onSave(stall.id, { openTime: openTime || null, closeTime: closeTime || null, closedToday, slotCapacity: Number(slotCapacity) }); }} className="flex flex-wrap items-center gap-2 text-sm"><label>Open <input className="ml-1 rounded border px-1 py-1" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} /></label><label>Close <input className="ml-1 rounded border px-1 py-1" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} /></label><label>Per slot <input className="ml-1 w-16 rounded border px-1 py-1" type="number" min="1" max="200" required value={slotCapacity} onChange={(e) => setSlotCapacity(e.target.value)} /></label><label className="flex items-center gap-1"><input type="checkbox" checked={closedToday} onChange={(e) => setClosedToday(e.target.checked)} />Closed today</label><button className={subtle}>Save hours</button></form>;
}

function ItemRow({ item, onSave, onDelete }) {
  const [name, setName] = useState(item.name); const [category, setCategory] = useState(item.category ?? ""); const [price, setPrice] = useState(item.price); const [veg, setVeg] = useState(item.veg); const [available, setAvailable] = useState(item.available);
  return <form onSubmit={(e) => { e.preventDefault(); onSave({ name, price: Number(price), veg, available, category }); }} className="grid gap-2 rounded-xl bg-[#fafcf9] p-3 sm:grid-cols-[1fr_140px_100px_82px_100px_auto_auto]"><input className={input} value={name} onChange={(e) => setName(e.target.value)} /><input className={input} maxLength={40} placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} /><input className={input} type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} /><label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} />Veg</label><label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />Available</label><button className={subtle}>Save</button><button type="button" className="text-sm font-semibold text-[#a34c43]" onClick={onDelete}>Delete</button></form>;
}

function Vendors({ vendors, onChange }) {
  const [error, setError] = useState(null);
  async function save(id, body) { try { await api(`/api/admin/vendors/${id}`, { method: "PATCH", body }); await onChange(); } catch (err) { setError(err.message); } }
  async function remove(vendor) { if (!window.confirm(`Remove the login for ${vendor.email}? The stall will remain.`)) return; try { await api(`/api/admin/vendors/${vendor.id}`, { method: "DELETE" }); await onChange(); } catch (err) { setError(err.message); } }
  return <section><SectionTitle title="Vendor accounts" description="Edit a vendor&apos;s sign-in and contact details, reset their password, or remove their login. Create new vendors from Stalls & menu." /><Notice error={error} /><div className="grid gap-4 lg:grid-cols-2">{vendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} onSave={save} onDelete={() => remove(vendor)} />)}</div></section>;
}

function VendorCard({ vendor, onSave, onDelete }) {
  const [email, setEmail] = useState(vendor.email); const [realEmail, setRealEmail] = useState(vendor.realEmail ?? ""); const [password, setPassword] = useState("");
  return <form onSubmit={(e) => { e.preventDefault(); onSave(vendor.id, { email, realEmail, password: password || null }); setPassword(""); }} className="rounded-2xl border border-[#e1e8dd] bg-white p-5 shadow-sm"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#5d8764]">{vendor.stallName}</p><div className="space-y-3"><input className={input} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><input className={input} type="email" placeholder="Contact email" value={realEmail} onChange={(e) => setRealEmail(e.target.value)} /><input className={input} minLength="6" type="password" placeholder="New password (leave blank to keep)" value={password} onChange={(e) => setPassword(e.target.value)} /></div><div className="mt-4 flex justify-between"><button className={button}>Save account</button><button type="button" onClick={onDelete} className="text-sm font-semibold text-[#a34c43]">Remove vendor</button></div></form>;
}

function Students({ students, onChange }) {
  const [error, setError] = useState(null); const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "", password: "" });
  async function create(event) { event.preventDefault(); try { await api("/api/admin/students", { method: "POST", body: newStudent }); setNewStudent({ name: "", email: "", phone: "", password: "" }); await onChange(); } catch (err) { setError(err.message); } }
  async function save(id, body) { try { await api(`/api/admin/students/${id}`, { method: "PATCH", body }); await onChange(); } catch (err) { setError(err.message); } }
  async function cancelDeletion(student) { try { await api(`/api/admin/students/${student.id}/deletion`, { method: "DELETE" }); await onChange(); } catch (err) { setError(err.message); } }
  async function remove(student) { if (!window.confirm(`Delete ${student.name}'s account? This cannot be undone.`)) return; try { await api(`/api/admin/students/${student.id}`, { method: "DELETE" }); await onChange(); } catch (err) { setError(err.message); } }
  return <section><SectionTitle title="Student accounts" description="Create, update, reset passwords, or permanently delete student accounts." /><Notice error={error} /><form onSubmit={create} className="mb-7 grid gap-3 rounded-2xl border border-[#dce6d8] bg-[#f7faf5] p-5 md:grid-cols-4"><h3 className="md:col-span-4 font-display text-lg font-bold">Add student</h3><input className={input} required placeholder="Student name" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} /><input className={input} required type="email" placeholder="Email (@bennett.edu.in)" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} /><input className={input} placeholder="Phone (optional)" value={newStudent.phone} onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} /><div className="flex gap-2"><input className={input} required minLength="6" type="password" placeholder="Password" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} /><button className={button}>Create</button></div></form><div className="grid gap-4 lg:grid-cols-2">{students.map((student) => <StudentCard key={student.id} student={student} onSave={save} onDelete={() => remove(student)} onCancelDeletion={() => cancelDeletion(student)} />)}</div></section>;
}

// A deletion the student asked for runs 24 hours after they asked.
function deletionDue(student) {
  if (!student.deletionRequestedAt) return null;
  return new Date(new Date(student.deletionRequestedAt).getTime() + 24 * 3600 * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function StudentCard({ student, onSave, onDelete, onCancelDeletion }) {
  const [name, setName] = useState(student.name); const [email, setEmail] = useState(student.email); const [phone, setPhone] = useState(student.phone ?? ""); const [password, setPassword] = useState("");
  return <form onSubmit={(e) => { e.preventDefault(); onSave(student.id, { name, email, phone, password: password || null }); setPassword(""); }} className="rounded-2xl border border-[#e1e8dd] bg-white p-5 shadow-sm">{deletionDue(student) && <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-[#fbede6] px-3 py-2 text-sm text-[#a34c43]"><span>Deletes itself at <strong>{deletionDue(student)}</strong> (student asked)</span><button type="button" onClick={onCancelDeletion} className="shrink-0 font-semibold underline">Cancel deletion</button></div>}<div className="space-y-3"><input className={input} required value={name} onChange={(e) => setName(e.target.value)} /><input className={input} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><input className={input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} /><input className={input} minLength="6" type="password" placeholder="New password (leave blank to keep)" value={password} onChange={(e) => setPassword(e.target.value)} /></div><div className="mt-4 flex justify-between"><button className={button}>Save account</button><button type="button" onClick={onDelete} className="text-sm font-semibold text-[#a34c43]">Delete student</button></div></form>;
}
