import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { store, useStore } from "@/lib/session-store";
import { toast } from "sonner";
import { Loader2, Plus, X, CalendarClock, ListChecks, Mail, Users } from "lucide-react";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Work Fast AI" },
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
  const state = useStore();
  const [mode, setMode] = useState<Mode>("Daily");
  const [hours, setHours] = useState("9:00 - 17:00");
  const [priorities, setPriorities] = useState("");
  const [manualTask, setManualTask] = useState("");
  const [extra, setExtra] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const openTodos = state.todos.filter((t) => !t.done);
  const doneTodos = state.todos.filter((t) => t.done);
  const upcoming = [...state.followUps]
    .filter((f) => !f.done)
    .sort((a, b) => a.dueAt - b.dueAt);

  const buildTaskString = () => {
    const list = openTodos.map((t) => `- ${t.text}${t.project ? ` (project: ${t.project})` : ""}`);
    const upcomingLines = upcoming.map(
      (f) =>
        `- ${f.type === "meeting" ? "Meeting" : "Follow-up email"}: ${f.project} (due ${new Date(f.dueAt).toLocaleString()})`,
    );
    return [...list, ...upcomingLines, ...(extra.trim() ? [extra.trim()] : [])].join("\n");
  };

  const run = async () => {
    const tasksStr = buildTaskString();
    if (!tasksStr.trim()) {
      toast.error("Add at least one task or generate an email first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({ data: { mode, hours, tasks: tasksStr, priorities } });
      setOutput(res.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const addManual = () => {
    if (!manualTask.trim()) return;
    store.addTodo(manualTask.trim());
    setManualTask("");
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">AI Task Planner</h2>
        <p className="text-sm text-muted-foreground">
          Tasks from your emails land here automatically. Add manual items, then generate a smart
          schedule.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-primary" />
                To-Do List
                <Badge variant="secondary" className="ml-1">
                  {openTodos.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a task..."
                  value={manualTask}
                  onChange={(e) => setManualTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addManual();
                    }
                  }}
                />
                <Button onClick={addManual} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {state.todos.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No tasks yet. Generate an email and its action items appear here automatically.
                </p>
              ) : (
                <ul className="space-y-1">
                  {[...openTodos, ...doneTodos].map((t) => (
                    <li
                      key={t.id}
                      className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
                    >
                      <Checkbox
                        checked={t.done}
                        onCheckedChange={() => store.toggleTodo(t.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}
                        >
                          {t.text}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                          {t.project && (
                            <Badge variant="outline" className="h-4 px-1 text-[10px]">
                              {t.project}
                            </Badge>
                          )}
                          {t.source === "email" && (
                            <span className="inline-flex items-center gap-0.5">
                              <Mail className="h-3 w-3" /> from email
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => store.removeTodo(t.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove task"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Follow-ups & Meetings
                <Badge variant="secondary" className="ml-1">
                  {upcoming.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Discussed projects auto-schedule a 48h follow-up email here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-start gap-3 rounded-md border p-2.5"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        {f.type === "meeting" ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {f.type === "meeting" ? "Meeting" : "Follow-up email"} · {f.project}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {f.recipient} · due {new Date(f.dueAt).toLocaleString()}
                        </p>
                        {f.note && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{f.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => store.removeFollowUp(f.id)}
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

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
                <Label htmlFor="extra">Additional tasks (optional)</Label>
                <Textarea
                  id="extra"
                  placeholder="Anything else to include, one per line"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priorities">Priorities (optional)</Label>
                <Textarea
                  id="priorities"
                  placeholder="e.g. Q3 report is highest priority; deep-work in the morning."
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
        </div>

        <OutputPanel
          title="Your Schedule"
          value={output}
          onChange={setOutput}
          onRegenerate={run}
          loading={loading}
          placeholder="Your AI-generated schedule will appear here..."
          minHeight="min-h-[600px]"
        />
      </div>
      <AiDisclaimer />
    </div>
  );
}
