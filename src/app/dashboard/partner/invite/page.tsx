'use client';
import { useState } from 'react';

const builderPacks = [
  { size: '5er', price: '49 EUR', codes: 5 },
  { size: '10er', price: '89 EUR', codes: 10 },
  { size: '25er', price: '199 EUR', codes: 25 },
  { size: '50er', price: '349 EUR', codes: 50 },
];

const existingCodes = [
  { code: 'GF-AX7K2', used: true, referral: 'Max M.' },
  { code: 'GF-BN3P9', used: false, referral: null },
  { code: 'GF-CQ8L1', used: true, referral: 'Lisa S.' },
];

export default function InvitePage() {
  const [copied, setCopied] = useState(false);
  const [codes, setCodes] = useState(existingCodes);
  const referralLink = 'https://goldfoundry.com/ref/partner123';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCode = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCodes([...codes, { code: `GF-${id}`, used: false, referral: null }]);
  };

  return (
    <div className="min-h-screen bg-[#060503] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#d4a537]">Einladen & Rekrutieren</h1>

      {/* Referral Link */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-3">Dein Referral-Link</h2>
        <div className="flex gap-2">
          <input readOnly value={referralLink} className="flex-1 bg-[#060503] border border-[#1a1a15] rounded-lg px-4 py-2 text-gray-300 text-sm" />
          <button onClick={copyLink} className="px-4 py-2 bg-[#d4a537] text-black rounded-lg font-semibold hover:bg-[#c4952f] text-sm">
            {copied ? 'Kopiert!' : 'Kopieren'}
          </button>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 flex flex-col items-center">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-3">QR Code</h2>
        <div className="w-48 h-48 bg-[#1a1a15] rounded-lg flex items-center justify-center text-gray-500 text-sm">
          QR Code Platzhalter
        </div>
      </div>

      {/* Builder Packs */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Builder Packs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {builderPacks.map((pack) => (
            <div key={pack.size} className="border border-[#1a1a15] rounded-lg p-4 text-center hover:border-[#d4a537] transition-colors">
              <p className="text-2xl font-bold text-[#d4a537]">{pack.size}</p>
              <p className="text-sm text-gray-400 mt-1">{pack.codes} Codes</p>
              <p className="text-lg font-semibold text-white mt-2">{pack.price}</p>
              <button className="mt-3 w-full px-3 py-1.5 bg-[#d4a537] text-black rounded-lg text-sm font-semibold hover:bg-[#c4952f]">
                Kaufen
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Codes */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#d4a537]">Aktive Codes</h2>
          <button onClick={generateCode} className="px-4 py-2 bg-[#d4a537] text-black rounded-lg text-sm font-semibold hover:bg-[#c4952f]">
            Neuer Code
          </button>
        </div>
        <div className="space-y-2">
          {codes.map((c) => (
            <div key={c.code} className="flex justify-between items-center px-4 py-2 bg-[#060503] rounded-lg border border-[#1a1a15]">
              <span className="font-mono text-sm">{c.code}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${c.used ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                {c.used ? `Eingeloest: ${c.referral}` : 'Offen'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
