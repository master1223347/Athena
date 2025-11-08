import React from 'react';

interface DashboardAchievementsWidgetProps {
  fullscreen?: boolean;
}

export const DashboardAchievementsWidget: React.FC<DashboardAchievementsWidgetProps> = ({ fullscreen }) => {
  return (
    <div className={`rounded-lg bg-white shadow p-4 ${fullscreen ? 'min-h-[400px]' : ''}`}>
      <h2 className="text-lg font-semibold mb-2">Ranked / Achievements</h2>
      <div className="text-muted-foreground">[Achievements widget placeholder]</div>
    </div>
  );
}; 