"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro";
      if (errorMessage.includes("user-not-found")) {
        setError("Email não encontrado");
      } else {
        setError("Erro ao enviar email. Tente novamente");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center mb-8">
          <span className="font-display text-3xl tracking-wide">
            D&apos; flor
          </span>
          <span className="font-body text-xs tracking-[0.3em] uppercase text-muted -mt-1">
            elegance
          </span>
        </Link>

        {/* Card */}
        <div className="bg-card-bg border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">
            Recuperar Senha
          </h1>
          <p className="text-center text-muted text-sm mb-6">
            Digite seu email para receber um link de recuperação
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
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
              <p className="text-foreground font-medium mb-2">Email enviado!</p>
              <p className="text-sm text-muted mb-4">
                Verifique sua caixa de entrada e siga as instruções para
                redefinir sua senha.
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-6">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Não encontrou?</strong> Verifique sua pasta de spam ou
                  lixo eletrônico.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
                  placeholder="seu@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-6 text-center text-sm text-muted">
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="text-foreground font-medium hover:underline"
              >
                Faça login
              </Link>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Voltar para a loja
          </Link>
        </p>
      </div>
    </div>
  );
}
