import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { chat as chatFn } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Copy, RefreshCw, Loader2, Send, Trash2, User, Sparkles } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat Assistant — Work Fast AI" },
      {
        name: "description",
        content: "Ask workplace questions and get instant AI-powered answers.",
      },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const send = useServerFn(chatFn);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ask = async (history: Msg[]) => {
    setLoading(true);
    try {
      const res = await send({ data: { messages: history } });
      setMessages([...history, { role: "assistant", content: res.text }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    await ask(next);
  };

  const regenerate = async () => {
    if (loading) return;
    // Drop the last assistant message and re-ask
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const cutoff = messages.length - lastUserIdx;
    const trimmed = messages.slice(0, cutoff);
    setMessages(trimmed);
    await ask(trimmed);
  };

  const clear = () => {
    setMessages([]);
    setInput("");
  };

  const editMessage = (idx: number, content: string) => {
    setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, content } : m)));
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-4xl flex-col p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Chat Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Session-only conversation — nothing is saved.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={regenerate} disabled={loading || messages.length === 0}>
            <RefreshCw className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Regenerate</span>
          </Button>
          <Button variant="outline" size="sm" onClick={clear} disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Sparkles className="mb-2 h-8 w-8 text-primary/60" />
              <p>Ask a workplace question to get started.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div
                className={`group max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    <Textarea
                      value={m.content}
                      onChange={(e) => editMessage(i, e.target.value)}
                      className="mt-2 min-h-[60px] resize-y bg-background text-xs"
                    />
                    <div className="mt-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copy(m.content)}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center rounded-lg bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </CardContent>
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask a workplace question..."
              className="min-h-[44px] max-h-32 resize-none"
              disabled={loading}
            />
            <Button onClick={submit} disabled={loading || !input.trim()} size="icon" className="h-auto">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      <AiDisclaimer />
    </div>
  );
}
