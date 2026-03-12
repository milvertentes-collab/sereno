'use client';

import { useState } from 'react';

interface Props { darkMode?: boolean }

const templates = [
  { id: 1, text: 'Estou usando o Sereno para cuidar da minha saúde mental. Experimenta, acho que você vai gostar! 💙' },
  { id: 2, text: 'Sei que você tem passado por momentos difíceis. Esse app tem me ajudado bastante. Talvez te ajude também. 🤗' },
  { id: 3, text: 'Encontrei uma ferramenta legal para registrar emoções e praticar respiração. Vamos testar juntos?' },
  { id: 4, text: 'Lembrei de você quando vi essa ferramenta de autocuidado. Espero que ajude. 💜' },
];

export default function InviteFriendSection({ darkMode: dm }: Props) {
  const [selected, setSelected] = useState(templates[0].text);
  const [copied, setCopied] = useState(false);
  const c = (l: string, d: string) => (dm ? d : l);

  const share = (platform: 'whatsapp' | 'telegram' | 'email') => {
    const text = encodeURIComponent(selected + '\n\nBaixe em: https://sereno.app');
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?url=${text}`,
      email: `mailto:?subject=Convite%20Sereno&body=${text}`,
    };
    window.open(urls[platform], '_blank');
  };

  const copy = () => {
    navigator.clipboard.writeText(selected);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>💌 Indicar para um Amigo</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Compartilhe o Sereno com uma mensagem de apoio.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Escolha uma mensagem</h3>
        <div className="space-y-2">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.text)} className={`w-full p-3 rounded-xl text-left text-sm transition-all ${selected === t.text ? 'bg-blue-500 text-white' : c('bg-slate-50', 'bg-slate-700')}`}>
              {t.text}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <h3 className="font-bold mb-3">Prévia</h3>
        <p className={`text-sm ${c('text-slate-600', 'text-slate-300')}`}>{selected}</p>
        <p className={`text-xs mt-2 ${c('text-slate-400', 'text-slate-500')}`}>+ Link para download</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => share('whatsapp')} className="py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">WhatsApp</button>
        <button onClick={() => share('telegram')} className="py-3 rounded-xl bg-sky-600 text-white font-bold text-sm">Telegram</button>
        <button onClick={() => share('email')} className="py-3 rounded-xl bg-slate-600 text-white font-bold text-sm">E-mail</button>
        <button onClick={copy} className={`py-3 rounded-xl font-bold text-sm ${copied ? 'bg-emerald-600 text-white' : c('bg-slate-100 text-slate-700', 'bg-slate-700 text-slate-200')}`}>{copied ? 'Copiado!' : 'Copiar'}</button>
      </div>
    </div>
  );
}