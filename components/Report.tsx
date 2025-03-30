'use client';

import { Report as ReportType, ParameterScore } from '@/lib/types';

interface ReportProps {
  report: ReportType;
  onRestart: () => void;
}

export default function Report({ report, onRestart }: ReportProps) {
  const getScoreColor = (category: ParameterScore['category']) => {
    switch (category) {
      case 'On the Edge':
        return 'text-yellow-600';
      case 'Slight Problem':
        return 'text-orange-500';
      case 'Problem':
        return 'text-red-500';
      case 'Severe':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8">Your Marketing Diagnostic Report</h2>
      
      {/* Score Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {report.scores.map(score => (
          <div
            key={score.parameter}
            className="bg-white rounded-lg p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold mb-2 capitalize">
              {score.parameter.replace('_', ' ')}
            </h3>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">
                {Math.round(score.score * 100)}%
              </div>
              <div className={`text-sm font-medium ${getScoreColor(score.category)}`}>
                {score.category}
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