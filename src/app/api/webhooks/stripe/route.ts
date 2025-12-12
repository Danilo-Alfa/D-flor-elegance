import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Stripe webhook event:", event.type);

    // Processar eventos do Stripe
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderNumber = paymentIntent.metadata.order_number;

        if (orderNumber) {
          // Atualizar status do pedido para pago
          const { error } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: paymentIntent.payment_method_types[0],
            })
            .eq("order_number", orderNumber);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Pedido ${orderNumber} marcado como pago`);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderNumber = paymentIntent.metadata.order_number;

        if (orderNumber) {
          // Atualizar status do pedido para falha
          const { error } = await supabase
            .from("orders")
            .update({
              status: "payment_failed",
              failure_reason:
                paymentIntent.last_payment_error?.message || "Pagamento falhou",
            })
            .eq("order_number", orderNumber);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(
              `Pedido ${orderNumber} marcado como falha no pagamento`,
            );
          }
        }
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderNumber = paymentIntent.metadata.order_number;

        if (orderNumber) {
          const { error } = await supabase
            .from("orders")
            .update({ status: "canceled" })
            .eq("order_number", orderNumber);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Pedido ${orderNumber} cancelado`);
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Buscar pedido pelo payment_intent_id
          const { data: order, error: findError } = await supabase
            .from("orders")
            .select("order_number")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single();

          if (order && !findError) {
            const { error } = await supabase
              .from("orders")
              .update({ status: "refunded" })
              .eq("order_number", order.order_number);

            if (error) {
              console.error("Erro ao atualizar pedido:", error);
            } else {
              console.log(`Pedido ${order.order_number} reembolsado`);
            }
          }
        }
        break;
      }

      // Embedded Checkout - sessao completada
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number;

        if (orderNumber) {
          // Verificar se o pagamento foi realmente concluido
          if (session.payment_status === "paid") {
            const { error } = await supabase
              .from("orders")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                payment_method: session.payment_method_types?.[0] || "card",
                stripe_session_id: session.id,
              })
              .eq("order_number", orderNumber);

            if (error) {
              console.error("Erro ao atualizar pedido:", error);
            } else {
              console.log(
                `Pedido ${orderNumber} marcado como pago via Checkout`,
              );
            }
          } else if (session.payment_status === "unpaid") {
            // Para PIX, o pagamento pode vir depois
            console.log(`Pedido ${orderNumber} aguardando pagamento PIX`);
          }
        }
        break;
      }

      // Pagamento assincrono completado (PIX via Checkout)
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number;

        if (orderNumber) {
          const { error } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "pix",
            })
            .eq("order_number", orderNumber);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Pedido ${orderNumber} pago via PIX (async)`);
          }
        }
        break;
      }

      // Pagamento assincrono falhou
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.order_number;

        if (orderNumber) {
          const { error } = await supabase
            .from("orders")
            .update({
              status: "payment_failed",
              failure_reason: "Pagamento PIX expirou ou falhou",
            })
            .eq("order_number", orderNumber);

          if (error) {
            console.error("Erro ao atualizar pedido:", error);
          } else {
            console.log(`Pedido ${orderNumber} - pagamento PIX falhou`);
          }
        }
        break;
      }

      default:
        console.log(`Evento nao tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
