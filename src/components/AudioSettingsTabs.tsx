'use client';

import React, { useState } from 'react';
import { Settings, Mic2, Music2, Timer, Volume2, Check, Plus, Trash2, Play } from 'lucide-react';

interface AudioSettingsTabsProps {
  darkMode?: boolean;
  selectedVoice: 'masculino' | 'feminino' | 'nenhuma';
  setSelectedVoice: (v: 'masculino' | 'feminino' | 'nenhuma') => void;
  bgEnabled: boolean;
  setBgEnabled: (v: boolean) => void;
  bgVolume: number;
  setBgVolume: (v: number) => void;
  bgMixerEnabled: boolean;
  setBgMixerEnabled: (v: boolean) => void;
  bgMixerTracks: Record<string, number>;
  setBgMixerTracks: (v: Record<string, number>) => void;
  speedMode: '0.9' | '1.0' | '1.1';
  setSpeedMode: (v: '0.9' | '1.0' | '1.1') => void;
  pauseMode: 'curta' | 'normal' | 'profunda';
  setPauseMode: (v: 'curta' | 'normal' | 'profunda') => void;
  maleVoice: string;
  setMaleVoice: (v: string) => void;
  femaleVoice: string;
  setFemaleVoice: (v: string) => void;
  onPreviewVoice: (gender: 'masculino' | 'feminino', voice: string) => void;
  ambientSounds: any[];
  bgSoundId: string;
  setBgSoundId: (v: string) => void;
  previewingBg: boolean;
  onPreviewBg: (id: string) => void;
}

