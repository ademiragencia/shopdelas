// Consulta o status de um pagamento Pix no Mercado Pago.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return Response.json({ error: "sem token" }, { status: 500 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id ausente" }, { status: 400 });

  try {
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await resp.json();
    if (!resp.ok) return Response.json({ error: "não encontrado" }, { status: 404 });
    // status: pending | approved | rejected | cancelled ...
    return Response.json({ status: data.status, status_detail: data.status_detail });
  } catch {
    return Response.json({ error: "falha" }, { status: 502 });
  }
}
