import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Gerar numero do pedido unico
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DF${timestamp}${random}`;
}

// Interface para resposta do OpenPix
interface OpenPixChargeResponse {
  charge: {
    value: number;
    identifier: string;
    correlationID: string;
    transactionID: string;
    status: string;
    brCode: string;
    qrCodeImage: string;
    paymentLinkUrl: string;
    expiresIn: number;
    expiresDate: string;
    pixKey: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { items, payer, shipping, cartItems } = await request.json();

    // Verificar configuracao
    const appId = process.env.OPENPIX_APP_ID;
    if (!appId) {
      console.error("OPENPIX_APP_ID nao configurado");
      return NextResponse.json(
        { error: "OpenPix nao configurado" },
        { status: 500 }
      );
    }

    // Calcular totais
    const subtotal = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0
    );
    const shippingCost = shipping?.cost || 0;
    const total = subtotal + shippingCost;

    // Valor em centavos (OpenPix usa centavos)
    const valueInCents = Math.round(total * 100);

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
        payment_method: "pix_openpix",
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
        })
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Erro ao criar itens do pedido:", itemsError);
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          { error: "Erro ao criar itens do pedido" },
          { status: 500 }
        );
      }
    }

    // Preparar descricao dos itens
    const itemsDescription = cartItems
      .map((item: { name: string; quantity: number }) =>
        `${item.quantity}x ${item.name}`
      )
      .join(", ");

    // Preparar dados do cliente (opcional mas recomendado)
    const cleanCPF = payer.cpf ? payer.cpf.replace(/\D/g, "") : "";
    const cleanPhone = payer.phone?.area_code
      ? `55${payer.phone.area_code}${payer.phone.number}`
      : "";

    // Body para criar cobranca no OpenPix
    const chargeBody: {
      value: number;
      correlationID: string;
      comment: string;
      expiresIn: number;
      customer?: {
        name: string;
        email: string;
        phone?: string;
        taxID?: string;
      };
    } = {
      value: valueInCents,
      correlationID: orderNumber,
      comment: `Pedido ${orderNumber} - D'Flor Elegance`,
      expiresIn: 3600, // 1 hora em segundos
    };

    // Adicionar dados do cliente se disponiveis
    if (payer.name && payer.email) {
      chargeBody.customer = {
        name: payer.name,
        email: payer.email,
      };

      if (cleanPhone) {
        chargeBody.customer.phone = cleanPhone;
      }

      if (cleanCPF && cleanCPF.length === 11) {
        chargeBody.customer.taxID = cleanCPF;
      }
    }

    console.log("Criando cobranca OpenPix:", JSON.stringify(chargeBody, null, 2));

    // Criar cobranca no OpenPix
    const openpixResponse = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: {
        "Authorization": appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chargeBody),
    });

    if (!openpixResponse.ok) {
      const errorText = await openpixResponse.text();
      console.error("Erro OpenPix:", openpixResponse.status, errorText);

      // Deletar pedido criado
      await supabase.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: "Erro ao gerar PIX. Verifique as credenciais do OpenPix." },
        { status: 500 }
      );
    }

    const openpixData: OpenPixChargeResponse = await openpixResponse.json();

    if (!openpixData.charge || !openpixData.charge.brCode) {
      console.error("Resposta invalida do OpenPix:", openpixData);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Erro ao gerar QR Code PIX" },
        { status: 500 }
      );
    }

    console.log("Cobranca OpenPix criada:", openpixData.charge.identifier);

    // Atualizar pedido com ID da transacao OpenPix
    await supabase
      .from("orders")
      .update({
        payment_id: openpixData.charge.identifier,
        payment_details: {
          provider: "openpix",
          transactionID: openpixData.charge.transactionID,
          correlationID: openpixData.charge.correlationID,
          pixKey: openpixData.charge.pixKey,
        },
      })
      .eq("id", order.id);

    // Retornar dados do PIX para o frontend
    return NextResponse.json({
      orderNumber: orderNumber,
      total: total,
      pix: {
        qrCode: openpixData.charge.brCode,
        qrCodeImage: openpixData.charge.qrCodeImage,
        paymentLinkUrl: openpixData.charge.paymentLinkUrl,
        expiresIn: openpixData.charge.expiresIn,
        expiresAt: Math.floor(Date.now() / 1000) + openpixData.charge.expiresIn,
      },
    });
  } catch (error) {
    console.error("Erro ao criar cobranca OpenPix:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}

// GET - Verificar status do pagamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order_number");

    if (!orderNumber) {
      return NextResponse.json(
        { error: "order_number obrigatorio" },
        { status: 400 }
      );
    }

    // Buscar pedido no banco
    const { data: order, error } = await supabase
      .from("orders")
      .select("status, payment_id")
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 }
      );
    }

    // Se ja esta pago, retornar
    if (order.status === "paid") {
      return NextResponse.json({ status: "paid" });
    }

    // Se tem payment_id, verificar status no OpenPix
    if (order.payment_id) {
      const appId = process.env.OPENPIX_APP_ID;
      if (appId) {
        try {
          const response = await fetch(
            `https://api.openpix.com.br/api/v1/charge/${order.payment_id}`,
            {
              headers: {
                "Authorization": appId,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();

            if (data.charge?.status === "COMPLETED") {
              // Atualizar status no banco
              await supabase
                .from("orders")
                .update({
                  status: "paid",
                  paid_at: new Date().toISOString(),
                })
                .eq("order_number", orderNumber);

              return NextResponse.json({ status: "paid" });
            }
          }
        } catch (err) {
          console.error("Erro ao verificar status no OpenPix:", err);
        }
      }
    }

    return NextResponse.json({ status: order.status });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
