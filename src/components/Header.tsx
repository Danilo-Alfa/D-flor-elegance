"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { CartDrawer } from "./CartDrawer";

export function Header() {
  const router = useRouter();
  const { cartCount, searchQuery, setSearchQuery } = useStore();
  const { user, loading: authLoading } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    router.push("/loja#produtos");
    setIsSearchOpen(false);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[var(--background)]/95 backdrop-blur-md shadow-sm py-3"
            : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/loja" className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl md:text-3xl tracking-wide">
                  D' flor
                </span>
                <span className="font-body text-[10px] md:text-xs tracking-[0.4em] uppercase text-[var(--muted-foreground)] -mt-1">
                  elegance
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              {[
                { href: "/", label: "Início" },
                { href: "/#collections", label: "Coleções" },
                { href: "/loja", label: "Loja" },
                { href: "/#about", label: "Sobre" },
                { href: "/#contact", label: "Contato" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-body text-sm tracking-widest uppercase text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[var(--primary)] hover:after:w-full after:transition-all after:duration-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 hover:text-[var(--primary)] transition-colors duration-300"
                  aria-label="Buscar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>

                {/* Search Dropdown */}
                {isSearchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-lg p-3 z-50">
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={localSearch}
                          onChange={(e) => setLocalSearch(e.target.value)}
                          placeholder="Buscar produtos..."
                          className="w-full px-4 py-2 pr-8 rounded-lg border border-[var(--border)] bg-[var(--secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          autoFocus
                        />
                        {localSearch && (
                          <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6 6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Buscar
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Account / Login */}
              {!authLoading && (
                <Link
                  href={user ? "/minha-conta" : "/login"}
                  className="p-2 hover:text-[var(--primary)] transition-colors duration-300 hidden md:flex items-center gap-2"
                  aria-label={user ? "Minha Conta" : "Entrar"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                  {!user && (
                    <span className="text-xs font-medium tracking-wide">Entrar</span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:text-[var(--primary)] transition-colors duration-300"
                aria-label="Sacola"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-[var(--background)] text-xs rounded-full flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-500 ${
              isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <nav className="flex flex-col gap-4 py-4 border-t border-[var(--border)] mt-4">
              {[
                { href: "/", label: "Início" },
                { href: "/#collections", label: "Coleções" },
                { href: "/loja", label: "Loja" },
                { href: "/#about", label: "Sobre" },
                { href: "/#contact", label: "Contato" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-body text-sm tracking-widest uppercase text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors duration-300 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {/* Mobile Account Link */}
              {!authLoading && (
                <Link
                  href={user ? "/minha-conta" : "/login"}
                  className="font-body text-sm tracking-widest uppercase text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors duration-300 py-2 flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                  {user ? "Minha Conta" : "Entrar"}
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
