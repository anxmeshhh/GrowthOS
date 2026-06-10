import { createFileRoute } from "@tanstack/react-router";
import { TopicWorkspace } from "@/components/growth/topic-workspace";

export const Route = createFileRoute("/topic/$topicId")({
  validateSearch: (search: Record<string, unknown>): { from?: string; nodeId?: string; mode?: string } => ({
    from: typeof search.from === "string" ? search.from : undefined,
    nodeId: typeof search.nodeId === "string" ? search.nodeId : undefined,
    mode: typeof search.mode === "string" ? search.mode : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Focus Workspace · GrowthOS` },
      { name: "description", content: "Highly productive study workspace for this roadmap node." },
    ],
  }),
  component: TopicPage,
});

function TopicPage() {
  const { topicId } = Route.useParams();
  const { from = "/roadmap", nodeId, mode } = Route.useSearch();
  return <TopicWorkspace topicId={topicId} backTo={from} roadmapNodeId={nodeId} initialMode={mode as any} />;
}