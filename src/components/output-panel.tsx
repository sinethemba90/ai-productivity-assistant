import { Copy, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface OutputPanelProps {
  title?: string;
  value: string;
  onChange: (v: string) => void;
  onRegenerate: () => void;
  loading: boolean;
  placeholder?: string;
  minHeight?: string;
}

export function OutputPanel({
  title = "AI Output",
  value,
  onChange,
  onRegenerate,
  loading,
  placeholder = "AI output will appear here...",
  minHeight = "min-h-[400px]",
}: OutputPanelProps) {
  const copy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} disabled={!value || loading}>
            <Copy className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Copy</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1 hidden sm:inline">Regenerate</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${minHeight} resize-y font-mono text-sm`}
        />
      </CardContent>
    </Card>
  );
}
