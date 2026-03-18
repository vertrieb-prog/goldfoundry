'use client';
import { useState } from 'react';

const rankProgress = 65;
const fpBalance = 12480;
const earnedThisMonth = 3200;
const missedFP = 1500;

const revenueBreakdown = [
  { label: 'Provisionen', amount: 5200 },
  { label: 'Matching Bonus', amount: 3800 },
  { label: 'Pool-Ausschuettung', amount: 3480 },
];

const liveFeed = [
  { time: '14:32', text: 'Neuer Referral: Max M. (L1)' },
  { time: '13:15', text: 'Provision erhalten: +120 FP' },
  { time: '12:01', text: 'Matching Bonus: +80 FP' },
  { time: '10:45', text: 'Neuer Referral: Lisa K. (L2)' },
  { time: '09:30', text: 'Pool-Ausschuettung: +200 FP' },
];

export default function PartnerDashboard() {
  const [feed] = useState(liveFeed);

  return (
    <div className="min-h-screen bg-[#060503] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#d4a537]">Partner Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* FP Balance */}
        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 col-span-1 md:col-span-2 lg:col-span-1">
          <p className="text-sm text-gray-400">FP Guthaben</p>
          <p className="text-4xl font-bold text-[#d4a537] mt-2">{fpBalance.toLocaleString('de-DE')} FP</p>
          <p className="text-sm text-green-400 mt-1">+ {earnedThisMonth.toLocaleString('de-DE')} FP diesen Monat</p>
        </div>

        {/* Rank Badge */}
        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
          <p className="text-sm text-gray-400">Aktueller Rang</p>
          <p className="text-xl font-bold text-[#d4a537] mt-2">Gold Partner</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Gold</span><span>Platin</span>
            </div>
            <div className="w-full bg-[#1a1a15] rounded-full h-2">
              <div className="bg-[#d4a537] h-2 rounded-full" style={{ width: `${rankProgress}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{rankProgress}% zum naechsten Rang</p>
          </div>
        </div>

        {/* Missed Bonuses */}
        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
          <p className="text-sm text-gray-400">Verpasste Boni</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{missedFP.toLocaleString('de-DE')} FP</p>
          <p className="text-sm text-gray-500 mt-1">Du hast {missedFP.toLocaleString('de-DE')} FP verpasst</p>
          <button className="mt-3 text-sm text-[#d4a537] hover:underline">Details anzeigen</button>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Einnahmen-Aufschluesselung</h2>
        <div className="space-y-3">
          {revenueBreakdown.map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-gray-300">{item.label}</span>
              <span className="text-[#d4a537] font-semibold">{item.amount.toLocaleString('de-DE')} FP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Feed */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Live Feed</h2>
        <div className="space-y-3">
          {feed.map((event, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 w-12 shrink-0">{event.time}</span>
              <div className="w-2 h-2 rounded-full bg-[#d4a537] shrink-0" />
              <span className="text-gray-300">{event.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
