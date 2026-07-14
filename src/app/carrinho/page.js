"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { formatBRL } from "@/lib/data";

export default function CartPage() {
  const router = useRouter();
  const { state, subtotal, frete, total, setQtd, removeFromCart } = useStore();
  const cart = state.cart;
  const faltam = Math.max(0, 99 - subtotal);

  return (
    <>
      <header className="pagehead">
        <button className="back-btn" onClick={() => router.back()}>
          ‹
        </button>
        <span className="pagehead__title">Minha sacola</span>
      </header>

      {cart.length === 0 ? (
        <div className="empty">
          <div className="empty__emoji">🛒</div>
          <h3>Sua sacola está vazia</h3>
          <p>Adicione peças que você ama e receba em casa.</p>
          <Link href="/" className="btn btn--primary" style={{ marginTop: 18, display: "inline-flex" }}>
            Explorar produtos
          </Link>
        </div>
      ) : (
        <>
          {faltam > 0 ? (
            <div className="notice">
              🚚 Faltam <strong>{formatBRL(faltam)}</strong> para ganhar frete grátis!
            </div>
          ) : (
            <div className="notice" style={{ background: "#e6f6ee", color: "var(--accent)" }}>
              🎉 Você ganhou frete grátis!
            </div>
          )}

          <div className="list">
            {cart.map((i) => (
              <div key={i.key} className="citem">
                <img src={i.imagem} alt={i.nome} />
                <div className="citem__info">
                  <div className="citem__name">{i.nome}</div>
                  <div className="citem__var">
                    Tam: {i.tamanho} · Cor: {i.cor}
                  </div>
                  <div className="citem__foot">
                    <span className="price__now" style={{ fontSize: 15 }}>
                      {formatBRL(i.preco * i.qtd)}
                    </span>
                    <div className="qty qty--sm">
                      <button onClick={() => setQtd(i.key, i.qtd - 1)}>−</button>
                      <span>{i.qtd}</span>
                      <button onClick={() => setQtd(i.key, i.qtd + 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button className="link-danger" onClick={() => cart.forEach((i) => removeFromCart(i.key))} style={{ alignSelf: "flex-end" }}>
              Esvaziar sacola
            </button>
          </div>

          <div className="summary">
            <div className="summary__row">
              <span>Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="summary__row">
              <span>Entrega</span>
              <span className={frete === 0 ? "free-tag" : ""}>
                {frete === 0 ? "Grátis" : formatBRL(frete)}
              </span>
            </div>
            <div className="summary__row summary__row--total">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
          </div>

          <div style={{ padding: "4px 14px 24px" }}>
            <Link href="/checkout" className="btn btn--primary btn--block">
              Finalizar compra · {formatBRL(total)}
            </Link>
          </div>
        </>
      )}
    </>
  );
}
