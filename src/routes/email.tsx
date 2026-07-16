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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OutputPanel } from "@/components/output-panel";
import { AiDisclaimer } from "@/components/ai-disclaimer";
import { generateEmail, analyzeEmail, generateFollowUpEmail } from "@/lib/ai.functions";
import { store } from "@/lib/session-store";
import { toast } from "sonner";
import { Loader2, CalendarClock, ListChecks } from "lucide-react";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Work Fast AI" },
      {
        name: "description",
        content: "Generate professional emails with AI in your chosen tone.",
      },
    ],
  }),
  component: EmailPage,
});

type Tone = "Formal" | "Friendly" | "Persuasive";

const FOLLOWUP_MS = 48 * 60 * 60 * 1000;

function EmailPage() {
  const genFn = useServerFn(generateEmail);
  const analyzeFn = useServerFn(analyzeEmail);
  const followUpFn = useServerFn(generateFollowUpEmail);

  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");
  const [output, setOutput] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [loading, setLoading] = useState(false);

  // Follow-up meeting dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastProject, setLastProject] = useState("");
  const [lastTasks, setLastTasks] = useState<string[]>([]);
  const [meetingWhen, setMeetingWhen] = useState("");

  const run = async () => {
    if (!recipient.trim() || !subject.trim() || !purpose.trim()) {
      toast.error("Please fill in recipient, subject, and purpose.");
      return;
    }
    setLoading(true);
    setFollowUpDraft("");
    try {
      const res = await genFn({ data: { recipient, subject, purpose, tone } });
      setOutput(res.text);

      // Extract project + tasks
      let project = "";
      let tasks: string[] = [];
      try {
        const analysis = await analyzeFn({
          data: { recipient, subject, emailText: res.text },
        });
        project = analysis.projectName?.trim() ?? "";
        tasks = (analysis.tasks ?? []).map((t) => t.trim()).filter(Boolean);
      } catch (err) {
        console.error("analyzeEmail failed", err);
      }

      // Push tasks into planner's to-do list
      if (tasks.length) {
        const added = store.addTodos(
          tasks.map((t) => ({ text: t, project: project || undefined, source: "email" as const })),
        );
        if (added) toast.success(`Added ${added} task${added > 1 ? "s" : ""} to your planner.`);
      }

      // If a project was discussed, schedule a 48h follow-up email + open meeting dialog
      if (project) {
        store.addFollowUp({
          project,
          recipient,
          originalSubject: subject,
          dueAt: Date.now() + FOLLOWUP_MS,
          type: "email",
          note: "Auto-scheduled 48h follow-up",
        });
        toast.success(`48h follow-up scheduled for "${project}".`);

        // Draft the actual follow-up email content for the user
        followUpFn({
          data: {
            recipient,
            originalSubject: subject,
            project,
            originalEmail: res.text,
          },
        })
          .then((f) => setFollowUpDraft(f.text))
          .catch((err) => console.error("followUp draft failed", err));

        setLastProject(project);
        setLastTasks(tasks);
        setMeetingWhen(defaultMeetingSlot());
        setDialogOpen(true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const confirmMeeting = () => {
    const parsed = parseWhen(meetingWhen);
    store.addFollowUp({
      project: lastProject,
      recipient,
      originalSubject: subject,
      dueAt: parsed,
      type: "meeting",
      note: meetingWhen || "Follow-up meeting",
    });
    store.addTodos([
      {
        text: `Prepare for follow-up meeting: ${lastProject}`,
        project: lastProject,
        source: "email",
      },
    ]);
    toast.success("Follow-up meeting added to your planner.");
    setDialogOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Smart Email Generator</h2>
        <p className="text-sm text-muted-foreground">
          Provide the details and let AI draft your email. Discussed projects auto-schedule a 48h
          follow-up and push tasks to your planner.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                placeholder="e.g. Jane Doe, Marketing Manager"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g. Project update for Q3"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="What should this email communicate?"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={run} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                "Generate Email"
              )}
            </Button>
          </CardContent>
        </Card>
        <OutputPanel
          title="Generated Email"
          value={output}
          onChange={setOutput}
          onRegenerate={run}
          loading={loading}
          placeholder="Your AI-generated email will appear here..."
        />
      </div>

      {followUpDraft && (
        <Card className="mt-4 border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              48-hour Follow-up Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-muted-foreground">
              Scheduled to send in 48 hours. Edit here, then copy when you're ready.
            </p>
            <Textarea
              value={followUpDraft}
              onChange={(e) => setFollowUpDraft(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Schedule a follow-up meeting?
            </DialogTitle>
            <DialogDescription>
              You discussed <span className="font-medium text-foreground">{lastProject}</span>.
              Would you like to add a follow-up meeting to your task planner?
            </DialogDescription>
          </DialogHeader>
          {lastTasks.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <ListChecks className="h-4 w-4 text-primary" />
                Tasks added to your planner
              </div>
              <ul className="ml-5 list-disc space-y-0.5 text-muted-foreground">
                {lastTasks.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="when">When?</Label>
            <Input
              id="when"
              value={meetingWhen}
              onChange={(e) => setMeetingWhen(e.target.value)}
              placeholder="e.g. Next Tuesday 2pm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              No thanks
            </Button>
            <Button onClick={confirmMeeting}>Add meeting to planner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AiDisclaimer />
    </div>
  );
}

function defaultMeetingSlot() {
  const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  d.setHours(14, 0, 0, 0);
  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseWhen(input: string): number {
  const t = Date.parse(input);
  if (!Number.isNaN(t)) return t;
  return Date.now() + 3 * 24 * 60 * 60 * 1000;
}
