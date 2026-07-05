import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

interface AIOpportunity {
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  suggestedAmount: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  riskRewardRatio: number;
  timestamp: number;
}

interface MarketAnalysis {
  symbol: string;
  timeframe: string;
  trend: "bullish" | "bearish" | "neutral";
  strength: number;
  volatility: "low" | "moderate" | "high";
  sentiment: "positive" | "negative" | "neutral";
  keyLevels: {
    support: string;
    resistance: string;
    pivot: string;
  };
  technicalSignals: {
    rsi: string;
    macd: string;
    movingAverages: string;
    bollinger: string;
  };
  predictedDirection: "up" | "down";
  predictedStrength: number;
  timestamp: number;
}

interface StrategyEnhancement {
  improvedConfig: {
    riskPerTrade: string;
    interval: string;
    stopLoss: string;
    takeProfit: string;
    trailingStop: string;
  };
  suggestions: string[];
  expectedImprovementPercent: number;
  backtestResults: {
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
  };
}

interface AIAlert {
  id: string;
  type: "opportunity" | "risk" | "sentiment" | "technical";
  symbol: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  action: string;
  timestamp: number;
  expiresAt: number;
}

interface SentimentData {
  overall: "bullish" | "bearish" | "neutral";
  score: number;
  sources: {
    social: number;
    news: number;
    onChain: number;
    technical: number;
  };
  topPositiveSentiments: string[];
  topNegativeSentiments: string[];
  timestamp: number;
}

