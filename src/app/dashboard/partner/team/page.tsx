'use client';

const leaderboard = [
  { rank: 1, name: 'Sarah K.', fp: 8500, trend: 'up' },
  { rank: 2, name: 'Du', fp: 6200, trend: 'up' },
  { rank: 3, name: 'Michael R.', fp: 5800, trend: 'down' },
  { rank: 4, name: 'Julia B.', fp: 4300, trend: 'up' },
  { rank: 5, name: 'Thomas W.', fp: 3900, trend: 'same' },
];

const contests = [
  { title: 'Maerz Sprint', end: '31.03.2026', prize: '10.000 FP', yourRank: 3, total: 25, active: true },
  { title: 'Q1 Challenge', end: '31.03.2026', prize: '50.000 FP', yourRank: 7, total: 100, active: true },
  { title: 'Februar Blitz', end: '28.02.2026', prize: '5.000 FP', yourRank: 2, total: 20, active: false },
];

const trainings = [
  { title: 'Grundlagen Partner-Programm', progress: 100 },
  { title: 'Fortgeschrittene Rekrutierung', progress: 60 },
  { title: 'Social Media Strategien', progress: 30 },
  { title: 'Leadership & Team-Fuehrung', progress: 0 },
];

export default function TeamPage() {
  const trendIcon: Record<string, string> = { up: '&#9650;', down: '&#9660;', same: '&#9679;' };
  const trendColor: Record<string, string> = { up: 'text-green-400', down: 'text-red-400', same: 'text-gray-500' };

  return (
    <div className="min-h-screen bg-[#060503] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#d4a537]">Team & Wettbewerbe</h1>

      {/* Leaderboard */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Team Rangliste</h2>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div key={entry.rank} className={`flex items-center gap-4 px-4 py-3 rounded-lg border ${entry.name === 'Du' ? 'bg-[#d4a537]/10 border-[#d4a537]/30' : 'bg-[#060503] border-[#1a1a15]'}`}>
              <span className={`w-8 text-center font-bold ${entry.rank <= 3 ? 'text-[#d4a537]' : 'text-gray-500'}`}>
                #{entry.rank}
              </span>
              <span className={`flex-1 font-medium ${entry.name === 'Du' ? 'text-[#d4a537]' : 'text-white'}`}>
                {entry.name}
              </span>
              <span className="text-sm text-gray-300">{entry.fp.toLocaleString('de-DE')} FP</span>
              <span className={`text-xs ${trendColor[entry.trend]}`} dangerouslySetInnerHTML={{ __html: trendIcon[entry.trend] }} />
            </div>
          ))}
        </div>
      </div>

      {/* Contests */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Aktive Wettbewerbe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((c) => (
            <div key={c.title} className={`border rounded-xl p-4 ${c.active ? 'border-[#d4a537]/30' : 'border-[#1a1a15] opacity-60'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm">{c.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${c.active ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                  {c.active ? 'Aktiv' : 'Beendet'}
                </span>
              </div>
              <p className="text-xs text-gray-400">Endet: {c.end}</p>
              <p className="text-sm text-[#d4a537] font-semibold mt-2">Preis: {c.prize}</p>
              <div className="mt-3 flex justify-between text-xs text-gray-400">
                <span>Dein Platz: #{c.yourRank}</span>
                <span>{c.total} Teilnehmer</span>
              </div>
              <div className="w-full bg-[#1a1a15] rounded-full h-1.5 mt-2">
                <div className="bg-[#d4a537] h-1.5 rounded-full" style={{ width: `${((c.total - c.yourRank) / c.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Progress */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Trainingsfortschritt</h2>
        <div className="space-y-4">
          {trainings.map((t) => (
            <div key={t.title}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">{t.title}</span>
                <span className="text-[#d4a537]">{t.progress}%</span>
              </div>
              <div className="w-full bg-[#1a1a15] rounded-full h-2">
                <div className={`h-2 rounded-full ${t.progress === 100 ? 'bg-green-500' : 'bg-[#d4a537]'}`} style={{ width: `${t.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
