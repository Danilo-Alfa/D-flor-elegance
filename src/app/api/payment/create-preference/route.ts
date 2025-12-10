import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabase } from "@/lib/supabase";

// Gerar número do pedido único
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DF${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const { items, payer, shipping, cartItems } = await request.json();

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado" },
        { status: 500 }
      );
    }

    // Pega a URL base: da env, ou do header origin, ou fallback localhost
    const origin = request.headers.get("origin") || request.headers.get("referer")?.split("/").slice(0, 3).join("/");
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin || "http://localhost:3000";

    // Garantir que a URL não termina com /
    baseUrl = baseUrl.replace(/\/$/, "");

    console.log("Base URL para pagamento:", baseUrl);

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // Calcular totais
    const subtotal = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0
    );
    const shippingCost = shipping?.cost || 0;
    const total = subtotal + shippingCost;

    // Gerar número do pedido
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
        { status: 500 }
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
        })
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Erro ao criar itens do pedido:", itemsError);
        // Deletar pedido se falhar
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          { error: "Erro ao criar itens do pedido" },
          { status: 500 }
        );
      }
    }

    // Construir URLs de retorno
    const successUrl = `${baseUrl}/checkout/success?order=${orderNumber}`;
    const failureUrl = `${baseUrl}/checkout/failure?order=${orderNumber}`;
    const pendingUrl = `${baseUrl}/checkout/pending?order=${orderNumber}`;

    console.log("URLs de retorno:", { successUrl, failureUrl, pendingUrl });

    const preferenceData = {
      items: items.map((item: { title: string; quantity: number; unit_price: number; id: string }) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "BRL",
      })),
      payer: {
        name: payer.name,
        email: payer.email,
        phone: {
          area_code: payer.phone?.area_code || "",
          number: payer.phone?.number || "",
        },
        address: {
          street_name: payer.address?.street_name || "",
          street_number: payer.address?.street_number || "",
          zip_code: payer.address?.zip_code || "",
        },
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      // auto_return desabilitado para testes com localhost
      // auto_return: "approved" as const,
      statement_descriptor: "DFLOR ELEGANCE",
      external_reference: orderNumber,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    };

    const response = await preference.create({ body: preferenceData });

    // Atualizar pedido com o ID da preferência do Mercado Pago
    await supabase
      .from("orders")
      .update({ mercadopago_preference_id: response.id })
      .eq("id", order.id);

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error("Erro ao criar preferência:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}
