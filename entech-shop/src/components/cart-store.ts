'use client';
import { useSyncExternalStore } from 'react';

export type CartItem = { variantId: number; qty: number };
const KEY = 'entech_cart_v1';
const EMPTY: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    cache = Array.isArray(raw)
      ? raw.filter((i) => Number.isInteger(i?.variantId) && Number.isInteger(i?.qty) && i.qty > 0).map((i) => ({ variantId: i.variantId, qty: Math.min(99, i.qty) }))
      : [];
  } catch {
    cache = [];
  }
  return cache;
}
function write(items: CartItem[]) {
  cache = items;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; l(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
}

export const cart = {
  add(variantId: number, qty = 1) {
    const items = read();
    const found = items.find((i) => i.variantId === variantId);
    write(found ? items.map((i) => (i === found ? { ...i, qty: Math.min(99, i.qty + qty) } : i)) : [...items, { variantId, qty: Math.min(99, qty) }]);
  },
  set(variantId: number, qty: number) {
    write(qty <= 0 ? read().filter((i) => i.variantId !== variantId) : read().map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(99, qty) } : i)));
  },
  remove(variantId: number) { write(read().filter((i) => i.variantId !== variantId)); },
  keepOnly(ids: number[]) { const s = new Set(ids); const items = read(); if (items.some((i) => !s.has(i.variantId))) write(items.filter((i) => s.has(i.variantId))); },
  clear() { write([]); },
};

export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY);
