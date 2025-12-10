import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mercado Pago envia diferentes tipos de notificação
    // Estamos interessados em notificações de pagamento
    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;

    if (!paymentId) {
      console.error("Webhook sem ID de pagamento");
      return NextResponse.json({ error: "ID de pagamento não fornecido" }, { status: 400 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN não configurado");
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (!paymentData) {
      console.error("Pagamento não encontrado:", paymentId);
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
    }

    const orderNumber = paymentData.external_reference;

    if (!orderNumber) {
      console.error("Pedido não encontrado na referência externa");
      return NextResponse.json({ error: "Referência externa não encontrada" }, { status: 400 });
    }

    // Mapear status do Mercado Pago para status do pedido
    let orderStatus = "pending_payment";
    switch (paymentData.status) {
      case "approved":
        orderStatus = "paid";
        break;
      case "pending":
      case "in_process":
        orderStatus = "pending_payment";
        break;
      case "rejected":
      case "cancelled":
        orderStatus = "cancelled";
        break;
      case "refunded":
        orderStatus = "refunded";
        break;
    }

    // Atualizar pedido no banco de dados
    const updateData: Record<string, unknown> = {
      mercadopago_payment_id: paymentId.toString(),
      payment_status: paymentData.status,
      payment_method: paymentData.payment_method_id,
      status: orderStatus,
    };

    // Se aprovado, adicionar data de pagamento
    if (orderStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("order_number", orderNumber);

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError);
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 });
    }

    // Se o pagamento foi aprovado, decrementar o estoque dos produtos
    if (orderStatus === "paid") {
      await decrementStock(orderNumber);
    }

    console.log(`Pedido ${orderNumber} atualizado para status: ${orderStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Função para decrementar estoque após pagamento aprovado
async function decrementStock(orderNumber: string) {
  try {
    // Buscar pedido com itens
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id,
        order_items (
          product_id,
          quantity
        )
      `)
      .eq("order_number", orderNumber)
      .single();

    if (orderError || !order) {
      console.error("Erro ao buscar pedido para atualizar estoque:", orderError);
      return;
    }

    // Decrementar estoque de cada produto
    for (const item of order.order_items) {
      const { error: stockError } = await supabase.rpc("decrement_stock", {
        product_id: item.product_id,
        quantity: item.quantity,
      });

      if (stockError) {
        console.error(`Erro ao decrementar estoque do produto ${item.product_id}:`, stockError);
      }
    }
  } catch (error) {
    console.error("Erro ao decrementar estoque:", error);
  }
}

// Endpoint GET para verificação do webhook (Mercado Pago pode fazer isso)
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
