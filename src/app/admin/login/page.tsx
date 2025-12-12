"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(password);
      if (success) {
        router.push("/admin");
      } else {
        setError("Senha incorreta. Tente novamente.");
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center">
              <span className="text-background font-bold text-lg">LR</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-4 text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted mt-2">Faça login para gerenciar sua loja</p>
        </div>

        {/* Login Form */}
        <div className="bg-card-bg border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Senha de Administrador
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground"
                placeholder="Digite a senha"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
