import { useCallback, useEffect, useState } from "react";

const KEY = "recently_viewed";
const MAX = 8;

export function useRecentlyViewed() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.productId !== product.productId);
      const next = [product, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearItems = useCallback(() => {
    localStorage.removeItem(KEY);
    setItems([]);
  }, []);

  return { items, addItem, clearItems };
}
