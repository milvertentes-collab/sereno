'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import SectionHeroCard from './SectionHeroCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssertivenessSectionProps {
  darkMode?: boolean;
  onNavigate?: (tab: any, params?: Record<string, any>) => void;
  onPracticeComplete?: () => void;
}

type MainTab = 'intro' | 'patterns' | 'responses' | 'scenarios' | 'practice';
type ScenarioType = 'trabalho' | 'familia' | 'amizade' | 'relacionamento' | 'autocuidado';

type Scenario = {
  id: string;
  type: ScenarioType;
  title: string;
  pressure: string;
  guilt: string;
  softNo: string;
  firmNo: string;
  briefNo: string;
  adjustTone: string;
  possibleLimit: string;
  goTo?: { tab: string; label: string; params?: Record<string, any> };
};

const tabs = [
  { id: 'intro', label: 'Início', emoji: '🛑' },
  { id: 'patterns', label: 'Padrões', emoji: '🧠' },
  { id: 'responses', label: 'Como responder', emoji: '🗣️' },
  { id: 'scenarios', label: 'Cenários', emoji: '🎯' },
  { id: 'practice', label: 'Treino', emoji: '💬' },
] as const;

const scenarios: Scenario[] = [
  {
    id: 'work-extra',
    type: 'trabalho',
    title: 'Pedido extra no trabalho',
    pressure: 'A pressão aqui é desempenho e medo de parecer pouco disponível.',
    guilt: 'A culpa costuma vir da ideia de que negar ajuda é ser egoísta ou pouco profissional.',
    softNo: 'Hoje eu não consigo assumir isso sem comprometer outras entregas.',
    firmNo: 'Não vou conseguir pegar essa demanda agora.',
    briefNo: 'Hoje não consigo.',
    adjustTone: 'Mantenha clareza sem se justificar em excesso. Firmeza não precisa soar seca.',
    possibleLimit: 'Posso olhar isso amanhã ou indicar o que já está pronto para outra pessoa seguir.',
  },
  {
    id: 'family-favor',
    type: 'familia',
    title: 'Favor familiar que pesa',
    pressure: 'A pressão aqui costuma vir de lealdade, obrigação e medo de decepcionar.',
    guilt: 'A culpa aparece como se colocar limite fosse falta de amor ou ingratidão.',
    softNo: 'Eu entendo a importância disso, mas hoje não consigo assumir.',
    firmNo: 'Não vou conseguir fazer isso.',
    briefNo: 'Hoje eu não consigo.',
    adjustTone: 'Reconheça a importância do pedido sem transformar isso em obrigação automática.',
    possibleLimit: 'Posso ajudar de outro jeito ou em outro momento, mas não dessa forma agora.',
    goTo: { tab: 'family', label: 'Abrir Modo Família' },
  },
  {
    id: 'friend-emergency',
    type: 'amizade',
    title: 'Amigo que sempre pede no limite',
    pressure: 'A pressão vem do medo de abandonar alguém ou parecer frio(a).',
    guilt: 'A culpa costuma misturar amizade com disponibilidade total.',
    softNo: 'Hoje eu não consigo estar da forma que você precisa.',
    firmNo: 'Não posso assumir isso agora.',
    briefNo: 'Hoje não consigo isso.',
    adjustTone: 'Validar a dor do outro não obriga você a se disponibilizar além do que pode.',
    possibleLimit: 'Posso te ouvir por 10 minutos, mas não consigo resolver isso com você hoje.',
    goTo: { tab: 'carta', label: 'Levar para Carta', params: { cartaType: 'personalizada', cartaDraft: 'O que eu nunca consigo dizer quando me sinto pressionado(a) por amizade:\n\nO que acontece:\nO que isso deixa em mim:\nO que eu gostaria de dizer agora:' } },
  },
  {
    id: 'relationship-boundary',
    type: 'relacionamento',
    title: 'Limite no relacionamento',
    pressure: 'A pressão aqui costuma vir do medo de conflito, afastamento ou rejeição.',
    guilt: 'A culpa aparece como se o limite ameaçasse o vínculo.',
    softNo: 'Eu não consigo seguir assim. Preciso que isso seja respeitado.',
    firmNo: 'Não aceito continuar dessa forma.',
    briefNo: 'Assim não dá para mim.',
    adjustTone: 'Firmeza aqui não é punir nem atacar. É nomear um limite com consequência clara.',
    possibleLimit: 'Se isso continuar acontecendo, vou precisar me afastar dessa conversa hoje.',
    goTo: { tab: 'couple', label: 'Abrir Modo Casal' },
  },
  {
    id: 'self-overload',
    type: 'autocuidado',
    title: 'Dizer não para a própria autocobrança',
    pressure: 'A pressão vem do ideal interno de dar conta de tudo.',
    guilt: 'A culpa aqui aparece quando descansar parece falha.',
    softNo: 'Hoje eu não vou me exigir além do que posso sustentar.',
    firmNo: 'Não vou continuar me empurrando agora.',
    briefNo: 'Hoje eu vou parar por aqui.',
    adjustTone: 'O tom precisa ser firme, mas acolhedor. Limite interno não precisa virar ataque a si.',
    possibleLimit: 'Hoje farei só o essencial e vou proteger meu descanso.',
    goTo: { tab: 'healthymessages', label: 'Abrir Mensagens do Eu Saudável' },
  },
];

