"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Mapa real (Leaflet + OpenStreetMap, sem chave de API).
// props: store {lat,lng}, home {lat,lng}, rider {lat,lng}
export default function LiveMap({ store, home, rider, badge }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const Lref = useRef(null);
  const markers = useRef({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current) return;
      Lref.current = L;
      if (!mapRef.current) {
        const map = L.map(elRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: true,
        }).setView([-20.4697, -54.6201], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 60);
      }
      draw();
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markers.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.lat, store?.lng, home?.lat, home?.lng, rider?.lat, rider?.lng]);

  function icon(L, emoji, bg) {
    return L.divIcon({
      html: `<div class="lm-pin" style="background:${bg}">${emoji}</div>`,
      className: "lm-icon",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  function draw() {
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const pts = [];
    const put = (key, pos, emoji, bg) => {
      if (!pos || pos.lat == null || pos.lng == null) return;
      const ll = [pos.lat, pos.lng];
      pts.push(ll);
      if (markers.current[key]) markers.current[key].setLatLng(ll);
      else markers.current[key] = L.marker(ll, { icon: icon(L, emoji, bg), zIndexOffset: emoji === "🛵" ? 1000 : 0 }).addTo(map);
    };
    put("store", store, "🏬", "#ee4d2d");
    put("home", home, "🏠", "#0a8f5b");
    put("rider", rider, "🛵", "#111827");

    const line = [store, rider, home].filter((p) => p && p.lat != null).map((p) => [p.lat, p.lng]);
    if (line.length > 1) {
      if (markers.current.line) markers.current.line.setLatLngs(line);
      else markers.current.line = L.polyline(line, { color: "#ee4d2d", weight: 4, opacity: 0.65, dashArray: "6 8" }).addTo(map);
    }
    if (pts.length === 1) map.setView(pts[0], 15);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [42, 42], maxZoom: 16 });
  }

  return (
    <div className="map">
      <div ref={elRef} className="livemap" />
      {badge && <div className="map__badge">{badge}</div>}
    </div>
  );
}
