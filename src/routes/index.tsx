import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ListTodo, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const features = [
  {
    to: "/email",
    icon: Mail,
    title: "Smart Email Generator",
    desc: "Draft professional emails with the perfect tone in seconds.",
  },
  {
    to: "/planner",
    icon: ListTodo,
    title: "AI Task Planner",
    desc: "Turn a task list into a prioritized daily or weekly schedule.",
  },
  {
    to: "/chat",
    icon: MessageSquare,
    title: "AI Chat Assistant",
    desc: "Ask workplace questions and get instant, thoughtful answers.",
  },
] as const;

function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a tool below to boost your workplace productivity.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="group">
            <Card className="h-full transition-all hover:border-primary hover:shadow-md">
              <CardHeader>
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {f.title}
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-xs font-medium text-primary">Open tool →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
