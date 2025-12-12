import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabase } from "@/lib/supabase";

// Gerar numero do pedido unico
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DF${timestamp}${random}`;
}

// Inicializar cliente Mercado Pago
function getMercadoPagoClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN nao configurado");
  }
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { items, payer, shipping, cartItems } = await request.json();

    // Verificar configuracao
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Mercado Pago nao configurado" },
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
        payment_method: "mercadopago_brick",
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

    // Preparar itens para a preferencia (com todos os campos para homologacao)
    const preferenceItems = cartItems.map(
      (item: {
        id: string;
        name: string;
        description?: string;
        quantity: number;
        price: number;
        image_url?: string;
        category?: string;
      }) => ({
        id: item.id,
        title: item.name,
        description: item.description || item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: "BRL",
        picture_url: item.image_url || undefined,
        category_id: item.category || "others",
      }),
    );

    // Adicionar frete como item separado se houver
    if (shippingCost > 0) {
      preferenceItems.push({
        id: "shipping",
        title: `Frete - ${shipping?.method || "Entrega"}`,
        description: shipping?.deadline || "Entrega padrao",
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "BRL",
        category_id: "services",
      });
    }

    // URL base
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Criar cliente Mercado Pago
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    // Criar preferencia com todos os campos para homologacao
    const mpPreference = await preference.create({
      body: {
        items: preferenceItems,
        payer: {
          name: payer.name?.split(" ")[0] || "Cliente",
          surname: payer.name?.split(" ").slice(1).join(" ") || "",
          email: payer.email,
          phone: payer.phone?.area_code
            ? {
                area_code: payer.phone.area_code,
                number: payer.phone.number,
              }
            : undefined,
          address: payer.address?.street_name
            ? {
                street_name: payer.address.street_name,
                street_number: String(payer.address.street_number || "0"),
                zip_code: payer.address.zip_code,
              }
            : undefined,
        },
        back_urls: {
          success: `${baseUrl}/checkout/success?order=${orderNumber}`,
          failure: `${baseUrl}/checkout?error=payment_failed&order=${orderNumber}`,
          pending: `${baseUrl}/checkout/success?order=${orderNumber}&status=pending`,
        },
        auto_return: "approved",
        external_reference: orderNumber,
        statement_descriptor: "DFLOR ELEGANCE",
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 12,
        },
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
        },
      },
    });

    if (!mpPreference || !mpPreference.id) {
      console.error("Erro ao criar preferencia:", mpPreference);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Erro ao criar preferencia de pagamento" },
        { status: 500 },
      );
    }

    console.log("Preferencia criada para Brick:", mpPreference.id);

    // Retornar dados para o Brick
    return NextResponse.json({
      preferenceId: mpPreference.id,
      orderNumber: orderNumber,
      total: total,
      publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("Erro ao criar preferencia para Brick:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 },
    );
  }
}
