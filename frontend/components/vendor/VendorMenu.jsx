"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "../../lib/api";

const inputClass = "w-full rounded-xl border border-[#dbe5d8] bg-white px-3 py-2 text-sm outline-none focus:border-[#477355] focus:ring-2 focus:ring-[#dbead6]";
const primaryButton = "rounded-xl bg-[#173725] px-3 py-2 text-sm font-semibold text-white hover:bg-[#28543a] disabled:opacity-50";

function MenuItemEditor({ item, categoriesId, onChanged }) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? "");
  const [price, setPrice] = useState(String(item.price));
  const [veg, setVeg] = useState(item.veg);
  const [available, setAvailable] = useState(item.available);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(`/api/vendor/menu-items/${item.id}`, {
        method: "PATCH",
        body: { name, price: Number(price), veg, available, category },
      });
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        await api(`/api/vendor/menu-items/${item.id}/image`, { method: "POST", formData });
        setImageFile(null);
      }
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-2xl border border-[#e1e8dd] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#e8eee5]">
          {item.image ? <Image src={item.image} alt="" fill sizes="64px" className="object-cover" /> : <span className="flex size-full items-center justify-center text-xl" aria-hidden="true">🍽️</span>}
        </div>
        <label className="min-w-0 text-xs font-bold uppercase tracking-wide text-gray-500">Dish image
          <input className="mt-1 block w-full max-w-xs text-sm font-normal normal-case tracking-normal file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f2e3] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#315c3d]" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
          <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-gray-500">JPEG, PNG, or WebP · up to 5 MB</span>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Item name
          <input className={`${inputClass} mt-1`} required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Price (₹)
          <input className={`${inputClass} mt-1`} required min="1" step="1" type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
      </div>
      <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-gray-500">Category
        <input className={`${inputClass} mt-1 normal-case tracking-normal`} list={categoriesId} maxLength={40} placeholder="e.g. Kathi Rolls, Cold Beverages" value={category} onChange={(event) => setCategory(event.target.value)} />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
        <label className="flex items-center gap-2"><input type="checkbox" checked={veg} onChange={(event) => setVeg(event.target.checked)} /> Vegetarian</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} /> Available to order</label>
        {!available && <span className="rounded-full bg-[#fbe9e7] px-2.5 py-1 text-xs text-[#9a4a3f]">Out of stock</span>}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{item.reportCount > 0 ? `${item.reportCount} stock report${item.reportCount === 1 ? "" : "s"}` : "No stock reports"}</span>
        <button className={primaryButton} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
      {error && <p className="mt-3 rounded-xl bg-[#fbe9e7] px-3 py-2 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
    </form>
  );
}

export default function VendorMenu({ stall, onChanged }) {
  const [newItem, setNewItem] = useState({ name: "", price: "", veg: true, category: "", imageFile: null });
  // Each distinct category becomes a row on the student menu; suggesting the
  // existing ones keeps spellings consistent.
  const categories = [...new Set(stall.items.map((item) => item.category).filter(Boolean))];
  const categoriesId = `categories-${stall.id}`;
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  async function addItem(event) {
    event.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const created = await api("/api/vendor/menu-items", {
        method: "POST",
        body: { name: newItem.name, price: Number(newItem.price), veg: newItem.veg, category: newItem.category },
      });
      if (newItem.imageFile) {
        const formData = new FormData();
        formData.append("image", newItem.imageFile);
        await api(`/api/vendor/menu-items/${created.id}/image`, { method: "POST", formData });
      }
      setNewItem({ name: "", price: "", veg: true, category: newItem.category, imageFile: null });
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Manage menu</h1>
        <p className="mt-1 text-gray-500">Update what {stall.name} is serving today. Turning off availability marks an item out of stock immediately.</p>
      </div>

      <form onSubmit={addItem} className="mb-7 rounded-2xl border border-[#dce6d8] bg-[#f7faf5] p-5">
        <h2 className="font-display text-lg font-bold">Add a menu item</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto_auto]">
          <input className={inputClass} required placeholder="Item name" value={newItem.name} onChange={(event) => setNewItem({ ...newItem, name: event.target.value })} />
          <input className={inputClass} required min="1" step="1" type="number" placeholder="Price" value={newItem.price} onChange={(event) => setNewItem({ ...newItem, price: event.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={newItem.veg} onChange={(event) => setNewItem({ ...newItem, veg: event.target.checked })} /> Vegetarian</label>
          <button className={primaryButton} disabled={adding}>{adding ? "Adding…" : "Add item"}</button>
        </div>
        <label className="mt-3 block text-sm font-semibold text-[#315c3d]">Category <span className="font-normal text-gray-500">(optional — each category is its own row on the menu; type a new name to add one)</span>
          <input className={`${inputClass} mt-1 font-normal`} list={categoriesId} maxLength={40} placeholder="e.g. Kathi Rolls" value={newItem.category} onChange={(event) => setNewItem({ ...newItem, category: event.target.value })} />
        </label>
        <datalist id={categoriesId}>{categories.map((name) => <option key={name} value={name} />)}</datalist>
        <label className="mt-3 block text-sm font-semibold text-[#315c3d]">Dish image <span className="font-normal text-gray-500">(optional)</span>
          <input className="mt-1 block w-full text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f2e3] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#315c3d]" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewItem({ ...newItem, imageFile: event.target.files?.[0] ?? null })} />
          <span className="mt-1 block text-xs font-normal text-gray-500">JPEG, PNG, or WebP · maximum 5 MB</span>
        </label>
        {error && <p className="mt-3 rounded-xl bg-[#fbe9e7] px-3 py-2 text-sm text-[#9a4a3f]" role="alert">{error}</p>}
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {stall.items.map((item) => <MenuItemEditor key={item.id} item={item} categoriesId={categoriesId} onChanged={onChanged} />)}
      </div>
      {stall.items.length === 0 && <p className="rounded-2xl bg-white px-5 py-10 text-center text-gray-500">No menu items yet. Add the first item above.</p>}
    </section>
  );
}
