"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatBRL } from "@/lib/data";
import { qr } from "@/lib/image";

const ENTREGA_METODOS = [
  { id: "cartao", label: "Cartão (maquininha)", ic: "💳" },
  { id: "dinheiro", label: "Dinheiro", ic: "💵" },
  { id: "pix", label: "Pix na entrega", ic: "📱" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { state, subtotal, frete, total, setAddress, placeOrder, getStore } = useStore();
  const cart = state.cart;

  const [form, setForm] = useState(
    state.address || { nome: "", rua: "", numero: "", bairro: "", cidade: "Campo Grande", cep: "" }
  );
  const [modo, setModo] = useState("pix_online"); // 'pix_online' | 'entrega'
  const [metodoEntrega, setMetodoEntrega] = useState("cartao");

  // Lojas presentes na sacola (para o Pix online por loja)
  const lojasNaSacola = useMemo(() => {
    const map = {};
    cart.forEach((i) => {
      if (!map[i.storeId]) map[i.storeId] = { store: getStore(i.storeId), valor: 0 };
      map[i.storeId].valor += i.preco * i.qtd;
    });
    return Object.values(map).filter((x) => x.store);
  }, [cart, getStore]);

  if (cart.length === 0) {
    return (
      <>
        <header className="pagehead">
          <button className="back-btn" onClick={() => router.push("/")}>‹</button>
          <span className="pagehead__title">Checkout</span>
        </header>
        <div className="empty">
          <div className="empty__emoji">🛒</div>
          <h3>Nada para finalizar</h3>
          <Link href="/" className="btn btn--primary" style={{ marginTop: 16, display: "inline-flex" }}>
            Voltar às compras
          </Link>
        </div>
      </>
    );
  }

  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function copiar(chave) {
    navigator?.clipboard?.writeText(chave).then(
      () => toast("Chave Pix copiada 📋"),
      () => toast("Copie a chave manualmente", "⚠️")
    );
  }

  function finalizar() {
    if (!form.nome || !form.rua || !form.numero || !form.bairro) {
      return toast("Preencha o endereço de entrega", "⚠️");
    }
    setAddress(form);

    const pagamento =
      modo === "pix_online"
        ? {
            modo: "pix_online",
            resumo: "Pix online (pago à loja)",
            pago: true,
            pixKeys: lojasNaSacola.map((l) => ({
              loja: l.store.nome,
              chave: l.store.pixKey,
              tipo: l.store.pixTipo,
              valor: l.valor,
            })),
          }
        : {
            modo: "entrega",
            resumo: `Na entrega · ${ENTREGA_METODOS.find((m) => m.id === metodoEntrega)?.label}`,
            metodo: metodoEntrega,
            pago: false,
          };

    const order = placeOrder({
      itens: cart,
      subtotal,
      frete,
      total,
      endereco: form,
      pagamento,
    });
    toast("Pedido confirmado! 🎉");
    router.push(`/pedido/${order.id}`);
  }

  return (
    <>
      <header className="pagehead">
        <button className="back-btn" onClick={() => router.back()}>‹</button>
        <span className="pagehead__title">Finalizar pedido</span>
      </header>

      {/* Endereço */}
      <div className="card-block">
        <h3>📍 Endereço de entrega</h3>
        <div className="field">
          <label>Nome completo</label>
          <input value={form.nome} onChange={(e) => up("nome", e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="field">
          <label>Rua / Avenida</label>
          <input value={form.rua} onChange={(e) => up("rua", e.target.value)} placeholder="Ex: Av. Afonso Pena" />
        </div>
        <div className="row2">
          <div className="field">
            <label>Número</label>
            <input value={form.numero} onChange={(e) => up("numero", e.target.value)} placeholder="123" />
          </div>
          <div className="field">
            <label>CEP</label>
            <input value={form.cep} onChange={(e) => up("cep", e.target.value)} placeholder="79000-000" />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label>Bairro</label>
            <input value={form.bairro} onChange={(e) => up("bairro", e.target.value)} placeholder="Centro" />
          </div>
          <div className="field">
            <label>Cidade</label>
            <input value={form.cidade} onChange={(e) => up("cidade", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Pagamento */}
      <div className="card-block">
        <h3>💳 Forma de pagamento</h3>
        <button className={`pay-opt ${modo === "pix_online" ? "is-active" : ""}`} onClick={() => setModo("pix_online")} style={{ width: "100%" }}>
          <span className="pay-opt__ic">⚡</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div>Pix online</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Pague agora na chave Pix da loja</div>
          </div>
          <span>{modo === "pix_online" ? "🔘" : "⚪"}</span>
        </button>
        <button className={`pay-opt ${modo === "entrega" ? "is-active" : ""}`} onClick={() => setModo("entrega")} style={{ width: "100%" }}>
          <span className="pay-opt__ic">🛵</span>
          <div style={{ textAlign: "left", flex: 1 }}>
            <div>Pagar na entrega</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Cartão, dinheiro ou pix ao receber</div>
          </div>
          <span>{modo === "entrega" ? "🔘" : "⚪"}</span>
        </button>

        {/* Pix online — chaves por loja */}
        {modo === "pix_online" && (
          <div style={{ marginTop: 12 }}>
            {lojasNaSacola.map((l) => (
              <div key={l.store.id} className="pix-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{l.store.emoji} {l.store.nome}</strong>
                  <span className="price__now" style={{ fontSize: 15 }}>{formatBRL(l.valor)}</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
                  <img src={qr(l.store.pixKey)} alt="QR Pix" style={{ width: 84, height: 84, borderRadius: 8, border: "1px solid var(--line)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Chave Pix ({l.store.pixTipo})</div>
                    <div style={{ fontWeight: 700, wordBreak: "break-all", fontSize: 14 }}>{l.store.pixKey}</div>
                    <button className="btn btn--outline" style={{ padding: "8px 12px", marginTop: 8, fontSize: 13 }} onClick={() => copiar(l.store.pixKey)}>
                      📋 Copiar chave
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <p className="helper" style={{ padding: "6px 0 0" }}>
              Você paga direto para cada loja. Ao confirmar, o pedido já entra como <strong>pago</strong>.
            </p>
          </div>
        )}

        {/* Na entrega — método */}
        {modo === "entrega" && (
          <div style={{ marginTop: 12 }}>
            {ENTREGA_METODOS.map((m) => (
              <button key={m.id} className={`pay-opt ${metodoEntrega === m.id ? "is-active" : ""}`} onClick={() => setMetodoEntrega(m.id)} style={{ width: "100%" }}>
                <span className="pay-opt__ic">{m.ic}</span>
                <div style={{ flex: 1, textAlign: "left" }}>{m.label}</div>
                <span>{metodoEntrega === m.id ? "🔘" : "⚪"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="summary">
        <div className="summary__row">
          <span>Itens ({cart.reduce((s, i) => s + i.qtd, 0)})</span>
          <span>{formatBRL(subtotal)}</span>
        </div>
        <div className="summary__row">
          <span>Entrega</span>
          <span className={frete === 0 ? "free-tag" : ""}>{frete === 0 ? "Grátis" : formatBRL(frete)}</span>
        </div>
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
      </div>

      <div style={{ padding: "4px 14px 30px" }}>
        <button className="btn btn--primary btn--block" onClick={finalizar}>
          {modo === "pix_online" ? "Já paguei · Confirmar pedido" : "Confirmar pedido"} · {formatBRL(total)}
        </button>
      </div>
    </>
  );
}
