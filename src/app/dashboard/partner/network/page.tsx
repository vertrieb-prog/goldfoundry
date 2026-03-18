'use client';
import { useState } from 'react';

interface Member { id: string; name: string; level: number; active: boolean; children: Member[] }

const tree: Member[] = [
  { id: '1', name: 'Max Mueller', level: 1, active: true, children: [
    { id: '3', name: 'Lisa Schmidt', level: 2, active: true, children: [
      { id: '6', name: 'Tobias Lang', level: 3, active: false, children: [] },
    ]},
    { id: '4', name: 'Tom Weber', level: 2, active: false, children: [] },
  ]},
  { id: '2', name: 'Anna Fischer', level: 1, active: true, children: [
    { id: '5', name: 'Jan Bauer', level: 2, active: true, children: [] },
  ]},
];

const levelCounts = [
  { level: 'L1', count: 2 },
  { level: 'L2', count: 3 },
  { level: 'L3', count: 1 },
];
const maxCount = Math.max(...levelCounts.map((l) => l.count));

function TreeNode({ member, search }: { member: Member; search: string }) {
  const match = !search || member.name.toLowerCase().includes(search.toLowerCase());
  const childMatch = member.children.some((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  if (!match && !childMatch) return null;

  return (
    <div className="ml-4 border-l border-[#1a1a15] pl-4 py-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${member.active ? 'bg-green-500' : 'bg-gray-600'}`} />
        <span className={match ? 'text-white' : 'text-gray-600'}>{member.name}</span>
        <span className="text-xs text-gray-500">L{member.level}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${member.active ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
          {member.active ? 'Aktiv' : 'Inaktiv'}
        </span>
      </div>
      {member.children.map((child) => (
        <TreeNode key={child.id} member={child} search={search} />
      ))}
    </div>
  );
}

export default function NetworkPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#060503] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#d4a537]">Netzwerk</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Name oder Status suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md bg-[#0a0a08] border border-[#1a1a15] rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4a537]"
      />

      {/* Level Bars */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Mitglieder pro Level</h2>
        <div className="space-y-3">
          {levelCounts.map((l) => (
            <div key={l.level} className="flex items-center gap-3">
              <span className="w-8 text-sm text-gray-400">{l.level}</span>
              <div className="flex-1 bg-[#1a1a15] rounded-full h-4">
                <div className="bg-[#d4a537] h-4 rounded-full" style={{ width: `${(l.count / maxCount) * 100}%` }} />
              </div>
              <span className="text-sm text-gray-300 w-8 text-right">{l.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-[#0a0a08] border border-[#1a1a15] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#d4a537] mb-4">Downline Baumansicht</h2>
        {tree.map((member) => (
          <TreeNode key={member.id} member={member} search={search} />
        ))}
      </div>
    </div>
  );
}