export default function AudioSettingsTabs({
  darkMode: dm,
  selectedVoice,
  setSelectedVoice,
  bgEnabled,
  setBgEnabled,
  bgVolume,
  setBgVolume,
  bgMixerEnabled,
  setBgMixerEnabled,
  bgMixerTracks,
  setBgMixerTracks,
  speedMode,
  setSpeedMode,
  pauseMode,
  setPauseMode,
  maleVoice,
  setMaleVoice,
  femaleVoice,
  setFemaleVoice,
  onPreviewVoice,
  ambientSounds,
  bgSoundId,
  setBgSoundId,
  previewingBg,
  onPreviewBg,
}: AudioSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<'voz' | 'sons' | 'ritmo'>('voz');

  const tabs = [
    { id: 'voz', label: 'Voz', icon: Mic2 },
    { id: 'sons', label: 'Sons', icon: Music2 },
    { id: 'ritmo', label: 'Ritmo', icon: Timer },
  ];

  return (
    <div className={`flex flex-col h-full ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Tabs Header */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={14} strokeWidth={2.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 min-h-[300px]">
        {/* Voice Tab */}
        {activeTab === 'voz' && (
          <div className="space-y-4 pb-4 animate-fade-in">
            <p className="text-xs font-bold text-slate-500 mb-2">Escolha a narração:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'feminino', icon: '👩', label: 'Feminina' },
                { id: 'masculino', icon: '👨', label: 'Masculina' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id as any)}
                  className={`relative p-4 rounded-3xl border-2 transition-all active:scale-95 text-center ${
                    selectedVoice === v.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                  }`}
                >
                  <span className="text-3xl block mb-2">{v.icon}</span>
                  <span className="text-sm font-bold block">{v.label}</span>
                  {selectedVoice === v.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check size={12} color="white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
              <button
                onClick={() => setSelectedVoice('nenhuma')}
                className={`col-span-2 p-3 rounded-2xl border-2 transition-all active:scale-95 text-center ${
                  selectedVoice === 'nenhuma'
                    ? 'border-slate-500 bg-slate-50 dark:bg-slate-800'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                }`}
              >
                <span className="text-xs font-bold">🔇 Sem Narração</span>
              </button>
            </div>

            {selectedVoice !== 'nenhuma' && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-indigo-500 mb-3 uppercase tracking-wider">Perfil da Voz</p>
                  <select
                    value={selectedVoice === 'masculino' ? maleVoice : femaleVoice}
                    onChange={(e) => selectedVoice === 'masculino' ? setMaleVoice(e.target.value) : setFemaleVoice(e.target.value)}
                    className="w-full p-3 rounded-xl text-sm bg-white dark:bg-slate-800 border-none shadow-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {selectedVoice === 'masculino' ? (
                      <>
                        <option value="pt_BR-cadu-medium">Cadu (Recomendado)</option>
                        <option value="pt_BR-edresson-low">Edresson</option>
                        <option value="pt_BR-jeff-medium">Jeff</option>
                        <option value="pt_BR-faber-medium">Faber</option>
                        <option value="pt-BR-AntonioNeural">Antonio</option>
                      </>
                    ) : (
                      <>
                        <option value="pt-BR-FranciscaNeural">Francisca (Natural)</option>
                        <option value="pt-BR-ThalitaMultilingualNeural">Thalita</option>
                      </>
                    )}
                  </select>
                  <button
                    onClick={() => onPreviewVoice(
                      selectedVoice === 'masculino' ? 'masculino' : 'feminino',
                      selectedVoice === 'masculino' ? maleVoice : femaleVoice
                    )}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500 text-white text-sm font-bold shadow-md hover:bg-indigo-600 active:scale-[0.98] transition-all"
                  >
                    <Play size={14} fill="white" />
                    Ouvir Amostra
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sounds Tab */}
        {activeTab === 'sons' && (
          <div className="space-y-4 pb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500">Sons de Ambiente:</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBgEnabled(!bgEnabled)}
                  className={`w-10 h-5 rounded-full transition-all flex items-center px-1 ${bgEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${bgEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-[10px] font-black uppercase">{bgEnabled ? 'Ativo' : 'Mudo'}</span>
              </div>
            </div>

            {bgEnabled && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} className="text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Volume Master</span>
                    </div>
                    <span className="text-xs font-black text-indigo-600">{bgVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="80"
                    value={bgVolume}
                    onChange={(e) => setBgVolume(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setBgMixerEnabled(false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!bgMixerEnabled ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    Som Único
                  </button>
                  <button
                    onClick={() => setBgMixerEnabled(true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${bgMixerEnabled ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    Mixer (Multi)
                  </button>
                </div>

                {bgMixerEnabled ? (
                  <div className="grid grid-cols-3 gap-3">
                    {ambientSounds.filter(s => s.file).map((s) => {
                      const vol = bgMixerTracks[s.id] || 0;
                      const active = vol > 0;
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => {
                              const newTracks = { ...bgMixerTracks };
                              if (active) delete newTracks[s.id]; else newTracks[s.id] = 30;
                              setBgMixerTracks(newTracks);
                            }}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all active:scale-90 relative ${
                              active
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {s.emoji}
                            {active && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-slate-700 text-indigo-500 rounded-full flex items-center justify-center border-2 border-indigo-500">
                                <Check size={10} strokeWidth={4} />
                              </div>
                            )}
                          </button>
                          <span className="text-[10px] font-bold text-center truncate w-full">{s.name}</span>
                          {active && (
                            <input
                              type="range" min="5" max="80" value={vol}
                              onChange={(e) => setBgMixerTracks({ ...bgMixerTracks, [s.id]: Number(e.target.value) })}
                              className="w-12 h-1 accent-indigo-400"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={bgSoundId}
                      onChange={(e) => setBgSoundId(e.target.value)}
                      className="w-full p-3 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border-none"
                    >
                      {ambientSounds.filter(s => s.file).map(s => (
                        <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => onPreviewBg(bgSoundId)}
                      className={`w-full py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                        previewingBg ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      {previewingBg ? '⏹️ Parar Prévia' : '🔊 Ouvir Prévia'}
                    </button>
                  </div>
                )}
                
                {bgMixerEnabled && Object.keys(bgMixerTracks).length > 0 && (
                  <button
                    onClick={() => setBgMixerTracks({})}
                    className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase text-rose-500"
                  >
                    <Trash2 size={12} />
                    Limpar Mixagem
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rhythm Tab */}
        {activeTab === 'ritmo' && (
          <div className="space-y-6 pb-4 animate-fade-in">
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500">Velocidade da Narração:</p>
              <div className="flex gap-2">
                {(['0.9', '1.0', '1.1'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setSpeedMode(v)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-black border-2 transition-all ${
                      speedMode === v
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    {v}x
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center italic">Normal (1.0x) é recomendado para relaxamento.</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500">Intervalos de Pausa:</p>
              <div className="flex flex-col gap-2">
                {(['curta', 'normal', 'profunda'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setPauseMode(v)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      pauseMode === v
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    <span className="text-sm font-bold capitalize">{v}</span>
                    <span className="text-[10px] font-medium">
                      {v === 'curta' ? 'Menos silêncio' : v === 'normal' ? 'Equilibrado' : 'Mais reflexão'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
