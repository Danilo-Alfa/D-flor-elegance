"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";

interface OrderData {
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  shipping_method: string;
  shipping_deadline: string;
}

function CheckoutSuccessContent() {
  const { clearCart } = useStore();
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get("order");
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(
    orderNumberParam,
  );
  const hasCleared = useRef(false);

  useEffect(() => {
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
  }, [clearCart]);

  // Verificar status da sessao do Stripe Embedded Checkout
  useEffect(() => {
    async function verifySession() {
      if (!sessionId) return;

      try {
        const response = await fetch(
          `/api/payment/create-session?session_id=${sessionId}`,
        );
        const data = await response.json();

        if (data.orderNumber) {
          setOrderNumber(data.orderNumber);
        }
      } catch (error) {
        console.error("Erro ao verificar sessao:", error);
      }
    }

    verifySession();
  }, [sessionId]);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders?order_number=${orderNumber}`);
        const data = await response.json();
        if (data && data.length > 0) {
          setOrder(data[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar pedido:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
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

        <h1 className="text-3xl font-bold text-foreground mb-4">
          Pagamento Confirmado!
        </h1>

        {loading ? (
          <p className="text-muted mb-8">Carregando detalhes do pedido...</p>
        ) : order ? (
          <div className="bg-card-bg border border-border rounded-2xl p-6 mb-6">
            <div className="text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Pedido:</span>
                <span className="font-bold text-foreground">
                  #{order.order_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total:</span>
                <span className="font-semibold text-foreground">
                  R$ {Number(order.total).toFixed(2).replace(".", ",")}
                </span>
              </div>
              {order.shipping_method && (
                <div className="flex justify-between">
                  <span className="text-muted">Entrega:</span>
                  <span className="text-foreground">
                    {order.shipping_method} ({order.shipping_deadline})
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : orderNumber ? (
          <div className="bg-card-bg border border-border rounded-2xl p-6 mb-6">
            <p className="text-foreground">
              Pedido: <span className="font-bold">#{orderNumber}</span>
            </p>
          </div>
        ) : null}

        <p className="text-muted mb-8">
          Obrigado pela sua compra! Você receberá um e-mail com os detalhes do
          pedido e informações de rastreamento em breve.
        </p>

        <div className="bg-card-bg border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">O que acontece agora?</h2>
          <div className="space-y-3 text-left text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs">
                1
              </span>
              <p className="text-muted">
                Você receberá um e-mail de confirmação com os detalhes do pedido
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs">
                2
              </span>
              <p className="text-muted">
                Seu pedido será preparado e enviado em até 2 dias úteis
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 text-xs">
                3
              </span>
              <p className="text-muted">
                Você receberá o código de rastreamento por e-mail
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-border border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted">Carregando...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
