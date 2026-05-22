import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, Button } from '../../../components/ui';
import { ArrowLeft, Mic, Square, Pause, ChevronRight, CheckCircle2, Lightbulb, AlertCircle, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleApiError, interviewService } from '../../../services';
import type { InterviewResponse, InterviewSession } from '../../../lib/shared';
import { useInterviewSpeechToText } from '../hooks/useInterviewSpeechToText';

export default function InterviewSessionPage() {
  const { id } = useParams();
  const [interview, setInterview] = React.useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRecording, setIsRecording] = React.useState(false);
  const [response, setResponse] = React.useState('');
  const [lastFeedback, setLastFeedback] = React.useState<InterviewResponse['feedback'] | null>(null);
  const [lastInterviewerReply, setLastInterviewerReply] = React.useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = React.useState(120);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const getResponseBaseText = React.useCallback(() => response, [response]);
  const handleSpeechEnd = React.useCallback(() => setIsRecording(false), []);
  const speechAnswer = useInterviewSpeechToText({
    getBaseText: getResponseBaseText,
    onEnd: handleSpeechEnd,
    onTranscript: setResponse,
  });

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('avora:agent-status', {
      detail: { agentId: 'interviews', status: 'done' },
    }));
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const loadInterview = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await interviewService.getInterview(id);
        if (!mounted) return;
        const latestResponse = response.interview.responses[response.interview.responses.length - 1];
        setInterview(response.interview);
        setLastFeedback(latestResponse?.feedback || null);
        setLastInterviewerReply(latestResponse?.interviewerReply || null);
        setTimeRemaining(response.interview.config.timePerQuestion);
      } catch (err) {
        if (!mounted) return;
        const apiError = handleApiError(err);
        setError(apiError.message || apiError.error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadInterview();
    return () => {
      mounted = false;
    };
  }, [id]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (isRecording && timeRemaining > 0) {
        setTimeRemaining((prev) => prev - 1);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording, timeRemaining]);

  const currentQuestion = interview?.questions[interview.currentQuestionIndex];
  const isComplete = interview?.status === 'completed';
  const currentInterviewerPrompt = currentQuestion?.interviewerPrompt || currentQuestion?.text || 'No more questions.';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = React.useCallback(async () => {
    if (!interview) return;

    setError(null);
    speechAnswer.clearError();
    setIsRecording(true);
    setTimeRemaining(interview.config.timePerQuestion);

    if (!(await speechAnswer.start())) {
      setIsRecording(false);
    }
  }, [interview, speechAnswer]);

  const stopRecording = React.useCallback(() => {
    setIsRecording(false);
    if (speechAnswer.isListening) speechAnswer.stop();
  }, [speechAnswer]);

  const pauseOrResume = async () => {
    if (!interview) return;
    setError(null);
    try {
      const result =
        interview.status === 'paused'
          ? await interviewService.resumeInterview(interview.id)
          : await interviewService.pauseInterview(interview.id);
      setInterview(result.interview);
    } catch (err) {
      setError(handleApiError(err).error);
    }
  };

  const submitResponse = async () => {
    if (!interview || !currentQuestion || response.trim().length < 5) return;

    stopRecording();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await interviewService.submitResponse(interview.id, {
        questionId: currentQuestion.id,
        response: response.trim(),
      });
      setInterview(result.interview);
      setLastFeedback(result.feedback);
      setLastInterviewerReply(result.response.interviewerReply || null);
      setResponse('');
      setTimeRemaining(result.interview.config.timePerQuestion);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || apiError.error);
    } finally {
      setIsSubmitting(false);
      stopRecording();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          <span>Loading interview...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link to="/interviews">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10 text-red-700">{error || 'Interview not found'}</CardContent>
        </Card>
      </div>
    );
  }

  const latestStoredResponse = interview.responses[interview.responses.length - 1];
  const completionInterviewerReply = lastInterviewerReply || latestStoredResponse?.interviewerReply || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/interviews">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Practice Interview</h1>
            <p className="text-sm text-gray-600">
              Question {Math.min(interview.currentQuestionIndex + 1, interview.questions.length)} of {interview.questions.length}
            </p>
          </div>
        </div>
        {!isComplete && (
          <Button variant="outline" size="sm" onClick={pauseOrResume}>
            <Pause className="h-4 w-4 mr-1" />
            {interview.status === 'paused' ? 'Resume' : 'Pause'}
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${(interview.responses.length / Math.max(1, interview.questions.length)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{interview.responses.length} answered</span>
            <span>{Math.max(0, interview.questions.length - interview.responses.length)} remaining</span>
          </div>
        </CardContent>
      </Card>

      {isComplete && interview.feedback ? (
        <Card>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-success-50 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-success-600" />
              <div>
                <p className="font-medium text-success-900">Interview complete</p>
                <p className="text-sm text-success-700">Overall score: {interview.feedback.overallScore}/10</p>
              </div>
            </div>

            {completionInterviewerReply && (
              <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-900">AI interviewer</p>
                  <p className="mt-1 text-sm leading-6 text-primary-900">{completionInterviewerReply}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {interview.feedback.strengths.map((strength) => (
                    <li key={strength} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success-500" />
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Areas to Improve</h3>
                <ul className="space-y-2">
                  {interview.feedback.improvements.map((improvement) => (
                    <li key={improvement} className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-warning-500" />
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {interview.feedback.disabilityDisclosureAdvice && (
              <div className="p-4 bg-primary-50 rounded-xl">
                <h3 className="font-semibold text-primary-900 mb-2">Disclosure Coaching</h3>
                <p className="text-sm text-primary-800 mb-2">{interview.feedback.disabilityDisclosureAdvice.timing}</p>
                <p className="text-sm text-primary-900">{interview.feedback.disabilityDisclosureAdvice.script}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-primary-100 bg-primary-50">
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-primary-900">AI interviewer</span>
                        <span className="px-2 py-0.5 bg-white text-primary-700 rounded text-xs font-medium">
                          Question {interview.currentQuestionIndex + 1}
                        </span>
                        <span className="px-2 py-0.5 bg-white text-primary-700 rounded text-xs font-medium">
                          {currentQuestion?.type || 'question'}
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-semibold leading-8 text-gray-900">
                        {currentInterviewerPrompt}
                      </p>
                      {currentQuestion?.interviewerPrompt && currentQuestion.interviewerPrompt !== currentQuestion.text && (
                        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-gray-600">
                          {currentQuestion.text}
                        </p>
                      )}
                    </div>
                  </div>
                  {currentQuestion?.accessibilityNotes && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-white rounded-lg">
                      <Lightbulb className="h-5 w-5 text-warning-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">{currentQuestion.accessibilityNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <Card>
            <CardContent>
              {lastFeedback && (
                <div className="space-y-4 mb-6">
                  {lastInterviewerReply && (
                    <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4">
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary-900">AI interviewer</p>
                        <p className="mt-1 text-sm leading-6 text-primary-900">{lastInterviewerReply}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-4 bg-success-50 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-success-600" />
                    <div>
                      <p className="font-medium text-success-900">Response submitted</p>
                      <p className="text-sm text-success-700">Score: {lastFeedback.score}/10</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Strengths</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {lastFeedback.strengths.map((strength) => <li key={strength}>{strength}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Improve</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {lastFeedback.improvements.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${timeRemaining <= 30 ? 'text-red-500' : 'text-gray-900'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-sm text-gray-500">Time remaining</p>
                </div>

                <div>
                  <label className="label mb-2">Your Response</label>
                  <textarea
                    value={response}
                    onChange={(event) => setResponse(event.target.value)}
                    placeholder="Type or dictate your response here."
                    className="input min-h-[150px] resize-none"
                    disabled={isSubmitting || interview.status === 'paused'}
                  />
                </div>

                <div className="flex items-center justify-center gap-4">
                  {speechAnswer.isTranscribing ? (
                    <Button
                      size="lg"
                      className="rounded-full w-16 h-16"
                      disabled
                      aria-label="Transcribing speech"
                    >
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </Button>
                  ) : !isRecording ? (
                    <Button
                      size="lg"
                      className="rounded-full w-16 h-16"
                      onClick={startRecording}
                      disabled={interview.status === 'paused' || isSubmitting}
                      aria-label="Start speech-to-text"
                      title={
                        speechAnswer.isSupported
                          ? 'Speak to transcribe your answer'
                          : 'Speech-to-text is not supported in this browser'
                      }
                    >
                      <Mic className="h-6 w-6" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="danger"
                      className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 animate-pulse"
                      onClick={stopRecording}
                      aria-label="Stop speech-to-text"
                    >
                      <Square className="h-6 w-6" />
                    </Button>
                  )}
                </div>
                <p
                  className={`text-center text-sm ${speechAnswer.error ? 'text-red-600' : 'text-gray-500'}`}
                  role={speechAnswer.error ? 'alert' : 'status'}
                >
                  {speechAnswer.error ||
                    (speechAnswer.isTranscribing
                      ? 'Transcribing your recording...'
                      : isRecording
                      ? speechAnswer.isSupported
                        ? 'Recording...'
                        : 'Timer running. Speech-to-text is unavailable in this browser.'
                      : speechAnswer.isSupported
                        ? 'Use the microphone button to dictate your response.'
                        : 'Speech-to-text is not supported in this browser. You can type your response.')}
                </p>

                <Button
                  className="w-full"
                  onClick={submitResponse}
                  isLoading={isSubmitting}
                  disabled={!currentQuestion || response.trim().length < 5 || interview.status === 'paused' || speechAnswer.isTranscribing}
                >
                  Submit Response
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Interview Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Use STAR: situation, task, action, result.</li>
                <li>Ask for time, written questions, or breaks when needed.</li>
                <li>Keep disability disclosure focused on the support that helps you perform.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
