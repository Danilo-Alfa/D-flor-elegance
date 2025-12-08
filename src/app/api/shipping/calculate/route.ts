import { NextRequest, NextResponse } from "next/server";

interface FreteResponse {
  name: string;
  price: string;
  delivery_time: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { cepDestino } = await request.json();

    const cepOrigem = process.env.CEP_ORIGEM || "01310100";

    const cepDestinoLimpo = cepDestino.replace(/\D/g, "");
    const cepOrigemLimpo = cepOrigem.replace(/\D/g, "");

    if (cepDestinoLimpo.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido" },
        { status: 400 }
      );
    }

    const opcoes = calcularFretePorRegiao(cepOrigemLimpo, cepDestinoLimpo);

    return NextResponse.json({ opcoes });
  } catch (error) {
    console.error("Erro ao calcular frete:", error);

    return NextResponse.json({
      opcoes: [
        { codigo: "PAC", nome: "PAC", preco: 24.90, prazo: 8 },
        { codigo: "SEDEX", nome: "SEDEX", preco: 39.90, prazo: 3 }
      ]
    });
  }
}

function calcularFretePorRegiao(cepOrigem: string, cepDestino: string) {
  const regiaoOrigem = parseInt(cepOrigem[0]);
  const regiaoDestino = parseInt(cepDestino[0]);

  const mesmaRegiao = regiaoOrigem === regiaoDestino;

  const regioesProximas: Record<number, number[]> = {
    0: [1, 2, 3],
    1: [0, 2, 3, 8],
    2: [0, 1, 3],
    3: [0, 1, 2, 4, 7],
    4: [3, 5, 7],
    5: [4, 6],
    6: [5, 7],
    7: [3, 4, 6, 8, 9],
    8: [1, 7, 9],
    9: [7, 8]
  };

  const regiaoProxima = regioesProximas[regiaoOrigem]?.includes(regiaoDestino);

  let precoPAC: number;
  let precoSEDEX: number;
  let prazoPAC: number;
  let prazoSEDEX: number;

  // === VALORES REALISTAS PARA ROUPAS (PAC/SEDEX) ===
  if (mesmaRegiao) {
    precoPAC = 19.90;
    precoSEDEX = 29.90;
    prazoPAC = 5;
    prazoSEDEX = 2;
  } else if (regiaoProxima) {
    precoPAC = 24.90;
    precoSEDEX = 39.90;
    prazoPAC = 7;
    prazoSEDEX = 3;
  } else {
    precoPAC = 34.90;
    precoSEDEX = 54.90;
    prazoPAC = 12;
    prazoSEDEX = 5;
  }

  // Capital geralmente recebe mais rápido
  const ehCapital =
    cepDestino.endsWith("000") || parseInt(cepDestino.slice(-3)) < 100;

  if (!ehCapital) {
    prazoPAC += 2;
    prazoSEDEX += 1;
  }

  return [
    { codigo: "PAC", nome: "PAC", preco: precoPAC, prazo: prazoPAC },
    { codigo: "SEDEX", nome: "SEDEX", preco: precoSEDEX, prazo: prazoSEDEX }
  ];
}
