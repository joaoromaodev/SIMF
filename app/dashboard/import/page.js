import { UploadForm } from "../../../components/upload-form";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl mb-10 text-center">
        <h1 className="text-4xl font-black text-para-blue tracking-tighter">SIMF</h1>
        <p className="text-para-blue font-bold text-sm mt-1 uppercase tracking-widest">Sistema Integrado de Monitoramento Financeiro</p>
        <div className="h-1 w-20 bg-para-blue mx-auto mt-4 rounded-full"></div>
      </div>
      <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-slate-300 overflow-hidden">
        <div className="bg-para-blue px-6 py-4">
          <h2 className="text-white text-xs font-black uppercase tracking-[0.2em]">Input de Relatórios (.csv)</h2>
        </div>
        <div className="p-10"><UploadForm /></div>
      </div>
      <footer className="mt-12 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Secretaria de Estado de Educação - SEDUC/PA</footer>
    </div>
  );
}