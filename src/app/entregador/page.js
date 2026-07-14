"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import MapTrack from "@/components/MapTrack";
import { useStore, ORDER_STEPS } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatBRL } from "@/lib/data";

export default function EntregadorPage() {
  const router = useRouter();
  const toast = useToast();
  const { currentUser, setRiderOnline, ordersForRider, advanceOrder } = useStore();

  if (!currentUser || currentUser.tipo !== "entregador") {
    return (
      <>
        <header className="pagehead">
          <Link href="/" className="back-btn">‹</Link>
          <span className="pagehead__title">Área do entregador</span>
        </header>
        <div className="empty">
          <div className="empty__emoji">🛵</div>
          <h3>Entregador Vistê</h3>
          <p>Cadastre-se para receber corridas automaticamente quando houver vendas.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Link href="/entrar" className="btn btn--outline">Entrar</Link>
            <Link href="/cadastro?tipo=entregador" className="btn btn--primary">Quero entregar</Link>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const corridas = ordersForRider(currentUser.id);
  const ativas = corridas.filter((o) => o.statusIndex < 4);
  const concluidas = corridas.filter((o) => o.statusIndex >= 4);
  const ganhos = corridas.reduce((s, o) => s + (o.frete || 0) + 6, 0); // frete + taxa fixa fictícia

  return (
    <>
      <header className="pagehead">
        <Link href="/perfil" className="back-btn">‹</Link>
        <span className="pagehead__title">Minhas corridas</span>
      </header>

      {/* Status online */}
      <div className="card-block" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>🛵</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>{currentUser.nome.split(" ")[0]}</div>
          <div style={{ color: currentUser.online ? "var(--accent)" : "var(--muted)", fontSize: 13, fontWeight: 700 }}>
            {currentUser.online ? "🟢 Disponível" : "⚪ Offline"}
          </div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={!!currentUser.online} onChange={(e) => {
            setRiderOnline(e.target.checked);
            toast(e.target.checked ? "Você está online 🟢" : "Você ficou offline");
          }} />
          <span className="slider" />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 14px 6px" }}>
        <MiniStat label="Ativas" value={ativas.length} />
        <MiniStat label="Concluídas" value={concluidas.length} />
        <MiniStat label="Ganhos" value={formatBRL(ganhos)} />
      </div>

      {corridas.length === 0 && (
        <div className="empty">
          <div className="empty__emoji">📭</div>
          <h3>Nenhuma corrida ainda</h3>
          <p>Fique <strong>online</strong> e aguarde. Ao acontecer uma venda, você recebe a corrida aqui automaticamente.</p>
        </div>
      )}

      {/* Corridas ativas com mapa */}
      {ativas.map((o) => {
        const step = ORDER_STEPS[o.statusIndex];
        const proxima = ORDER_STEPS[o.statusIndex + 1];
        return (
          <div key={o.id} className="card-block">
            <div className="ocard__head">
              <strong>Corrida #{o.id}</strong>
              <span className="ostatus andamento">{step.emoji} {step.label}</span>
            </div>
            <MapTrack order={o} />
            <div style={{ marginTop: 12 }}>
              <div className="rota-line"><span>🏬</span> Retirar em <strong>Loja parceira</strong></div>
              <div className="rota-line"><span>🏠</span> Entregar para <strong>{o.endereco?.nome}</strong></div>
              <div className="rota-line"><span>📍</span> {o.endereco?.rua}, {o.endereco?.numero} — {o.endereco?.bairro}</div>
              <div className="rota-line"><span>💳</span> {o.pagamento?.resumo}</div>
            </div>
            {proxima && (
              <button className="btn btn--primary btn--block" style={{ marginTop: 12 }} onClick={() => {
                advanceOrder(o.id);
                toast(`Status: ${proxima.label}`);
              }}>
                {o.statusIndex === 0 && "Aceitar e ir à loja"}
                {o.statusIndex === 1 && "Retirei o pedido"}
                {o.statusIndex === 2 && "Cheguei perto do cliente"}
                {o.statusIndex === 3 && "Confirmar entrega"}
              </button>
            )}
          </div>
        );
      })}

      {/* Histórico */}
      {concluidas.length > 0 && (
        <section className="section">
          <div className="section__head"><span className="section__title">Concluídas</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {concluidas.map((o) => (
              <div key={o.id} className="ocard">
                <div className="ocard__head">
                  <strong>#{o.id}</strong>
                  <span className="ostatus entregue">🎉 Entregue</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {o.endereco?.bairro} · {formatBRL((o.frete || 0) + 6)} ganhos
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "10px 8px", textAlign: "center", boxShadow: "var(--shadow)" }}>
      <div style={{ fontWeight: 900, fontSize: 15 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
