// app/layout.js
import "./globals.css"; // Isso carrega o Tailwind v4

export const metadata = {
  title: "SIMF - Governo do Pará",
  description: "Sistema de Inteligência e Monitoramento Financeiro",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="font-sans antialiased bg-white text-slate-900">
        {/* O 'children' é onde suas páginas (como a de importação) aparecerão */}
        {children}
      </body>
    </html>
  );
}