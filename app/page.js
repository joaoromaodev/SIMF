export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Título do Portal */}
      <div className="w-full max-w-4xl mb-14 text-center">
        <h1 className="text-5xl font-black text-para-blue tracking-tighter">SIMF</h1>
        <p className="text-para-blue font-bold text-sm mt-2 uppercase tracking-[0.3em]">
          Sistema Integrado de Monitoramento Financeiro
        </p>
        <div className="h-1.5 w-32 bg-para-blue mx-auto mt-6 rounded-full"></div>
      </div>

      {/* Grid de Módulos (Baseado no Organograma) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        
        {/* Card DFIN */}
        <a href="/dashboard/dfin" className="group bg-white p-10 rounded shadow-lg border-b-4 border-slate-300 hover:border-para-blue transition-all flex flex-col justify-center min-h-[220px]">
          <h2 className="text-para-blue font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            Diretoria de Finanças
          </h2>
          <p className="text-4xl font-black text-slate-800 leading-tight">DFIN</p>
        </a>

        {/* Card DPPC */}
        <a href="/dashboard/dppc" className="group bg-white p-10 rounded shadow-lg border-b-4 border-slate-300 hover:border-para-blue transition-all flex flex-col justify-center min-h-[220px]">
          <h2 className="text-para-blue font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            Pagamento e Prestação de Contas
          </h2>
          <p className="text-4xl font-black text-slate-800 leading-tight">DPPC</p>
        </a>

        {/* Card GESTÃO/IMPORT - Azul para Destaque */}
        <a href="/dashboard/import" className="group bg-para-blue p-10 rounded shadow-lg border-b-4 border-blue-900 hover:bg-blue-800 transition-all text-white flex flex-col justify-center min-h-[220px]">
          <h2 className="text-blue-200 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            Gestão de Dados
          </h2>
          <p className="text-4xl font-black leading-tight tracking-tighter">
            ATUALIZAÇÃO DE BASE
          </p>
        </a>

      </div>

      {/* Rodapé Institucional */}
      <footer className="mt-24 text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">
        Secretaria de Estado de Educação - SEDUC/PA
      </footer>
    </div>
  );
}