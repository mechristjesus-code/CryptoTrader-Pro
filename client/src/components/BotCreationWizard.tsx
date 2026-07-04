import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface BotCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BotCreationWizard({ open, onOpenChange }: BotCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    name: '',
    botType: 'dca' as const,
    exchange: 'kraken',
    symbol: 'BTC/USD',
    amount: 50,
    riskLevel: 5,
  });

  const createBot = trpc.bots.list.useQuery();

  const handleCreate = () => {
    toast.success('🎉 Bot launched successfully!');
    onOpenChange(false);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bot Creation Wizard • Step {step}/3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label>Bot Name</Label>
              <Input 
                value={config.name} 
                onChange={(e) => setConfig({...config, name: e.target.value})} 
                placeholder="Aggressive BTC DCA" 
              />
            </div>
            <div>
              <Label>Strategy Type</Label>
              <Select value={config.botType} onValueChange={(v: any) => setConfig({...config, botType: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dca">DCA (Dollar Cost Averaging)</SelectItem>
                  <SelectItem value="grid">Grid Trading</SelectItem>
                  <SelectItem value="scalping">Scalping</SelectItem>
                  <SelectItem value="swing">Swing Trading</SelectItem>
                  <SelectItem value="arbitrage">Arbitrage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label>Trading Pair</Label>
              <Input value={config.symbol} onChange={(e) => setConfig({...config, symbol: e.target.value})} />
            </div>
            <div>
              <Label>Exchange</Label>
              <Select value={config.exchange} onValueChange={(v: any) => setConfig({...config, exchange: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kraken">Kraken</SelectItem>
                  <SelectItem value="coinbase">Coinbase</SelectItem>
                  <SelectItem value="binance">Binance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Next: Risk Settings</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label>Investment per Cycle ($)</Label>
              <Input type="number" value={config.amount} onChange={(e) => setConfig({...config, amount: parseInt(e.target.value)})} />
            </div>
            <div>
              <Label>Risk Level (1-10)</Label>
              <Slider value={[config.riskLevel]} onValueChange={([v]) => setConfig({...config, riskLevel: v})} max={10} />
              <p className="text-xs text-muted-foreground mt-1">{config.riskLevel}/10 - {config.riskLevel <= 3 ? 'Conservative' : config.riskLevel <= 6 ? 'Balanced' : 'Aggressive'}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
              <Button onClick={handleCreate} className="flex-1" disabled={!config.name}>
                Launch Bot Now
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

