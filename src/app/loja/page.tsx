"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { Product } from "@/types";

export default function LojaPage() {
  const { products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  const categories = useMemo(() => {
    const cats = ["Todos", ...new Set(products.map((p) => p.category))];
    return cats;
  }, [products]);

  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.featured);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Todos") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-[var(--secondary)] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-6">
                  Vista-se com
                  <span className="block text-[var(--primary)]">Estilo e Elegância</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Descubra as últimas tendências em moda feminina. Peças exclusivas para todas as ocasiões,
                  com qualidade premium e preços acessíveis.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="#produtos"
                    className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Ver Coleção
                  </a>
                  <a
                    href="#sobre"
                    className="px-8 py-3 border-2 border-[var(--foreground)] text-[var(--foreground)] rounded-xl font-semibold hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
                  >
                    Saiba Mais
                  </a>
                </div>
              </div>

              {/* Logo */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="absolute inset-0 bg-[var(--accent)] rounded-full blur-3xl opacity-20 scale-110" />
                  <Image
                    src="/logo.jpg"
                    alt="D'Flor Elegance"
                    width={320}
                    height={320}
                    className="relative rounded-full object-cover shadow-2xl border-4 border-[var(--background)]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-16 bg-[var(--background)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
                    Destaques
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Peças selecionadas especialmente para você
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 4).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section id="categorias" className="py-16 bg-[var(--secondary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
                Categorias
              </h2>
              <p className="text-muted-foreground mt-2">
                Navegue por categoria e encontre o que procura
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--card-bg)] text-[var(--foreground)] hover:bg-[var(--border)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* All Products */}
        <section id="produtos" className="py-16 bg-[var(--background)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
                  {selectedCategory === "Todos" ? "Todos os Produtos" : selectedCategory}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria</p>
              </div>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="sobre" className="py-16 bg-[var(--secondary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)] mb-6">
                  Sobre Nossa Loja
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Há mais de 10 anos no mercado, somos referência em moda de qualidade.
                  Nossa missão é proporcionar a melhor experiência de compra, oferecendo
                  peças que combinam estilo, conforto e preço justo.
                </p>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Trabalhamos com as melhores marcas e tecidos, garantindo durabilidade
                  e satisfação em cada compra. Nossa equipe está sempre pronta para
                  ajudá-lo a encontrar o look perfeito.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-[var(--card-bg)] rounded-xl">
                    <p className="text-2xl font-bold text-[var(--foreground)]">10+</p>
                    <p className="text-sm text-muted-foreground">Anos de experiência</p>
                  </div>
                  <div className="text-center p-4 bg-[var(--card-bg)] rounded-xl">
                    <p className="text-2xl font-bold text-[var(--foreground)]">50k+</p>
                    <p className="text-sm text-muted-foreground">Clientes satisfeitos</p>
                  </div>
                  <div className="text-center p-4 bg-[var(--card-bg)] rounded-xl">
                    <p className="text-2xl font-bold text-[var(--foreground)]">1000+</p>
                    <p className="text-sm text-muted-foreground">Produtos</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--card-bg)] border border-[var(--border)]">
                  <img
                    src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800"
                    alt="Nossa Loja"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--foreground)] rounded-2xl flex items-center justify-center text-[var(--background)]">
                  <div className="text-center">
                    <p className="text-2xl font-bold">100%</p>
                    <p className="text-xs">Satisfação</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[var(--foreground)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-[var(--background)] mb-4">
              Cadastre-se e ganhe 10% de desconto
            </h2>
            <p className="text-[var(--background)]/70 mb-8 max-w-md mx-auto">
              Receba novidades, promoções exclusivas e dicas de moda diretamente no seu e-mail.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--background)] text-[var(--foreground)] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-background/50"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[var(--background)] text-[var(--foreground)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Cadastrar
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
