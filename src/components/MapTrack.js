"use client";

import { useEffect, useRef, useState } from "react";
import { STEP_PROGRESS } from "@/lib/store";

// Constrói uma rota "de ruas" (formato de degraus) entre loja e casa
function routePoints(store, home) {
  const midY = (store.y + home.y) / 2;
  return [
    { x: store.x, y: store.y },
    { x: store.x, y: midY },
    { x: home.x, y: midY },
    { x: home.x, y: home.y },
  ];
}

function pointAt(points, t) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len });
    total += len;
  }
  let dist = t * total;
  for (const s of segs) {
    if (dist <= s.len || s === segs[segs.length - 1]) {
      const f = s.len === 0 ? 0 : dist / s.len;
      return { x: s.a.x + (s.b.x - s.a.x) * f, y: s.a.y + (s.b.y - s.a.y) * f };
    }
    dist -= s.len;
  }
  return points[points.length - 1];
}

export default function MapTrack({ order }) {
  const store = order.storeCoord || { x: 30, y: 30 };
  const home = order.homeCoord || { x: 50, y: 85 };
  const points = routePoints(store, home);
  const target = STEP_PROGRESS[order.statusIndex] ?? 0;

  const [t, setT] = useState(target);
  const raf = useRef(target);

  // Move suavemente o marcador em direção ao alvo da etapa atual
  useEffect(() => {
    const timer = setInterval(() => {
      raf.current += (target - raf.current) * 0.08 + (target > raf.current ? 0.004 : 0);
      if (Math.abs(target - raf.current) < 0.002) raf.current = target;
      setT(Math.min(1, Math.max(0, raf.current)));
    }, 180);
    return () => clearInterval(timer);
  }, [target]);

  const pos = pointAt(points, t);
  const pathD = "M " + points.map((p) => `${p.x} ${p.y}`).join(" L ");
  const entregue = order.statusIndex >= 4;

  return (
    <div className="map">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="map__svg">
        {/* fundo */}
        <rect width="100" height="100" fill="#e8efe9" />
        {/* quarteirões */}
        {[12, 40, 68].map((x) =>
          [12, 40, 68].map((y) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="20" height="20" rx="2" fill="#dfe8e1" />
          ))
        )}
        {/* ruas (grid) */}
        {[0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100].map((v) => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="#fff" strokeWidth="2.4" />
            <line x1="0" y1={v} x2="100" y2={v} stroke="#fff" strokeWidth="2.4" />
          </g>
        ))}
        {/* rota */}
        <path d={pathD} fill="none" stroke="#ee4d2d" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathD} fill="none" stroke="#ee4d2d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />

        {/* pino da loja */}
        <g transform={`translate(${store.x} ${store.y})`}>
          <circle r="4.6" fill="#fff" stroke="#ee4d2d" strokeWidth="1.4" />
          <text y="1.6" textAnchor="middle" fontSize="5">🏬</text>
        </g>
        {/* pino de casa */}
        <g transform={`translate(${home.x} ${home.y})`}>
          <circle r="4.6" fill="#fff" stroke="#0a8f5b" strokeWidth="1.4" />
          <text y="1.6" textAnchor="middle" fontSize="5">🏠</text>
        </g>
        {/* motoentregador */}
        {!entregue && (
          <g transform={`translate(${pos.x} ${pos.y})`}>
            <circle r="6" fill="#ee4d2d" opacity="0.18">
              <animate attributeName="r" values="5;8;5" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle r="5" fill="#ee4d2d" />
            <text y="1.8" textAnchor="middle" fontSize="5.4">🛵</text>
          </g>
        )}
      </svg>
      <div className="map__badge">
        {entregue ? "✅ Entregue" : `🛵 ${order.rider?.nome?.split(" ")[0]} a caminho`}
      </div>
    </div>
  );
}
