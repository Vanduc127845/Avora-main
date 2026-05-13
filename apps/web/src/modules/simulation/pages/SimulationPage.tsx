import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../../components/ui';
import { Play, MousePointer, Clock, Star, ArrowRight, Users, Building } from 'lucide-react';

const simulations = [
  {
    id: '1',
    title: 'A Day in the Life: Software Developer',
    description: 'Experience a typical day working as a software developer',
    duration: '15 min',
    difficulty: 'Beginner',
    category: 'technology',
    rating: 4.8,
    participants: 234,
    image: '</>',
  },
  {
    id: '2',
    title: 'Accessibility in the Workplace',
    description: 'Learn how to advocate for your accessibility needs',
    duration: '20 min',
    difficulty: 'Intermediate',
    category: 'advocacy',
    rating: 4.9,
    participants: 189,
    image: 'A11y',
  },
  {
    id: '3',
    title: 'Team Meeting Scenarios',
    description: 'Practice participating in virtual team meetings',
    duration: '10 min',
    difficulty: 'Beginner',
    category: 'communication',
    rating: 4.6,
    participants: 312,
    image: 'Team',
  },
  {
    id: '4',
    title: 'Problem-Solving Challenge',
    description: 'Tackle real-world problems like a professional',
    duration: '25 min',
    difficulty: 'Advanced',
    category: 'problem-solving',
    rating: 4.7,
    participants: 156,
    image: 'Logic',
  },
];

const companies = [
  { name: 'TechCorp', rating: 4.5, reviews: 89, accessibility: 'Excellent' },
  { name: 'DesignStudio', rating: 4.2, reviews: 45, accessibility: 'Good' },
  { name: 'DataViz Inc', rating: 4.0, reviews: 32, accessibility: 'Good' },
];

export default function SimulationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 mb-2">Career Simulation</h1>
        <p className="text-gray-600">
          Experience different careers through interactive simulations before committing.
        </p>
      </div>

      {/* Featured Simulation */}
      <Card className="bg-gradient-to-r from-primary-600 to-accent-600 text-white overflow-hidden">
        <div className="flex">
          <div className="flex-1 p-8">
            <span className="px-2 py-1 bg-white/20 rounded text-sm mb-4 inline-block">
              Featured
            </span>
            <h2 className="text-2xl font-bold mb-2">
              {simulations[0].title}
            </h2>
            <p className="text-white/90 mb-6">
              {simulations[0].description}
            </p>
            <div className="flex items-center gap-4 mb-6">
              <span className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" />
                {simulations[0].duration}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-warning-300 fill-warning-300" />
                {simulations[0].rating}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                {simulations[0].participants}
              </span>
            </div>
            <Button className="bg-white text-primary-600 hover:bg-gray-100" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Start Simulation
            </Button>
          </div>
          <div className="hidden md:flex items-center justify-center w-48 text-8xl bg-white/10">
            {simulations[0].image}
          </div>
        </div>
      </Card>

      {/* Simulation Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          {['All', 'Technology', 'Design', 'Communication', 'Problem Solving', 'Advocacy'].map((cat) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cat === 'All'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Available Simulations */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Simulations</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {simulations.map((sim) => (
            <Card key={sim.id} className="hover:shadow-lg transition-all group">
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                    {sim.image}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{sim.title}</h3>
                        <p className="text-sm text-gray-600">{sim.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {sim.duration}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 text-warning-500 fill-warning-500" />
                        {sim.rating}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {sim.difficulty}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:border-primary-500 group-hover:text-primary-600"
                    >
                      Start
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Task Try-outs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5 text-primary-600" />
            Try Out Real Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Get a taste of specific tasks from different jobs:
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { task: 'Write Code', icon: '</>' },
              { task: 'Design UI', icon: 'UI' },
              { task: 'Analyze Data', icon: 'Data' },
              { task: 'Write Content', icon: 'Text' },
            ].map((item) => (
              <button
                key={item.task}
                className="p-4 border border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <span className="text-sm font-medium text-gray-900">{item.task}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Accessibility Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-success-600" />
            Company Accessibility Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            See how companies rate in accessibility based on community feedback:
          </p>
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Building className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{company.name}</h4>
                    <p className="text-sm text-gray-500">{company.reviews} reviews</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning-500 fill-warning-500" />
                      <span className="font-medium">{company.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    company.accessibility === 'Excellent'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {company.accessibility}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Companies
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
