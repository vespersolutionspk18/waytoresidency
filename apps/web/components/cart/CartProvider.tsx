'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CartItem = {
  slug: string;
  title: string;
  edition?: string;
  cover: string;
  priceMinor: number;
  currency: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  totalMinor: number;
  totalQty: number;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'wtr-cart-v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // hydrate once
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  // persist on change
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* noop */
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty: number = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.slug === item.slug);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = { ...next[i]!, qty: next[i]!.qty + qty };
        return next;
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((x) => x.slug !== slug));
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((x) => (x.slug === slug ? { ...x, qty: Math.max(0, qty) } : x))
        .filter((x) => x.qty > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalMinor = items.reduce((s, x) => s + x.priceMinor * x.qty, 0);
    const totalQty = items.reduce((s, x) => s + x.qty, 0);
    return { items, totalMinor, totalQty, add, remove, setQty, clear, ready };
  }, [items, add, remove, setQty, clear, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // Return a no-op cart so callers don't crash if a component renders outside the provider.
    return {
      items: [],
      totalMinor: 0,
      totalQty: 0,
      add: () => {},
      remove: () => {},
      setQty: () => {},
      clear: () => {},
      ready: false,
    };
  }
  return ctx;
}
