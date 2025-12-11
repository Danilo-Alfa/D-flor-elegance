import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json();

    if (!orderNumber) {
      return NextResponse.json(
        { error: "Numero do pedido nao fornecido" },
        { status: 400 }
      );
    }

    // Atualizar status do pedido para pago
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: "card",
      })
      .eq("order_number", orderNumber)
      .eq("status", "pending_payment") // So atualiza se ainda estiver pendente
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar pedido:", error);
      return NextResponse.json(
        { error: "Erro ao confirmar pagamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
