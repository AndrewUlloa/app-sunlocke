'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Parameter } from "@/lib/types";

interface ReportProps {
  report: {
    insights: string;
    recommendations: string[];
  };
  scores: Record<Parameter, number>;
  onRestart: () => void;
}

export default function Report({ report, scores, onRestart }: ReportProps) {
  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-bold text-center mb-6">Your Marketing Report</h2>
      
      <Card className="p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Insights</h3>
        <p className="mb-6 text-gray-700">{report.insights}</p>
        
        <h3 className="text-xl font-semibold mb-4">Scores</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {Object.entries(scores).map(([parameter, score]) => (
            <div key={parameter} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">{parameter}</span>
                <span className="text-sm font-medium text-gray-700">{score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
        <ul className="list-disc pl-5 mb-6 space-y-2">
          {report.recommendations.map((recommendation, index) => (
            <li key={index} className="text-gray-700">{recommendation}</li>
          ))}
        </ul>
        
        <div className="flex justify-center mt-6">
          <Button onClick={onRestart}>Take Quiz Again</Button>
        </div>
      </Card>
    </div>
  );
} 