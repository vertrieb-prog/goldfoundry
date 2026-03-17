import Link from "next/link";
export default function RiskDisclaimer() {
  return (
    <div className="min-h-screen py-20 px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/"><span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
        <h1 className="text-3xl font-bold mt-8 mb-8" style={{ color: "var(--gf-text-bright)" }}>Risikohinweis</h1>
        <div className="gf-panel p-8 mb-8" style={{ borderColor: "rgba(192,57,43,0.3)" }}>
          <p className="text-base font-semibold mb-4" style={{ color: "var(--gf-red)" }}>WICHTIGER HINWEIS: Trading mit Finanzinstrumenten birgt erhebliche Risiken und ist nicht für jeden Anleger geeignet.</p>
          <p className="mb-4" style={{ color: "var(--gf-text)" }}>Der Handel mit Devisen (Forex), CFDs, Gold (XAUUSD) und Indizes (US500) beinhaltet ein hohes Risiko und kann zum vollständigen Verlust des eingesetzten Kapitals führen. Sie sollten nur Kapital einsetzen, dessen Verlust Sie sich leisten können.</p>
          <p style={{ color: "var(--gf-text)" }}>Vergangene Performance ist KEIN Indikator für zukünftige Ergebnisse. Historische Renditen, Backtests und simulierte Performance stellen keine Garantie für zukünftige Gewinne dar.</p>
        </div>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Smart Copier Risiko</p><p>Der Gold Foundry Smart Copier nutzt algorithmische Risikoanpassung mit 7 Faktoren und einem Manipulation Shield. Dies REDUZIERT Risiken, ELIMINIERT sie aber NICHT. Automatisierte Systeme können auf unvorhergesehene Marktbedingungen nicht immer korrekt reagieren. Technische Ausfälle (Internet, Server, Broker) können zu Verlusten führen.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Prop-Firm Risiko</p><p>Trading mit Prop-Firm-Kapital unterliegt strengen Drawdown-Regeln. Ein Verstoß gegen diese Regeln führt zum Verlust des Funded-Accounts. Gold Foundry übernimmt keine Haftung für verlorene Prop-Firm-Challenges oder Funded-Accounts.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Keine Finanzberatung</p><p>Gold Foundry bietet KEINE Anlageberatung, Finanzberatung oder Empfehlungen zum Kauf/Verkauf von Finanzinstrumenten. Alle Informationen auf dieser Plattform dienen ausschließlich Bildungs- und Informationszwecken. Konsultieren Sie einen unabhängigen Finanzberater bevor Sie mit dem Trading beginnen.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Hebelwirkung</p><p>Prop-Firm-Accounts bieten hohe Hebel (bis 1:200). Hebelwirkung vergrößert sowohl Gewinne als auch Verluste. Bei hohem Hebel können kleine Marktbewegungen zu überproportionalen Verlusten führen.</p></div>
          <div className="pt-4"><p style={{ color: "var(--gf-text-dim)" }}>Durch die Nutzung von Gold Foundry bestätigen Sie, dass Sie diesen Risikohinweis gelesen und verstanden haben und die damit verbundenen Risiken akzeptieren.</p></div>
        </div>
      </div>
    </div>
  );
}
