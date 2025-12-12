"use client";

import React, { useRef, useState } from "react";
import { Product } from "@/types";
import { ImageFrame } from "./ImageFrame";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    );
  };

  const handleMouseLeave = () => {
    setTransform("");
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className="relative cursor-pointer rounded-xl overflow-hidden bg-card-bg border border-border shadow-sm transition-all duration-300 ease-out"
      style={{
        transform: transform,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Discount Badge */}
      {discount > 0 && product.stock > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-foreground text-background px-2 py-1 rounded-md text-xs font-semibold">
          -{discount}%
        </div>
      )}

      {/* Out of Stock Badge */}
      {product.stock === 0 && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
          Esgotado
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-3/4 overflow-hidden bg-secondary">
        <ImageFrame
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            product.stock === 0 ? "grayscale opacity-70" : ""
          }`}
          style={{
            transform: isHovering ? "scale(1.05)" : "scale(1)",
          }}
        />

        {/* Hover Overlay */}
        <div
          className="absolute inset-0 bg-foreground transition-opacity duration-300 flex items-center justify-center"
          style={{ opacity: isHovering ? 0.05 : 0 }}
        />
      </div>

      {/* Content */}
      <div
        className="p-4 transition-transform duration-300"
        style={{
          transform: isHovering ? "translateZ(20px)" : "translateZ(0)",
        }}
      >
        <p className="text-xs text-muted uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-medium text-foreground mb-2 line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-foreground">
            R$ {product.price.toFixed(2).replace(".", ",")}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted line-through">
              R$ {product.originalPrice.toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>

        {/* Color Options Preview */}
        <div className="flex gap-1 mt-3">
          {product.colors.slice(0, 4).map((color) => (
            <div
              key={color.hex}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-xs text-muted ml-1">
              +{product.colors.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* 3D Shadow Effect */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-shadow duration-300"
        style={{
          boxShadow: isHovering
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            : "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      />
    </div>
  );
}
