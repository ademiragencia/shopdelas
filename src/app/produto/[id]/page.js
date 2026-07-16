"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatBRL, storeAvatar } from "@/lib/data";

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, toggleFavorite, isFavorite, count, getProduct, getStore, ready } = useStore();
  const product = getProduct(id);
  const toast = useToast();

  const [tamanho, setTamanho] = useState(null);
  const [cor, setCor] = useState(product?.cores?.[0]?.nome ?? null);
  const [qtd, setQtd] = useState(1);

  if (!product) {
    if (!ready) {
      return (
        <div className="empty">
          <div className="empty__emoji">⏳</div>
          <h3>Carregando produto...</h3>
        </div>
      );
    }
    return (
      <div className="empty">
        <div className="empty__emoji">🫥</div>
        <h3>Produto não encontrado</h3>
        <Link href="/" className="btn btn--primary" style={{ marginTop: 16, display: "inline-flex" }}>
          Voltar à loja
        </Link>
      </div>
    );
  }

  const store = getStore(product.storeId);
  const off = product.precoAntigo
    ? Math.round((1 - product.preco / product.precoAntigo) * 100)
    : 0;

  function ensureSelection() {
    if (!tamanho) {
      toast("Selecione um tamanho", "⚠️");
      return false;
    }
    return true;
  }

  function handleAdd() {
    if (!ensureSelection()) return;
    addToCart(product, tamanho, cor, qtd);
    toast("Adicionado à sacola");
  }

  function handleBuy() {
    if (!ensureSelection()) return;
    addToCart(product, tamanho, cor, qtd);
    router.push("/checkout");
  }

  return (
    <>
      <header className="pagehead" style={{ position: "absolute", background: "transparent", border: "none", width: "100%" }}>
        <button className="back-btn" onClick={() => router.back()} style={{ background: "rgba(255,255,255,.9)", borderRadius: "50%" }}>
          ‹
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="back-btn" onClick={() => toggleFavorite(product.id)} style={{ background: "rgba(255,255,255,.9)", borderRadius: "50%" }}>
            {isFavorite(product.id) ? "❤️" : "🤍"}
          </button>
          <Link href="/carrinho" className="back-btn" style={{ background: "rgba(255,255,255,.9)", borderRadius: "50%", position: "relative" }}>
            🛒
            {count > 0 && <span className="badge">{count}</span>}
          </Link>
        </div>
      </header>

      <div className="pd-hero">
        <img src={product.imagem} alt={product.nome} />
      </div>

      <div className="pd-body">
        <div className="pd-price">
          <span className="price__now">{formatBRL(product.preco)}</span>
          {product.precoAntigo && <span className="price__old">{formatBRL(product.precoAntigo)}</span>}
          {off > 0 && <span className="pcard__off" style={{ position: "static" }}>-{off}%</span>}
        </div>
        <h1 className="pd-name">{product.nome}</h1>
        <div className="pd-sub">
          <span className="rating">★ {product.rating.toFixed(1)}</span>
          <span>· {product.vendidos.toLocaleString("pt-BR")} vendidos</span>
          <span>· em até {product.parcelas}x sem juros</span>
        </div>

        {/* Tamanhos */}
        <div className="pd-section">
          <h4>Tamanho {tamanho ? `· ${tamanho}` : ""}</h4>
          <div className="opts">
            {product.tamanhos.map((t) => (
              <button key={t} className={`opt ${tamanho === t ? "is-active" : ""}`} onClick={() => setTamanho(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cores */}
        {product.cores?.length > 0 && (
          <div className="pd-section">
            <h4>Cor · {cor}</h4>
            <div className="opts">
              {product.cores.map((c) => (
                <button key={c.nome} className={`opt color-opt ${cor === c.nome ? "is-active" : ""}`} onClick={() => setCor(c.nome)}>
                  <span className="swatch" style={{ background: c.hex }} />
                  {c.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantidade */}
        <div className="pd-section">
          <h4>Quantidade</h4>
          <div className="qty">
            <button onClick={() => setQtd((q) => Math.max(1, q - 1))}>−</button>
            <span>{qtd}</span>
            <button onClick={() => setQtd((q) => q + 1)}>+</button>
          </div>
        </div>

        {/* Descrição */}
        <div className="pd-section">
          <h4>Descrição</h4>
          <p className="pd-desc">{product.descricao}</p>
        </div>

        {/* Loja */}
        {store && (
          <Link href={`/loja/${store.id}`} className="pd-store">
            <img src={storeAvatar(store)} alt={store.nome} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{store.nome}</div>
              <div className="store__meta">
                <span className="rating">★ {store.rating}</span>
                <span className="dot" />
                <span>🛵 {store.tempo}</span>
              </div>
            </div>
            <span className="chev">›</span>
          </Link>
        )}
      </div>

      <div className="buybar">
        <button className="btn btn--outline" onClick={handleAdd}>
          🛒 Adicionar
        </button>
        <button className="btn btn--primary" onClick={handleBuy}>
          Comprar agora
        </button>
      </div>
    </>
  );
}
