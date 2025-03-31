'use client';

import { Report as ReportType, Parameter } from '@/lib/types';

interface ReportProps {
  report: ReportType;
  scores: Record<Parameter, number>;
  onRestart: () => void;
}

export default function Report({ report, scores, onRestart }: ReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreCategory = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  };

  const parameters: Parameter[] = [
    'awareness',
    'credibility',
    'communication',
    'retention',
    'engagement',
    'strategy'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8">Your Marketing Diagnostic Report</h2>
      
      {/* Score Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {parameters.map(parameter => (
          <div
            key={parameter}
            className="bg-white rounded-lg p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-2 capitalize">
              {parameter}
            </h3>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">
                {Math.round(scores[parameter])}%
              </div>
              <div className={`text-sm font-medium ${getScoreColor(scores[parameter])}`}>
                {getScoreCategory(scores[parameter])}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg p-8 shadow-sm border mb-8">
        <h3 className="text-2xl font-semibold mb-4">Key Insights</h3>
        <div className="prose max-w-none">
          {report.insights.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg p-8 shadow-sm border mb-8">
        <h3 className="text-2xl font-semibold mb-4">Recommendations</h3>
        <ul className="space-y-4">
          {report.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-4">
                {index + 1}
              </span>
              <span className="text-gray-700">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start New Assessment
        </button>
      </div>
    </div>
  );
} 