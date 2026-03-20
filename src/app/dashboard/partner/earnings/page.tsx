'use client';
import { useState } from 'react';

const transactions = [
  { date: '15.03.2026', type: 'Provision', amount: 120, balance: 12480 },
  { date: '14.03.2026', type: 'Matching Bonus', amount: 80, balance: 12360 },
  { date: '13.03.2026', type: 'Pool-Ausschuettung', amount: 200, balance: 12280 },
  { date: '12.03.2026', type: 'Provision', amount: 95, balance: 12080 },
  { date: '11.03.2026', type: 'Task Belohnung', amount: 50, balance: 11985 },
  { date: '10.03.2026', type: 'Auszahlung', amount: -5000, balance: 11935 },
];

const payoutHistory = [
  { date: '10.03.2026', amount: 5000, status: 'Ausgezahlt' },
  { date: '25.02.2026', amount: 5000, status: 'Ausgezahlt' },
  { date: '10.02.2026', amount: 7500, status: 'Ausgezahlt' },
];

export default function EarningsPage() {
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requested, setRequested] = useState(false);

  const handlePayout = () => {
    const amount = parseInt(payoutAmount);
    if (amount >= 5000) {
      setRequested(true);
      setTimeout(() => setRequested(false), 3000);
      setPayoutAmount('');
    }
  };

  const statusColor: Record<string, string> = {
    'Ausgezahlt': 'bg-green-900/40 text-green-400',
    'In Bearbeitung': 'bg-yellow-900/40 text-yellow-400',
    'Abgelehnt': 'bg-red-900/40 text-red-400',
  };

  return (
    <div className="min-h-screen bg-[var(--gf-obsidian)] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--gf-gold)]">Einnahmen & Auszahlungen</h1>

      {/* Transaction History */}
      <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--gf-gold)] mb-4">FP Transaktionen</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-600 border-b border-[var(--gf-border)]">
                <th className="text-left py-2 px-3">Datum</th>
                <th className="text-left py-2 px-3">Typ</th>
                <th className="text-right py-2 px-3">Betrag</th>
                <th className="text-right py-2 px-3">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i} className="border-b border-[var(--gf-border)]/50">
                  <td className="py-2 px-3 text-zinc-500">{tx.date}</td>
                  <td className="py-2 px-3">{tx.type}</td>
                  <td className={`py-2 px-3 text-right font-medium ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('de-DE')} FP
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-500">{tx.balance.toLocaleString('de-DE')} FP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request */}
      <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--gf-gold)] mb-4">Auszahlung beantragen</h2>
        <p className="text-sm text-zinc-500 mb-3">Mindestbetrag: 5.000 FP</p>
        <div className="flex gap-2 max-w-md">
          <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Betrag in FP" className="flex-1 bg-[var(--gf-obsidian)] border border-[var(--gf-border)] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--gf-gold)]" />
          <button onClick={handlePayout} className="px-4 py-2 bg-[var(--gf-gold)] text-black rounded-lg font-semibold hover:bg-[#c4952f] text-sm">
            {requested ? 'Beantragt!' : 'Beantragen'}
          </button>
        </div>
      </div>

      {/* Payout History */}
      <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--gf-gold)]">Auszahlungsverlauf</h2>
          <button className="px-4 py-2 border border-[var(--gf-gold)] text-[var(--gf-gold)] rounded-lg text-sm font-semibold hover:bg-[var(--gf-gold)] hover:text-black transition-colors">
            CSV Export
          </button>
        </div>
        <div className="space-y-2">
          {payoutHistory.map((p, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-3 bg-[var(--gf-obsidian)] rounded-lg border border-[var(--gf-border)]">
              <span className="text-sm text-zinc-500">{p.date}</span>
              <span className="text-sm font-medium">{p.amount.toLocaleString('de-DE')} FP</span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColor[p.status] || ''}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
