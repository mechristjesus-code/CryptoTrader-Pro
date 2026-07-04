import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Bot, Play, Pause, Trash2, Plus, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type BotStatus = 'active' | 'inactive' | 'paused' | 'error';

interface BotCard {
  id: number;
  botName: string;
  tradingPair: string | null;
  platform: 'native' | '3commas' | 'cryptohopper';
  status: BotStatus;
  currentProfit?: string | null;
  totalProfit?: string | null;
  totalTrades?: number;
  winRate?: string | number | null;
}

export default function BotManagement() {
  const [activeTab, setActiveTab] = useState('native');
  const { data: botsResponse, refetch } = trpc.bots.list.useQuery();
  const bots = botsResponse?.data || [];

  const getStatusColor = (status: BotStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-700 border-green-500';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500';
      case 'error':
        return 'bg-red-500/20 text-red-700 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500';
    }
  };

  const getStatusIcon = (status: BotStatus) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const handleToggleBot = (botId: number, currentStatus: BotStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toast.success(`Bot ${newStatus === 'active' ? 'started' : 'paused'}`);
    refetch();
  };

  const handleDeleteBot = (botId: number, botName: string) => {
    toast.success(`Bot "${botName}" deleted`);
    refetch();
  };

  const BotCardComponent = ({ bot }: { bot: BotCard }) => (
    <Card className="p-6 hover:border-primary/50 transition-all duration-200 border-l-4 border-l-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Bot className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{bot.botName}</h3>
            <p className="text-sm text-muted-foreground">{bot.tradingPair || 'N/A'} • {bot.platform.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(bot.status)}
          <Badge variant="outline" className={getStatusColor(bot.status)}>
            {bot.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 text-sm mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Profit</span>
          <span className={`font-medium ${parseFloat(bot.totalProfit || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {parseFloat(bot.totalProfit || '0') >= 0 ? '+' : ''}{parseFloat(bot.totalProfit || '0').toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Trades</span>
          <span className="font-medium">{bot.totalTrades || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Win Rate</span>
          <span className="font-medium">{typeof bot.winRate === 'number' ? bot.winRate.toFixed(1) : '0'}%</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => handleToggleBot(bot.id, bot.status)}
        >
          {bot.status === 'active' ? (
            <>
              <Pause className="mr-2 h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Start
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => handleDeleteBot(bot.id, bot.botName)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Trading Bots</h1>
            <p className="text-muted-foreground">Manage and monitor your automated trading strategies</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Bot
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="native">Native Bots</TabsTrigger>
            <TabsTrigger value="3commas">3Commas</TabsTrigger>
            <TabsTrigger value="cryptohopper">Cryptohopper</TabsTrigger>
          </TabsList>

          <TabsContent value="native" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.filter((b: any) => b.platform === 'native').length > 0 ? (
                bots.filter((b: any) => b.platform === 'native').map((bot: any) => (
                  <BotCardComponent key={bot.id} bot={bot} />
                ))
              ) : (
                <Card className="col-span-full p-12 text-center">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No native bots created yet</p>
                  <Button>Create Your First Bot</Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="3commas" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.filter((b: any) => b.platform === '3commas').length > 0 ? (
                bots.filter((b: any) => b.platform === '3commas').map((bot: any) => (
                  <BotCardComponent key={bot.id} bot={bot} />
                ))
              ) : (
                <Card className="col-span-full p-12 text-center">
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No 3Commas bots connected</p>
                  <Button variant="outline">Connect 3Commas Account</Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cryptohopper" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.filter((b: any) => b.platform === 'cryptohopper').length > 0 ? (
                bots.filter((b: any) => b.platform === 'cryptohopper').map((bot: any) => (
                  <BotCardComponent key={bot.id} bot={bot} />
                ))
              ) : (
                <Card className="col-span-full p-12 text-center">
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No Cryptohopper bots connected</p>
                  <Button variant="outline">Connect Cryptohopper Account</Button>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
