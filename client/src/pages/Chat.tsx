import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: historyResponse } = trpc.chat.getHistory.useQuery({ limit: 50 });
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data]);
        setInput('');
      }
      setIsLoading(false);
    },
  });

  const clearHistory = trpc.chat.clearHistory.useMutation({
    onSuccess: () => {
      setMessages([]);
      toast.success('Chat history cleared');
    },
  });

  useEffect(() => {
    if (historyResponse?.data) {
      setMessages(historyResponse.data as Message[]);
    }
  }, [historyResponse]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    setIsLoading(true);
    sendMessage.mutate({
      message: input,
      context: 'Trading bot performance analysis',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">AI Trading Assistant</h1>
            <p className="text-muted-foreground">Get AI-powered trading insights and recommendations</p>
          </div>
          <Button
            variant="outline"
            onClick={() => clearHistory.mutate()}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear History
          </Button>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Start a conversation with the AI assistant</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                        <p className="text-sm">{message.userMessage}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 max-w-xs">
                        <p className="text-sm">{message.aiResponse}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your trading performance, strategies, or market conditions..."
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

