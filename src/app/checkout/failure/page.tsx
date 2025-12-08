"use client";

import React from "react";
import Link from "next/link";

export default function CheckoutFailure() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
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
        </div>

        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
          Pagamento não aprovado
        </h1>

        <p className="text-[var(--muted)] mb-8">
          Infelizmente não foi possível processar o seu pagamento. Isso pode acontecer
          por diversos motivos. Por favor, tente novamente ou escolha outro método de pagamento.
        </p>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Possíveis motivos:</h2>
          <ul className="space-y-2 text-left text-sm text-[var(--muted)]">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full" />
              Cartão sem limite disponível
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full" />
              Dados do cartão incorretos
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full" />
              Cartão bloqueado pelo banco
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full" />
              Problemas de conexão
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/checkout"
            className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Tentar Novamente
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-[var(--border)] rounded-xl font-semibold hover:bg-[var(--secondary)] transition-colors"
          >
            Voltar à Loja
          </Link>
        </div>
      </div>
    </div>
  );
}
