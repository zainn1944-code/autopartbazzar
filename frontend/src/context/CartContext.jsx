"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "cart";
const CartContext = createContext(null);

function normalizeCartItem(item) {
  const productRef = item.productRef ?? item.productId ?? item.id ?? null;
  const nextQuantity = Math.max(1, Number(item.quantity) || 1);
  const kind = item.kind ?? (productRef ? "catalog" : "custom-build");

  return {
    id: String(item.id ?? productRef ?? `cart-${Date.now()}`),
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
  const [cart, setCart] = useState([]);

  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
      if (Array.isArray(storedCart)) {
        setCart(storedCart.map(normalizeCartItem));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const nextItem = normalizeCartItem(product);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === nextItem.id);
      if (!existingItem) return [...prevCart, nextItem];

      return prevCart.map((item) =>
        item.id === nextItem.id
          ? { ...item, quantity: item.quantity + nextItem.quantity }
          : item
      );
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = useMemo(
    () => ({
      cart,
      cartCount: cart.reduce((total, item) => total + item.quantity, 0),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
