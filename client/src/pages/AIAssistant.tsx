import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Download, MessageSquare, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function AIAssistant() {
  const utils = trpc.useUtils();
  const { data: history, isLoading } = trpc.chat.getHistory.useQuery();
  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getHistory.invalidate();
    },
    onError: e => toast.error(e.message),
  });
  const clearMutation = trpc.chat.clearHistory.useMutation({
    onSuccess: () => {
      utils.chat.getHistory.invalidate();
      toast.success("Chat history cleared");
    },
    onError: e => toast.error(e.message),
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMutation.mutate({ message: input, conversationHistory: (history ?? []).map(m => ({ role: m.userMessage ? "user" as const : "assistant" as const, content: m.userMessage || m.aiResponse })) });

    setInput("");
  };

  const exportChat = () => {
    const text = history
      ?.map(m => `${m.userMessage ? "You" : "AI"}: ${m.userMessage || m.aiResponse}`)
      .join("\n\n");
    const blob = new Blob([text || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${Date.now()}.txt`;
    a.click();
    toast.success("Chat exported");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto h-screen flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              AI Trading Assistant
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Chat with our AI for trading advice and analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportChat}
              disabled={!history || history.length === 0}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearMutation.mutate()}
              disabled={!history || history.length === 0 || clearMutation.isPending}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6 overflow-y-auto space-y-4 flex flex-col">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <>
              {history.map((msg, i) => (
                <div key={i} className="space-y-2">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-xs lg:max-w-md bg-primary/20 border border-primary/30 rounded-xl px-4 py-2.5 text-sm">
                      {msg.userMessage}
                    </div>
                  </div>
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
                      {msg.aiResponse}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start a conversation with the AI trading assistant</p>
            </div>
          )}

          {/* Loading Response */}
          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md bg-background/50 border border-border rounded-xl px-4 py-2.5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about trading strategies, technical analysis, market conditions..."
              className="flex-1"
              disabled={sendMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              className="gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            💡 Tip: Ask about DCA, Grid, Scalping, Swing, Arbitrage bots, or technical indicators like RSI, MACD, Bollinger Bands
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
