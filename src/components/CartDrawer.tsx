"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ImageFrame } from "./ImageFrame";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateCartQuantity, cartTotal } = useStore();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 modal-overlay ${isClosing ? "opacity-0" : ""}`}
      style={{ transition: "opacity 0.3s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Drawer Content */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl modal-content ${isClosing ? "modal-closing" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Carrinho</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg
                className="w-16 h-16 text-muted mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-muted">Seu carrinho está vazio</p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.hex}-${index}`}
                  className="flex gap-4 p-3 bg-card-bg border border-border rounded-xl"
                >
                  {/* Image */}
                  <div className="w-20 h-24 rounded-lg overflow-hidden shrink-0">
                    <ImageFrame
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-muted mt-1">
                      Tamanho: {item.selectedSize} | Cor:{" "}
                      {item.selectedColor.name}
                    </p>
                    <p className="font-bold mt-2">
                      R$ {item.product.price.toFixed(2).replace(".", ",")}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.product.id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-secondary transition-colors text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-secondary transition-colors text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-muted hover:text-error transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted">Subtotal</span>
              <span className="text-xl font-bold">
                R$ {cartTotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={handleClose}
              className="block w-full py-3 bg-foreground text-background text-center rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Finalizar Compra
            </Link>
            <button
              onClick={handleClose}
              className="w-full py-3 mt-2 text-muted hover:text-foreground transition-colors text-sm"
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
