"use client";

import { useEffect, useRef } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

interface MercadoPagoBrickProps {
  preferenceId: string;
  orderNumber: string;
  total: number;
  onSuccess?: (orderNumber: string) => void;
  onError?: (error: string) => void;
}

export function MercadoPagoBrick({
  preferenceId,
  orderNumber,
  total,
  onError,
}: MercadoPagoBrickProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!publicKey) {
      console.error("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY nao configurada");
      onError?.("Configuracao do Mercado Pago incompleta");
      return;
    }

    // Inicializar Mercado Pago SDK
    initMercadoPago(publicKey, {
      locale: "pt-BR",
    });

    initialized.current = true;
  }, [onError]);

  return (
    <div className="space-y-6">
      {/* Resumo do pedido */}
      <div className="text-center p-6 bg-secondary rounded-xl">
        <h3 className="text-lg font-bold mb-2">
          Total: R$ {total.toFixed(2).replace(".", ",")}
        </h3>
        <p className="text-sm text-muted">Pedido: {orderNumber}</p>
      </div>

      {/* Wallet Brick - Botao do Mercado Pago */}
      <div className="rounded-xl overflow-hidden">
        <Wallet
          initialization={{ preferenceId }}
          onError={(error) => {
            console.error("Erro no Wallet Brick:", error);
            onError?.("Erro ao carregar metodo de pagamento");
          }}
        />
      </div>

      {/* Informacoes adicionais */}
      <div className="p-4 bg-secondary rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-5 h-5 text-sky-600 dark:text-sky-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span className="font-medium">Pagamento Seguro</span>
        </div>
        <p className="text-sm text-muted">
          Clique no botao acima para escolher entre PIX, cartao de credito,
          debito ou boleto. Processado pelo Mercado Pago.
        </p>
      </div>

      {/* Metodos aceitos */}
      <div className="flex items-center justify-center gap-4 text-muted">
        <div className="flex items-center gap-1 text-xs">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>PIX</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect
              x="1"
              y="4"
              width="22"
              height="16"
              rx="2"
              ry="2"
              strokeWidth="2"
            />
            <line x1="1" y1="10" x2="23" y2="10" strokeWidth="2" />
          </svg>
          <span>Cartao</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Boleto</span>
        </div>
      </div>
    </div>
  );
}
