"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";

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
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string;
  shipping_address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_method: string;
  shipping_deadline: string;
  tracking_code: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order_items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  pending_payment: "Aguardando Pagamento",
  paid: "Pago",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function AdminOrders() {
  const router = useRouter();
  const { user, logout } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (!user.isAdmin) {
      router.push("/admin/login");
    }
  }, [user.isAdmin, router]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      // Garante que orders seja sempre um array
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data.error) {
        console.error("Erro da API:", data.error);
        setErrorMessage("Execute o SQL no Supabase para criar a tabela de pedidos");
        setOrders([]);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setErrorMessage("Erro ao carregar pedidos");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setTrackingCode(order.tracking_code || "");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      const data = await response.json();

      // Atualizar lista de pedidos
      setOrders(orders.map(o =>
        o.id === selectedOrder.id ? { ...o, ...data.order } : o
      ));
      setSelectedOrder({ ...selectedOrder, ...data.order });

      setSuccessMessage("Status atualizado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Erro ao atualizar status");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedOrder || !trackingCode) return;

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_code: trackingCode,
          status: "shipped"
        }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      const data = await response.json();

      setOrders(orders.map(o =>
        o.id === selectedOrder.id ? { ...o, ...data.order } : o
      ));
      setSelectedOrder({ ...selectedOrder, ...data.order });

      setSuccessMessage("Código de rastreio salvo!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Erro ao salvar código de rastreio");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
  };

  const filteredOrders = filterStatus === "all"
    ? (orders || [])
    : (orders || []).filter(o => o.status === filterStatus);

  if (!user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="font-display text-xl tracking-wide">
                    D&apos; flor
                  </span>
                  <span className="font-body text-[8px] tracking-[0.3em] uppercase text-[var(--muted)] -mt-1">
                    elegance
                  </span>
                </div>
              </Link>
              <span className="text-[var(--muted)]">/</span>
              <span className="font-semibold">Pedidos</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Produtos
              </Link>
              <Link
                href="/loja"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Ver Loja
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-[var(--secondary)] hover:bg-[var(--border)] rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Orders List */}
          <div className="lg:w-1/3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Pedidos</h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending_payment">Aguardando Pagamento</option>
                <option value="paid">Pagos</option>
                <option value="preparing">Preparando</option>
                <option value="shipped">Enviados</option>
                <option value="delivered">Entregues</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-[var(--muted)]">
                  Carregando pedidos...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted)]">
                  Nenhum pedido encontrado
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${
                      selectedOrder?.id === order.id
                        ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                        : "bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--foreground)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">#{order.order_number}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedOrder?.id === order.id
                          ? "bg-white/20"
                          : statusColors[order.status]
                      }`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className={`text-sm ${selectedOrder?.id === order.id ? "opacity-80" : "text-[var(--muted)]"}`}>
                      {order.customer_name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-sm ${selectedOrder?.id === order.id ? "opacity-80" : "text-[var(--muted)]"}`}>
                        {formatDate(order.created_at)}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:w-2/3">
            {selectedOrder ? (
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">
                      Pedido #{selectedOrder.order_number}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>

                {successMessage && (
                  <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Status Actions */}
                  <div className="p-4 bg-[var(--secondary)] rounded-xl">
                    <label className="block text-sm font-medium mb-3">Atualizar Status</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.status === "pending_payment" && (
                        <button
                          onClick={() => handleUpdateStatus("paid")}
                          disabled={isSaving}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          Marcar como Pago
                        </button>
                      )}
                      {selectedOrder.status === "paid" && (
                        <button
                          onClick={() => handleUpdateStatus("preparing")}
                          disabled={isSaving}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          Preparando
                        </button>
                      )}
                      {(selectedOrder.status === "paid" || selectedOrder.status === "preparing") && (
                        <button
                          onClick={() => handleUpdateStatus("shipped")}
                          disabled={isSaving}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          Marcar como Enviado
                        </button>
                      )}
                      {selectedOrder.status === "shipped" && (
                        <button
                          onClick={() => handleUpdateStatus("delivered")}
                          disabled={isSaving}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          Marcar como Entregue
                        </button>
                      )}
                      {selectedOrder.status !== "cancelled" && selectedOrder.status !== "delivered" && (
                        <button
                          onClick={() => handleUpdateStatus("cancelled")}
                          disabled={isSaving}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          Cancelar Pedido
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tracking Code */}
                  {(selectedOrder.status === "paid" || selectedOrder.status === "preparing" || selectedOrder.status === "shipped") && (
                    <div className="p-4 bg-[var(--secondary)] rounded-xl">
                      <label className="block text-sm font-medium mb-3">Código de Rastreio</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={trackingCode}
                          onChange={(e) => setTrackingCode(e.target.value)}
                          placeholder="Ex: BR123456789BR"
                          className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
                        />
                        <button
                          onClick={handleUpdateTracking}
                          disabled={isSaving || !trackingCode}
                          className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          {isSaving ? "Salvando..." : "Salvar e Enviar"}
                        </button>
                      </div>
                      {selectedOrder.tracking_code && (
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          Rastreio atual: <strong>{selectedOrder.tracking_code}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Customer Info */}
                  <div>
                    <h3 className="font-semibold mb-3">Dados do Cliente</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--muted)]">Nome:</span>
                        <p className="font-medium">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">Email:</span>
                        <p className="font-medium">{selectedOrder.customer_email}</p>
                      </div>
                      {selectedOrder.customer_phone && (
                        <div>
                          <span className="text-[var(--muted)]">Telefone:</span>
                          <p className="font-medium">{selectedOrder.customer_phone}</p>
                        </div>
                      )}
                      {selectedOrder.customer_cpf && (
                        <div>
                          <span className="text-[var(--muted)]">CPF:</span>
                          <p className="font-medium">{selectedOrder.customer_cpf}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold mb-3">Endereço de Entrega</h3>
                    <div className="text-sm">
                      <p>
                        {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.number}
                        {selectedOrder.shipping_address.complement && ` - ${selectedOrder.shipping_address.complement}`}
                      </p>
                      <p>{selectedOrder.shipping_address.neighborhood}</p>
                      <p>
                        {selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.state}
                      </p>
                      <p>CEP: {selectedOrder.shipping_address.zip_code}</p>
                      {selectedOrder.shipping_method && (
                        <p className="mt-2 text-[var(--muted)]">
                          Envio: {selectedOrder.shipping_method} ({selectedOrder.shipping_deadline})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Itens do Pedido</h3>
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
                              {item.selected_size && <span>Tam: {item.selected_size}</span>}
                              {item.selected_size && item.selected_color && <span> | </span>}
                              {item.selected_color && <span>Cor: {item.selected_color}</span>}
                            </div>
                            <p className="text-sm">
                              {item.quantity}x {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-[var(--border)] pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Frete:</span>
                        <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto:</span>
                          <span>-{formatCurrency(selectedOrder.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                        <span>Total:</span>
                        <span>{formatCurrency(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {selectedOrder.payment_method && (
                    <div className="text-sm text-[var(--muted)]">
                      <p>Forma de pagamento: {selectedOrder.payment_method}</p>
                      {selectedOrder.paid_at && (
                        <p>Pago em: {formatDate(selectedOrder.paid_at)}</p>
                      )}
                    </div>
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
