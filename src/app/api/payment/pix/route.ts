import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Gerar numero do pedido unico
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DF${timestamp}${random}`;
}

// Validar CPF
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os digitos sao iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  // Validacao dos digitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;

  return true;
}

// Inicializar cliente Mercado Pago (lazy)
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
        payment_method: "pix",
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
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json(
          { error: "Erro ao criar itens do pedido" },
          { status: 500 }
        );
      }
    }

    // Descricao dos itens
    const description = cartItems
      .map((item: { name: string; quantity: number }) => `${item.quantity}x ${item.name}`)
      .join(", ")
      .substring(0, 200);

    // Criar cliente Mercado Pago
    const client = getMercadoPagoClient();
    const payment = new Payment(client);

    // Data de expiracao (1 hora)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    // Preparar dados do pagador
    const cleanCPF = payer.cpf ? payer.cpf.replace(/\D/g, "") : "";
    const hasValidCPF = cleanCPF && isValidCPF(cleanCPF);

    // Preparar body do pagamento
    const paymentBody = {
      transaction_amount: total,
      description: description,
      payment_method_id: "pix",
      payer: {
        email: payer.email,
        first_name: payer.name?.split(" ")[0] || "Cliente",
        last_name: payer.name?.split(" ").slice(1).join(" ") || "",
        ...(hasValidCPF && {
          identification: {
            type: "CPF",
            number: cleanCPF,
          },
        }),
      },
      external_reference: orderNumber,
      date_of_expiration: expirationDate.toISOString(),
    };

    // Log para debug
    console.log("Criando pagamento PIX com:", JSON.stringify(paymentBody, null, 2));
    console.log("Access Token (primeiros 20 chars):", process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20) + "...");

    // Criar pagamento PIX no Mercado Pago
    let mpPayment;
    try {
      mpPayment = await payment.create({
        body: paymentBody,
        requestOptions: {
          idempotencyKey: crypto.randomUUID(),
        },
      });
    } catch (mpError: unknown) {
      console.error("Erro detalhado do Mercado Pago:", mpError);

      // Deletar pedido criado
      await supabase.from("orders").delete().eq("id", order.id);

      // Extrair mensagem de erro
      const errorMessage = mpError instanceof Error
        ? mpError.message
        : typeof mpError === 'object' && mpError !== null
          ? JSON.stringify(mpError)
          : "Erro desconhecido";

      return NextResponse.json(
        {
          error: "Erro ao gerar PIX. Verifique as credenciais do Mercado Pago.",
          details: errorMessage
        },
        { status: 500 }
      );
    }

    if (!mpPayment || !mpPayment.id) {
      console.error("Pagamento criado mas sem ID:", mpPayment);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Erro ao gerar PIX - resposta invalida" },
        { status: 500 }
      );
    }

    console.log("Pagamento PIX criado com sucesso:", mpPayment.id);

    // Extrair dados do PIX
    const transactionData = mpPayment.point_of_interaction?.transaction_data;

    if (!transactionData?.qr_code) {
      console.error("QR Code nao retornado pelo Mercado Pago");
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Erro ao gerar QR Code PIX" },
        { status: 500 }
      );
    }

    // Atualizar pedido com o ID do pagamento
    await supabase
      .from("orders")
      .update({
        mercadopago_payment_id: mpPayment.id.toString(),
      })
      .eq("id", order.id);

    // Retornar dados do PIX
    return NextResponse.json({
      type: "pix",
      orderNumber: orderNumber,
      paymentId: mpPayment.id,
      pixData: {
        qrCode: transactionData.qr_code, // Codigo copia e cola
        qrCodeBase64: transactionData.qr_code_base64, // Imagem Base64 do QR Code
        expiresAt: Math.floor(expirationDate.getTime() / 1000),
      },
      total: total,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento PIX:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento PIX" },
      { status: 500 }
    );
  }
}

// Endpoint para verificar status do pagamento PIX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order_number");

    if (!orderNumber) {
      return NextResponse.json(
        { error: "order_number nao fornecido" },
        { status: 400 }
      );
    }

    // Buscar pedido no banco
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("mercadopago_payment_id, status")
      .eq("order_number", orderNumber)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 }
      );
    }

    // Se ja esta pago no banco, retornar
    if (order.status === "paid") {
      return NextResponse.json({
        status: "paid",
        orderNumber: orderNumber,
      });
    }

    // Se nao tem payment_id, ainda esta pendente
    if (!order.mercadopago_payment_id) {
      return NextResponse.json({
        status: "pending",
        orderNumber: orderNumber,
      });
    }

    // Verificar status no Mercado Pago
    const client = getMercadoPagoClient();
    const payment = new Payment(client);

    const mpPayment = await payment.get({
      id: order.mercadopago_payment_id,
    });

    // Mapear status do Mercado Pago
    let status = "pending";
    if (mpPayment.status === "approved") {
      status = "paid";
      // Atualizar status no banco
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("order_number", orderNumber);
    } else if (mpPayment.status === "cancelled" || mpPayment.status === "rejected") {
      status = "failed";
    }

    return NextResponse.json({
      status: status,
      orderNumber: orderNumber,
      mpStatus: mpPayment.status,
    });
  } catch (error) {
    console.error("Erro ao verificar status PIX:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
