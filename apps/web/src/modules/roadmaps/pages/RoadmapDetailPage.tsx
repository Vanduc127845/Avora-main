import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, Button } from '../../../components/ui';
import { ArrowLeft, CheckCircle2, Circle, PlayCircle, Loader2, Target } from 'lucide-react';
import { formatDuration } from '../../../utils/helpers';
import { handleApiError, roadmapService } from '../../../services';
import type { Roadmap } from '../../../lib/shared';

const countPhaseItems = (phase: Roadmap['phases'][number]) =>
  phase.milestones.reduce((count, milestone) => count + milestone.items.length, 0);

const countPhaseCompleted = (phase: Roadmap['phases'][number]) =>
  phase.milestones.reduce(
    (count, milestone) => count + milestone.items.filter((item) => Boolean(item.completedAt)).length,
    0
  );

export default function RoadmapDetailPage() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = React.useState<Roadmap | null>(null);
  const [expandedPhase, setExpandedPhase] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [savingItemId, setSavingItemId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadRoadmap = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await roadmapService.getRoadmap(id);
        if (!mounted) return;
        setRoadmap(response.roadmap);
        setExpandedPhase(response.roadmap.phases[0]?.id || null);
      } catch (err) {
        if (!mounted) return;
        const apiError = handleApiError(err);
        setError(apiError.message || apiError.error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadRoadmap();
    return () => {
      mounted = false;
    };
  }, [id]);

  const completeItem = async (itemId: string) => {
    if (!roadmap) return;
    setSavingItemId(itemId);
    setError(null);

    try {
      const response = await roadmapService.completeItem(roadmap.id, itemId);
      setRoadmap(response.roadmap);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setSavingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          <span>Loading roadmap...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="space-y-4">
        <Link to="/roadmaps">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10 text-red-700">{error || 'Roadmap not found'}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/roadmaps">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-primary-600 mb-1">
            <Target className="h-5 w-5" />
            <span className="text-sm font-medium">Career Roadmap</span>
          </div>
          <h1 className="heading-2">{roadmap.title}</h1>
          <p className="text-gray-600">{roadmap.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{roadmap.progress.percentComplete}%</p>
              <p className="text-sm text-gray-500">Complete</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {roadmap.progress.completedItems}/{roadmap.progress.totalItems}
              </p>
              <p className="text-sm text-gray-500">Items Done</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{roadmap.progress.currentPhase}</p>
              <p className="text-sm text-gray-500">Current Phase</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{roadmap.phases.length}</p>
              <p className="text-sm text-gray-500">Total Phases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {roadmap.phases.map((phase) => {
          const completed = countPhaseCompleted(phase);
          const total = countPhaseItems(phase);
          const phaseStatus = completed === total && total > 0 ? 'completed' : completed > 0 ? 'in-progress' : 'pending';

          return (
            <Card
              key={phase.id}
              className={`transition-all ${phaseStatus === 'in-progress' ? 'ring-2 ring-primary-500' : ''}`}
            >
              <button
                type="button"
                className="w-full p-4 text-left"
                onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {phaseStatus === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-success-500" />
                    ) : phaseStatus === 'in-progress' ? (
                      <div className="w-5 h-5 border-2 border-primary-500 rounded-full animate-pulse" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500">Phase {phase.order}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {completed}/{total} items
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                    <p className="text-sm text-gray-600">{phase.description}</p>
                  </div>
                </div>
              </button>

              {expandedPhase === phase.id && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {phase.milestones.map((milestone) => (
                    <div key={milestone.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {milestone.items.every((item) => item.completedAt) ? (
                          <CheckCircle2 className="h-5 w-5 text-success-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                        <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                        <span className="text-sm text-gray-500">({milestone.items.length} items)</span>
                      </div>
                      <p className="ml-7 text-sm text-gray-500">{milestone.description}</p>
                      <div className="ml-7 space-y-2">
                        {milestone.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {item.completedAt ? (
                              <CheckCircle2 className="h-5 w-5 text-success-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300" />
                            )}
                            <div className="flex-1">
                              <p className={`font-medium ${item.completedAt ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.type} - {formatDuration(item.duration)}
                              </p>
                            </div>
                            {!item.completedAt && (
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<PlayCircle className="h-4 w-4" />}
                                onClick={() => completeItem(item.id)}
                                isLoading={savingItemId === item.id}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