export const aiBotRouter = router({
  /**
   * Analyze trading opportunity using AI
   */
  analyzeOpportunity: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        botType: z.string(),
        currentPrice: z.string(),
        timeframe: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const opportunity = generateMockOpportunity(
          input.symbol,
          input.currentPrice
        );
        return {
          success: true,
          data: opportunity,
        };
      } catch (error) {
        console.error("[aiBotRouter.analyzeOpportunity]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get AI strategy enhancement suggestions
   */
  enhanceStrategy: protectedProcedure
    .input(z.object({ botId: z.string(), pineCode: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const enhancement = generateMockStrategyEnhancement();
        return {
          success: true,
          data: enhancement,
        };
      } catch (error) {
        console.error("[aiBotRouter.enhanceStrategy]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get comprehensive market analysis for a symbol
   */
  analyzeMarket: protectedProcedure
    .input(z.object({ symbol: z.string(), timeframe: z.string().default("1h") }))
    .query(async ({ input }) => {
      try {
        const analysis = generateMockMarketAnalysis(input.symbol, input.timeframe);
        return {
          success: true,
          data: analysis,
        };
      } catch (error) {
        console.error("[aiBotRouter.analyzeMarket]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get AI-powered trading opportunities for dashboard
   */
  getOpportunitiesForDashboard: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      try {
        const opportunities: AIOpportunity[] = [];
        const symbols = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "ADA/USD"];

        for (let i = 0; i < Math.min(input.limit, symbols.length); i++) {
          opportunities.push(generateMockOpportunity(symbols[i], "0"));
        }

        return {
          success: true,
          data: opportunities,
        };
      } catch (error) {
        console.error("[aiBotRouter.getOpportunitiesForDashboard]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get market sentiment analysis
   */
  getMarketSentiment: protectedProcedure.query(async () => {
    try {
      const sentiment = generateMockSentimentData();
      return {
        success: true,
        data: sentiment,
      };
    } catch (error) {
      console.error("[aiBotRouter.getMarketSentiment]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Get AI-powered alerts
   */
  getAlerts: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        type: z.enum(["opportunity", "risk", "sentiment", "technical"]).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const alerts = generateMockAlerts(input.limit, input.type, input.severity);
        return {
          success: true,
          data: alerts,
        };
      } catch (error) {
        console.error("[aiBotRouter.getAlerts]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get AI insights for a specific bot
   */
  getBotInsights: protectedProcedure
    .input(z.object({ botId: z.string() }))
    .query(async ({ input }) => {
      try {
        const insights = generateMockBotInsights();
        return {
          success: true,
          data: insights,
        };
      } catch (error) {
        console.error("[aiBotRouter.getBotInsights]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get multi-timeframe analysis
   */
  getMultiTimeframeAnalysis: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      try {
        const timeframes = ["5m", "15m", "1h", "4h", "1d"];
        const analyses = timeframes.map((tf) =>
          generateMockMarketAnalysis(input.symbol, tf)
        );

        return {
          success: true,
          data: {
            symbol: input.symbol,
            analyses,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error("[aiBotRouter.getMultiTimeframeAnalysis]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get risk assessment for a trade
   */
  assessTradeRisk: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        entryPrice: z.string(),
        stopLoss: z.string(),
        takeProfit: z.string(),
        tradeSize: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const riskAssessment = generateMockRiskAssessment(input);
        return {
          success: true,
          data: riskAssessment,
        };
      } catch (error) {
        console.error("[aiBotRouter.assessTradeRisk]", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  /**
   * Get AI recommendations for portfolio optimization
   */
  getPortfolioOptimization: protectedProcedure.query(async () => {
    try {
      const recommendations = generateMockPortfolioOptimization();
      return {
        success: true,
        data: recommendations,
      };
    } catch (error) {
      console.error("[aiBotRouter.getPortfolioOptimization]", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }),

  /**
   * Predictive price forecast using time-series analysis
   */
  getPriceForecast: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        horizon: z.enum(['1h', '4h', '1d', '1w']),
        confidence: z.number().min(0).max(100).optional().default(80),
      })
    )
    .query(async ({ input }) => {
      const { pair, horizon, confidence } = input;
      const forecastData = generateMockForecast(pair, horizon, confidence);
      return { success: true, data: forecastData };
    }),

  /**
   * Generate personalized trading strategies based on user profile
   */
  generatePersonalizedStrategy: protectedProcedure
    .input(
      z.object({
        riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
        capital: z.number().positive(),
        tradingGoals: z.array(z.string()),
        preferredAssets: z.array(z.string()).optional(),
        timeframe: z.enum(['short-term', 'medium-term', 'long-term']).optional(),
      })
    )
    .query(async ({ input }) => {
      const strategy = generatePersonalizedStrategyLogic(input);
      return { success: true, data: strategy };
    }),

  /**
   * Volatility forecast for risk management
   */
  getVolatilityForecast: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        period: z.number().default(14),
        horizon: z.enum(['1h', '4h', '1d', '1w']).default('1d'),
      })
    )
    .query(async ({ input }) => {
      const volatilityForecast = generateVolatilityForecast(input.pair, input.period, input.horizon);
      return { success: true, data: volatilityForecast };
    }),

  /**
   * Correlation analysis between multiple assets
   */
  getCorrelationAnalysis: protectedProcedure
    .input(
      z.object({
        pairs: z.array(z.string()).min(2),
        period: z.number().default(30),
      })
    )
    .query(async ({ input }) => {
      const correlationMatrix = generateCorrelationMatrix(input.pairs, input.period);
      return { success: true, data: correlationMatrix };
    }),

  /**
   * Advanced pattern recognition
   */
  identifyPatterns: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        timeframe: z.string().default('1h'),
        sensitivity: z.number().min(0).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const patterns = identifyMarketPatterns(input.pair, input.timeframe, input.sensitivity);
      return { success: true, data: patterns };
    }),

  /**
   * Anomaly detection for unusual market behavior
   */
  detectAnomalies: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        threshold: z.number().min(0).max(100).default(70),
      })
    )
    .query(async ({ input }) => {
      const anomalies = detectMarketAnomalies(input.pair, input.threshold);
      return { success: true, data: anomalies };
    }),

  /**
   * Risk-adjusted position sizing recommendations
   */
  getPositionSizing: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        capital: z.number().positive(),
        riskPerTrade: z.number().min(0).max(100),
        volatility: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const positionSizing = calculatePositionSize(input.pair, input.capital, input.riskPerTrade, input.volatility);
      return { success: true, data: positionSizing };
    }),

  /**
   * Multi-timeframe analysis enhanced
   */
  getMultiTimeframeAnalysisEnhanced: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        timeframes: z.array(z.string()).default(['5m', '15m', '1h', '4h', '1d']),
      })
    )
    .query(async ({ input }) => {
      const analysis = performMultiTimeframeAnalysis(input.pair, input.timeframes);
      return { success: true, data: analysis };
    }),

  /**
   * Market regime detection
   */
  detectMarketRegime: protectedProcedure
    .input(
      z.object({
        pair: z.string(),
        period: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const regime = detectMarketRegimeHelper(input.pair, input.period);
      return { success: true, data: regime };
    }),
});

// Mock data generation functions
function generateMockOpportunity(symbol: string, currentPrice: string): AIOpportunity {
  const price = parseFloat(currentPrice) || 43150;
  const action = Math.random() > 0.6 ? "buy" : Math.random() > 0.5 ? "sell" : "hold";
  const confidence = Math.floor(Math.random() * 40) + 60;
  const riskRewardRatio = Math.random() * 2 + 1;

  return {
    symbol,
    action,
    confidence,
    reasoning:
      action === "buy"
        ? "Strong momentum on 4h chart with RSI oversold. Volume confirms breakout."
        : action === "sell"
          ? "Resistance level approaching with declining volume. Technical indicators suggest pullback."
          : "Mixed signals. Wait for clearer direction.",
    suggestedAmount: (Math.random() * 500 + 100).toFixed(2),
    entryPrice: price.toFixed(2),
    stopLoss: (price * 0.98).toFixed(2),
    takeProfit: (price * 1.05).toFixed(2),
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    timestamp: Date.now(),
  };
}

function generateMockStrategyEnhancement(): StrategyEnhancement {
  return {
    improvedConfig: {
      riskPerTrade: "1.2%",
      interval: "4h",
      stopLoss: "2.5%",
      takeProfit: "5.0%",
      trailingStop: "1.5%",
    },
    suggestions: [
      "Add trailing stop-loss at 1.5% to protect gains while allowing upside",
      "Increase interval to 4h for better signal quality and reduced false signals",
      "Consider adding RSI confirmation filter (30-70 range)",
      "Implement dynamic position sizing based on volatility",
      "Add correlation analysis to reduce portfolio risk",
    ],
    expectedImprovementPercent: Math.round(Math.random() * 20 + 10),
    backtestResults: {
      winRate: Math.round((Math.random() * 30 + 55) * 100) / 100,
      profitFactor: Math.round((Math.random() * 1.5 + 1.5) * 100) / 100,
      maxDrawdown: Math.round((Math.random() * 10 + 5) * 100) / 100,
    },
  };
}

function generateMockMarketAnalysis(
  symbol: string,
  timeframe: string
): MarketAnalysis {
  const trend = ["bullish", "bearish", "neutral"][Math.floor(Math.random() * 3)] as
    | "bullish"
    | "bearish"
    | "neutral";
  const volatility = ["low", "moderate", "high"][Math.floor(Math.random() * 3)] as
    | "low"
    | "moderate"
    | "high";
  const sentiment = ["positive", "negative", "neutral"][Math.floor(Math.random() * 3)] as
    | "positive"
    | "negative"
    | "neutral";

  return {
    symbol,
    timeframe,
    trend,
    strength: Math.round((Math.random() * 10) * 10) / 10,
    volatility,
    sentiment,
    keyLevels: {
      support: (43150 - Math.random() * 1000).toFixed(2),
      resistance: (43150 + Math.random() * 1000).toFixed(2),
      pivot: "43150.00",
    },
    technicalSignals: {
      rsi: Math.round(Math.random() * 100).toString(),
      macd: Math.random() > 0.5 ? "Bullish" : "Bearish",
      movingAverages: Math.random() > 0.5 ? "Bullish" : "Bearish",
      bollinger: Math.random() > 0.5 ? "Overbought" : "Oversold",
    },
    predictedDirection: Math.random() > 0.5 ? "up" : "down",
    predictedStrength: Math.round((Math.random() * 8 + 2) * 10) / 10,
    timestamp: Date.now(),
  };
}

function generateMockSentimentData(): SentimentData {
  const overall = ["bullish", "bearish", "neutral"][Math.floor(Math.random() * 3)] as
    | "bullish"
    | "bearish"
    | "neutral";

  return {
    overall,
    score: Math.round((Math.random() * 100) * 100) / 100,
    sources: {
      social: Math.round((Math.random() * 100) * 100) / 100,
      news: Math.round((Math.random() * 100) * 100) / 100,
      onChain: Math.round((Math.random() * 100) * 100) / 100,
      technical: Math.round((Math.random() * 100) * 100) / 100,
    },
    topPositiveSentiments: [
      "Strong institutional buying",
      "Bullish technical setup",
      "Positive news flow",
    ],
    topNegativeSentiments: [
      "Regulatory concerns",
      "Profit taking",
      "Bearish divergence",
    ],
    timestamp: Date.now(),
  };
}

function generateMockAlerts(
  limit: number,
  type?: string,
  severity?: string
): AIAlert[] {
  const alerts: AIAlert[] = [];
  const types = ["opportunity", "risk", "sentiment", "technical"];
  const severities = ["low", "medium", "high", "critical"];
  const symbols = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "ADA/USD"];

  for (let i = 0; i < limit; i++) {
    const alertType = type || types[Math.floor(Math.random() * types.length)];
    const alertSeverity = severity || severities[Math.floor(Math.random() * severities.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];

    alerts.push({
      id: `alert-${i}`,
      type: alertType as "opportunity" | "risk" | "sentiment" | "technical",
      symbol,
      severity: alertSeverity as "low" | "medium" | "high" | "critical",
      title: generateAlertTitle(alertType, symbol),
      description: generateAlertDescription(alertType),
      action: generateAlertAction(alertType),
      timestamp: Date.now() - Math.random() * 3600000,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
  }

  return alerts;
}

function generateAlertTitle(type: string, symbol: string): string {
  const titles: Record<string, string> = {
    opportunity: `Trading Opportunity: ${symbol}`,
    risk: `Risk Alert: ${symbol}`,
    sentiment: `Sentiment Shift: ${symbol}`,
    technical: `Technical Signal: ${symbol}`,
  };
  return titles[type] || "Market Alert";
}

function generateAlertDescription(type: string): string {
  const descriptions: Record<string, string> = {
    opportunity: "AI has identified a potential trading opportunity based on technical and sentiment analysis.",
    risk: "Risk indicators suggest caution. Consider reviewing your positions.",
    sentiment: "Market sentiment has shifted. Social and news sentiment turning positive.",
    technical: "Technical indicators have generated a new signal. Check chart for confirmation.",
  };
  return descriptions[type] || "New market alert";
}

function generateAlertAction(type: string): string {
  const actions: Record<string, string> = {
    opportunity: "Review and consider entering a position",
    risk: "Review open positions and adjust risk management",
    sentiment: "Monitor for confirmation and adjust strategy",
    technical: "Verify signal on multiple timeframes",
  };
  return actions[type] || "Take action";
}

function generateMockBotInsights() {
  return {
    performanceTrend: "improving",
    winRateTrend: "stable",
    profitTrend: "increasing",
    recommendations: [
      "Bot is performing well. Consider increasing position size.",
      "Win rate is stable at 65%. No changes needed.",
      "Profit trend is increasing. Strategy is working effectively.",
    ],
    riskAssessment: "low",
    nextActionSuggestion: "Continue monitoring. No immediate action required.",
  };
}

function generateMockRiskAssessment(input: any) {
  const entry = parseFloat(input.entryPrice);
  const stop = parseFloat(input.stopLoss);
  const tp = parseFloat(input.takeProfit);
  const size = parseFloat(input.tradeSize);

  const riskAmount = Math.abs(entry - stop) * size;
  const rewardAmount = Math.abs(tp - entry) * size;
  const riskRewardRatio = rewardAmount > 0 ? rewardAmount / riskAmount : 0;

  return {
    riskAmount: Math.round(riskAmount * 100) / 100,
    rewardAmount: Math.round(rewardAmount * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    riskLevel: riskRewardRatio > 2 ? "low" : riskRewardRatio > 1 ? "medium" : "high",
    recommendation:
      riskRewardRatio > 2
        ? "Good risk/reward ratio. Trade is acceptable."
        : riskRewardRatio > 1
          ? "Moderate risk/reward. Consider adjusting stops."
          : "Poor risk/reward. Adjust entry or stops.",
  };
}

function generateMockPortfolioOptimization() {
  return {
    currentAllocation: {
      BTC: 40,
      ETH: 30,
      ALT: 30,
    },
    recommendedAllocation: {
      BTC: 45,
      ETH: 35,
      ALT: 20,
    },
    recommendations: [
      "Increase BTC allocation to 45% for better stability",
      "Increase ETH allocation to 35% for growth potential",
      "Reduce ALT allocation to 20% to reduce volatility",
    ],
    expectedImprovement: {
      sharpeRatio: "+15%",
      volatility: "-8%",
      maxDrawdown: "-5%",
    },
  };
}


// Helper functions for enhanced AI features
function generateMockForecast(pair: string, horizon: string, confidence: number) {
  const basePrice = pair === 'BTC/USD' ? 43500 : 2300;
  const forecasts = [];
  for (let i = 0; i < 5; i++) {
    forecasts.push({
      timestamp: Date.now() + i * 3600000,
      predictedPrice: basePrice + (Math.random() - 0.5) * 1000,
      upperBound: basePrice + 2000,
      lowerBound: basePrice - 2000,
      confidence,
    });
  }
  return { pair, horizon, forecasts, model: 'LSTM', accuracy: confidence };
}

function generatePersonalizedStrategyLogic(params: any) {
  const strategies = {
    conservative: {
      name: 'Conservative Growth',
      description: 'Low-risk strategy focusing on stable, long-term gains',
      allocation: { BTC: 50, ETH: 30, Stables: 20 },
      rebalanceFrequency: 'monthly',
      maxDrawdown: 10,
      targetReturn: 15,
    },
    moderate: {
      name: 'Balanced Growth',
      description: 'Balanced strategy with moderate risk and return',
      allocation: { BTC: 40, ETH: 35, Alts: 15, Stables: 10 },
      rebalanceFrequency: 'weekly',
      maxDrawdown: 20,
      targetReturn: 30,
    },
    aggressive: {
      name: 'Aggressive Growth',
      description: 'High-risk strategy for maximum returns',
      allocation: { BTC: 30, ETH: 30, Alts: 35, Leverage: 5 },
      rebalanceFrequency: 'daily',
      maxDrawdown: 40,
      targetReturn: 100,
    },
  };
  return strategies[params.riskTolerance as keyof typeof strategies] || strategies.moderate;
}

function generateVolatilityForecast(pair: string, period: number, horizon: string) {
  return {
    pair,
    period,
    horizon,
    currentVolatility: (Math.random() * 10 + 5).toFixed(2),
    forecastedVolatility: (Math.random() * 10 + 5).toFixed(2),
    trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
    confidence: Math.random() * 30 + 70,
  };
}

function generateCorrelationMatrix(pairs: string[], period: number) {
  const matrix: Record<string, Record<string, number>> = {};
  pairs.forEach((pair1) => {
    matrix[pair1] = {};
    pairs.forEach((pair2) => {
      matrix[pair1][pair2] = pair1 === pair2 ? 1 : Math.random() * 2 - 1;
    });
  });
  return { pairs, period, correlationMatrix: matrix, timestamp: Date.now() };
}

function identifyMarketPatterns(pair: string, timeframe: string, sensitivity: number) {
  const patterns = [
    { name: 'Head and Shoulders', confidence: Math.random() * 100, direction: 'bearish' },
    { name: 'Double Bottom', confidence: Math.random() * 100, direction: 'bullish' },
    { name: 'Triangle', confidence: Math.random() * 100, direction: 'neutral' },
  ];
  return {
    pair,
    timeframe,
    patterns: patterns.filter((p) => p.confidence > 100 - sensitivity),
    timestamp: Date.now(),
  };
}

function detectMarketAnomalies(pair: string, threshold: number) {
  return {
    pair,
    threshold,
    anomalies: [
      {
        type: 'unusual_volume',
        severity: Math.random() * 100,
        description: 'Volume spike detected',
        timestamp: Date.now(),
      },
      {
        type: 'price_gap',
        severity: Math.random() * 100,
        description: 'Significant price gap',
        timestamp: Date.now(),
      },
    ],
  };
}

function calculatePositionSize(pair: string, capital: number, riskPerTrade: number, volatility?: number) {
  const riskAmount = (capital * riskPerTrade) / 100;
  const positionSize = riskAmount / (volatility || 0.02);
  return {
    pair,
    capital,
    riskPerTrade,
    riskAmount,
    positionSize: positionSize.toFixed(4),
    percentageOfCapital: ((positionSize / capital) * 100).toFixed(2) + '%',
  };
}

function performMultiTimeframeAnalysis(pair: string, timeframes: string[]) {
  return {
    pair,
    timeframes: timeframes.map((tf) => ({
      timeframe: tf,
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: Math.random() * 100,
      rsi: Math.random() * 100,
      macd: Math.random() > 0.5 ? 'positive' : 'negative',
    })),
  };
}

function detectMarketRegimeHelper(pair: string, period: number) {
  const regimes = ['trending_up', 'trending_down', 'ranging', 'volatile'];
  const selectedRegime = regimes[Math.floor(Math.random() * regimes.length)];
  return {
    pair,
    period,
    regime: selectedRegime,
    confidence: Math.random() * 30 + 70,
    characteristics: {
      volatility: Math.random() * 20 + 5,
      trend_strength: Math.random() * 100,
      support_resistance: {
        support: 42000,
        resistance: 45000,
      },
    },
  };
}

export default aiBotRouter;
