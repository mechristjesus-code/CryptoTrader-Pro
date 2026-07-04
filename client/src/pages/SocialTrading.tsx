import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Share2, Trophy, Users } from "lucide-react";

export function SocialTradingContent() {
  const [leaderId, setLeaderId] = useState("");
  const [positionSize, setPositionSize] = useState("100");
  const [symbol, setSymbol] = useState("BTC");
  const [signalAction, setSignalAction] = useState("buy");
  const [confidence, setConfidence] = useState("0.8");
  const [description, setDescription] = useState("");

  const followTrader = trpc.social.followTrader.useMutation();
  const publishSignal = trpc.social.publishSignal.useMutation();
  const getFollowingList = trpc.social.getFollowingList.useQuery({ limit: 20, offset: 0 });
  const getFollowersList = trpc.social.getFollowersList.useQuery({ limit: 20, offset: 0 });
  const getMySignals = trpc.social.getMySignals.useQuery({ limit: 20, offset: 0 });
  const listContests = trpc.social.listContests.useQuery({ limit: 20, offset: 0 });
  const socialStats = trpc.social.getSocialStats.useQuery();

  const handleFollowTrader = async () => {
    if (!leaderId) return;
    await followTrader.mutateAsync({
      leaderId: parseInt(leaderId),
      positionSizePercent: parseFloat(positionSize),
    });
    setLeaderId("");
    getFollowingList.refetch();
  };

  const handlePublishSignal = async () => {
    if (!symbol) return;
    await publishSignal.mutateAsync({
      symbol,
      action: signalAction as "buy" | "sell",
      confidence: parseFloat(confidence),
      description,
    });
    setDescription("");
    getMySignals.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Social Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Followers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialStats.data?.followers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Following</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialStats.data?.following || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trading Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialStats.data?.signals || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialStats.data?.contests || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Copy Trading & Signals */}
      <Card>
        <CardHeader>
          <CardTitle>Copy Trading & Signals</CardTitle>
          <CardDescription>Follow traders and publish trading signals</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="follow" className="space-y-4">
            <TabsList>
              <TabsTrigger value="follow">Follow Trader</TabsTrigger>
              <TabsTrigger value="signal">Publish Signal</TabsTrigger>
            </TabsList>

            <TabsContent value="follow" className="space-y-4">
              <p className="text-sm text-gray-600">
                Follow successful traders and automatically copy their trades with adjustable position sizing.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  type="number"
                  placeholder="Trader ID"
                  value={leaderId}
                  onChange={(e) => setLeaderId(e.target.value)}
                />
                <div>
                  <label className="text-sm font-medium">Position Size: {positionSize}%</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={positionSize}
                    onChange={(e) => setPositionSize(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <Button onClick={handleFollowTrader} disabled={followTrader.isPending}>
                {followTrader.isPending ? "Following..." : "Follow Trader"}
              </Button>
            </TabsContent>

            <TabsContent value="signal" className="space-y-4">
              <p className="text-sm text-gray-600">
                Publish trading signals to share your analysis with other traders.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Symbol (BTC, ETH)"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
                <Select value={signalAction} onValueChange={setSignalAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy Signal</SelectItem>
                    <SelectItem value="sell">Sell Signal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Confidence: {confidence}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-full"
                />
              </div>
              <textarea
                placeholder="Signal description and analysis..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
              />
              <Button onClick={handlePublishSignal} disabled={publishSignal.isPending}>
                {publishSignal.isPending ? "Publishing..." : "Publish Signal"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Following List */}
      {getFollowingList.data && (
        <Card>
          <CardHeader>
            <CardTitle>Traders You Follow</CardTitle>
            <CardDescription>Copy trading relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getFollowingList.data.map((relationship) => (
                <div key={relationship.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Trader #{relationship.leaderId}</p>
                    <p className="text-sm text-gray-600">Position Size: {relationship.positionSizePercent}%</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {relationship.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Signals */}
      {getMySignals.data && (
        <Card>
          <CardHeader>
            <CardTitle>Your Trading Signals</CardTitle>
            <CardDescription>Signals you've published</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getMySignals.data.map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{signal.symbol}</p>
                    <p className="text-sm text-gray-600">
                      {signal.action === 'buy' ? '📈' : '📉'} {signal.action.toUpperCase()} - Confidence: {signal.confidence}
                    </p>
                    {signal.description && (
                      <p className="text-xs text-gray-500 mt-1">{signal.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{signal.subscribers} subscribers</p>
                    {signal.successRate && (
                      <p className="text-xs text-green-600">{signal.successRate}% success rate</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contests */}
      {listContests.data && (
        <Card>
          <CardHeader>
            <CardTitle>Trading Contests</CardTitle>
            <CardDescription>Compete with other traders for prizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listContests.data.map((contest) => (
                <div key={contest.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{contest.name}</p>
                    <p className="text-sm text-gray-600">{contest.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(contest.startDate).toLocaleDateString()} - {new Date(contest.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm">Join Contest</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SocialTrading() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6 text-primary" />
            Social Trading
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Copy trades, share signals, and compete in contests</p>
        </div>
        <SocialTradingContent />
      </div>
    </DashboardLayout>
  );
}
