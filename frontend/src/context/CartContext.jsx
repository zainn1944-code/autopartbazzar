"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "cart";
const CartContext = createContext(null);

function readStoredCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return Array.isArray(storedCart) ? storedCart.map(normalizeCartItem) : [];
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    return [];
  }
}

function normalizeCartItem(item) {
  const explicitKind = item.kind ?? null;
  const productRef =
    item.productRef ?? item.productId ?? (explicitKind === "catalog" ? item.id : null);
  const nextQuantity = Math.max(1, Number(item.quantity) || 1);
  const kind = explicitKind ?? (productRef ? "catalog" : "custom-build");
  const fallbackId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const id =
    kind === "catalog"
      ? `catalog:${String(productRef ?? item.id)}`
      : String(item.id ?? `build-${fallbackId}`);

  return {
    id,
    productRef: productRef != null ? String(productRef) : null,
    kind,
    name: item.name ?? "Cart Item",
    price: Number(item.price) || 0,
    imageUrl: item.imageUrl || "",
    category: item.category || "",
    make: item.make || "",
    description: item.description || "",
    quantity: nextQuantity,
    snapshot: item.snapshot ?? null,
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const updateCart = useCallback((updater) => {
    setCart((currentCart) =>
      typeof updater === "function" ? updater(currentCart) : updater
    );
  }, []);

  const addToCart = useCallback((product) => {
    const nextItem = normalizeCartItem(product);
    updateCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === nextItem.id);
      if (!existingItem) return [...prevCart, nextItem];

      return prevCart.map((item) =>
        item.id === nextItem.id
          ? { ...item, quantity: item.quantity + nextItem.quantity }
          : item
      );
    });
  }, [updateCart]);

  const removeFromCart = useCallback((id) => {
    updateCart((prevCart) => prevCart.filter((item) => item.id !== id));
  }, [updateCart]);

  const updateQuantity = useCallback((id, quantity) => {
    updateCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item
      )
    );
  }, [updateCart]);

  const incrementQuantity = useCallback((id) => {
    updateCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, [updateCart]);

  const decrementQuantity = useCallback((id) => {
    updateCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  }, [updateCart]);

  const clearCart = useCallback(() => {
    updateCart([]);
  }, [updateCart]);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );
  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      incrementQuantity,
      decrementQuantity,
      clearCart,
    }),
    [
      cart,
      cartCount,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      incrementQuantity,
      decrementQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };
