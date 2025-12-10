"use client";

import React, { useState, useEffect } from "react";
import { Product, ProductColor } from "@/types";
import { useStore } from "@/context/StoreContext";
import { ImageFrame } from "./ImageFrame";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { addToCart } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || "");
      setSelectedColor(product.colors[0] || null);
      setQuantity(1);
      setCurrentImageIndex(0);
    }
  }, [product]);

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

  const handleAddToCart = () => {
    if (!product || !selectedColor) return;

    addToCart({
      product,
      quantity,
      selectedSize,
      selectedColor,
    });

    handleClose();
  };

  const handleBuyNow = async () => {
    if (!product || !selectedColor) return;

    // Add to cart first
    addToCart({
      product,
      quantity,
      selectedSize,
      selectedColor,
    });

    // Redirect to checkout
    window.location.href = "/checkout";
  };

  if (!isOpen || !product) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

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

      {/* Modal Content */}
      <div
        className={`absolute right-0 top-0 h-full w-full md:w-[70%] bg-[var(--background)] shadow-2xl overflow-y-auto modal-content ${isClosing ? "modal-closing" : ""}`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[var(--secondary)] hover:bg-[var(--border)] transition-colors"
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

        <div className="flex flex-col lg:flex-row h-full">
          {/* Images Section */}
          <div className="lg:w-1/2 p-6 lg:p-8">
            {/* Main Image */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--secondary)] mb-4">
              <ImageFrame
                src={product.images[currentImageIndex] || product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-[var(--foreground)] text-[var(--background)] px-3 py-1 rounded-md text-sm font-semibold">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index
                        ? "border-[var(--foreground)]"
                        : "border-transparent hover:border-[var(--border)]"
                    }`}
                  >
                    <ImageFrame
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-6 lg:p-8 lg:border-l border-[var(--border)]">
            <div className="max-w-md mx-auto lg:mx-0">
              {/* Category */}
              <p className="text-sm text-[var(--muted)] uppercase tracking-wider mb-2">
                {product.category}
              </p>

              {/* Title */}
              <h2 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-4">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-[var(--foreground)]">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-[var(--muted)] line-through">
                    R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[var(--muted)] mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Colors */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Cor: <span className="text-[var(--muted)]">{selectedColor?.name}</span>
                </label>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor?.hex === color.hex
                          ? "border-[var(--foreground)] scale-110"
                          : "border-[var(--border)] hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Tamanho</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedSize === size
                          ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                          : "bg-transparent border-[var(--border)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">Quantidade</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--secondary)] transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--secondary)] transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-[var(--muted)]">
                    {product.stock} disponíveis
                  </span>
                </div>
              </div>

              {/* Stock Warning */}
              {product.stock > 0 && product.stock < 10 && (
                <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                  Restam apenas {product.stock} unidades!
                </div>
              )}

              {/* Out of Stock Warning */}
              {product.stock === 0 && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                  <p className="text-red-600 dark:text-red-400 font-semibold">
                    Produto Esgotado
                  </p>
                  <p className="text-sm text-red-500 dark:text-red-400/80 mt-1">
                    Este produto não está disponível no momento
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className={`w-full py-4 rounded-xl font-semibold transition-opacity ${
                    product.stock === 0
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                  }`}
                >
                  {product.stock === 0 ? "Indisponível" : "Comprar Agora"}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`w-full py-4 rounded-xl border-2 font-semibold transition-colors ${
                    product.stock === 0
                      ? "border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {product.stock === 0 ? "Sem Estoque" : "Adicionar ao Carrinho"}
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                <div className="space-y-3 text-sm text-[var(--muted)]">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Frete grátis para compras acima de R$ 299</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Troca grátis em até 30 dias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Compra 100% segura</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
