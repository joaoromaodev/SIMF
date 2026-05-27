// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css"; // Isso carrega o Tailwind v4

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "SIMF - Governo do Pará",
  description: "Sistema de Inteligência e Monitoramento Financeiro",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" className={inter.variable}>
      <body className={`${inter.className} font-sans antialiased bg-white text-slate-900`}>
        {/* O 'children' é onde suas páginas (como a de importação) aparecerão */}
        {children}
      </body>
    </html>
  );
}
