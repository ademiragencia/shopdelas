"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatBRL } from "@/lib/data";

const ENTREGA_METODOS = [
  { id: "cartao", label: "Cartão (maquininha)", ic: "💳" },
  { id: "dinheiro", label: "Dinheiro", ic: "💵" },
  { id: "pix", label: "Pix na entrega", ic: "📱" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { state, subtotal, frete, total, setAddress, placeOrder, getStore, currentUser } = useStore();
  const cart = state.cart;
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState(
    state.address || { nome: "", rua: "", numero: "", bairro: "", cidade: "Campo Grande", cep: "" }
  );
  const [modo, setModo] = useState("pix_online"); // 'pix_online' | 'entrega'
  const [metodoEntrega, setMetodoEntrega] = useState("cartao");
  const [home, setHome] = useState(null);
  const [pix, setPix] = useState(null); // { id, qr_code, qr_code_base64 }
  const [gerando, setGerando] = useState(false);
  const [aguardando, setAguardando] = useState(false);

  // Confere o pagamento Pix no Mercado Pago a cada 4s
  useEffect(() => {
    if (!aguardando || !pix?.id) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/pix/status?id=${pix.id}`);
        const d = await r.json();
        if (d.status === "approved") {
          clearInterval(t);
          setAguardando(false);
          confirmarPago();
        } else if (d.status === "rejected" || d.status === "cancelled") {
          clearInterval(t);
          setAguardando(false);
          toast("Pagamento não aprovado. Tente de novo.", "⚠️");
        }
      } catch {}
    }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aguardando, pix?.id]);

  function usarLocalizacao() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return toast("GPS indisponível neste aparelho", "⚠️");
    }
    toast("Obtendo sua localização...", "📍");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setHome({ lat: p.coords.latitude, lng: p.coords.longitude });
        toast("Localização de entrega definida 📍");
      },
      () => toast("Não foi possível obter o GPS", "⚠️"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

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

  function validar() {
    if (!form.nome || !form.rua || !form.numero || !form.bairro) {
      toast("Preencha o endereço de entrega", "⚠️");
      return false;
    }
    if (!currentUser) {
      toast("Entre na sua conta para finalizar", "🔒");
      router.push("/entrar");
      return false;
    }
    return true;
  }

  async function criarPedido(pagamento) {
    setAddress(form);
    const homeGeo = home || { lat: -20.4697 + (Math.random() - 0.5) * 0.03, lng: -54.6201 + (Math.random() - 0.5) * 0.03 };
    const res = await placeOrder({ subtotal, frete, total, endereco: form, pagamento, home: homeGeo });
    if (!res.ok) {
      toast(res.erro || "Não foi possível criar o pedido", "⚠️");
      return false;
    }
    router.push(`/pedido/${res.codigo}`);
    return true;
  }

  async function finalizarEntrega() {
    if (!validar()) return;
    setEnviando(true);
    const ok = await criarPedido({
      modo: "entrega",
      resumo: `Na entrega · ${ENTREGA_METODOS.find((m) => m.id === metodoEntrega)?.label}`,
      metodo: metodoEntrega,
      pago: false,
    });
    setEnviando(false);
    if (ok) toast("Pedido confirmado! 🎉");
  }

  async function gerarPix() {
    if (!validar()) return;
    setGerando(true);
    const codigo = "V" + Date.now().toString().slice(-6);
    try {
      const r = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, email: currentUser?.email, descricao: "Pedido Vistê", codigo }),
      });
      const d = await r.json();
      if (!r.ok) {
        setGerando(false);
        return toast(d.error || "Erro ao gerar Pix", "⚠️");
      }
      setPix({ ...d, codigo });
      setAguardando(true);
    } catch {
      toast("Falha ao gerar o Pix", "⚠️");
    }
    setGerando(false);
  }

  async function confirmarPago() {
    const ok = await criarPedido({
      modo: "pix_online",
      resumo: "Pix (Mercado Pago) — pago",
      pago: true,
      mpPaymentId: pix?.id,
    });
    if (ok) toast("Pagamento aprovado! 🎉");
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
        <button
          className="btn btn--outline btn--block"
          style={{ marginBottom: 12, padding: "10px 12px" }}
          onClick={usarLocalizacao}
        >
          {home ? "✅ Localização definida — toque para atualizar" : "📍 Usar minha localização atual"}
        </button>
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

        {/* Pix online — Mercado Pago */}
        {modo === "pix_online" && (
          <div style={{ marginTop: 12 }}>
            {!pix ? (
              <p className="helper" style={{ padding: "0 0 2px" }}>
                Ao gerar, você paga com o app do seu banco escaneando o QR ou com o Pix copia-e-cola. O pedido é confirmado <strong>assim que o pagamento cair</strong>.
              </p>
            ) : (
              <div className="pix-box">
                <div style={{ textAlign: "center" }}>
                  {pix.qr_code_base64 ? (
                    <img
                      src={`data:image/png;base64,${pix.qr_code_base64}`}
                      alt="QR Code Pix"
                      style={{ width: 190, height: 190, margin: "0 auto", borderRadius: 8 }}
                    />
                  ) : (
                    <div style={{ padding: 20 }}>QR indisponível — use o copia-e-cola abaixo</div>
                  )}
                  <div style={{ fontWeight: 800, marginTop: 6 }}>{formatBRL(total)}</div>
                  <div style={{ color: aguardando ? "var(--primary)" : "var(--accent)", fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                    {aguardando ? "⏳ Aguardando pagamento..." : "Pronto"}
                  </div>
                </div>
                {pix.qr_code && (
                  <>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>Pix copia-e-cola</div>
                    <div style={{ fontSize: 11, wordBreak: "break-all", background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: 8, marginTop: 4 }}>
                      {pix.qr_code}
                    </div>
                    <button className="btn btn--outline btn--block" style={{ marginTop: 8, fontSize: 13, padding: "10px" }} onClick={() => copiar(pix.qr_code)}>
                      📋 Copiar código Pix
                    </button>
                  </>
                )}
              </div>
            )}
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
        {modo === "entrega" ? (
          <button className="btn btn--primary btn--block" onClick={finalizarEntrega} disabled={enviando}>
            {enviando ? "Enviando..." : "Confirmar pedido"} · {formatBRL(total)}
          </button>
        ) : !pix ? (
          <button className="btn btn--primary btn--block" onClick={gerarPix} disabled={gerando}>
            {gerando ? "Gerando Pix..." : `Gerar Pix · ${formatBRL(total)}`}
          </button>
        ) : (
          <button className="btn btn--outline btn--block" disabled>
            {aguardando ? "⏳ Aguardando pagamento..." : "Processando..."}
          </button>
        )}
      </div>
    </>
  );
}
