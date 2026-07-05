import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Lightbulb, AlertCircle, TrendingUp, Brain, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AIInsightsPanel() {
  const { data: opportunities } = trpc.aiBot.getOpportunitiesForDashboard.useQuery({ limit: 5 });
  const { data: sentiment } = trpc.aiBot.getMarketSentiment.useQuery();
  const { data: alerts } = trpc.aiBot.getAlerts.useQuery({ limit: 5 });
  const { data: portfolioOptimization } = trpc.aiBot.getPortfolioOptimization.useQuery();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">
            <Lightbulb className="h-4 w-4 mr-2" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="sentiment">
            <Brain className="h-4 w-4 mr-2" />
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertCircle className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="optimization">
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </TabsTrigger>
        </TabsList>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities?.data?.map((opp: any, idx: number) => (
              <Card key={idx} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{opp.symbol}</CardTitle>
                    <Badge
                      variant={
                        opp.action === 'buy'
                          ? 'default'
                          : opp.action === 'sell'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {opp.action.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Confidence</span>
                      <span className="text-sm font-semibold">{opp.confidence}%</span>
                    </div>
                    <Progress value={opp.confidence} />
                  </div>

                  {/* Price Levels */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Entry</p>
                      <p className="font-semibold">${opp.entryPrice}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stop Loss</p>
                      <p className="font-semibold text-red-600">${opp.stopLoss}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Take Profit</p>
                      <p className="font-semibold text-green-600">${opp.takeProfit}</p>
                    </div>
                  </div>

                  {/* Risk/Reward */}
                  <div className="flex justify-between items-center p-2 bg-secondary rounded">
                    <span className="text-sm font-medium">Risk/Reward</span>
                    <span className="font-bold">{opp.riskRewardRatio}:1</span>
                  </div>

                  {/* Reasoning */}
                  <p className="text-sm text-muted-foreground italic">{opp.reasoning}</p>

                  {/* Action Button */}
                  <Button className="w-full" size="sm">
                    {opp.action === 'buy' ? 'Open Long' : opp.action === 'sell' ? 'Open Short' : 'Review'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment">
          <Card>
            <CardHeader>
              <CardTitle>Market Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Sentiment */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Overall Sentiment</span>
                  <Badge
                    variant={
                      sentiment?.data?.overall === 'bullish'
                        ? 'default'
                        : sentiment?.data?.overall === 'bearish'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {sentiment?.data?.overall?.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: `${sentiment?.data?.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{sentiment?.data?.score?.toFixed(1)}</span>
                </div>
              </div>

              {/* Sentiment Sources */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-secondary rounded">
                  <p className="text-xs text-muted-foreground mb-1">Social</p>
                  <p className="text-lg font-bold">{sentiment?.data?.sources?.social?.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-secondary rounded">
                  <p className="text-xs text-muted-foreground mb-1">News</p>
                  <p className="text-lg font-bold">{sentiment?.data?.sources?.news?.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-secondary rounded">
                  <p className="text-xs text-muted-foreground mb-1">On-Chain</p>
                  <p className="text-lg font-bold">{sentiment?.data?.sources?.onChain?.toFixed(0)}</p>
                </div>
                <div className="p-3 bg-secondary rounded">
                  <p className="text-xs text-muted-foreground mb-1">Technical</p>
                  <p className="text-lg font-bold">{sentiment?.data?.sources?.technical?.toFixed(0)}</p>
                </div>
              </div>

              {/* Positive Sentiments */}
              <div>
                <p className="font-semibold mb-2 text-green-600">Positive Signals</p>
                <div className="space-y-2">
                  {sentiment?.data?.topPositiveSentiments?.map((signal: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-green-500/10 rounded border border-green-500/30">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{signal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Sentiments */}
              <div>
                <p className="font-semibold mb-2 text-red-600">Risk Signals</p>
                <div className="space-y-2">
                  {sentiment?.data?.topNegativeSentiments?.map((signal: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts?.data?.map((alert: any, idx: number) => (
            <Card
              key={idx}
              className={`border-l-4 ${
                alert.severity === 'critical'
                  ? 'border-l-red-600'
                  : alert.severity === 'high'
                    ? 'border-l-orange-500'
                    : alert.severity === 'medium'
                      ? 'border-l-yellow-500'
                      : 'border-l-blue-500'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <CardTitle className="text-base">{alert.title}</CardTitle>
                  </div>
                  <Badge
                    variant={
                      alert.severity === 'critical'
                        ? 'destructive'
                        : alert.severity === 'high'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    {alert.action}
                  </Button>
                  <Button size="sm" variant="ghost">
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Portfolio Optimization Tab */}
        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current vs Recommended */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-3">Current Allocation</p>
                  <div className="space-y-2">
                    {Object.entries(portfolioOptimization?.data?.currentAllocation || {}).map(
                      ([asset, value]: [string, any]) => (
                        <div key={asset}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{asset}</span>
                            <span className="text-sm font-semibold">{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-semibold mb-3">Recommended Allocation</p>
                  <div className="space-y-2">
                    {Object.entries(portfolioOptimization?.data?.recommendedAllocation || {}).map(
                      ([asset, value]: [string, any]) => (
                        <div key={asset}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{asset}</span>
                            <span className="text-sm font-semibold">{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <p className="font-semibold mb-3">Recommendations</p>
                <div className="space-y-2">
                  {portfolioOptimization?.data?.recommendations?.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-secondary rounded">
                      <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Improvements */}
              <div>
                <p className="font-semibold mb-3">Expected Improvements</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(portfolioOptimization?.data?.expectedImprovement || {}).map(
                    ([metric, value]: [string, any]) => (
                      <div key={metric} className="p-3 bg-green-500/10 rounded border border-green-500/30">
                        <p className="text-xs text-muted-foreground capitalize">{metric}</p>
                        <p className="text-lg font-bold text-green-600">{value}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button className="w-full">Apply Recommendations</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
