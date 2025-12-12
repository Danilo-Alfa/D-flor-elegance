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
    const { items, payer, shipping, cartItems, paymentMethod } =
      await request.json();

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

    // Converter para centavos (Stripe trabalha com a menor unidade da moeda)
    const amountInCents = Math.round(total * 100);

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

    // Descricao dos itens para o Stripe
    const description = cartItems
      .map(
        (item: { name: string; quantity: number }) =>
          `${item.quantity}x ${item.name}`,
      )
      .join(", ");

    // Criar PaymentIntent baseado no metodo de pagamento
    if (paymentMethod === "pix") {
      // Criar PaymentIntent para PIX ja confirmado
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "brl",
        payment_method_types: ["pix"],
        payment_method_data: {
          type: "pix",
        },
        confirm: true,
        description: description,
        metadata: {
          order_number: orderNumber,
          order_id: order.id,
        },
      });

      // Atualizar pedido com o ID do PaymentIntent
      await supabase
        .from("orders")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", order.id);

      // Extrair dados do PIX
      const pixData = paymentIntent.next_action?.pix_display_qr_code;

      return NextResponse.json({
        type: "pix",
        clientSecret: paymentIntent.client_secret,
        orderNumber: orderNumber,
        pixData: pixData
          ? {
              qrCode: pixData.data,
              qrCodeBase64: pixData.image_url_png,
              expiresAt: pixData.expires_at,
            }
          : null,
      });
    } else {
      // Criar PaymentIntent para cartao
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "brl",
        payment_method_types: ["card"],
        description: description,
        metadata: {
          order_number: orderNumber,
          order_id: order.id,
        },
      });

      // Atualizar pedido com o ID do PaymentIntent
      await supabase
        .from("orders")
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq("id", order.id);

      return NextResponse.json({
        type: "card",
        clientSecret: paymentIntent.client_secret,
        orderNumber: orderNumber,
      });
    }
  } catch (error) {
    console.error("Erro ao criar PaymentIntent:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 },
    );
  }
}
