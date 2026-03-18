'use client';

const banners = [
  { id: 1, title: 'Gold Trading Banner 728x90', size: '728x90' },
  { id: 2, title: 'Social Media Square', size: '1080x1080' },
  { id: 3, title: 'Story Format', size: '1080x1920' },
  { id: 4, title: 'Website Header', size: '1920x400' },
];

const socialTemplates = [
  { id: 1, title: 'Erfolgsgeschichte Post', platform: 'Instagram' },
  { id: 2, title: 'Einladungs-Story', platform: 'Instagram' },
  { id: 3, title: 'Performance Update', platform: 'Facebook' },
  { id: 4, title: 'Partner Vorteile', platform: 'LinkedIn' },
];

const videos = [
  { id: 1, title: 'Einstieg ins Partner-Programm', duration: '5:30' },
  { id: 2, title: 'Netzwerk aufbauen - Tipps', duration: '8:15' },
  { id: 3, title: 'Builder Pack erklaert', duration: '3:45' },
  { id: 4, title: 'Landing Page optimieren', duration: '6:20' },
];

export default function MaterialPage() {
  return (
    <div className="min-h-screen bg-[#060503] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#d4a537]">Marketing Material</h1>

      {/* Banners */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Banner Galerie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="border border-[#1a1a15] rounded-lg overflow-hidden">
              <div className="h-32 bg-[#1a1a15] flex items-center justify-center text-gray-500 text-sm">
                {b.size} Platzhalter
              </div>
              <div className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.size}</p>
                </div>
                <button className="px-3 py-1.5 bg-[#d4a537] text-black rounded-lg text-xs font-semibold hover:bg-[#c4952f]">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Templates */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Social Media Vorlagen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialTemplates.map((t) => (
            <div key={t.id} className="border border-[#1a1a15] rounded-lg p-4">
              <div className="h-24 bg-[#1a1a15] rounded mb-3 flex items-center justify-center text-gray-500 text-xs">
                Vorschau
              </div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-gray-500 mt-1">{t.platform}</p>
              <button className="mt-2 w-full px-3 py-1.5 bg-[#d4a537] text-black rounded-lg text-xs font-semibold hover:bg-[#c4952f]">
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Video Tutorials</h2>
        <div className="space-y-3">
          {videos.map((v) => (
            <div key={v.id} className="flex justify-between items-center px-4 py-3 bg-[#060503] rounded-lg border border-[#1a1a15]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a1a15] rounded flex items-center justify-center text-[#d4a537] text-lg">
                  &#9654;
                </div>
                <div>
                  <p className="text-sm font-medium">{v.title}</p>
                  <p className="text-xs text-gray-500">{v.duration}</p>
                </div>
              </div>
              <button className="px-3 py-1.5 border border-[#d4a537] text-[#d4a537] rounded-lg text-xs font-semibold hover:bg-[#d4a537] hover:text-black transition-colors">
                Ansehen
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
