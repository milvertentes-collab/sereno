'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Props { darkMode?: boolean }

export default function HealthySelfMessages({ darkMode: dm }: Props) {
  const [messages, setMessages] = useLocalStorage<{ id: string; text: string; createdAt: string }[]>('psico_healthy_self', []);
  const [text, setText] = useState('');
  const c = (l: string, d: string) => (dm ? d : l);

  const add = () => {
    if (!text.trim()) return;
    setMessages([{ id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString() }, ...messages]);
    setText('');
  };

  const remove = (id: string) => setMessages(messages.filter((m) => m.id !== id));

  return (
    <div className={`p-4 pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="text-center pt-4 mb-6">
        <h2 className={`text-3xl font-extrabold ${c('text-slate-900', 'text-slate-100')}`}>💬 Mensagem do Eu Saudável</h2>
        <p className={`text-sm mt-2 ${c('text-slate-600', 'text-slate-400')}`}>Escreva mensagens para si mesmo em bons momentos. Elas serão usadas em notificações futuras.</p>
      </div>

      <div className={`rounded-3xl p-5 border mb-5 ${c('bg-white border-slate-100', 'bg-slate-800/80 border-slate-700')}`}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex: Você é capaz de superar isso. Lembre-se de quanto já venceu..." className={`w-full min-h-[100px] p-3 rounded-xl border text-sm ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`} />
        <button onClick={add} className="w-full mt-3 py-3 rounded-xl bg-emerald-600 text-white font-bold">Salvar mensagem</button>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`rounded-2xl p-4 border ${c('bg-white border-slate-100', 'bg-slate-800/70 border-slate-700')}`}>
            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${c('text-slate-500', 'text-slate-400')}`}>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</span>
              <button onClick={() => remove(m.id)} className="text-xs text-rose-500">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className={`rounded-3xl p-6 text-center border ${c('bg-slate-50 border-slate-200', 'bg-slate-900 border-slate-700')}`}>
          <p className={`text-sm ${c('text-slate-600', 'text-slate-400')}`}>Nenhuma mensagem salva ainda.</p>
        </div>
      )}
    </div>
  );
}