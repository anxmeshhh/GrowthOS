import { createFileRoute } from "@tanstack/react-router";
import { TopicWorkspace } from "@/components/growth/topic-workspace";

export const Route = createFileRoute("/topic/$topicId")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : "/roadmap",
    nodeId: typeof search.nodeId === "string" ? search.nodeId : undefined,
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
  const { from, nodeId } = Route.useSearch();
  return <TopicWorkspace topicId={topicId} backTo={from} roadmapNodeId={nodeId} />;
}