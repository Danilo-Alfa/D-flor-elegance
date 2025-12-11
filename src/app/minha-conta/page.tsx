"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_size: string | null;
  selected_color: string | null;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  shipping_method: string;
  shipping_deadline: string;
  tracking_code: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order_items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  pending_payment: "Aguardando Pagamento",
  paid: "Pagamento Confirmado",
  preparing: "Preparando Envio",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const statusColors: Record<string, string> = {
  pending_payment: "bg-amber-500/20 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30",
  paid: "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30",
  preparing: "bg-blue-500/20 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30",
  shipped: "bg-violet-500/20 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-500/30",
  delivered: "bg-teal-500/20 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/30",
  cancelled: "bg-red-500/20 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-500/30",
  refunded: "bg-slate-500/20 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/30",
};

export default function MyAccountPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.email) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--foreground)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="font-display text-xl tracking-wide">D&apos; flor</span>
                <span className="font-body text-[8px] tracking-[0.3em] uppercase text-[var(--muted)] -mt-1">
                  elegance
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/loja"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Continuar Comprando
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-[var(--secondary)] hover:bg-[var(--border)] rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center text-2xl font-bold">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                Olá, {user.displayName || "Cliente"}!
              </h1>
              <p className="text-[var(--muted)] text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4">Meus Pedidos</h2>

            {isLoadingOrders ? (
              <div className="text-center py-8 text-[var(--muted)]">
                Carregando pedidos...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-8 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-[var(--muted)] mb-4"
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
                <p className="text-[var(--muted)] mb-4">
                  Você ainda não fez nenhum pedido
                </p>
                <Link
                  href="/loja"
                  className="inline-block px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Explorar Loja
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full p-5 rounded-xl border transition-all text-left ${
                      selectedOrder?.id === order.id
                        ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                        : "bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--foreground)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-sm truncate">#{order.order_number}</span>
                      <span className="font-bold text-lg whitespace-nowrap">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm ${
                          selectedOrder?.id === order.id
                            ? "opacity-80"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {formatDate(order.created_at)}
                      </span>
                      <span
                        className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-medium ${
                          selectedOrder?.id === order.id
                            ? "bg-white/20"
                            : statusColors[order.status]
                        }`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">
                      Pedido #{selectedOrder.order_number}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                      Realizado em {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      statusColors[selectedOrder.status]
                    }`}
                  >
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>

                {/* Order Timeline */}
                <div className="mb-6 p-4 bg-[var(--secondary)] rounded-xl">
                  <h3 className="font-medium mb-3">Status do Pedido</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedOrder.created_at
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <span className="text-sm">
                        Pedido realizado - {formatDate(selectedOrder.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedOrder.paid_at ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <span className="text-sm">
                        {selectedOrder.paid_at
                          ? `Pagamento confirmado - ${formatDate(selectedOrder.paid_at)}`
                          : "Aguardando pagamento"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedOrder.shipped_at
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <span className="text-sm">
                        {selectedOrder.shipped_at
                          ? `Enviado - ${formatDate(selectedOrder.shipped_at)}`
                          : "Aguardando envio"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedOrder.delivered_at
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <span className="text-sm">
                        {selectedOrder.delivered_at
                          ? `Entregue - ${formatDate(selectedOrder.delivered_at)}`
                          : "Aguardando entrega"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tracking Code */}
                {selectedOrder.tracking_code && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <strong>Código de rastreio:</strong>{" "}
                      {selectedOrder.tracking_code}
                    </p>
                    <a
                      href={`https://www.linkcorreios.com.br/?id=${selectedOrder.tracking_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 underline mt-1 inline-block"
                    >
                      Rastrear pedido
                    </a>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Itens do Pedido</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 bg-[var(--secondary)] rounded-lg"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--border)]">
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <div className="text-sm text-[var(--muted)]">
                            {item.selected_size && (
                              <span>Tam: {item.selected_size}</span>
                            )}
                            {item.selected_size && item.selected_color && (
                              <span> | </span>
                            )}
                            {item.selected_color && (
                              <span>Cor: {item.selected_color}</span>
                            )}
                          </div>
                          <p className="text-sm">
                            {item.quantity}x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.total_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-[var(--border)] pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  {selectedOrder.shipping_method && (
                    <p className="text-sm text-[var(--muted)] mt-1">
                      Entrega via {selectedOrder.shipping_method} (
                      {selectedOrder.shipping_deadline})
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-[var(--muted)] mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-[var(--muted)]">
                  Selecione um pedido para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
