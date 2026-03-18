// ═══════════════════════════════════════════════════════════════
// src/lib/partner/fast-start.ts — 4-Week Fast Start Plan
// ═══════════════════════════════════════════════════════════════

export type PartnerGoal = "casual" | "side_income" | "full_time" | "team_builder";

export function getFastStartPlan(goal: PartnerGoal) {
    const plans: Record<PartnerGoal, Array<{ week: number; title: string; tasks: string[]; target: string }>> = {
        casual: [
            { week: 1, title: "Setup & Basics", tasks: ["Profil vervollständigen", "Landing Page erstellen", "3 Freunde einladen"], target: "1 Referral" },
            { week: 2, title: "Erste Schritte", tasks: ["Ergebnisse teilen", "WhatsApp Status posten", "5 Kontakte anschreiben"], target: "2 Referrals" },
            { week: 3, title: "Routine aufbauen", tasks: ["Daily Tasks machen", "Instagram Story", "Feedback sammeln"], target: "3 Referrals" },
            { week: 4, title: "Wachstum", tasks: ["Erfahrungsbericht schreiben", "Netzwerk erweitern", "Partner helfen"], target: "5 Referrals total" },
        ],
        side_income: [
            { week: 1, title: "Foundation", tasks: ["Alle Materialien studieren", "Top 20 Kontakte listen", "Landing Page optimieren", "5 Einladungen senden"], target: "3 Referrals" },
            { week: 2, title: "Aktivierung", tasks: ["10 Kontakte anschreiben", "2 Instagram Posts", "WhatsApp Broadcast", "Ergebnisse dokumentieren"], target: "5 Referrals" },
            { week: 3, title: "Skalierung", tasks: ["Content Plan erstellen", "Telegram Gruppe starten", "Team-Call organisieren", "Builder Pack kaufen"], target: "8 Referrals" },
            { week: 4, title: "System", tasks: ["Tägliche Routine etablieren", "Team unterstützen", "Erste Duplikation", "Rank-Up zu Silber"], target: "10 Referrals total" },
        ],
        full_time: [
            { week: 1, title: "All-In Start", tasks: ["25er Builder Pack kaufen", "Top 50 Kontakte", "3 Social Media Posts", "10 persönliche Einladungen", "Landing Page perfektionieren"], target: "5 Referrals" },
            { week: 2, title: "Momentum", tasks: ["20 Kontakte täglich", "Content jeden Tag", "Team-Support aufbauen", "Webinar planen", "Daily Tasks komplett"], target: "10 Referrals" },
            { week: 3, title: "Team Building", tasks: ["Duplikations-System erstellen", "Partner trainieren", "Community aufbauen", "Cross-Promotion", "Netzwerk-Events"], target: "18 Referrals" },
            { week: 4, title: "Leadership", tasks: ["Gold-Rank erreichen", "Team-Leaderboard führen", "Mentoring anbieten", "Strategie optimieren", "50er Pack kaufen"], target: "25 Referrals total" },
        ],
        team_builder: [
            { week: 1, title: "Infrastructure", tasks: ["50er Builder Pack", "Team-System erstellen", "Onboarding-Prozess dokumentieren", "Leader identifizieren", "100 Kontakte listen"], target: "10 Referrals" },
            { week: 2, title: "Recruitment Blitz", tasks: ["30 Kontakte/Tag", "Live Sessions", "Testimonials sammeln", "Partner-Calls starten", "Content Machine"], target: "20 Referrals" },
            { week: 3, title: "Duplikation", tasks: ["Top-Partner fördern", "System übergeben", "Delegation starten", "Leader entwickeln", "Automatisierung"], target: "35 Referrals" },
            { week: 4, title: "Scaling", tasks: ["Diamond-Rank", "Multiple Teams", "Passive Income aufbauen", "Internationale Expansion", "System perfektioniert"], target: "50 Referrals total" },
        ],
    };

    return plans[goal] || plans.casual;
}
