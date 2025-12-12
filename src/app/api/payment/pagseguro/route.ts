import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Gerar numero do pedido unico
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DF${timestamp}${random}`;
}

// URLs da API PagSeguro
const PAGSEGURO_API_URL =
  process.env.PAGSEGURO_SANDBOX === "true"
    ? "https://sandbox.api.pagseguro.com"
    : "https://api.pagseguro.com";

export async function POST(request: NextRequest) {
  try {
    const { items, payer, shipping, cartItems } = await request.json();

    // Verificar configuracao
    const token = process.env.PAGSEGURO_TOKEN;
    if (!token) {
      console.error("PAGSEGURO_TOKEN nao configurado");
      return NextResponse.json(
        { error: "PagSeguro nao configurado" },
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
        payment_method: "pagseguro_pix",
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

    // Criar itens do pedido no banco
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

    // Preparar itens para o PagSeguro Checkout (valores em centavos)
    const pagseguroItems = cartItems.map(
      (item: { name: string; quantity: number; price: number }) => ({
        reference_id: item.name.substring(0, 64), // Max 64 chars
        name: item.name.substring(0, 64),
        quantity: item.quantity,
        unit_amount: Math.round(item.price * 100), // Converter para centavos
      }),
    );

    // Adicionar frete como item se houver
    if (shippingCost > 0) {
      pagseguroItems.push({
        reference_id: "frete",
        name: `Frete - ${shipping?.method || "Entrega"}`.substring(0, 64),
        quantity: 1,
        unit_amount: Math.round(shippingCost * 100),
      });
    }

    // URL base
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isLocalhost = baseUrl.includes("localhost");

    // Preparar body para PagSeguro Checkout API
    // Usando payment_methods para aceitar APENAS PIX
    const checkoutBody: Record<string, unknown> = {
      reference_id: orderNumber,
      customer: {
        name: payer.name || "Cliente",
        email: payer.email,
        tax_id: payer.cpf?.replace(/\D/g, "") || undefined,
        phones: payer.phone?.area_code
          ? [
              {
                country: "55",
                area: payer.phone.area_code,
                number: payer.phone.number,
                type: "MOBILE",
              },
            ]
          : undefined,
      },
      items: pagseguroItems,
      // IMPORTANTE: Aceitar APENAS PIX
      payment_methods: [
        {
          type: "PIX",
        },
      ],
      // URLs de retorno
      redirect_url: `${baseUrl}/checkout/success?order=${orderNumber}`,
      // Expiracao em 24 horas
      expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // Adicionar webhook apenas se NAO for localhost
    if (!isLocalhost) {
      checkoutBody.notification_urls = [`${baseUrl}/api/webhooks/pagseguro`];
    }

    console.log(
      "Criando checkout PagSeguro (PIX only):",
      JSON.stringify(checkoutBody, null, 2),
    );

    // Fazer requisicao para PagSeguro Checkout API
    const response = await fetch(`${PAGSEGURO_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-api-version": "4.0",
      },
      body: JSON.stringify(checkoutBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Erro PagSeguro Checkout:", responseData);

      // Deletar pedido criado
      await supabase.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        {
          error: "Erro ao criar checkout",
          message:
            responseData.error_messages?.[0]?.description ||
            "Erro desconhecido",
          details: responseData,
        },
        { status: 500 },
      );
    }

    console.log("Checkout PagSeguro criado:", responseData.id);

    // Extrair link de pagamento
    const payLink = responseData.links?.find(
      (link: { rel: string }) => link.rel === "PAY",
    );

    if (!payLink) {
      console.error("Link de pagamento nao retornado:", responseData);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Link de pagamento nao gerado" },
        { status: 500 },
      );
    }

    // Atualizar pedido com ID do PagSeguro
    await supabase
      .from("orders")
      .update({
        pagseguro_checkout_id: responseData.id,
      })
      .eq("id", order.id);

    // Retornar URL de checkout (redirect)
    return NextResponse.json({
      type: "redirect",
      orderNumber: orderNumber,
      checkoutId: responseData.id,
      checkoutUrl: payLink.href,
      total: total,
    });
  } catch (error) {
    console.error("Erro ao criar checkout PagSeguro:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 },
    );
  }
}
