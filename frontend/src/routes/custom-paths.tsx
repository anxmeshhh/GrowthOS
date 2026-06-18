import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageShell, PageHeader } from '@/components/growth-ui';
import { CustomPathBuilder, CustomPathList } from '@/components/custom-paths';
import { Plus, BookOpen } from 'lucide-react';

export const Route = createFileRoute('/custom-paths')({
  component: CustomPathsManagement,
});

function CustomPathsManagement() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <PageShell>
      <PageHeader
        title="Custom Learning Paths"
        subtitle="Create, manage, and share your personalized learning roadmaps"
      />

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="my-paths" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-paths" className="flex items-center gap-2">
              <BookOpen size={16} />
              My Paths
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus size={16} />
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-paths" className="space-y-4">
            <CustomPathList
              onPathCloned={() => {
                setRefreshKey((k) => k + 1);
              }}
            />
          </TabsContent>

          <TabsContent value="create">
            <div className="bg-white rounded-lg border p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Build Your Path</h2>
                  <p className="text-gray-600">
                    Design a custom learning path tailored to your goals. Add topics,
                    set their sequence, and track your progress through them.
                  </p>
                </div>

                <CustomPathBuilder />

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    💡 Tips for Creating Great Paths
                  </h3>
                  <ul className="text-lg text-blue-800 space-y-1">
                    <li>
                      • Start with foundations and progress to advanced topics
                    </li>
                    <li>• Set realistic estimated duration (in weeks)</li>
                    <li>• Use clear, descriptive topic titles</li>
                    <li>• Add summaries to help reviewers understand each topic</li>
                    <li>• Share with others to get feedback and collaborate</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
