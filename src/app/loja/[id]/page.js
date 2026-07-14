"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { storeAvatar } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function StorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { getStore, productsByStore } = useStore();
  const store = getStore(id);
  const items = productsByStore(id);

  if (!store) {
    return (
      <div className="empty">
        <div className="empty__emoji">🏚️</div>
        <h3>Loja não encontrada</h3>
        <Link href="/" className="btn btn--primary" style={{ marginTop: 16, display: "inline-flex" }}>
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="pagehead">
        <button className="back-btn" onClick={() => router.back()}>
          ‹
        </button>
        <span className="pagehead__title">Loja</span>
      </header>

      <div style={{ background: "#fff", padding: "16px 14px", boxShadow: "var(--shadow)" }}>
        <div className="store" style={{ boxShadow: "none", padding: 0 }}>
          <div className="store__avatar" style={{ width: 64, height: 64 }}>
            <img src={storeAvatar(store)} alt={store.nome} />
          </div>
          <div className="store__info">
            <div className="store__name">
              {store.nome}
              {store.selo && <span className="selo">{store.selo}</span>}
            </div>
            <div className="store__meta">
              <span className="rating">★ {store.rating}</span>
              <span className="dot" />
              <span>{store.avaliacoes.toLocaleString("pt-BR")} avaliações</span>
            </div>
            <div className="store__meta" style={{ marginTop: 4 }}>
              <span>🛵 {store.tempo}</span>
              <span className="dot" />
              <span className={store.frete === 0 ? "free-tag" : ""}>
                {store.frete === 0 ? "Frete grátis" : `Frete R$ ${store.frete.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
        {store.cupom && (
          <div className="notice" style={{ marginTop: 12, borderRadius: 10 }}>
            🎟️ {store.cupom}
          </div>
        )}
      </div>

      <section className="section">
        <div className="section__head">
          <span className="section__title">Produtos ({items.length})</span>
        </div>
        <div className="grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <BottomNav />
    </>
  );
}
