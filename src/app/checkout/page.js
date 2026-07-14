"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatBRL } from "@/lib/data";

const PAGAMENTOS = [
  { id: "pix", label: "Pix", ic: "⚡", desc: "Aprovação na hora" },
  { id: "credito", label: "Cartão de crédito", ic: "💳", desc: "Em até 3x sem juros" },
  { id: "dinheiro", label: "Dinheiro na entrega", ic: "💵", desc: "Troco para quanto?" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { state, subtotal, frete, total, setAddress, placeOrder } = useStore();
  const cart = state.cart;

  const [form, setForm] = useState(
    state.address || { nome: "", rua: "", numero: "", bairro: "", cidade: "Campo Grande", cep: "" }
  );
  const [pag, setPag] = useState("pix");

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

  function up(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function finalizar() {
    if (!form.nome || !form.rua || !form.numero || !form.bairro) {
      toast("Preencha o endereço de entrega", "⚠️");
      return;
    }
    setAddress(form);
    const order = {
      id: "PED" + Date.now().toString().slice(-6),
      itens: cart,
      subtotal,
      frete,
      total,
      endereco: form,
      pagamento: PAGAMENTOS.find((p) => p.id === pag)?.label,
      criadoEm: Date.now(),
      statusIndex: 0,
    };
    placeOrder(order);
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
        {PAGAMENTOS.map((p) => (
          <button
            key={p.id}
            className={`pay-opt ${pag === p.id ? "is-active" : ""}`}
            onClick={() => setPag(p.id)}
            style={{ width: "100%" }}
          >
            <span className="pay-opt__ic">{p.ic}</span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div>{p.label}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{p.desc}</div>
            </div>
            <span>{pag === p.id ? "🔘" : "⚪"}</span>
          </button>
        ))}
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
          Confirmar pedido · {formatBRL(total)}
        </button>
      </div>
    </>
  );
}
