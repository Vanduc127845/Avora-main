import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '../../../components/ui';
import { Mic, Clock, Star, ArrowRight, History, Plus, Loader2 } from 'lucide-react';
import { handleApiError, interviewService } from '../../../services';
import type { InterviewSession } from '../../../lib/shared';

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = React.useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('avora:agent-status', {
      detail: { agentId: 'interviews', status: 'done' },
    }));
  }, []);

  const loadInterviews = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await interviewService.getInterviews();
      setInterviews(response.interviews);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const startInterview = async (jobType = 'Accessible Career Role') => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await interviewService.createInterview({
        targetJobId: '',
        targetRole: jobType,
        config: {
          types: ['behavioral', 'situational', 'disability'],
          difficulty: 'medium',
          questionCount: 5,
          timePerQuestion: 120,
          allowPause: true,
          includeFollowUp: true,
        },
      });
      navigate(`/interviews/${response.interview.id}`);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="heading-2 mb-2">Practice Interviews</h1>
          <p className="text-gray-600">
            Practice with AI questions, flexible timing, and disability disclosure coaching.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => startInterview()} isLoading={isCreating}>
          New Interview
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Card className="bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">Ready to practice?</h3>
              <p className="text-white/90">
                Start a mock interview tailored to your target job and get structured feedback.
              </p>
            </div>
            <Button className="bg-white text-primary-600 hover:bg-gray-100" size="lg" onClick={() => startInterview()} isLoading={isCreating}>
              <Mic className="h-5 w-5 mr-2" />
              Start Interview
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Star, title: 'Be Specific', desc: 'Use concrete examples from your experience' },
          { icon: Clock, title: 'Take Your Time', desc: "Pause and think before answering if you need to" },
          { icon: History, title: 'Practice Regularly', desc: 'Save feedback and repeat weak areas' },
        ].map((tip) => {
          const Icon = tip.icon;
          return (
            <Card key={tip.title}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                    <p className="text-sm text-gray-600">{tip.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Types</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { type: 'behavioral', title: 'Behavioral', desc: 'Past experiences and actions' },
            { type: 'technical', title: 'Technical', desc: 'Job-specific skills' },
            { type: 'situational', title: 'Situational', desc: 'Hypothetical scenarios' },
            { type: 'disability', title: 'Disclosure', desc: 'Rights and accommodation scripts' },
          ].map((item) => (
            <button key={item.type} type="button" onClick={() => startInterview(item.title)} className="text-left">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">AI generated</span>
                    <ArrowRight className="h-4 w-4 text-primary-600" />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Interviews</h2>
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <span>Loading interviews...</span>
            </CardContent>
          </Card>
        ) : interviews.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium text-gray-900">No interviews yet.</p>
              <p className="text-sm text-gray-500 mt-1">Start your first practice session when ready.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        interview.status === 'completed' ? 'bg-success-100' : 'bg-warning-100'
                      }`}>
                        {interview.status === 'completed' ? (
                          <Star className="h-6 w-6 text-success-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-warning-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Practice Interview</h4>
                        <p className="text-sm text-gray-600">
                          {interview.config.difficulty} - {new Date(interview.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {interview.feedback && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{interview.feedback.overallScore}</p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      )}
                      <Link to={`/interviews/${interview.id}`}>
                        <Button variant="outline" size="sm">
                          {interview.status === 'completed' ? 'Review' : 'Continue'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {interview.feedback && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Feedback: </span>
                        {interview.feedback.strengths[0] || 'Feedback ready.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
