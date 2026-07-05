import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { TrendingUp, DollarSign, PieChart, Activity, BarChart3, TrendingDown, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function Portfolio() {
  const { user } = useAuth();
  const { data: bots } = trpc.bots.list.useQuery();
  const { data: portfolioMetrics } = trpc.bots.getPortfolioMetrics.useQuery();
  const { data: dashboardStats } = trpc.bots.getDashboardStats.useQuery();

  const portfolio = portfolioMetrics?.data;
  const stats = dashboardStats?.data;

  // Asset allocation data
  const assetAllocation = [
    { name: 'BTC', value: 40, color: '#f7931a' },
    { name: 'ETH', value: 30, color: '#627eea' },
    { name: 'Alts', value: 30, color: '#8b5cf6' },
  ];

  // Portfolio value over time
  const portfolioChart = [
    { date: 'Jan 1', value: 85000, realized: 5000, unrealized: 2000 },
    { date: 'Jan 8', value: 92000, realized: 6500, unrealized: 2500 },
    { date: 'Jan 15', value: 88500, realized: 5800, unrealized: 2200 },
    { date: 'Jan 22', value: 105000, realized: 8200, unrealized: 3500 },
    { date: 'Jan 29', value: 118000, realized: 10500, unrealized: 4200 },
    { date: 'Feb 5', value: portfolio?.totalValue || 124892, realized: portfolio?.realizedPnL || 12000, unrealized: portfolio?.unrealizedPnL || 5000 },
  ];

  // Monthly returns
  const monthlyReturns = [
    { month: 'Jan', return: 8.5 },
    { month: 'Feb', return: 12.3 },
    { month: 'Mar', return: -2.1 },
    { month: 'Apr', return: 15.7 },
    { month: 'May', return: 6.2 },
    { month: 'Jun', return: 18.9 },
  ];

  // Risk metrics over time
  const riskMetrics = [
    { date: 'Week 1', volatility: 5.2, drawdown: 3.1, sharpe: 1.2 },
    { date: 'Week 2', volatility: 6.1, drawdown: 4.2, sharpe: 1.1 },
    { date: 'Week 3', volatility: 4.8, drawdown: 2.8, sharpe: 1.4 },
    { date: 'Week 4', volatility: 7.3, drawdown: 5.1, sharpe: 0.9 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Portfolio Overview</h1>
          <p className="text-xl text-muted-foreground">Your trading performance at a glance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio?.totalValue?.toLocaleString() || '0'}</div>
              <div className="flex items-center gap-1 mt-2">
                {portfolio && portfolio.dayChangePercent >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-600">+{portfolio.dayChangePercent.toFixed(2)}% today</p>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <p className="text-xs text-red-600">{portfolio?.dayChangePercent?.toFixed(2)}% today</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All-Time Gain</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio?.allTimeChange?.toLocaleString() || '0'}</div>
              <p className="text-xs text-green-600 mt-2">+{portfolio?.allTimeChangePercent?.toFixed(2)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realized P&L</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio?.realizedPnL?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground mt-2">Locked in profits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio?.unrealizedPnL?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground mt-2">Open positions</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
            <TabsTrigger value="bots">Bot Performance</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Portfolio Value Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Portfolio Value Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={portfolioChart}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Returns */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyReturns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="return" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* P&L Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>P&L Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={portfolioChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="realized" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                      <Area type="monotone" dataKey="unrealized" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Allocation Tab */}
          <TabsContent value="allocation" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Allocation Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie data={assetAllocation} cx="50%" cy="50%" labelLine={false} label>
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Allocation Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Allocation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assetAllocation.map((asset, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{asset.name}</span>
                        <span className="text-sm">{asset.value}%</span>
                      </div>
                      <Progress value={asset.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Metrics Tab */}
          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Risk Metrics Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Risk Metrics Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={riskMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="volatility" stroke="#ef4444" />
                      <Line type="monotone" dataKey="drawdown" stroke="#f97316" />
                      <Line type="monotone" dataKey="sharpe" stroke="#3b82f6" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Current Risk Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Volatility</span>
                      <span className="text-sm">{portfolio?.volatility?.toFixed(2)}%</span>
                    </div>
                    <Progress value={Math.min(portfolio?.volatility || 0, 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Max Drawdown</span>
                      <span className="text-sm">{portfolio?.maxDrawdown?.toFixed(2)}%</span>
                    </div>
                    <Progress value={Math.min(portfolio?.maxDrawdown || 0, 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Sharpe Ratio</span>
                      <span className="text-sm">{portfolio?.sharpeRatio?.toFixed(2)}</span>
                    </div>
                    <Progress value={Math.min((portfolio?.sharpeRatio || 0) * 20, 100)} />
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Risk Level</span>
                    <Badge variant="outline">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Portfolio Beta</span>
                    <span className="font-medium">1.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Correlation to BTC</span>
                    <span className="font-medium">0.85</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bot Performance Tab */}
          <TabsContent value="bots" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bots?.data?.map((bot: any) => (
                <Card key={bot.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{bot.botName}</CardTitle>
                      <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                        {bot.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Platform</span>
                      <span className="font-medium capitalize">{bot.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Profit</span>
                      <span className="font-medium">${parseFloat(bot.totalProfit || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <span className="font-medium">{bot.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Deals</span>
                      <span className="font-medium">{bot.totalDeals}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
