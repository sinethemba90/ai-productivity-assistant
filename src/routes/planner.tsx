import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutputPanel } from "@/components/output-panel";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { generatePlan } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Workplace" },
      {
        name: "description",
        content: "Turn your tasks into a prioritized daily or weekly schedule.",
      },
    ],
  }),
  component: PlannerPage,
});

type Mode = "Daily" | "Weekly";

function PlannerPage() {
  const fn = useServerFn(generatePlan);
  const [mode, setMode] = useState<Mode>("Daily");
  const [hours, setHours] = useState("9:00 - 17:00");
  const [tasks, setTasks] = useState("");
  const [priorities, setPriorities] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!tasks.trim()) {
      toast.error("Please add at least one task.");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({ data: { mode, hours, tasks, priorities } });
      setOutput(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">AI Task Planner</h2>
        <p className="text-sm text-muted-foreground">
          Get a smart, prioritized schedule tailored to your working hours.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Plan type</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Working hours</Label>
              <Input
                id="hours"
                placeholder="e.g. 9:00 - 17:00"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasks">Tasks (one per line)</Label>
              <Textarea
                id="tasks"
                placeholder={"Prepare Q3 report\nReview PR from Alex\nTeam standup"}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                className="min-h-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priorities">Priorities (optional)</Label>
              <Textarea
                id="priorities"
                placeholder="e.g. Q3 report is highest priority; block deep-work in the morning."
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <Button onClick={run} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Planning...
                </>
              ) : (
                "Generate Plan"
              )}
            </Button>
          </CardContent>
        </Card>
        <OutputPanel
          title="Your Schedule"
          value={output}
          onChange={setOutput}
          onRegenerate={run}
          loading={loading}
          placeholder="Your AI-generated schedule will appear here..."
        />
      </div>
      <AiDisclaimer />
    </div>
  );
}
