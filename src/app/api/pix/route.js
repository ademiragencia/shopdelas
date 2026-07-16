// Cria uma cobrança Pix real no Mercado Pago (lado servidor).
// O Access Token fica APENAS em variável de ambiente (MP_ACCESS_TOKEN) — nunca no código.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return Response.json(
      { error: "Pagamento indisponível: defina MP_ACCESS_TOKEN nas variáveis de ambiente." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { amount, email, descricao, codigo } = body || {};
  const valor = Number(amount);
  if (!valor || valor <= 0) {
    return Response.json({ error: "Valor inválido" }, { status: 400 });
  }

  try {
    const resp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Idempotency-Key": codigo || `viste-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: Math.round(valor * 100) / 100,
        description: descricao || "Pedido Vistê",
        payment_method_id: "pix",
        payer: { email: email || "cliente@viste.app" },
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return Response.json(
        { error: data?.message || "Erro ao gerar Pix no Mercado Pago" },
        { status: 400 }
      );
    }

    const tx = data?.point_of_interaction?.transaction_data || {};
    return Response.json({
      id: data.id,
      status: data.status, // pending
      qr_code: tx.qr_code, // copia e cola
      qr_code_base64: tx.qr_code_base64, // imagem PNG base64
      ticket_url: tx.ticket_url,
    });
  } catch (e) {
    return Response.json({ error: "Falha ao contatar o Mercado Pago" }, { status: 502 });
  }
}
