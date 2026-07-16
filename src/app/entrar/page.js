"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [entrando, setEntrando] = useState(false);

  async function submit() {
    if (!email || !senha) return toast("Preencha e-mail e senha", "⚠️");
    setEntrando(true);
    const res = await login(email, senha);
    setEntrando(false);
    if (!res.ok) return toast(res.erro, "⚠️");
    const nome = res.user?.nome?.split(" ")[0] || "";
    toast(`Bem-vindo, ${nome}!`);
    router.push(
      res.user?.tipo === "lojista" ? "/lojista" : res.user?.tipo === "entregador" ? "/entregador" : "/perfil"
    );
  }

  return (
    <>
      <header className="pagehead">
        <button className="back-btn" onClick={() => router.push("/perfil")}>‹</button>
        <span className="pagehead__title">Entrar</span>
      </header>

      <div style={{ textAlign: "center", padding: "30px 0 10px" }}>
        <div style={{ fontSize: 52 }}>🛍️</div>
        <h2 style={{ margin: "8px 0 2px" }}>Vistê</h2>
        <p style={{ color: "var(--muted)", margin: 0 }}>Vestiu, chegou.</p>
      </div>

      <div className="card-block">
        <div className="field">
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" />
        </div>
        <button className="btn btn--primary btn--block" onClick={submit} style={{ marginTop: 6 }} disabled={entrando}>
          {entrando ? "Entrando..." : "Entrar"}
        </button>
      </div>

      <p className="helper" style={{ textAlign: "center" }}>
        Ainda não tem conta?{" "}
        <Link href="/cadastro" style={{ color: "var(--primary)", fontWeight: 700 }}>
          Criar agora
        </Link>
      </p>
    </>
  );
}
