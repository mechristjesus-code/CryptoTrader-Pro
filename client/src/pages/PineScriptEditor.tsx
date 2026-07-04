import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Editor from '@monaco-editor/react';
import { trpc } from '@/lib/trpc';
import { Play, Save, Trash2, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const STRATEGY_TEMPLATES = {
  dca: `strategy("DCA Strategy", overlay=true)

// Dollar Cost Averaging Strategy
// Buys fixed amount at regular intervals

interval = input(1, "Interval (hours)")
amount = input(100, "Amount per buy")

lastBuyTime = 0

if (time - lastBuyTime >= interval * 3600000)
    strategy.entry("Buy", strategy.long)
    lastBuyTime := time

plot(close, color=color.blue)`,

  rsi: `strategy("RSI Strategy", overlay=true)

// RSI Overbought/Oversold Strategy

rsiLength = input(14, "RSI Length")
overbought = input(70, "Overbought Level")
oversold = input(30, "Oversold Level")

rsi = ta.rsi(close, rsiLength)

if (rsi < oversold)
    strategy.entry("Buy", strategy.long)
if (rsi > overbought)
    strategy.close("Buy")

plot(rsi, color=color.orange)
hline(overbought, color=color.red)
hline(oversold, color=color.green)`,

  macd: `strategy("MACD Strategy", overlay=true)

// MACD Crossover Strategy

fastLength = input(12, "Fast MA")
slowLength = input(26, "Slow MA")
signalLength = input(9, "Signal")

macd = ta.macd(close, fastLength, slowLength, signalLength)

if (ta.crossover(macd, signal))
    strategy.entry("Buy", strategy.long)
if (ta.crossunder(macd, signal))
    strategy.close("Buy")`,
};

interface Strategy {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  code: string;
  createdAt: string;
  isActive: boolean;
}

interface BacktestResult {
  totalTrades: number;
  winRate: string;
  netProfit: string;
  profitFactor: number;
  maxDrawdown: string;
  sharpeRatio: number;
}

export default function PineScriptEditor() {
  const [activeTab, setActiveTab] = useState('editor');
  const [code, setCode] = useState(STRATEGY_TEMPLATES.dca);
  const [strategyName, setStrategyName] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const saveStrategy = trpc.pine.saveStrategy.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Strategy saved successfully!');
        setShowSaveDialog(false);
        setStrategyName('');
      } else {
        toast.error(result.error || 'Failed to save strategy');
      }
    },
  });

  const runBacktest = trpc.pine.runBacktest.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setBacktestResult(result.data || null);
        toast.success('Backtest completed!');
      } else {
        toast.error(result.error || 'Backtest failed');
      }
      setIsBacktesting(false);
    },
  });

  const handleSaveStrategy = () => {
    if (!strategyName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }

    saveStrategy.mutate({
      name: strategyName,
      code,
      symbol: selectedSymbol,
      timeframe: selectedTimeframe as "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
      description: `${selectedSymbol} ${selectedTimeframe} strategy`,
    });
  };

  const handleRunBacktest = () => {
    if (!strategyName.trim()) {
      toast.error('Please save the strategy first');
      return;
    }

    setIsBacktesting(true);
    runBacktest.mutate({
      strategyId: 'temp-' + Date.now(),
      symbol: selectedSymbol,
      days: 30,
    });
  };

  const handleLoadTemplate = (template: keyof typeof STRATEGY_TEMPLATES) => {
    setCode(STRATEGY_TEMPLATES[template]);
    toast.success(`Loaded ${template.toUpperCase()} template`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Pine Script Editor</h1>
            <p className="text-muted-foreground">Create and backtest trading strategies</p>
          </div>
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Save className="h-4 w-4" /> Save Strategy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Strategy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Strategy Name</Label>
                  <Input
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="My Awesome Strategy"
                  />
                </div>
                <Button onClick={handleSaveStrategy} className="w-full" disabled={saveStrategy.isPending}>
                  {saveStrategy.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Pine Script Code</CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                        <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                        <SelectItem value="XRP/USD">XRP/USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1m</SelectItem>
                        <SelectItem value="5m">5m</SelectItem>
                        <SelectItem value="1h">1h</SelectItem>
                        <SelectItem value="4h">4h</SelectItem>
                        <SelectItem value="1d">1d</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Editor
                  height="500px"
                  language="pine"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backtest Tab */}
          <TabsContent value="backtest" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Backtest Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  onClick={handleRunBacktest}
                  disabled={isBacktesting}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="h-4 w-4" />
                  {isBacktesting ? 'Running Backtest...' : 'Run Backtest (30 days)'}
                </Button>

                {backtestResult && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold">{backtestResult.totalTrades}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold text-green-600">{backtestResult.winRate}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className="text-2xl font-bold text-green-600">{backtestResult.netProfit}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Profit Factor</p>
                      <p className="text-2xl font-bold">{backtestResult.profitFactor.toFixed(2)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Max Drawdown</p>
                      <p className="text-2xl font-bold text-red-600">{backtestResult.maxDrawdown}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                      <p className="text-2xl font-bold">{backtestResult.sharpeRatio.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {!backtestResult && (
                  <div className="p-8 text-center border-2 border-dashed rounded-lg">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Run a backtest to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
                <Card key={key} className="hover:border-primary/50 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle className="capitalize">{key} Strategy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {key === 'dca' && 'Dollar Cost Averaging - Regular fixed amount purchases'}
                      {key === 'rsi' && 'RSI Overbought/Oversold - Mean reversion strategy'}
                      {key === 'macd' && 'MACD Crossover - Trend following strategy'}
                    </p>
                    <Button
                      onClick={() => handleLoadTemplate(key as keyof typeof STRATEGY_TEMPLATES)}
                      className="w-full"
                    >
                      Load Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-4 mt-6">
            {strategies.length > 0 ? (
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <Card key={strategy.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{strategy.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{strategy.symbol} • {strategy.timeframe}</p>
                        </div>
                        <Badge variant={strategy.isActive ? 'default' : 'secondary'}>
                          {strategy.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Backtest
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No strategies saved yet</p>
                <Button onClick={() => setShowSaveDialog(true)}>Create Your First Strategy</Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
