import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { TrendingUp, DollarSign, PieChart, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Portfolio() {
  const { user } = useAuth();
  const { data: bots } = trpc.bots.list.useQuery();

  // Mock portfolio data
  const portfolioData = {
    totalValue: 124892.50,
    dayChange: 4.2,
    allTimeChange: 18.5,
    activeBots: bots?.data?.filter((b: any) => b.status === 'active').length || 0,
    totalTrades: 342,
    winRate: 68.5,
  };

  const chartData = [
    { date: 'Jan 1', value: 85000 },
    { date: 'Jan 8', value: 92000 },
    { date: 'Jan 15', value: 88500 },
    { date: 'Jan 22', value: 105000 },
    { date: 'Jan 29', value: 118000 },
    { date: 'Feb 5', value: 124892 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
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
              <div className="text-2xl font-bold">${portfolioData.totalValue.toLocaleString()}</div>
              <p className="text-xs text-green-600">+{portfolioData.dayChange}% today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioData.activeBots}</div>
              <p className="text-xs text-muted-foreground">Trading 24/7</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioData.totalTrades}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioData.winRate}%</div>
              <p className="text-xs text-green-600">Above average</p>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Value Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bot Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bots?.data?.slice(0, 5).map((bot: any) => (
                <div key={bot.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{bot.botName}</p>
                    <p className="text-sm text-muted-foreground">{bot.tradingPair}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+{bot.totalProfit}%</p>
                    <p className="text-sm text-muted-foreground">{bot.totalDeals} trades</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