export default function AssertivenessSection({ darkMode: dm, onNavigate, onPracticeComplete }: AssertivenessSectionProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('intro');
  const [selectedScenario, setSelectedScenario] = useState<string>(scenarios[0].id);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Vamos treinar limites com clareza. Traga uma situação real e eu vou ajudar você a formular um não firme, sem agressividade.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [practiceCounted, setPracticeCounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const c = (base: string, dark: string) => (dm ? dark : base);
  const currentScenario = useMemo(
    () => scenarios.find((item) => item.id === selectedScenario) || scenarios[0],
    [selectedScenario]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    if (!practiceCounted) {
      onPracticeComplete?.();
      setPracticeCounted(true);
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          mode: 'assertiveness',
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'Desculpe, deu um erro. Pode repetir?' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Desculpe, houve um problema técnico. Tente de novo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-4 animate-fade-in pb-24 max-w-lg mx-auto ${dm ? 'text-white' : ''}`}>
      <div className="pt-4 mb-6">
        <SectionHeroCard
          darkMode={dm}
          eyebrow="Limites com clareza"
          title="O Poder do NÃO"
          description="Limite sem agressividade, sem culpa e com mais clareza relacional."
          icon="🛑"
        />
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 min-w-0 ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                  : c('bg-slate-50 text-slate-600 border border-slate-200/60', 'bg-slate-800 text-slate-300 border border-slate-700/60')
              }`}
            >
              <span className="shrink-0">{tab.emoji}</span>
              <span className="text-center leading-tight break-words">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === 'intro' && (
          <>
            <HeroCard darkMode={!!dm} title="Limite com clareza" body="Aqui você trabalha culpa, medo de desagradar e firmeza sem agressividade." />
            <SectionCard darkMode={!!dm} title="Se quiser seguir daqui">
              <div className="grid gap-3">
                <ActionLink darkMode={!!dm} title="Método dos 5 Dedos" text="Quando o limite precisa virar conversa clara, com fato, sentimento e pedido." onClick={() => onNavigate?.('fivefingers')} />
                <ActionLink darkMode={!!dm} title="Linguagens do Amor" text="Quando o desencontro parece mais ligado a afeto, reconhecimento ou forma de cuidado." onClick={() => onNavigate?.('lovelanguages')} />
                <ActionLink darkMode={!!dm} title="Modo Casal" text="Quando o limite envolve vínculo íntimo, rotina a dois ou reparo no relacionamento." onClick={() => onNavigate?.('couple')} />
                <ActionLink darkMode={!!dm} title="Modo Família" text="Quando o não precisa ser sustentado dentro da convivência familiar." onClick={() => onNavigate?.('family')} />
              </div>
            </SectionCard>
            <InfoGridCard
              darkMode={!!dm}
              title="O caminho"
              items={[
                'Entender por que dizer não é tão difícil',
                'Reconhecer padrões de culpa e medo de desagradar',
                'Treinar respostas mais claras',
                'Aplicar em trabalho, família, amizade, relacionamento e autocuidado',
              ]}
            />
            <div className={`rounded-3xl p-5 border ${c('bg-rose-50 border-rose-100', 'bg-rose-950/20 border-rose-800/40')}`}>
              <p className={`text-sm font-semibold leading-relaxed ${c('text-rose-900', 'text-rose-100')}`}>
                Firmeza não é dureza. Dureza ataca ou afasta. Firmeza nomeia limite, protege você e mantém a comunicação limpa.
              </p>
            </div>
          </>
        )}

        {activeTab === 'patterns' && (
          <>
            <SectionCard darkMode={!!dm} title="Por que costuma ser difícil">
              <div className="space-y-3">
                <PatternCard darkMode={!!dm} title="Culpa" text="Você pode confundir limite com egoísmo ou rejeição do outro." />
                <PatternCard darkMode={!!dm} title="Medo de desagradar" text="A necessidade de aceitação pode fazer você trocar paz interna por aprovação momentânea." />
                <PatternCard darkMode={!!dm} title="Firmeza x dureza" text="Firmeza é clara e respeitosa. Dureza humilha, fecha ou reage no impulso." />
                <PatternCard darkMode={!!dm} title="Justificar demais" text="Explicar excessivamente abre espaço para negociação e alimenta ainda mais culpa." />
              </div>
            </SectionCard>
            <SectionCard darkMode={!!dm} title="O que muda quando você se posiciona">
              <div className="grid gap-3">
                <BenefitCard darkMode={!!dm} emoji="🧘" title="Menos sobrecarga" text="Seu corpo e sua agenda deixam de carregar o que não cabe." />
                <BenefitCard darkMode={!!dm} emoji="🕰️" title="Mais prioridade" text="O seu tempo começa a refletir o que realmente importa para você." />
                <BenefitCard darkMode={!!dm} emoji="🤝" title="Relações mais honestas" text="O vínculo fica menos baseado em adaptação silenciosa e mais em clareza." />
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === 'responses' && (
          <>
            <SectionCard darkMode={!!dm} title="Como responder sem agressividade">
              <div className="space-y-4">
                <ResponseStep darkMode={!!dm} emoji="1" title="Identifique o tipo de pressão" text="Antes de responder, nomeie se a pressão é culpa, urgência, medo de conflito ou obrigação implícita." example="Ex: estou me sentindo pressionado(a) por parecer egoísta se eu negar." />
                <ResponseStep darkMode={!!dm} emoji="2" title="Escolha o formato do não" text="Decida se cabe um não direto, um não com alternativa ou um limite com consequência." example='Ex: "Hoje eu não consigo." / "Não consigo agora, posso ver amanhã." / "Se isso continuar, vou encerrar por aqui hoje."' />
                <ResponseStep darkMode={!!dm} emoji="3" title="Ajuste o tom" text="Fale de forma respeitosa, mas sem abrir brecha pela culpa." example='Clareza: "Não vou conseguir." Sem excesso: evite discursos longos para justificar.' />
                <ResponseStep darkMode={!!dm} emoji="4" title="Treine um limite possível" text="Comece por limites sustentáveis. O objetivo não é resposta perfeita, e sim um passo real." example='Ex: limitar tempo, negar um pedido específico ou adiar um compromisso.' />
              </div>
            </SectionCard>
            <SectionCard darkMode={!!dm} title="Apoios úteis">
              <div className="grid gap-3">
                <ActionLink darkMode={!!dm} title="Cenários práticos" text="Refina o tom da resposta em trabalho, família, amizade, relacionamento e autocuidado." onClick={() => setActiveTab('scenarios')} />
                <ActionLink darkMode={!!dm} title="Método dos 5 Dedos" text="Ajuda quando o limite precisa virar conversa organizada, e não só uma resposta curta." onClick={() => onNavigate?.('fivefingers')} />
                <ActionLink darkMode={!!dm} title="Falas Tóxicas" text="Ajuda a perceber manipulação, culpa e pressão implícita." onClick={() => onNavigate?.('toxicthoughts')} />
                <ActionLink darkMode={!!dm} title="Carta Terapêutica" text="Útil quando o não travado virou conteúdo emocional antigo." onClick={() => onNavigate?.('carta', { cartaType: 'personalizada' })} />
                <ActionLink darkMode={!!dm} title="Modo Casal" text="Ajuda quando o limite envolve vínculo íntimo, pedido afetivo ou reparo no relacionamento." onClick={() => onNavigate?.('couple')} />
                <ActionLink darkMode={!!dm} title="Modo Família" text="Ajuda quando o limite envolve convivência, lealdade, cobrança ou combinados em casa." onClick={() => onNavigate?.('family')} />
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === 'scenarios' && (
          <>
            <SectionCard darkMode={!!dm} title="Cenários reais">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['trabalho', 'familia', 'amizade', 'relacionamento', 'autocuidado'] as ScenarioType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedScenario(scenarios.find((item) => item.type === type)?.id || scenarios[0].id)}
                    className={`px-3 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.14em] ${
                      currentScenario.type === type
                        ? 'bg-red-600 text-white'
                        : c('bg-slate-100 text-slate-700', 'bg-slate-900 text-slate-300')
                    }`}
                  >
                    {type === 'trabalho' ? 'Trabalho' : type === 'familia' ? 'Família' : type === 'amizade' ? 'Amizade' : type === 'relacionamento' ? 'Relacionamento' : 'Autocuidado'}
                  </button>
                ))}
              </div>

              <div className={`rounded-3xl border p-5 ${c('bg-slate-50 border-slate-200', 'bg-slate-900/40 border-slate-700')}`}>
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${c('text-slate-500', 'text-slate-400')}`}>Cenário atual</p>
                <h3 className="mt-2 text-xl font-black">{currentScenario.title}</h3>
                <div className="space-y-4 mt-4">
                  <ScenarioBlock darkMode={!!dm} title="Tipo de pressão" text={currentScenario.pressure} />
                  <ScenarioBlock darkMode={!!dm} title="Onde a culpa costuma entrar" text={currentScenario.guilt} />
                  <ScenarioBlock darkMode={!!dm} title="Resposta mais suave" text={currentScenario.softNo} />
                  <ScenarioBlock darkMode={!!dm} title="Resposta mais firme" text={currentScenario.firmNo} />
                  <ScenarioBlock darkMode={!!dm} title="Resposta mais breve" text={currentScenario.briefNo} />
                  <ScenarioBlock darkMode={!!dm} title="Ajuste de tom" text={currentScenario.adjustTone} />
                  <ScenarioBlock darkMode={!!dm} title="Limite possível" text={currentScenario.possibleLimit} />
                </div>
                <div className={`mt-4 grid gap-3 ${currentScenario.goTo ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <button
                    onClick={() => onNavigate?.('diary', {
                      diaryMode: 'quick',
                      diaryDraft: `Situação: ${currentScenario.title}\n\nTipo de pressão: ${currentScenario.pressure}\n\nO não que eu quero treinar:\n- Mais suave: ${currentScenario.softNo}\n- Mais firme: ${currentScenario.firmNo}\n- Mais breve: ${currentScenario.briefNo}\n\nLimite possível: ${currentScenario.possibleLimit}`,
                      diaryDraftKey: Date.now(),
                    })}
                    className={`py-4 px-5 rounded-2xl font-bold bg-indigo-600 text-white text-sm ${currentScenario.goTo ? '' : 'whitespace-nowrap'}`}
                  >
                    Levar este limite para o Diário
                  </button>
                  {currentScenario.goTo && (
                    <button
                      onClick={() => onNavigate?.(currentScenario.goTo?.tab, currentScenario.goTo?.params)}
                      className="py-4 rounded-2xl font-bold bg-fuchsia-600 text-white"
                    >
                      {currentScenario.goTo.label}
                    </button>
                  )}
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {activeTab === 'practice' && (
          <div className={`rounded-3xl border shadow-lg flex flex-col h-[650px] max-h-[75vh] overflow-hidden ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
            <div className={`p-5 flex items-center gap-4 ${c('bg-gradient-to-r from-slate-50 to-white border-b border-slate-100', 'bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700')}`}>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl">🛡️</div>
              <div>
                <h3 className={`font-extrabold text-base tracking-tight ${c('text-slate-900', 'text-white')}`}>Treino de limite</h3>
                <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${c('text-red-600', 'text-red-400')}`}>IA treinadora</p>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-5 ${dm ? 'bg-slate-900/20' : 'bg-slate-50/50'}`}>
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-3xl p-4 text-sm font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? `rounded-br-sm ${c('bg-gradient-to-r from-red-600 to-rose-500 text-white', 'bg-gradient-to-r from-red-700 to-rose-600 text-white')}`
                        : `rounded-bl-sm border ${c('bg-white border-slate-200 text-slate-800', 'bg-slate-800 border-slate-700 text-slate-200')}`
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`max-w-[85%] rounded-3xl rounded-bl-sm p-5 border shadow-sm ${c('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="w-2.5 h-2.5 bg-red-500/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-2.5 h-2.5 bg-red-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-2.5 h-2.5 bg-red-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            <div className={`p-4 border-t ${c('border-slate-100 bg-white', 'border-slate-700 bg-slate-800')}`}>
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Descreva uma situação em que foi difícil dizer não..."
                  className={`flex-1 pl-5 pr-12 py-4 rounded-2xl border text-sm font-medium outline-none transition-all shadow-inner focus:ring-2 focus:ring-red-500/50 ${c('bg-slate-50 border-slate-200 text-slate-900', 'bg-slate-900/50 border-slate-600 text-white')}`}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className={`absolute right-2 top-2 bottom-2 aspect-square rounded-xl flex items-center justify-center text-white transition-all ${(!input.trim() || isLoading) ? 'bg-slate-200 text-slate-400 dark:bg-slate-700' : 'bg-red-600 hover:bg-red-700 active:scale-90 shadow-md'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroCard({ darkMode, title, body }: { darkMode: boolean; title: string; body: string }) {
  return (
    <div className={`rounded-3xl p-6 border ${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{body}</p>
    </div>
  );
}

function InfoGridCard({ darkMode, title, items }: { darkMode: boolean; title: string; items: string[] }) {
  return (
    <div className={`rounded-3xl p-6 border ${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}>
      <h3 className="text-xl font-bold">{title}</h3>
      <div className="grid gap-3 mt-4">
        {items.map((item) => (
          <div key={item} className={`rounded-2xl p-4 text-sm font-medium ${darkMode ? 'bg-slate-900 border border-slate-700 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ darkMode, title, children }: { darkMode: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-3xl p-6 border ${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function PatternCard({ darkMode, title, text }: { darkMode: boolean; title: string; text: string }) {
  return (
    <div className={`rounded-2xl p-4 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className={`mt-1 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>
    </div>
  );
}

function BenefitCard({ darkMode, emoji, title, text }: { darkMode: boolean; emoji: string; title: string; text: string }) {
  return (
    <div className={`flex gap-4 p-5 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex-shrink-0 w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl">
        {emoji}
      </div>
      <div>
        <h4 className="font-bold">{title}</h4>
        <p className={`text-sm mt-1 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>
      </div>
    </div>
  );
}

function ResponseStep({ darkMode, emoji, title, text, example }: { darkMode: boolean; emoji: string; title: string; text: string; example: string }) {
  return (
    <div className={`rounded-2xl p-5 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-sm">{emoji}</div>
        <h4 className="font-bold">{title}</h4>
      </div>
      <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>
      <div className={`mt-3 rounded-xl p-4 text-sm font-semibold ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'}`}>
        {example}
      </div>
    </div>
  );
}

function ActionLink({ darkMode, title, text, onClick }: { darkMode: boolean; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full min-h-[96px] text-left rounded-2xl p-4 border transition-all active:scale-[0.99] ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
      <p className="font-bold leading-tight">{title}</p>
      <p className={`mt-2 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>
    </button>
  );
}

function ScenarioBlock({ darkMode, title, text }: { darkMode: boolean; title: string; text: string }) {
  return (
    <div className={`rounded-2xl p-4 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className={`mt-1 text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>
    </div>
  );
}
