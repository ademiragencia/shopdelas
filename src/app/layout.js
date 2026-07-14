import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "ModaExpress — Roupas com entrega rápida",
  description:
    "Marketplace de moda com entrega expressa. Milhares de peças, várias lojas, receba em casa em minutos. Estilo iFood + Shopee.",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ee4d2d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <StoreProvider>
          <ToastProvider>
            <div className="shell">{children}</div>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
