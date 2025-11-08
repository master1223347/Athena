import React from 'react';

interface DashboardGradesWidgetProps {
  fullscreen?: boolean;
}

export const DashboardGradesWidget: React.FC<DashboardGradesWidgetProps> = ({ fullscreen }) => {
  return (
    <div className={`rounded-lg bg-white shadow p-4 ${fullscreen ? 'min-h-[400px]' : ''}`}>
      <h2 className="text-lg font-semibold mb-2">Course Grades</h2>
      <div className="text-muted-foreground">[Grades widget placeholder]</div>
    </div>
  );
}; 