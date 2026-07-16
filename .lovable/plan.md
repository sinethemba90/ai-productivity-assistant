# AI Workplace Productivity Assistant

A session-only SaaS app with a collapsible sidebar, dashboard, and three AI-powered tools. No auth, no database, no persistence.

## Stack & AI

- TanStack Start (existing template), Tailwind v4, shadcn components.
- Lovable AI Gateway (auto-provisioned `LOVABLE_API_KEY`) using `openai/gpt-5.5` via AI SDK.
- Three server functions in `src/lib/ai.functions.ts`:
  - `generateEmail({ recipient, subject, purpose, tone })`
  - `generatePlan({ mode, hours, tasks, priorities })`
  - `chat({ messages })` — stateless, receives full history from client session state.

## Design

- Blue/white professional palette. Update `src/styles.css` tokens (primary = blue).
- Layout: shadcn `Sidebar` (collapsible icon mode) + top header with app title.
- Each AI page: two-column grid (input left, output right); stacks on mobile.
- Output card includes editable `Textarea`, Copy button, Regenerate button, loading state.
- Disclaimer footer component rendered on all three AI pages.

## Routes

```
src/routes/
  __root.tsx        (update head metadata; wrap in SidebarProvider + AppSidebar + header)
  index.tsx         (Dashboard: 3 feature cards linking to tools)
  email.tsx         (Smart Email Generator)
  planner.tsx       (AI Task Planner)
  chat.tsx          (AI Chat Assistant)
  api/
    email.ts, planner.ts  (not needed — use server functions)
```

Chat uses `useChat` + `DefaultChatTransport` pointing to `src/routes/api/chat.ts` streaming route. Session-only: messages live in component state; no persistence.

## Components

- `src/components/app-sidebar.tsx` — nav items (Dashboard, Email, Planner, Chat) with lucide icons.
- `src/components/app-header.tsx` — title + `SidebarTrigger`.
- `src/components/ai-disclaimer.tsx` — bottom disclaimer.
- `src/components/output-panel.tsx` — reusable editable output + Copy/Regenerate.

## Files to create/modify

- Modify: `src/routes/__root.tsx` (metadata, sidebar shell), `src/routes/index.tsx` (dashboard), `src/styles.css` (blue tokens).
- Create: 3 new route files, 4 components, `src/lib/ai.functions.ts`, `src/lib/ai-gateway.server.ts`, `src/routes/api/chat.ts`.
- Add packages: `ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`, `zod`, `react-markdown`.

## Out of scope

No auth, no Supabase/database, no localStorage persistence, no history.
