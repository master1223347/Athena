import React from 'react';

interface DashboardCalendarWidgetProps {
  fullscreen?: boolean;
}

export const DashboardCalendarWidget: React.FC<DashboardCalendarWidgetProps> = ({ fullscreen }) => {
  return (
    <div className={`rounded-lg bg-white shadow p-4 ${fullscreen ? 'min-h-[400px]' : ''}`}>
      <h2 className="text-lg font-semibold mb-2">Calendar</h2>
      <div className="text-muted-foreground">[Calendar widget placeholder]</div>
    </div>
  );
}; 