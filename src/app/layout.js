import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "Vistê — Vestiu, chegou.",
  description:
    "Vistê: marketplace de moda com entrega expressa. Lojas, produtos, motoentregador com rastreamento no mapa e pagamento via Pix. Estilo iFood + Shopee.",
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
