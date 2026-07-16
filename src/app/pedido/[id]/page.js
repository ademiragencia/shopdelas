"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useStore, ORDER_STEPS } from "@/lib/store";
import { formatBRL } from "@/lib/data";
import MapTrack from "@/components/MapTrack";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function OrderTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getOrder, ready } = useStore();
  const order = getOrder(id);

  if (!order && !ready) {
    return (
      <div className="empty">
        <div className="empty__emoji">⏳</div>
        <h3>Carregando pedido...</h3>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty">
        <div className="empty__emoji">📭</div>
        <h3>Pedido não encontrado</h3>
        <Link href="/pedidos" className="btn btn--primary" style={{ marginTop: 16, display: "inline-flex" }}>
          Ver meus pedidos
        </Link>
      </div>
    );
  }

  const entregue = order.statusIndex >= 4;
  const step = ORDER_STEPS[order.statusIndex];
  const eta = 45 - order.statusIndex * 10;

  return (
    <>
      <header className="pagehead" style={{ position: "absolute", background: "transparent", border: "none", width: "100%", zIndex: 41 }}>
        <button className="back-btn" onClick={() => router.push("/pedidos")} style={{ color: "#fff" }}>
          ‹
        </button>
      </header>

      <div className="track-hero">
        <div className="emoji">{step.emoji}</div>
        <h2>{step.label}</h2>
        <p>
          {entregue
            ? "Seu pedido foi entregue. Obrigado! 💛"
            : `Chega em aproximadamente ${eta} min`}
        </p>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>Pedido #{order.id}</div>
      </div>

      {/* Mapa de rastreamento */}
      {order.rider && (order.storeCoord || order.geo?.store) && (
        <div style={{ padding: "14px 14px 0" }}>
          {order.geo?.store && order.geo?.home ? (
            <LiveMap
              store={order.geo.store}
              home={order.geo.home}
              rider={order.geo.rider || order.geo.store}
              badge={entregue ? "✅ Entregue" : `🛵 ${order.rider.nome?.split(" ")[0]} a caminho`}
            />
          ) : (
            <MapTrack order={order} />
          )}
          <div className="rider-card">
            <div className="rider-card__ava">{order.rider.emoji || "🛵"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{order.rider.nome}</div>
              <div className="store__meta">
                <span className="rating">★ {order.rider.rating?.toFixed(1)}</span>
                <span className="dot" />
                <span>{order.rider.veiculo} · {order.rider.placa}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="tel:+5567000000000" className="rider-btn">📞</a>
              <button className="rider-btn">💬</button>
            </div>
          </div>
        </div>
      )}

      {/* Etapas */}
      <div className="steps">
        {ORDER_STEPS.map((s, idx) => {
          const cls =
            idx < order.statusIndex ? "done" : idx === order.statusIndex ? "current" : "pending";
          return (
            <div key={idx} className={`step ${cls}`}>
              {idx < ORDER_STEPS.length - 1 && <span className="step__line" />}
              <div className="step__dot">{idx < order.statusIndex ? "✓" : s.emoji}</div>
              <div className="step__txt">
                <strong>{s.label}</strong>
                <p>{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entrega */}
      <div className="card-block">
        <h3>📍 Endereço de entrega</h3>
        <p style={{ margin: 0, color: "#444", fontSize: 14, lineHeight: 1.5 }}>
          {order.endereco.nome}
          <br />
          {order.endereco.rua}, {order.endereco.numero} — {order.endereco.bairro}
          <br />
          {order.endereco.cidade} {order.endereco.cep && `· ${order.endereco.cep}`}
        </p>
      </div>

      {/* Itens */}
      <div className="card-block">
        <h3>🛍️ Itens do pedido</h3>
        {order.itens.map((i) => (
          <div key={i.key} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
            <img src={i.imagem} alt={i.nome} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{i.nome}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                {i.qtd}x · Tam {i.tamanho} · {i.cor}
              </div>
            </div>
            <strong>{formatBRL(i.preco * i.qtd)}</strong>
          </div>
        ))}
        <div className="summary__row" style={{ paddingTop: 12 }}>
          <span>Pagamento</span>
          <span>{order.pagamento?.resumo}</span>
        </div>
        {order.pagamento?.modo === "pix_online" && (
          <div className="notice" style={{ borderRadius: 10, marginTop: 8, background: "#e6f6ee", color: "var(--accent)" }}>
            ✅ Pagamento Pix confirmado
          </div>
        )}
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span>{formatBRL(order.total)}</span>
        </div>
      </div>

      <div style={{ padding: "4px 14px 30px" }}>
        <Link href="/" className="btn btn--outline btn--block">
          Voltar à loja
        </Link>
      </div>
    </>
  );
}
