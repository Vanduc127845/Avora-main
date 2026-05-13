import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Button } from '../../../components/ui';
import { Plus, Target, Clock, CheckCircle2, PlayCircle, Trash2, Loader2 } from 'lucide-react';
import { formatDuration } from '../../../utils/helpers';
import { handleApiError, roadmapService } from '../../../services';
import type { Roadmap } from '../../../lib/shared';

const totalHours = (roadmap: Roadmap) =>
  roadmap.phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = React.useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadRoadmaps = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await roadmapService.getRoadmaps();
      setRoadmaps(response.roadmaps);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  const createRoadmap = async () => {
    const targetRole = window.prompt('Target role for this roadmap', 'Junior Frontend Developer');
    if (!targetRole) return;

    setIsCreating(true);
    setError(null);
    try {
      const response = await roadmapService.createRoadmap({
        targetJobId: 'general',
        targetRole,
        title: targetRole,
        settings: { weeklyHours: 6, preferredPace: 'moderate' },
      });
      setRoadmaps((previous) => [response.roadmap, ...previous]);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRoadmap = async (id: string) => {
    if (!window.confirm('Delete this roadmap?')) return;
    setRoadmaps((previous) => previous.filter((roadmap) => roadmap.id !== id));
    try {
      await roadmapService.deleteRoadmap(id);
    } catch (err) {
      setError(handleApiError(err).error);
      loadRoadmaps();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="heading-2 mb-2">Your Career Roadmaps</h1>
          <p className="text-gray-600">
            Personalized learning paths with flexible pacing and accessibility supports.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={createRoadmap} isLoading={isCreating}>
          Create Roadmap
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Roadmaps</h2>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <span>Loading roadmaps...</span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {roadmaps.map((roadmap) => (
              <Card key={roadmap.id} className="hover:shadow-lg transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-5 w-5 text-primary-600" />
                        <span className="text-sm text-gray-500">Career Path</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{roadmap.title}</h3>
                      <p className="text-sm text-gray-600">{roadmap.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm font-medium">
                      {roadmap.progress.percentComplete}% Complete
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                        style={{ width: `${roadmap.progress.percentComplete}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Phase {roadmap.progress.currentPhase} of {roadmap.phases.length}</span>
                      <span>
                        {roadmap.progress.completedItems}/{roadmap.progress.totalItems} items - {formatDuration(totalHours(roadmap) * 60)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Updated {new Date(roadmap.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/roadmaps/${roadmap.id}`} className="flex-1">
                      <Button className="w-full" leftIcon={<PlayCircle className="h-4 w-4" />}>
                        Continue
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => deleteRoadmap(roadmap.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-dashed border-2 border-gray-300 hover:border-primary-400 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Roadmap</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Generate a personalized path for a target role.
                </p>
                <Button variant="outline" onClick={createRoadmap} isLoading={isCreating}>Choose a Career</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed</h2>
        <Card>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Completed roadmaps will appear here.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
