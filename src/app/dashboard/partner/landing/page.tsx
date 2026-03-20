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
    <div className="min-h-screen bg-[var(--gf-obsidian)] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--gf-gold)]">Landing Page Editor</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full bg-[var(--gf-obsidian)] border border-[var(--gf-border)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--gf-gold)]" />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[var(--gf-obsidian)] border border-[var(--gf-border)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--gf-gold)] resize-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Foto URL</label>
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." className="w-full bg-[var(--gf-obsidian)] border border-[var(--gf-border)] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--gf-gold)]" />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Video URL</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="w-full bg-[var(--gf-obsidian)] border border-[var(--gf-border)] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--gf-gold)]" />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-2">Trader auswaehlen</label>
            <div className="flex flex-wrap gap-2">
              {traderOptions.map((t) => (
                <button key={t} onClick={() => toggleTrader(t)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedTraders.includes(t) ? 'bg-[var(--gf-gold)] text-black border-[var(--gf-gold)]' : 'border-[var(--gf-border)] text-zinc-500 hover:border-[var(--gf-gold)]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-2 bg-[var(--gf-gold)] text-black rounded-lg font-semibold hover:bg-[#c4952f]">
            {saved ? 'Gespeichert!' : 'Speichern'}
          </button>
        </div>

        {/* Preview */}
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--gf-gold)] mb-4">Vorschau</h2>
          <div className="space-y-4">
            {photoUrl && <div className="w-20 h-20 rounded-full bg-[var(--gf-border)] overflow-hidden"><img src={photoUrl} alt="Foto" className="w-full h-full object-cover" /></div>}
            {!photoUrl && <div className="w-20 h-20 rounded-full bg-[var(--gf-border)] flex items-center justify-center text-zinc-600 text-xs">Kein Foto</div>}
            <h3 className="text-xl font-bold text-[var(--gf-gold)]">{headline || 'Headline...'}</h3>
            <p className="text-zinc-400 text-sm">{bio || 'Bio...'}</p>
            {videoUrl && <p className="text-xs text-zinc-600 break-all">Video: {videoUrl}</p>}
            <div>
              <p className="text-sm text-zinc-500 mb-1">Ausgewaehlte Trader:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTraders.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-[var(--gf-gold)]/20 text-[var(--gf-gold)] rounded">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
