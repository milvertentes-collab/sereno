'use client';

import { useState } from 'react';
import RecommendAppModal from './RecommendAppModal';

export default function InviteFriendSection({ darkMode }: { darkMode?: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const c = (l: string, d: string) => (darkMode ? d : l);

  return (
    <div className="p-4 pb-32 max-w-lg mx-auto animate-fade-in">
      <div className={`overflow-hidden rounded-[2.4rem] border ${c('border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] shadow-[0_20px_50px_rgba(15,23,42,0.08)]', 'border-slate-800 bg-[linear-gradient(180deg,#0f172a_0%,#101a31_100%)] shadow-[0_24px_60px_rgba(2,6,23,0.5)]')}`}>
        <div className={`relative h-56 overflow-hidden ${c('bg-[radial-gradient(circle_at_top_left,#c7d2fe_0%,#8b5cf6_32%,#0f172a_100%)]', 'bg-[radial-gradient(circle_at_top_left,#8b5cf6_0%,#4338ca_32%,#0b1220_100%)]')}`}>
          <div className="absolute inset-0">
            <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-fuchsia-300/20 blur-3xl" />
            <div className="absolute left-8 top-8 h-20 w-20 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-xl" />
            <div className="absolute right-12 top-14 h-12 w-12 rounded-full border border-white/15 bg-white/10 backdrop-blur-xl" />
          </div>
          <div className="relative flex h-full flex-col justify-between p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
                Compartilhe o Sereno
              </div>
              <div className="rounded-[1.3rem] border border-white/15 bg-white/10 px-4 py-3 text-3xl shadow-[0_18px_40px_rgba(15,23,42,0.2)] backdrop-blur-xl">
                ✨
              </div>
            </div>
            <div>
              <h2 className="max-w-[14rem] text-[2rem] font-black leading-[1.02]">Indique cuidado de um jeito bonito.</h2>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-white/80">
                Monte uma mensagem com contexto, tom certo e envio rápido para quem você quer acolher.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: 'Escolha o contexto', text: 'apoio, família, autocuidado' },
              { title: 'Ajuste o tom', text: 'mais acolhedor ou mais direto' },
              { title: 'Envie rápido', text: 'WhatsApp, Telegram, e-mail ou copiar' },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-[1.6rem] border p-3 ${c('border-slate-200 bg-white/80', 'border-slate-800 bg-white/5')}`}
              >
                <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${c('text-violet-700', 'text-violet-300')}`}>{item.title}</p>
                <p className={`mt-2 text-xs leading-relaxed ${c('text-slate-600', 'text-slate-300')}`}>{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <button
              onClick={() => setModalOpen(true)}
              className={`group relative w-full overflow-hidden rounded-[1.6rem] px-5 py-4 text-base font-black transition-all active:scale-[0.98] ${c('bg-[linear-gradient(135deg,#6d28d9_0%,#7c3aed_50%,#2563eb_100%)] text-white shadow-[0_20px_40px_rgba(109,40,217,0.25)]', 'bg-[linear-gradient(135deg,#7c3aed_0%,#8b5cf6_55%,#22c55e_120%)] text-white shadow-[0_24px_48px_rgba(76,29,149,0.4)]')}`}
            >
              <span className="absolute inset-y-0 left-[-30%] w-24 rotate-12 bg-white/20 blur-md transition-transform duration-1000 group-hover:translate-x-[360%] group-active:translate-x-[360%]" />
              <span className="relative">Montar indicação</span>
            </button>
            <p className={`text-center text-[10px] font-black uppercase tracking-[0.2em] ${c('text-slate-400', 'text-slate-500')}`}>
              Feito para soar pessoal, não genérico
            </p>
          </div>
        </div>
      </div>

      <RecommendAppModal
        open={modalOpen}
        darkMode={darkMode}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
