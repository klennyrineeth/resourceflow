import DashboardLayout from '../components/Layout/DashboardLayout';
import Card from '../components/UI/Card';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Target } from 'lucide-react';

export default function Insights() {
  const aiSuggestions = [
    {
      type: 'priority',
      title: 'High Demand Area Detected',
      description: 'Downtown District showing 40% increase in medical requests over the past 24 hours',
      recommendation: 'Consider deploying 2-3 additional medical volunteers to this area',
      confidence: 94
    },
    {
      type: 'efficiency',
      title: 'Response Time Improvement',
      description: 'Average response time decreased by 15% after optimizing volunteer-request matching',
      recommendation: 'Continue using AI-powered matching algorithm',
      confidence: 88
    },
    {
      type: 'resource',
      title: 'Volunteer Availability Gap',
      description: 'Projected shortage of food distribution volunteers for weekend coverage',
      recommendation: 'Recruit 5-7 volunteers with food distribution skills',
      confidence: 91
    },
  ];

  const performanceMetrics = [
    { label: 'Request Resolution Rate', value: '94%', change: '+3%', icon: CheckCircle },
    { label: 'Avg Response Time', value: '8.2 min', change: '-15%', icon: Clock },
    { label: 'Volunteer Utilization', value: '76%', change: '+5%', icon: Users },
    { label: 'Match Accuracy', value: '89%', change: '+7%', icon: Target },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">AI Insights</h1>
          <p className="text-sm text-gray-500 mt-1">Data-driven recommendations and performance analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {performanceMetrics.map((metric) => (
            <Card key={metric.label} className="p-5 sm:p-6 shadow-sm border-gray-100 transition-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">{metric.label}</span>
                <metric.icon className="w-4 h-4 text-blue-500/50" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">{metric.value}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  metric.change.startsWith('+') && !metric.label.includes('Time')
                    ? 'bg-green-50 text-green-700'
                    : metric.change.startsWith('-') && metric.label.includes('Time')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {metric.change}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h2>
          <div className="space-y-4">
            {aiSuggestions.map((suggestion, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {suggestion.type === 'priority' && <AlertTriangle className="w-5 h-5 text-blue-600" />}
                    {suggestion.type === 'efficiency' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                    {suggestion.type === 'resource' && <Users className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">{suggestion.title}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {suggestion.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                    <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                      <p className="text-sm font-medium text-blue-900">Recommendation:</p>
                      <p className="text-sm text-blue-700 mt-1">{suggestion.recommendation}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Trends</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Medical Requests</span>
                  <span className="font-medium text-gray-900">+12% this week</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Food Distribution</span>
                  <span className="font-medium text-gray-900">+8% this week</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '54%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Shelter Assistance</span>
                  <span className="font-medium text-gray-900">-3% this week</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Transport Services</span>
                  <span className="font-medium text-gray-900">+15% this week</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Volunteers</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">SW</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sarah Williams</p>
                    <p className="text-xs text-gray-500">89 completed requests</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">98%</p>
                  <p className="text-xs text-gray-500">Success rate</p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">ED</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Emily Davis</p>
                    <p className="text-xs text-gray-500">71 completed requests</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">96%</p>
                  <p className="text-xs text-gray-500">Success rate</p>
                </div>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">MJ</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Maria Johnson</p>
                    <p className="text-xs text-gray-500">63 completed requests</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">95%</p>
                  <p className="text-xs text-gray-500">Success rate</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">DB</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">David Brown</p>
                    <p className="text-xs text-gray-500">52 completed requests</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">94%</p>
                  <p className="text-xs text-gray-500">Success rate</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
