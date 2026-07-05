import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { GripVertical, X, Plus, Save, RotateCcw } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface DashboardWidget {
  id: string;
  type: 'portfolio' | 'bots' | 'market' | 'opportunities' | 'sentiment' | 'performance' | 'chart' | 'alerts';
  title: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  visible: boolean;
}

interface DraggableDashboardProps {
  userId: number;
  onSaveLayout?: (widgets: DashboardWidget[]) => void;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: '1', type: 'portfolio', title: 'Portfolio Value', position: 0, size: 'medium', visible: true },
  { id: '2', type: 'bots', title: 'Active Bots', position: 1, size: 'small', visible: true },
  { id: '3', type: 'market', title: 'Market Overview', position: 2, size: 'large', visible: true },
  { id: '4', type: 'opportunities', title: 'AI Opportunities', position: 3, size: 'medium', visible: true },
  { id: '5', type: 'sentiment', title: 'Market Sentiment', position: 4, size: 'small', visible: true },
  { id: '6', type: 'performance', title: 'Performance', position: 5, size: 'medium', visible: true },
];

export default function DraggableDashboard({ userId, onSaveLayout }: DraggableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  // Fetch data
  const { data: dashboardStats } = trpc.bots.getDashboardStats.useQuery();
  const { data: portfolioMetrics } = trpc.bots.getPortfolioMetrics.useQuery();
  const { data: opportunities } = trpc.aiBot.getOpportunitiesForDashboard.useQuery({ limit: 3 });
  const { data: sentiment } = trpc.aiBot.getMarketSentiment.useQuery();
  const { data: marketOverview } = trpc.market.getOverview.useQuery();

  // Load saved layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`);
    if (savedLayout) {
      try {
        setWidgets(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Failed to load saved layout:', error);
      }
    }
  }, [userId]);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;

    const draggedIndex = widgets.findIndex((w) => w.id === draggedWidget);
    const targetIndex = widgets.findIndex((w) => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [draggedItem] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedItem);

    // Update positions
    newWidgets.forEach((w, idx) => {
      w.position = idx;
    });

    setWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const handleSaveLayout = useCallback(() => {
    localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(widgets));
    if (onSaveLayout) {
      onSaveLayout(widgets);
    }
    setEditMode(false);
  }, [widgets, userId, onSaveLayout]);

  const handleResetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem(`dashboard-layout-${userId}`);
  }, [userId]);

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const addWidget = (type: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: Date.now().toString(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      position: widgets.length,
      size: 'medium',
      visible: true,
    };
    setWidgets([...widgets, newWidget]);
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  const renderWidgetContent = (widget: DashboardWidget) => {
    const stats = dashboardStats?.data;
    const portfolio = portfolioMetrics?.data;

    const chartData = [
      { date: 'Jan 1', value: 85000 },
      { date: 'Jan 8', value: 92000 },
      { date: 'Jan 15', value: 88500 },
      { date: 'Jan 22', value: 105000 },
      { date: 'Jan 29', value: 118000 },
      { date: 'Feb 5', value: portfolio?.totalValue || 124892 },
    ];

    switch (widget.type) {
      case 'portfolio':
        return (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-3xl font-bold">${portfolio?.totalValue?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className={`text-lg font-semibold ${portfolio && portfolio.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio && portfolio.dayChangePercent >= 0 ? '+' : ''}
                {portfolio?.dayChangePercent?.toFixed(2)}%
              </p>
            </div>
          </div>
        );

      case 'bots':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Active</span>
              <span className="font-bold">{stats?.activeBots || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total</span>
              <span className="font-bold">{stats?.totalBots || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Win Rate</span>
              <span className="font-bold">{stats?.avgWinRate || '0'}%</span>
            </div>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">BTC</p>
                <p className="font-semibold">${marketOverview?.data?.btc?.price}</p>
              </div>
              <Badge variant="outline">{marketOverview?.data?.btc?.change24h}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">ETH</p>
                <p className="font-semibold">${marketOverview?.data?.eth?.price}</p>
              </div>
              <Badge variant="outline">{marketOverview?.data?.eth?.change24h}</Badge>
            </div>
          </div>
        );

      case 'opportunities':
        return (
          <div className="space-y-2">
            {opportunities?.data?.slice(0, 2).map((opp: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-secondary rounded">
                <span className="text-sm font-medium">{opp.symbol}</span>
                <Badge variant={opp.action === 'buy' ? 'default' : 'secondary'}>
                  {opp.confidence}%
                </Badge>
              </div>
            ))}
          </div>
        );

      case 'sentiment':
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Overall</span>
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
            <div>
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">{sentiment?.data?.score?.toFixed(1)}</p>
            </div>
          </div>
        );

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'chart':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'alerts':
        return (
          <div className="space-y-2">
            <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
              <p className="text-sm font-medium">Market Alert</p>
              <p className="text-xs text-muted-foreground">BTC approaching resistance</p>
            </div>
            <div className="p-2 bg-green-500/10 rounded border border-green-500/30">
              <p className="text-sm font-medium">Opportunity</p>
              <p className="text-xs text-muted-foreground">ETH buy signal detected</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleWidgets = widgets.filter((w) => w.visible);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          {editMode && (
            <>
              <Button onClick={handleResetLayout} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSaveLayout} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
            </>
          )}
          <Button
            onClick={() => setEditMode(!editMode)}
            variant={editMode ? 'default' : 'outline'}
            size="sm"
          >
            {editMode ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Edit Mode - Add Widgets */}
      {editMode && (
        <Card className="bg-secondary/50">
          <CardHeader>
            <CardTitle className="text-base">Add Widgets</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {['portfolio', 'bots', 'market', 'opportunities', 'sentiment', 'performance', 'chart', 'alerts'].map(
              (type) => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  onClick={() => addWidget(type as DashboardWidget['type'])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-max">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            className={`${getSizeClass(widget.size)} ${editMode ? 'cursor-move' : ''}`}
            draggable={editMode}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
          >
            <Card className={`relative h-full ${editMode ? 'border-dashed border-primary' : ''}`}>
              {editMode && (
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className="h-6 w-6 p-0"
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWidget(widget.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <CardHeader className={editMode ? 'pt-8' : ''}>
                <CardTitle className="text-base">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>{renderWidgetContent(widget)}</CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
