import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// URLs da API PagSeguro
const PAGSEGURO_API_URL =
  process.env.PAGSEGURO_SANDBOX === "true"
    ? "https://sandbox.api.pagseguro.com"
    : "https://api.pagseguro.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Webhook PagSeguro recebido:", JSON.stringify(body, null, 2));

    // PagSeguro envia o pedido completo na notificacao
    // Pode ser uma notificacao de charges (pagamento) ou do pedido
    const orderId = body.id;
    const referenceId = body.reference_id;
    const charges = body.charges || [];

    if (!referenceId) {
      console.error("Webhook sem reference_id");
      return NextResponse.json({ received: true });
    }

    // Verificar se ha charges (pagamentos)
    let orderStatus = "pending_payment";
    let paymentStatus = "WAITING";
    let paymentMethod = "pix";

    if (charges.length > 0) {
      const charge = charges[0];
      paymentStatus = charge.status;
      paymentMethod = charge.payment_method?.type || "pix";

      // Mapear status do PagSeguro para status do pedido
      switch (paymentStatus) {
        case "PAID":
          orderStatus = "paid";
          break;
        case "AUTHORIZED":
        case "IN_ANALYSIS":
        case "WAITING":
          orderStatus = "pending_payment";
          break;
        case "DECLINED":
        case "CANCELED":
          orderStatus = "cancelled";
          break;
        default:
          orderStatus = "pending_payment";
      }
    }

    // Atualizar pedido no banco de dados
    const updateData: Record<string, unknown> = {
      pagseguro_order_id: orderId,
      payment_status: paymentStatus,
      payment_method: `pagseguro_${paymentMethod}`,
      status: orderStatus,
    };

    // Se pago, adicionar data de pagamento
    if (orderStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("order_number", referenceId);

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar pedido" },
        { status: 500 },
      );
    }

    // Se o pagamento foi aprovado, decrementar o estoque dos produtos
    if (orderStatus === "paid") {
      await decrementStock(referenceId);
    }

    console.log(`Pedido ${referenceId} atualizado para status: ${orderStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook PagSeguro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Funcao para decrementar estoque apos pagamento aprovado
async function decrementStock(orderNumber: string) {
  try {
    // Buscar pedido com itens
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_items (
          product_id,
          quantity
        )
      `,
      )
      .eq("order_number", orderNumber)
      .single();

    if (orderError || !order) {
      console.error(
        "Erro ao buscar pedido para atualizar estoque:",
        orderError,
      );
      return;
    }

    // Decrementar estoque de cada produto
    for (const item of order.order_items) {
      const { error: stockError } = await supabase.rpc("decrement_stock", {
        product_id: item.product_id,
        quantity: item.quantity,
      });

      if (stockError) {
        console.error(
          `Erro ao decrementar estoque do produto ${item.product_id}:`,
          stockError,
        );
      }
    }
  } catch (error) {
    console.error("Erro ao decrementar estoque:", error);
  }
}

// Endpoint GET para verificacao do webhook
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

// Endpoint para consultar status de um pedido (opcional, para polling)
export async function PUT(request: NextRequest) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return NextResponse.json(
        { error: "orderNumber obrigatorio" },
        { status: 400 },
      );
    }

    const token = process.env.PAGSEGURO_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "PagSeguro nao configurado" },
        { status: 500 },
      );
    }

    // Buscar pedido no banco
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("pagseguro_order_id, status, payment_status")
      .eq("order_number", orderNumber)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 },
      );
    }

    // Se ja esta pago, retornar status
    if (order.status === "paid") {
      return NextResponse.json({
        status: "paid",
        orderNumber,
      });
    }

    // Se tem ID do PagSeguro, consultar status atualizado
    if (order.pagseguro_order_id) {
      const response = await fetch(
        `${PAGSEGURO_API_URL}/orders/${order.pagseguro_order_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-version": "4.0",
          },
        },
      );

      if (response.ok) {
        const pagseguroOrder = await response.json();
        const charges = pagseguroOrder.charges || [];

        if (charges.length > 0 && charges[0].status === "PAID") {
          // Atualizar pedido como pago
          await supabase
            .from("orders")
            .update({
              status: "paid",
              payment_status: "PAID",
              paid_at: new Date().toISOString(),
            })
            .eq("order_number", orderNumber);

          // Decrementar estoque
          await decrementStock(orderNumber);

          return NextResponse.json({
            status: "paid",
            orderNumber,
          });
        }
      }
    }

    return NextResponse.json({
      status: order.status,
      paymentStatus: order.payment_status,
      orderNumber,
    });
  } catch (error) {
    console.error("Erro ao consultar status:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
