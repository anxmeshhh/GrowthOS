import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PageShell, PageHeader } from '@/components/growth-ui';
import { CustomPathBuilder } from '@/components/roadmap/CustomPathBuilder';

export const Route = createFileRoute('/paths/create')({
  component: PathsCreatePage,
});

function PathsCreatePage() {
  const navigate = useNavigate();
  
  return (
    <PageShell>
      <PageHeader 
        kicker="Builder"
        title="Create a Custom Path"
        subtitle="The path builder is now available anywhere via the modal."
      />
      <div className="flex flex-col items-center justify-center p-12 mt-8 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]">
        <h3 className="text-lg font-medium text-white mb-2">Ready to build?</h3>
        <p className="text-[#eee] mb-6 text-center max-w-md text-lg">
          We've upgraded the path builder to a universal modal. It's much faster, supports milestones, and perfectly mimics standard JSON roadmaps. 
          <br /><br />
          Click below to start building.
        </p>
        <CustomPathBuilder onCreated={() => navigate({ to: '/roadmap' })} />
      </div>
    </PageShell>
  );
}
