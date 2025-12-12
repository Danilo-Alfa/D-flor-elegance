import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password === adminPassword) {
      return NextResponse.json({
        success: true,
        message: "Login realizado com sucesso",
      });
    }

    return NextResponse.json(
      { success: false, message: "Senha incorreta" },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Erro ao processar requisição" },
      { status: 500 },
    );
  }
}
