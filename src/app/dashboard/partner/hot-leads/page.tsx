'use client';
import { useState } from 'react';

interface Lead {
  id: number; hash: string; visits: number; pages: string[]; lastVisit: string; status: 'warm' | 'heiss' | 'konvertiert';
}

const initialLeads: Lead[] = [
  { id: 1, hash: 'v8k2x', visits: 12, pages: ['Landing', 'Preise', 'FAQ'], lastVisit: '15.03.2026', status: 'heiss' },
  { id: 2, hash: 'p3m7n', visits: 5, pages: ['Landing', 'Preise'], lastVisit: '14.03.2026', status: 'warm' },
  { id: 3, hash: 'q9f4r', visits: 8, pages: ['Landing', 'Preise', 'Partner'], lastVisit: '15.03.2026', status: 'heiss' },
  { id: 4, hash: 'a1b2c', visits: 3, pages: ['Landing'], lastVisit: '13.03.2026', status: 'warm' },
  { id: 5, hash: 'x5y6z', visits: 15, pages: ['Landing', 'Preise', 'FAQ', 'Partner'], lastVisit: '12.03.2026', status: 'konvertiert' },
];

export default function HotLeadsPage() {
  const [leads, setLeads] = useState(initialLeads);

  const statusStyle: Record<string, string> = {
    'warm': 'bg-yellow-900/40 text-yellow-400',
    'heiss': 'bg-red-900/40 text-red-400',
    'konvertiert': 'bg-green-900/40 text-green-400',
  };

  const markConverted = (id: number) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: 'konvertiert' as const } : l));
  };

  const activeLeads = leads.filter((l) => l.status !== 'konvertiert').length;
  const hotCount = leads.filter((l) => l.status === 'heiss').length;

  return (
    <div className="min-h-screen bg-[var(--gf-obsidian)] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--gf-gold)]">Hot Leads</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-500">Gesamt Leads</p>
          <p className="text-3xl font-bold text-white mt-1">{leads.length}</p>
        </div>
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-500">Aktive Leads</p>
          <p className="text-3xl font-bold text-[var(--gf-gold)] mt-1">{activeLeads}</p>
        </div>
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-500">Heisse Leads</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{hotCount}</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--gf-gold)] mb-4">Kontakte</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-600 border-b border-[var(--gf-border)]">
                <th className="text-left py-2 px-3">Besucher</th>
                <th className="text-center py-2 px-3">Besuche</th>
                <th className="text-left py-2 px-3">Seiten</th>
                <th className="text-left py-2 px-3">Letzter Besuch</th>
                <th className="text-center py-2 px-3">Status</th>
                <th className="text-right py-2 px-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--gf-border)]/50">
                  <td className="py-3 px-3 font-mono text-zinc-400">{lead.hash}</td>
                  <td className="py-3 px-3 text-center text-[var(--gf-gold)] font-semibold">{lead.visits}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {lead.pages.map((p) => (
                        <span key={p} className="text-xs px-1.5 py-0.5 bg-[var(--gf-border)] rounded text-zinc-500">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-zinc-500">{lead.lastVisit}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusStyle[lead.status]}`}>{lead.status}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {lead.status !== 'konvertiert' && (
                      <div className="flex gap-1 justify-end">
                        <button className="px-2 py-1 text-xs border border-[var(--gf-gold)] text-[var(--gf-gold)] rounded hover:bg-[var(--gf-gold)] hover:text-black transition-colors">
                          Kontakt
                        </button>
                        <button onClick={() => markConverted(lead.id)} className="px-2 py-1 text-xs bg-green-800 text-green-300 rounded hover:bg-green-700 transition-colors">
                          Konvertiert
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
