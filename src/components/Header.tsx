"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { CartDrawer } from "./CartDrawer";

export function Header() {
  const { cartCount, user, logout } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="font-semibold text-xl tracking-wide">D'Flor Elegance</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Início
              </Link>
              <Link
                href="/#produtos"
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Produtos
              </Link>
              <Link
                href="/#categorias"
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Categorias
              </Link>
              <Link
                href="/#sobre"
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Sobre
              </Link>
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Admin Link */}
              {user.isAdmin ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/admin"
                    className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <Link
                  href="/admin/login"
                  className="hidden sm:block text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Admin
                </Link>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
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
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-full flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
            <nav className="flex flex-col p-4 gap-4">
              <Link
                href="/"
                className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/#produtos"
                className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Produtos
              </Link>
              <Link
                href="/#categorias"
                className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categorias
              </Link>
              <Link
                href="/#sobre"
                className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sobre
              </Link>
              {user.isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-[var(--foreground)] hover:text-[var(--muted)] transition-colors py-2"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  href="/admin/login"
                  className="text-[var(--foreground)] hover:text-[var(--muted)] transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
