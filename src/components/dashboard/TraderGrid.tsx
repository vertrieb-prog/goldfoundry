"use client";

import { motion } from "framer-motion";
import { TraderCard } from "@/components/dashboard/TraderCard";
import { TRADER_CONFIG } from "@/lib/trader-config";

interface TraderData {
  codename: string;
  active: boolean;
  todayProfit: number;
  ddBuffer: number;
  ddUsed: number;
  equityCurve?: number[];
}

interface TraderGridProps {
  traders: TraderData[];
  ddLimit: number;
}

export function TraderGrid({ traders, ddLimit }: TraderGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {TRADER_CONFIG.map((config) => {
        const data = traders.find((t) => t.codename === config.codename);
        return (
          <TraderCard
            key={config.codename}
            codename={config.codename}
            asset={config.asset}
            assetLabel={config.assetLabel}
            color={config.color}
            perf={config.perf}
            wr={config.wr}
            maxDd={config.maxDd}
            since={config.since}
            active={data?.active ?? false}
            todayProfit={data?.todayProfit ?? 0}
            ddBuffer={data?.ddBuffer ?? ddLimit}
            ddLimit={ddLimit}
            equityCurve={data?.equityCurve ?? []}
          />
        );
      })}
    </motion.div>
  );
}
