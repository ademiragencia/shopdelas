"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useStore, ORDER_STEPS } from "@/lib/store";
import { formatBRL } from "@/lib/data";

export default function OrdersPage() {
  const { state } = useStore();
  const orders = state.orders;

  return (
    <>
      <header className="pagehead" style={{ justifyContent: "center" }}>
        <span className="pagehead__title">Meus pedidos</span>
      </header>

      {orders.length === 0 ? (
        <div className="empty">
          <div className="empty__emoji">🧾</div>
          <h3>Nenhum pedido ainda</h3>
          <p>Quando você comprar, seus pedidos aparecem aqui com rastreamento em tempo real.</p>
          <Link href="/" className="btn btn--primary" style={{ marginTop: 18, display: "inline-flex" }}>
            Começar a comprar
          </Link>
        </div>
      ) : (
        <div className="list">
          {orders.map((o) => {
            const entregue = o.statusIndex >= 4;
            const step = ORDER_STEPS[o.statusIndex];
            return (
              <Link key={o.id} href={`/pedido/${o.id}`} className="ocard">
                <div className="ocard__head">
                  <strong>#{o.id}</strong>
                  <span className={`ostatus ${entregue ? "entregue" : "andamento"}`}>
                    {step.emoji} {step.label}
                  </span>
                </div>
                <div className="ocard__items">
                  {o.itens.slice(0, 5).map((i) => (
                    <img key={i.key} src={i.imagem} alt={i.nome} />
                  ))}
                </div>
                <div className="summary__row" style={{ padding: 0 }}>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    {o.itens.reduce((s, i) => s + i.qtd, 0)} itens ·{" "}
                    {new Date(o.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                  <strong>{formatBRL(o.total)}</strong>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <BottomNav />
    </>
  );
}
