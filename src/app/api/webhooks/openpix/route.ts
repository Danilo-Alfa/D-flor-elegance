import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Verificar assinatura do webhook OpenPix
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  webhookSecret: string
): boolean {
  if (!signature || !webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const webhookSecret = process.env.OPENPIX_WEBHOOK_SECRET;

    // Verificar assinatura (opcional, mas recomendado em producao)
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error("Assinatura do webhook OpenPix invalida");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("OpenPix webhook event:", event.event, event);

    // Processar eventos do OpenPix
    switch (event.event) {
      // Cobranca paga (PIX recebido)
      case "OPENPIX:CHARGE_COMPLETED": {
        const charge = event.charge;
        const correlationID = charge?.correlationID;

        if (correlationID) {
          // Atualizar status do pedido para pago
          const { error } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "pix",
              openpix_transaction_id: event.pix?.transactionID || charge?.transactionID,
            })
            .eq("order_number", correlationID);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Pedido ${correlationID} marcado como pago via PIX OpenPix`);
          }
        }
        break;
      }

      // Cobranca expirada
      case "OPENPIX:CHARGE_EXPIRED": {
        const charge = event.charge;
        const correlationID = charge?.correlationID;

        if (correlationID) {
          const { error } = await supabase
            .from("orders")
            .update({
              status: "expired",
              failure_reason: "PIX expirado",
            })
            .eq("order_number", correlationID);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Pedido ${correlationID} expirado`);
          }
        }
        break;
      }

      // Cobranca criada
      case "OPENPIX:CHARGE_CREATED": {
        const charge = event.charge;
        console.log(`Cobranca PIX criada: ${charge?.correlationID}`);
        break;
      }

      // Transacao PIX recebida (confirmacao adicional)
      case "OPENPIX:TRANSACTION_RECEIVED": {
        const pix = event.pix;
        const charge = pix?.charge;
        const correlationID = charge?.correlationID;

        if (correlationID) {
          // Garantir que o pedido esta marcado como pago
          const { error } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "pix",
            })
            .eq("order_number", correlationID);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Transacao PIX confirmada para pedido ${correlationID}`);
          }
        }
        break;
      }

      // Reembolso realizado
      case "OPENPIX:TRANSACTION_REFUND_RECEIVED": {
        const refund = event.refund;
        const correlationID = refund?.correlationID;

        if (correlationID) {
          const { error } = await supabase
            .from("orders")
            .update({ status: "refunded" })
            .eq("order_number", correlationID);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Pedido ${correlationID} reembolsado`);
          }
        }
        break;
      }

      default:
        console.log(`Evento OpenPix nao tratado: ${event.event}`);
    }

    // Retornar 200 para confirmar recebimento
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook OpenPix:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Endpoint GET para teste de configuracao do webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "OpenPix webhook endpoint is active",
  });
}
