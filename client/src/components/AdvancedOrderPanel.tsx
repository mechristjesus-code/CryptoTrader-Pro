import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface AdvancedOrderPanelProps {
  symbol: string;
  currentPrice: number;
}

export default function AdvancedOrderPanel({ symbol, currentPrice }: AdvancedOrderPanelProps) {
  const [orderType, setOrderType] = useState<'limit' | 'stop_loss' | 'take_profit' | 'trailing_stop' | 'oco'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [entryPrice, setEntryPrice] = useState(currentPrice.toString());
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [trailingPercent, setTrailingPercent] = useState('');

  const createOrderMutation = trpc.orders.createOrder.useMutation();

  const handleCreateOrder = async () => {
    if (!quantity || !entryPrice) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        symbol,
        orderType,
        side,
        quantity,
        entryPrice,
        limitPrice: limitPrice || undefined,
        stopPrice: stopPrice || undefined,
        trailingPercent: trailingPercent || undefined,
        exchange: 'kraken',
      });

      toast.success(`${orderType} order created successfully`);
      setQuantity('');
      setLimitPrice('');
      setStopPrice('');
      setTrailingPercent('');
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  return (
    <Card className="p-6 bg-slate-900 border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Advanced Orders</h3>
      
      <Tabs defaultValue="limit" onValueChange={(v) => setOrderType(v as any)}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="stop_loss">Stop Loss</TabsTrigger>
          <TabsTrigger value="take_profit">Take Profit</TabsTrigger>
          <TabsTrigger value="trailing_stop">Trailing</TabsTrigger>
          <TabsTrigger value="oco">OCO</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          {/* Side Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={side === 'buy' ? 'default' : 'outline'}
              onClick={() => setSide('buy')}
              className="bg-green-600 hover:bg-green-700"
            >
              Buy
            </Button>
            <Button
              variant={side === 'sell' ? 'default' : 'outline'}
              onClick={() => setSide('sell')}
              className="bg-red-600 hover:bg-red-700"
            >
              Sell
            </Button>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-gray-300">Quantity</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          {/* Entry Price */}
          <div>
            <Label className="text-gray-300">Entry Price</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Current: ${currentPrice.toFixed(2)}</p>
          </div>

          {/* Conditional Fields Based on Order Type */}
          {(orderType === 'limit' || orderType === 'oco') && (
            <div>
              <Label className="text-gray-300">Limit Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          )}

          {(orderType === 'stop_loss' || orderType === 'oco') && (
            <div>
              <Label className="text-gray-300">Stop Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          )}

          {orderType === 'trailing_stop' && (
            <div>
              <Label className="text-gray-300">Trailing Percent (%)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={trailingPercent}
                onChange={(e) => setTrailingPercent(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          )}

          {/* Create Order Button */}
          <Button
            onClick={handleCreateOrder}
            disabled={createOrderMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </Tabs>
    </Card>
  );
}
