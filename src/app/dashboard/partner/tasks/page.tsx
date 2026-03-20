'use client';
import { useState } from 'react';

interface Task { id: number; title: string; fp: number; done: boolean }

const initialTasks: Task[] = [
  { id: 1, title: 'Taegliches Login', fp: 10, done: true },
  { id: 2, title: 'Einen Partner kontaktieren', fp: 20, done: false },
  { id: 3, title: 'Social Media Post teilen', fp: 15, done: false },
  { id: 4, title: 'Coach-Tipp lesen', fp: 10, done: true },
  { id: 5, title: 'Neuen Kontakt einladen', fp: 25, done: false },
];

const completedHistory = [
  { date: '14.03.2026', tasks: 5, fp: 80 },
  { date: '13.03.2026', tasks: 4, fp: 65 },
  { date: '12.03.2026', tasks: 5, fp: 80 },
  { date: '11.03.2026', tasks: 3, fp: 45 },
  { date: '10.03.2026', tasks: 5, fp: 80 },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const streak = 7;
  const totalFPFromTasks = 420;

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const completedToday = tasks.filter((t) => t.done).length;
  const fpToday = tasks.filter((t) => t.done).reduce((sum, t) => sum + t.fp, 0);

  return (
    <div className="min-h-screen bg-[var(--gf-obsidian)] text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--gf-gold)]">Taegliche Aufgaben</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-500">Streak</p>
          <p className="text-3xl font-bold text-[var(--gf-gold)] mt-1">{streak} Tage</p>
          <p className="text-xs text-zinc-600 mt-1">Bonus bei 14 und 30 Tagen</p>
        </div>
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-500">Heute erledigt</p>
          <p className="text-3xl font-bold text-white mt-1">{completedToday}/{tasks.length}</p>
          <p className="text-xs text-green-400 mt-1">+{fpToday} FP</p>
        </div>
        <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-4 text-center">
          <p className="text-sm text-zinc-500">FP aus Aufgaben (gesamt)</p>
          <p className="text-3xl font-bold text-[var(--gf-gold)] mt-1">{totalFPFromTasks}</p>
        </div>
      </div>

      {/* Streak Progress */}
      <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
          <span>Streak Fortschritt</span>
          <span className="text-[var(--gf-gold)]">{streak}/14 Tage</span>
        </div>
        <div className="w-full bg-[var(--gf-border)] rounded-full h-3">
          <div className="bg-[var(--gf-gold)] h-3 rounded-full" style={{ width: `${(streak / 14) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-600 mt-1">
          <span>Start</span><span>14d Bonus (+500 FP)</span><span>30d Bonus (+2000 FP)</span>
        </div>
      </div>

      {/* Daily Tasks */}
      <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--gf-gold)] mb-4">Heutige Aufgaben</h2>
        <div className="space-y-2">
          {tasks.map((task) => (
            <button key={task.id} onClick={() => toggleTask(task.id)} className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--gf-obsidian)] rounded-lg border border-[var(--gf-border)] hover:border-[var(--gf-gold)]/50 transition-colors text-left">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${task.done ? 'bg-[var(--gf-gold)] border-[var(--gf-gold)]' : 'border-gray-600'}`}>
                {task.done && <span className="text-black text-xs font-bold">&#10003;</span>}
              </div>
              <span className={`flex-1 text-sm ${task.done ? 'text-zinc-600 line-through' : 'text-white'}`}>{task.title}</span>
              <span className="text-xs text-[var(--gf-gold)]">+{task.fp} FP</span>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="gf-panel border border-[var(--gf-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--gf-gold)] mb-4">Verlauf</h2>
        <div className="space-y-2">
          {completedHistory.map((h, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-2 bg-[var(--gf-obsidian)] rounded-lg border border-[var(--gf-border)] text-sm">
              <span className="text-zinc-500">{h.date}</span>
              <span className="text-zinc-400">{h.tasks}/5 Aufgaben</span>
              <span className="text-[var(--gf-gold)]">+{h.fp} FP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
