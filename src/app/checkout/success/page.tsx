"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";

export default function CheckoutSuccess() {
  const { clearCart } = useStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
          Pagamento Confirmado!
        </h1>

        <p className="text-[var(--muted)] mb-8">
          Obrigado pela sua compra! Você receberá um e-mail com os detalhes do pedido
          e informações de rastreamento em breve.
        </p>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">O que acontece agora?</h2>
          <div className="space-y-3 text-left text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <p className="text-[var(--muted)]">
                Você receberá um e-mail de confirmação com os detalhes do pedido
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <p className="text-[var(--muted)]">
                Seu pedido será preparado e enviado em até 2 dias úteis
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <p className="text-[var(--muted)]">
                Você receberá o código de rastreamento por e-mail
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
