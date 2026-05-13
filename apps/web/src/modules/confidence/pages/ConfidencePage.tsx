import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../../components/ui';
import { Heart, BookOpen, Users, Sparkles, Clock, Star, ChevronRight } from 'lucide-react';

const affirmations = [
  "Your unique perspective is valuable. Employers recognize talent that comes from diverse experiences.",
  "Every expert was once a beginner. Your journey is exactly where it needs to be.",
  "Disability is a part of who you are, not a limitation on what you can achieve.",
  "You've overcome challenges that have prepared you for the workplace in unique ways.",
  "Your determination and resilience are qualities employers deeply value.",
];

const achievements = [
  { id: 1, title: 'Getting Started', desc: 'Created your account', icon: Star, unlocked: true },
  { id: 2, title: 'Self-Discoverer', desc: 'Finished assessment', icon: BookOpen, unlocked: true },
  { id: 3, title: 'Roadmapper', desc: 'Created first roadmap', icon: Clock, unlocked: true },
  { id: 4, title: 'Interview Pro', desc: 'Complete 5 interviews', icon: Star, unlocked: false },
  { id: 5, title: 'Career Champion', desc: 'Land your first job', icon: Heart, unlocked: false },
];

const journalEntries = [
  { id: 1, title: 'Today I learned...', date: 'Yesterday', preview: 'About the importance of accessibility in tech...' },
  { id: 2, title: 'My progress so far', date: '3 days ago', preview: 'I completed my first roadmap milestone...' },
  { id: 3, title: 'Interview practice', date: '1 week ago', preview: 'My latest mock interview went better...' },
];

export default function ConfidencePage() {
  const [currentAffirmation, setCurrentAffirmation] = React.useState(0);

  const nextAffirmation = () => {
    setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 mb-2">Build Your Confidence</h1>
        <p className="text-gray-600">
          Celebrate your wins, track your progress, and build resilience.
        </p>
      </div>

      {/* Daily Affirmation */}
      <Card className="bg-gradient-to-br from-primary-500 to-accent-500 text-white">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium mb-4">
                "{affirmations[currentAffirmation]}"
              </p>
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">
                  Daily Affirmation | {currentAffirmation + 1} of {affirmations.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={nextAffirmation}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Success Journal</h3>
                <p className="text-sm text-gray-600">Reflect on your wins</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-success-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Community</h3>
                <p className="text-sm text-gray-600">Connect with peers</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-accent-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Get Support</h3>
                <p className="text-sm text-gray-600">Resources when you need help</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning-500" />
            Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`flex flex-col items-center text-center p-4 rounded-xl ${
                    achievement.unlocked
                      ? 'bg-warning-50 border-2 border-warning-200'
                      : 'bg-gray-50 border-2 border-dashed border-gray-200 opacity-60'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      achievement.unlocked ? 'bg-warning-100' : 'bg-gray-200'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        achievement.unlocked ? 'text-warning-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <h4 className={`text-sm font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-500">{achievement.desc}</p>
                  {!achievement.unlocked && (
                    <span className="mt-2 px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                      Locked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Journal */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              Success Journal
            </CardTitle>
            <Button size="sm" variant="outline">
              New Entry
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{entry.title}</h4>
                    <span className="text-xs text-gray-500">{entry.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">{entry.preview}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Imposter Syndrome Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent-600" />
              Imposter Syndrome Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              It's normal to feel like you don't belong sometimes. Many successful people 
              experience these feelings. Here are some strategies:
            </p>
            <ul className="space-y-3">
              {[
                'Keep a "proof" folder of positive feedback',
                'Remember: feelings of fraud do not equal actual fraud',
                'Focus on your growth, not perfection',
                'Talk to mentors who understand',
              ].map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent-600 text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-4">
              Get Personalized Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Encouragement */}
      <Card className="bg-gradient-to-r from-success-50 to-primary-50 border-success-100">
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl">You've got this!</div>
            <div>
              <p className="text-gray-700">
                Every step you take brings you closer to your goals. 
                Your journey is unique, and you're doing great!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
