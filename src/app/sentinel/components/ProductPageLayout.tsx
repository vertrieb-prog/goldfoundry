'use client'

import SentinelNav from './SentinelNav'
import SentinelFooter from './SentinelFooter'
import ProductHero from './ProductHero'
import ProblemSection from './ProblemSection'
import HowItWorksAnimated from './HowItWorksAnimated'
import FeaturesGrid from './FeaturesGrid'
import GoodToKnow from './GoodToKnow'
import BaseVsAI from './BaseVsAI'
import PerformanceCards from './PerformanceCards'
import ProductCTA from './ProductCTA'
import type { Step, TerminalLine } from './HowItWorksAnimated'
import type { Feature } from './FeaturesGrid'
import type { PerformanceData } from './PerformanceCards'

export interface ProductPageData {
  name: string
  tagline: string
  description: string
  basePrice: string
  aiPrice: string
  problem: string
  steps: Step[]
  terminalLines: TerminalLine[]
  terminalTitle?: string
  features: Feature[]
  goodToKnow: string[]
  basePriceDisplay: string
  aiPriceDisplay: string
  baseFeatures: string[]
  aiFeatures: string[]
  performanceTitle?: string
  performanceSubtitle?: string
  performanceData: PerformanceData[]
  performanceDateRange?: string
}

export default function ProductPageLayout({ data }: { data: ProductPageData }) {
  return (
    <>
      <SentinelNav />
      <main>
        <ProductHero
          name={data.name}
          tagline={data.tagline}
          description={data.description}
          basePrice={data.basePrice}
          aiPrice={data.aiPrice}
        />
        <ProblemSection problem={data.problem} />
        <HowItWorksAnimated
          steps={data.steps}
          terminalLines={data.terminalLines}
          terminalTitle={data.terminalTitle}
        />
        <FeaturesGrid features={data.features} />
        <GoodToKnow items={data.goodToKnow} />
        <BaseVsAI
          basePrice={data.basePriceDisplay}
          aiPrice={data.aiPriceDisplay}
          baseFeatures={data.baseFeatures}
          aiFeatures={data.aiFeatures}
        />
        <PerformanceCards
          title={data.performanceTitle}
          subtitle={data.performanceSubtitle}
          data={data.performanceData}
          dateRange={data.performanceDateRange}
        />
        <ProductCTA />
      </main>
      <SentinelFooter />
    </>
  )
}
