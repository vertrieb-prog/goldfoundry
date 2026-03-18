'use client';
import { useState } from 'react';

const traderOptions = ['GoldScalper Pro', 'SwingKing V2', 'TrendMaster', 'NightOwl EA', 'SafeHaven'];

export default function LandingPage() {
  const [headline, setHeadline] = useState('Dein Weg zur finanziellen Freiheit');
  const [bio, setBio] = useState('Erfahrener Trader mit 5 Jahren Erfahrung im Goldhandel.');
  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedTraders, setSelectedTraders] = useState<string[]>(['GoldScalper Pro']);
  const [saved, setSaved] = useState(false);

  const toggleTrader = (t: string) => {
    setSelectedTraders((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060503] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#d4a537]">Landing Page Editor</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full bg-[#060503] border border-[#1a1a15] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#d4a537]" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[#060503] border border-[#1a1a15] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#d4a537] resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Foto URL</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#060503] border border-[#1a1a15] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4a537]" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Video URL</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#060503] border border-[#1a1a15] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4a537]" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Trader auswaehlen</label>
            <div className="flex flex-wrap gap-2">
              {traderOptions.map((t) => (
                <button key={t} onClick={() => toggleTrader(t)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedTraders.includes(t) ? 'bg-[#d4a537] text-black border-[#d4a537]' : 'border-[#1a1a15] text-gray-400 hover:border-[#d4a537]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-2 bg-[#d4a537] text-black rounded-lg font-semibold hover:bg-[#c4952f]">
            {saved ? 'Gespeichert!' : 'Speichern'}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Vorschau</h2>
          <div className="space-y-4">
            {photoUrl && <div className="w-20 h-20 rounded-full bg-[#1a1a15] overflow-hidden"><img src={photoUrl} alt="Foto" className="w-full h-full object-cover" /></div>}
            {!photoUrl && <div className="w-20 h-20 rounded-full bg-[#1a1a15] flex items-center justify-center text-gray-500 text-xs">Kein Foto</div>}
            <h3 className="text-xl font-bold text-[#d4a537]">{headline || 'Headline...'}</h3>
            <p className="text-gray-300 text-sm">{bio || 'Bio...'}</p>
            {videoUrl && <p className="text-xs text-gray-500 break-all">Video: {videoUrl}</p>}
            <div>
              <p className="text-sm text-gray-400 mb-1">Ausgewaehlte Trader:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTraders.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-[#d4a537]/20 text-[#d4a537] rounded">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
