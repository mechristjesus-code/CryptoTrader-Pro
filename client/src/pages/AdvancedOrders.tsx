import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Plus, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE"];

export default function AdvancedOrders() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("limit");
  const [symbol, setSymbol] = useState("BTC");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: orders, isLoading } = trpc.advancedOrders?.listOrders?.useQuery?.({ limit: 50, offset: 0 }) || { data: [], isLoading: false };
  const { data: stats } = trpc.advancedOrders?.getOrderStats?.useQuery?.() || { data: null };

  const createLimitOrderMutation = trpc.advancedOrders?.createLimitOrder?.useMutation?.({
    onSuccess: () => {
      toast.success("Limit order created");
      setPrice("");
      setQuantity("");
      setCreateDialogOpen(false);
      utils.advancedOrders?.listOrders?.invalidate?.();
    },
    onError: (e) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const createStopLossMutation = trpc.advancedOrders?.createStopLossOrder?.useMutation?.({
    onSuccess: () => {
      toast.success("Stop-loss order created");
      setPrice("");
      setStopPrice("");
      setQuantity("");
      setCreateDialogOpen(false);
      utils.advancedOrders?.listOrders?.invalidate?.();
    },
    onError: (e) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const createTakeProfitMutation = trpc.advancedOrders?.createTakeProfitOrder?.useMutation?.({
    onSuccess: () => {
      toast.success("Take-profit order created");
      setPrice("");
      setTakeProfit("");
      setQuantity("");
      setCreateDialogOpen(false);
      utils.advancedOrders?.listOrders?.invalidate?.();
    },
    onError: (e) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const handleCreateOrder = () => {
    if (!symbol || !quantity) {
      toast.error("Fill all required fields");
      return;
    }

    switch (activeTab) {
      case "limit":
        if (!price) return;
        createLimitOrderMutation.mutate({
          symbol,
          quantity: parseFloat(quantity),
          price: parseFloat(price),
          type: orderType,
        });
        break;
      case "stop-loss":
        if (!price || !stopPrice) return;
        createStopLossMutation.mutate({
          symbol,
          quantity: parseFloat(quantity),
          entryPrice: parseFloat(price),
          stopPrice: parseFloat(stopPrice),
          type: orderType,
        });
        break;
      case "take-profit":
        if (!price || !takeProfit) return;
        createTakeProfitMutation.mutate({
          symbol,
          quantity: parseFloat(quantity),
          entryPrice: parseFloat(price),
          takeProfitPrice: parseFloat(takeProfit),
          type: orderType,
        });
        break;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Advanced Orders
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create limit, stop-loss, take-profit, and OCO orders</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Advanced Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
                    <TabsTrigger value="stop-loss" className="flex-1">Stop-Loss</TabsTrigger>
                    <TabsTrigger value="take-profit" className="flex-1">Take-Profit</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Symbol</Label>
                    <Select value={symbol} onValueChange={setSymbol}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYMBOLS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={orderType} onValueChange={(v) => setOrderType(v as "buy" | "sell")}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5"
                    step="0.0001"
                  />
                </div>

                {(activeTab === "limit" || activeTab === "stop-loss" || activeTab === "take-profit") && (
                  <div>
                    <Label className="text-xs">Entry Price</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="mt-1.5"
                      step="0.01"
                    />
                  </div>
                )}

                {activeTab === "stop-loss" && (
                  <div>
                    <Label className="text-xs">Stop Price</Label>
                    <Input
                      type="number"
                      value={stopPrice}
                      onChange={(e) => setStopPrice(e.target.value)}
                      placeholder="0.00"
                      className="mt-1.5"
                      step="0.01"
                    />
                  </div>
                )}

                {activeTab === "take-profit" && (
                  <div>
                    <Label className="text-xs">Take Profit Price</Label>
                    <Input
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      placeholder="0.00"
                      className="mt-1.5"
                      step="0.01"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrder} disabled={createLimitOrderMutation.isPending}>
                    {createLimitOrderMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: stats?.total || 0, icon: Zap },
            { label: "Pending", value: stats?.pending || 0, icon: AlertCircle, color: "text-yellow-400" },
            { label: "Filled", value: stats?.filled || 0, icon: CheckCircle2, color: "text-green-400" },
            { label: "Cancelled", value: stats?.cancelled || 0, icon: TrendingDown, color: "text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color ?? "text-primary"}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color ?? "text-foreground"}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
            <CardDescription>Manage your advanced trading orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left pb-2 font-medium">Symbol</th>
                      <th className="text-left pb-2 font-medium">Type</th>
                      <th className="text-left pb-2 font-medium">Quantity</th>
                      <th className="text-left pb-2 font-medium">Price</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                      <th className="text-left pb-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-medium">{order.symbol}</td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs capitalize">
                            {order.type}
                          </Badge>
                        </td>
                        <td className="py-3 font-mono text-xs">{order.quantity}</td>
                        <td className="py-3 font-mono text-xs">${order.price}</td>
                        <td className="py-3">
                          <Badge
                            className={`text-xs ${
                              order.status === "pending"
                                ? "bg-yellow-400/10 text-yellow-400"
                                : order.status === "filled"
                                  ? "bg-green-400/10 text-green-400"
                                  : "bg-gray-400/10 text-gray-400"
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No orders yet. Create your first advanced order!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
