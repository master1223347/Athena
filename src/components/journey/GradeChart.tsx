import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { JourneyCourse } from './JourneyMap';
import { useTheme } from "@/contexts/ThemeContext"; // or your theme hook

interface GradeChartProps {
  courses: JourneyCourse[];
}

const getGradeColor = (grade: number, isDark: boolean): string => {
  if (grade >= 90) return '#4ade80';
  if (grade >= 80) return '#60a5fa';
  if (grade >= 70) return '#fb923c';
  if (grade >= 60) return '#f97316';
  return '#ef4444';
};

const getLetterGrade = (grade: number): string => {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  return 'F';
};

// Custom Tooltip component
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        background: isDark ? "#222" : "#fff",
        color: isDark ? "#fff" : "#222",
        borderRadius: 8,
        border: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', // even lighter and smaller
        padding: '12px 16px',
        fontSize: 14,
        minWidth: 120,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.full}</div>
      <div>
        <span style={{ fontWeight: 700 }}>{data.letter}</span> : {data.grade}%
      </div>
    </div>
  );
};

export default function GradeChart({ courses }: GradeChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const data = courses
    .filter(c => typeof c.grade === 'number' && c.grade >= 0 && c.grade <= 100)
    .map(c => ({
      name: c.code || c.title,
      grade: c.grade!,
      color: getGradeColor(c.grade!, isDark),
      letter: getLetterGrade(c.grade!),
      full: c.title
    }));

  const textColor = isDark ? "#fff" : "#374151";
  const labelColor = isDark ? "#fff" : "#111827";
  const tooltipBg = isDark ? "#222" : "#fff";
  const tooltipText = isDark ? "#fff" : "#222";

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 mt-8">
        <p className={`text-sm ${isDark ? "text-white" : "text-gray-500"}`}>Unable to retrieve your grades.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[480px] mt-10">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? "#444" : "#e5e7eb"} />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12, fill: textColor }}
            interval={0}
            axisLine={{ stroke: textColor }}
            tickLine={{ stroke: textColor }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 12, fill: textColor }}
            axisLine={{ stroke: textColor }}
            tickLine={{ stroke: textColor }}
          />
          <Tooltip
            content={<CustomTooltip isDark={isDark} />}
            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
          />
          <Bar
            dataKey="grade"
            name="Grade"
            radius={[6, 6, 0, 0]}
            barSize={90}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
            <LabelList
              dataKey="letter"
              position="top"
              style={{ fontWeight: 600, fill: labelColor, fontSize: 14 }}
              offset={8}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
