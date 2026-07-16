"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { categories } from "@/lib/data";

const TIPOS = [
  { id: "cliente", label: "Cliente", emoji: "🛍️", desc: "Comprar roupas" },
  { id: "lojista", label: "Lojista", emoji: "🏬", desc: "Vender na Vistê" },
  { id: "entregador", label: "Entregador", emoji: "🛵", desc: "Fazer entregas" },
];

const EMOJIS_LOJA = ["🏬", "👗", "👕", "👟", "👜", "🧥", "🧸", "🕶️", "👑", "✨"];
const PIX_TIPOS = ["E-mail", "Telefone", "CPF", "CNPJ", "Aleatória"];

function CadastroInner() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const { register, loginGoogle } = useStore();

  async function entrarGoogle() {
    const res = await loginGoogle();
    if (!res.ok) return toast(res.erro, "⚠️");
    toast("Conta conectada! 🎉");
    router.push(res.user?.tipo === "lojista" ? "/lojista" : res.user?.tipo === "entregador" ? "/entregador" : "/");
  }

  const [tipo, setTipo] = useState(params.get("tipo") || "cliente");
  const [f, setF] = useState({
    nome: "",
    email: "",
    senha: "",
    storeNome: "",
    categoria: "feminino",
    emoji: "🏬",
    pixKey: "",
    pixTipo: "E-mail",
    veiculo: "",
    placa: "",
    storeLat: null,
    storeLng: null,
  });

  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));

  function localizarLoja() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return toast("GPS indisponível neste aparelho", "⚠️");
    }
    toast("Obtendo localização da loja...", "📍");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((s) => ({ ...s, storeLat: p.coords.latitude, storeLng: p.coords.longitude }));
        toast("Localização da loja definida 📍");
      },
      () => toast("Não foi possível obter o GPS", "⚠️"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const [salvando, setSalvando] = useState(false);

  async function submit() {
    if (!f.nome || !f.email || !f.senha) return toast("Preencha nome, e-mail e senha", "⚠️");
    if (f.senha.length < 6) return toast("Senha de no mínimo 6 caracteres", "⚠️");
    if (tipo === "lojista" && !f.storeNome) return toast("Informe o nome da loja", "⚠️");
    if (tipo === "lojista" && !f.pixKey) return toast("Informe a chave Pix da loja", "⚠️");
    if (tipo === "entregador" && !f.veiculo) return toast("Informe seu veículo", "⚠️");

    // fallback: se não definiu no mapa, usa o centro de Campo Grande
    const payload = { tipo, ...f };
    if (tipo === "lojista" && payload.storeLat == null) {
      payload.storeLat = -20.4697 + (Math.random() - 0.5) * 0.04;
      payload.storeLng = -54.6201 + (Math.random() - 0.5) * 0.04;
    }

    setSalvando(true);
    const res = await register(payload);
    setSalvando(false);
    if (!res.ok) return toast(res.erro, "⚠️");
    if (res.precisaConfirmar) {
      toast("Enviamos um e-mail de confirmação 📧", "📧");
      return router.push("/entrar");
    }
    toast("Conta criada! 🎉");
    router.push(tipo === "lojista" ? "/lojista" : tipo === "entregador" ? "/entregador" : "/");
  }

  return (
    <>
      <header className="pagehead">
        <button className="back-btn" onClick={() => router.back()}>‹</button>
        <span className="pagehead__title">Criar conta</span>
      </header>

      <div className="card-block">
        <h3>Quero me cadastrar como</h3>
        <div className="tipos">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              className={`tipo ${tipo === t.id ? "is-active" : ""}`}
              onClick={() => setTipo(t.id)}
            >
              <span style={{ fontSize: 26 }}>{t.emoji}</span>
              <strong>{t.label}</strong>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card-block">
        <h3>Seus dados</h3>
        <div className="field">
          <label>Nome completo</label>
          <input value={f.nome} onChange={(e) => up("nome", e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={f.email} onChange={(e) => up("email", e.target.value)} placeholder="voce@email.com" />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={f.senha} onChange={(e) => up("senha", e.target.value)} placeholder="••••••" />
        </div>
      </div>

      {tipo === "lojista" && (
        <div className="card-block">
          <h3>Dados da loja</h3>
          <div className="field">
            <label>Nome da loja</label>
            <input value={f.storeNome} onChange={(e) => up("storeNome", e.target.value)} placeholder="Ex: Ateliê da Ana" />
          </div>
          <div className="field">
            <label>Categoria principal</label>
            <select value={f.categoria} onChange={(e) => up("categoria", e.target.value)}>
              {categories.filter((c) => c.id !== "todos").map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Ícone da loja</label>
            <div className="opts">
              {EMOJIS_LOJA.map((e) => (
                <button key={e} className={`opt ${f.emoji === e ? "is-active" : ""}`} onClick={() => up("emoji", e)} style={{ fontSize: 20 }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label>Tipo da chave Pix</label>
              <select value={f.pixTipo} onChange={(e) => up("pixTipo", e.target.value)}>
                {PIX_TIPOS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Chave Pix</label>
              <input value={f.pixKey} onChange={(e) => up("pixKey", e.target.value)} placeholder="sua chave" />
            </div>
          </div>
          <p className="helper" style={{ padding: 0 }}>
            🔑 É nessa chave que os clientes vão pagar quando escolherem <strong>Pix online</strong>.
          </p>
          <button className="btn btn--outline btn--block" style={{ marginTop: 10 }} onClick={localizarLoja}>
            {f.storeLat ? "✅ Local da loja definido — tocar para atualizar" : "📍 Definir local da loja no mapa"}
          </button>
          <p className="helper" style={{ padding: "6px 0 0" }}>
            📍 Usado para calcular a rota e a distância até o cliente.
          </p>
        </div>
      )}

      {tipo === "entregador" && (
        <div className="card-block">
          <h3>Dados do entregador</h3>
          <div className="field">
            <label>Veículo</label>
            <input value={f.veiculo} onChange={(e) => up("veiculo", e.target.value)} placeholder="Ex: Honda CG 160" />
          </div>
          <div className="field">
            <label>Placa</label>
            <input value={f.placa} onChange={(e) => up("placa", e.target.value)} placeholder="ABC-1D23" />
          </div>
          <p className="helper" style={{ padding: 0 }}>
            🛵 Ao ficar <strong>disponível</strong>, você recebe corridas automaticamente quando houver vendas.
          </p>
        </div>
      )}

      <div style={{ padding: "4px 14px 20px" }}>
        <button className="btn btn--primary btn--block" onClick={submit} disabled={salvando}>
          {salvando ? "Criando..." : "Criar conta"}
        </button>

        <div className="ou-divisor"><span>ou</span></div>
        <button className="btn btn--google btn--block" onClick={entrarGoogle}>
          <span className="g-ic">G</span> Continuar com Google (cliente)
        </button>
        <p className="helper" style={{ textAlign: "center", marginTop: 12 }}>
          Já tem conta? <Link href="/entrar" style={{ color: "var(--primary)", fontWeight: 700 }}>Entrar</Link>
        </p>
      </div>
    </>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="empty"><div className="empty__emoji">📝</div></div>}>
      <CadastroInner />
    </Suspense>
  );
}
