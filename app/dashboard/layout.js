import "../globals.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-para-white font-sans text-slate-800">
      {/* Sidebar Institucional - Azul Pará */}
      <aside className="w-72 bg-para-blue text-white flex flex-col shadow-xl">
        <div className="p-8 border-b border-blue-400/30">
          <h1 className="text-2xl font-bold tracking-tight">SIMF</h1>
          <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">
            Governo do Estado do Pará
          </p>
        </div>
        
        <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
          {/* Módulo DFIN */}
          <div>
            <h2 className="text-sm font-black text-blue-100/50 uppercase mb-4 tracking-wider">
              Diretoria de Finanças (DFIN)
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">CEO</li>
              <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">CPED</li>
              <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">ACONT</li>
            </ul>
          </div>

          {/* Módulo DPPC */}
          <div>
            <h2 className="text-sm font-black text-blue-100/50 uppercase mb-4 tracking-wider">
              Pagamento e Prestação de Contas (DPPC)
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">CLIQ</li>
              <li className="p-3 hover:bg-white/10 rounded-md cursor-pointer transition-colors">CPAG</li>
            </ul>
          </div>
        </nav>

        {/* Rodapé de Gestão - Vermelho para destaque */}
        <div className="p-6 bg-blue-900/20">
          <a 
            href="/dashboard/import" 
            className="flex items-center justify-center gap-2 p-3 bg-para-red hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-all"
          >
            <span>⚙️</span> Atualizar Base
          </a>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-sm">
          <span className="text-slate-400 font-medium">SECRETARIA ADJUNTA DE PLANEJAMENTO E FINANÇAS (SAPF)</span>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500">Usuário do Sistema</p>
          </div>
        </header>
        <section className="p-10">
          {children}
        </section>
      </main>
    </div>
  );
}