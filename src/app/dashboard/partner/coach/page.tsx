'use client';
import { useState } from 'react';

interface Message { role: 'user' | 'coach'; text: string }

const quickActions = ['Tipps fuer heute', 'Netzwerk-Analyse', 'Strategie-Empfehlung', 'Rank-Aufstieg'];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'coach', text: 'Hallo! Ich bin dein KI Partner-Coach. Wie kann ich dir heute helfen?' },
    { role: 'coach', text: 'Du kannst mir Fragen zu deinem Netzwerk, deiner Strategie oder deinen naechsten Schritten stellen.' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    const coachResponses: Record<string, string> = {
      'Tipps fuer heute': 'Fokussiere dich heute auf deine 3 aktivsten L1-Partner. Sende ihnen eine Motivationsnachricht und frage nach ihren Herausforderungen.',
      'Netzwerk-Analyse': 'Dein Netzwerk waechst gut! 65% deiner L1-Partner sind aktiv. Tipp: Kontaktiere die inaktiven Partner und biete Unterstuetzung an.',
      'Strategie-Empfehlung': 'Mit deinem aktuellen Tempo erreichst du Platin in ca. 6 Wochen. Empfehlung: Nutze Builder Packs um schneller zu wachsen.',
      'Rank-Aufstieg': 'Dir fehlen noch 35% zum Platin-Rang. Fokussiere dich auf 2 neue direkte Partner diesen Monat.',
    };
    const response = coachResponses[text] || 'Das ist eine gute Frage! Basierend auf deinen Daten empfehle ich dir, dein Netzwerk weiter auszubauen und die taeglichen Tasks zu erledigen.';
    setMessages((prev) => [...prev, userMsg, { role: 'coach', text: response }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#060503] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#d4a537]">KI Partner-Coach</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3 bg-[#0a0a08] border border-[#1a1a15] rounded-xl flex flex-col h-[600px]">
          {/* Coach Header */}
          <div className="p-4 border-b border-[#1a1a15] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d4a537] flex items-center justify-center text-black font-bold text-sm">GF</div>
            <div>
              <p className="font-semibold text-sm">GoldFoundry Coach</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-xl text-sm ${msg.role === 'user' ? 'bg-[#d4a537] text-black' : 'bg-[#1a1a15] text-gray-300'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#1a1a15]">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)} placeholder="Nachricht schreiben..." className="flex-1 bg-[#060503] border border-[#1a1a15] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4a537] text-sm" />
              <button onClick={() => sendMessage(input)} className="px-4 py-2 bg-[#d4a537] text-black rounded-lg font-semibold hover:bg-[#c4952f] text-sm">
                Senden
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-4 h-fit">
          <h2 className="text-sm font-semibold text-[#d4a537] mb-3">Schnellaktionen</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button key={action} onClick={() => sendMessage(action)} className="w-full text-left px-3 py-2 bg-[#060503] border border-[#1a1a15] rounded-lg text-sm text-gray-300 hover:border-[#d4a537] hover:text-[#d4a537] transition-colors">
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
