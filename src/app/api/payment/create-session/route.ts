import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

// Gerar numero do pedido unico
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DF${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const { items, payer, shipping, cartItems } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe nao configurado" },
        { status: 500 },
      );
    }

    // Calcular totais
    const subtotal = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0,
    );
    const shippingCost = shipping?.cost || 0;
    const total = subtotal + shippingCost;

    // Gerar numero do pedido
    const orderNumber = generateOrderNumber();

    // Criar pedido no banco de dados
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: payer.name,
        customer_email: payer.email,
        customer_phone: payer.phone?.area_code
          ? `${payer.phone.area_code}${payer.phone.number}`
          : null,
        customer_cpf: payer.cpf || null,
        shipping_address: {
          street: payer.address?.street_name || "",
          number: payer.address?.street_number || "",
          complement: payer.address?.complement || "",
          neighborhood: payer.address?.neighborhood || "",
          city: payer.address?.city || "",
          state: payer.address?.state || "",
          zip_code: payer.address?.zip_code || "",
        },
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount: 0,
        total: total,
        shipping_method: shipping?.method || null,
        shipping_deadline: shipping?.deadline || null,
        status: "pending_payment",
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
    if (cartItems && cartItems.length > 0) {
      const orderItems = cartItems.map(
        (item: {
          id: string;
          name: string;
          image_url?: string;
          quantity: number;
          price: number;
          selectedSize?: string;
          selectedColor?: string;
        }) => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          product_image: item.image_url,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          selected_size: item.selectedSize || null,
          selected_color: item.selectedColor || null,
        }),
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Erro ao criar itens do pedido:", itemsError);
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          { error: "Erro ao criar itens do pedido" },
          { status: 500 },
        );
      }
    }

    // Preparar line_items para o Stripe Checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cartItems.map(
        (item: {
          name: string;
          quantity: number;
          price: number;
          selectedSize?: string;
          selectedColor?: string;
        }) => ({
          price_data: {
            currency: "brl",
            product_data: {
              name: item.name,
              description:
                [
                  item.selectedSize ? `Tamanho: ${item.selectedSize}` : null,
                  item.selectedColor ? `Cor: ${item.selectedColor}` : null,
                ]
                  .filter(Boolean)
                  .join(" | ") || undefined,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }),
      );

    // Adicionar frete como item se existir
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: `Frete - ${shipping?.method || "Entrega"}`,
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // URL base do site
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_URL ||
      "http://localhost:3000";

    // Criar Checkout Session com modo embedded
    // NOTA: PIX esta desabilitado temporariamente ate ser ativado no Stripe Dashboard
    // Para ativar PIX: https://dashboard.stripe.com/settings/payment_methods
    // Quando ativado, adicione "pix" ao array payment_method_types
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: payer.email,
      return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      metadata: {
        order_number: orderNumber,
        order_id: order.id,
      },
    });

    // Atualizar pedido com o ID da sessao
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({
      clientSecret: session.client_secret,
      orderNumber: orderNumber,
    });
  } catch (error) {
    console.error("Erro ao criar sessao de checkout:", error);
    return NextResponse.json(
      { error: "Erro ao processar checkout" },
      { status: 500 },
    );
  }
}

// Endpoint para verificar status da sessao
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id nao fornecido" },
        { status: 400 },
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      customerEmail: session.customer_details?.email,
      orderNumber: session.metadata?.order_number,
    });
  } catch (error) {
    console.error("Erro ao verificar sessao:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 },
    );
  }
}
