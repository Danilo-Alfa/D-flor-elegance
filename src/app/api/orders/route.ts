import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Gerar número do pedido único
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DF${timestamp}${random}`;
}

// GET - Buscar pedidos (por email ou todos para admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const orderId = searchParams.get("id");
    const orderNumber = searchParams.get("order_number");

    let query = supabase.from("orders").select(`
      *,
      order_items (*)
    `);

    if (orderId) {
      query = query.eq("id", orderId);
    } else if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    } else if (email) {
      query = query.eq("customer_email", email);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar pedidos" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// POST - Criar novo pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer, items, shipping, totals, mercadopago_preference_id } =
      body;

    // Validações básicas
    if (!customer || !items || !items.length || !shipping || !totals) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_cpf: customer.cpf,
        shipping_address: {
          street: shipping.address.street,
          number: shipping.address.number,
          complement: shipping.address.complement,
          neighborhood: shipping.address.neighborhood,
          city: shipping.address.city,
          state: shipping.address.state,
          zip_code: shipping.address.zipCode,
        },
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping,
        discount: totals.discount || 0,
        total: totals.total,
        shipping_method: shipping.method,
        shipping_deadline: shipping.deadline,
        status: "pending_payment",
        mercadopago_preference_id: mercadopago_preference_id,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Erro ao criar pedido:", orderError);
      return NextResponse.json(
        { error: "Erro ao criar pedido" },
        { status: 500 },
      );
    }

    // Criar itens do pedido
    const orderItems = items.map(
      (item: {
        id: string;
        name: string;
        image?: string;
        quantity: number;
        price: number;
        selectedSize?: string;
        selectedColor?: string;
      }) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        selected_size: item.selectedSize,
        selected_color: item.selectedColor,
      }),
    );

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Erro ao criar itens do pedido:", itemsError);
      // Deletar pedido se falhar ao criar itens
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Erro ao criar itens do pedido" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
