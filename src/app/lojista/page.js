"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useStore, ORDER_STEPS } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatBRL, storeAvatar } from "@/lib/data";

export default function LojistaPage() {
  const router = useRouter();
  const toast = useToast();
  const { currentUser, myStore, productsByStore, deleteProduct, ordersForStore } = useStore();
  const [tab, setTab] = useState("produtos");

  if (!currentUser || currentUser.tipo !== "lojista") {
    return <Gate router={router} />;
  }

  const produtos = productsByStore(myStore.id);
  const pedidos = ordersForStore(myStore.id);
  const faturamento = pedidos.reduce(
    (s, o) => s + o.itens.filter((i) => i.storeId === myStore.id).reduce((a, i) => a + i.preco * i.qtd, 0),
    0
  );

  return (
    <>
      <header className="pagehead">
        <Link href="/perfil" className="back-btn">‹</Link>
        <span className="pagehead__title">Painel da loja</span>
      </header>

      {/* Header da loja */}
      <div style={{ background: "#fff", padding: 14, boxShadow: "var(--shadow)" }}>
        <div className="store" style={{ boxShadow: "none", padding: 0 }}>
          <div className="store__avatar"><img src={storeAvatar(myStore)} alt={myStore.nome} /></div>
          <div className="store__info">
            <div className="store__name">{myStore.nome} <span className="selo">{myStore.selo}</span></div>
            <div className="store__meta">
              <span className="rating">★ {myStore.rating.toFixed(1)}</span>
              <span className="dot" />
              <span>🔑 Pix: {myStore.pixTipo}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <MiniStat label="Produtos" value={produtos.length} />
          <MiniStat label="Pedidos" value={pedidos.length} />
          <MiniStat label="Faturamento" value={formatBRL(faturamento)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={tab === "produtos" ? "is-active" : ""} onClick={() => setTab("produtos")}>
          Produtos
        </button>
        <button className={tab === "pedidos" ? "is-active" : ""} onClick={() => setTab("pedidos")}>
          Pedidos {pedidos.length > 0 && `(${pedidos.length})`}
        </button>
      </div>

      {tab === "produtos" && (
        <div style={{ padding: 14 }}>
          <Link href="/lojista/produto" className="btn btn--primary btn--block" style={{ marginBottom: 14 }}>
            ➕ Cadastrar produto
          </Link>
          {produtos.length === 0 ? (
            <div className="empty">
              <div className="empty__emoji">📦</div>
              <h3>Nenhum produto ainda</h3>
              <p>Cadastre seu primeiro produto para começar a vender.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {produtos.map((p) => (
                <div key={p.id} className="citem">
                  <img src={p.imagem} alt={p.nome} />
                  <div className="citem__info">
                    <div className="citem__name">{p.nome}</div>
                    <div className="citem__var">{formatBRL(p.preco)} · {p.vendidos} vendidos</div>
                    <div className="citem__foot">
                      <Link href={`/lojista/produto?id=${p.id}`} className="search__go">Editar</Link>
                      <button
                        className="link-danger"
                        onClick={() => {
                          deleteProduct(p.id);
                          toast("Produto removido", "🗑️");
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pedidos" && (
        <div style={{ padding: 14 }}>
          {pedidos.length === 0 ? (
            <div className="empty">
              <div className="empty__emoji">🧾</div>
              <h3>Sem pedidos ainda</h3>
              <p>Quando alguém comprar, o pedido aparece aqui.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pedidos.map((o) => {
                const meus = o.itens.filter((i) => i.storeId === myStore.id);
                const step = ORDER_STEPS[o.statusIndex];
                return (
                  <div key={o.id} className="ocard">
                    <div className="ocard__head">
                      <strong>#{o.id}</strong>
                      <span className={`ostatus ${o.statusIndex >= 4 ? "entregue" : "andamento"}`}>
                        {step.emoji} {step.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      {meus.reduce((a, i) => a + i.qtd, 0)} item(ns) · {o.pagamento?.resumo}
                    </div>
                    <div className="ocard__items">
                      {meus.map((i) => <img key={i.key} src={i.imagem} alt={i.nome} />)}
                    </div>
                    <div className="summary__row" style={{ padding: 0 }}>
                      <span style={{ fontSize: 13 }}>🛵 {o.rider?.nome}</span>
                      <strong>{formatBRL(meus.reduce((a, i) => a + i.preco * i.qtd, 0))}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontWeight: 900, fontSize: 15 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function Gate({ router }) {
  return (
    <>
      <header className="pagehead">
        <Link href="/" className="back-btn">‹</Link>
        <span className="pagehead__title">Painel da loja</span>
      </header>
      <div className="empty">
        <div className="empty__emoji">🏬</div>
        <h3>Área do lojista</h3>
        <p>Entre como lojista ou abra sua loja para cadastrar produtos.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Link href="/entrar" className="btn btn--outline">Entrar</Link>
          <Link href="/cadastro?tipo=lojista" className="btn btn--primary">Abrir loja</Link>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
