import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Buscar pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar pedido:", error);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar pedido (status, código de rastreio, etc)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    // Campos que podem ser atualizados
    if (body.status) {
      updateData.status = body.status;

      // Atualizar timestamps baseado no status
      if (body.status === "paid") {
        updateData.paid_at = new Date().toISOString();
      } else if (body.status === "shipped") {
        updateData.shipped_at = new Date().toISOString();
      } else if (body.status === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    if (body.tracking_code) {
      updateData.tracking_code = body.tracking_code;
    }

    if (body.mercadopago_payment_id) {
      updateData.mercadopago_payment_id = body.mercadopago_payment_id;
    }

    if (body.payment_method) {
      updateData.payment_method = body.payment_method;
    }

    if (body.payment_status) {
      updateData.payment_status = body.payment_status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado para atualizar" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar pedido:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar pedido" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
