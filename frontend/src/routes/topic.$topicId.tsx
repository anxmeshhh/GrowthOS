import { createFileRoute } from "@tanstack/react-router";
import { TopicWorkspace } from "@/components/growth/topic-workspace";

export const Route = createFileRoute("/topic/$topicId")({
  head: ({ params }) => ({
    meta: [
      { title: `Topic · ${params.topicId} · GrowthOS` },
      { name: "description", content: "Study, capture notes, and complete proof for this topic." },
    ],
  }),
  component: TopicPage,
});

function TopicPage() {
  const { topicId } = Route.useParams();
  return <TopicWorkspace topicId={topicId} />;
}
