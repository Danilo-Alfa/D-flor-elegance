"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Product, CartItem, User } from "@/types";

interface StoreContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  user: User;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  updateProduct: (product: Product) => Promise<void>;
  createProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User>({ isAdmin: false, isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(true);

  // Buscar produtos do backend
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Atualizar lista de produtos
  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Carregar produtos do backend
    fetchProducts();

    // Carregar carrinho do localStorage (carrinho permanece local)
    const savedCart = localStorage.getItem("store_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Verificar sessão do admin
    const adminSession = localStorage.getItem("admin_session");
    if (adminSession === "true") {
      setUser({ isAdmin: true, isAuthenticated: true });
    }
  }, [fetchProducts]);

  useEffect(() => {
    localStorage.setItem("store_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.product.id === item.product.id &&
          i.selectedSize === item.selectedSize &&
          i.selectedColor.hex === item.selectedColor.hex
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }

      return [...prev, item];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setUser({ isAdmin: true, isAuthenticated: true });
        localStorage.setItem("admin_session", "true");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser({ isAdmin: false, isAuthenticated: false });
    localStorage.removeItem("admin_session");
  };

  // Atualizar produto no backend
  const updateProduct = async (updatedProduct: Product) => {
    try {
      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === data.id ? data : p))
        );
      } else {
        throw new Error("Erro ao atualizar produto");
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      throw error;
    }
  };

  // Criar novo produto no backend
  const createProduct = async (newProduct: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts((prev) => [data, ...prev]);
      } else {
        throw new Error("Erro ao criar produto");
      }
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      throw error;
    }
  };

  // Deletar produto no backend
  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        throw new Error("Erro ao deletar produto");
      }
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      throw error;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        user,
        login,
        logout,
        updateProduct,
        createProduct,
        deleteProduct,
        refreshProducts,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
