// import React from 'react';
// import MainLayout from '@/components/layouts/MainLayout';
// import { Link } from 'react-router-dom';
// import { Maximize2 } from 'lucide-react';

// // Placeholder imports for widgets (to be implemented)
// // import { DashboardProgressWidget } from '../components/dashboard/DashboardProgressWidget';
// import { DashboardCalendarWidget } from '../components/dashboard/DashboardCalendarWidget';
// import { DashboardAchievementsWidget } from '../components/dashboard/DashboardAchievementsWidget';
// import { DashboardGradesWidget } from '../components/dashboard/DashboardGradesWidget';

// const DashboardPage: React.FC = () => {
//   return (
//     <MainLayout>
//       <div className="space-y-6">
//         <h1 className="text-3xl font-bold">Dashboard</h1>
//         <p className="text-muted-foreground mb-4">Welcome to CanvasIQ - Your improved Canvas experience</p>
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//           {/* Tomorrow's Due Assignments & This Week's Progress */}
//           <div className="col-span-1 flex flex-col gap-6">
//             <div className="relative">
//               <DashboardProgressWidget type="tomorrow" />
//               <Link to="/progress" className="absolute top-2 right-2 text-muted-foreground hover:text-primary">
//                 <Maximize2 className="w-4 h-4" />
//               </Link>
//             </div>
//             <div className="relative">
//               <DashboardProgressWidget type="week" />
//               <Link to="/progress" className="absolute top-2 right-2 text-muted-foreground hover:text-primary">
//                 <Maximize2 className="w-4 h-4" />
//               </Link>
//             </div>
//           </div>
//           {/* Ranked/Achievement Card */}
//           <div className="relative col-span-1">
//             <DashboardAchievementsWidget />
//             <Link to="/achievements" className="absolute top-2 right-2 text-muted-foreground hover:text-primary">
//               <Maximize2 className="w-4 h-4" />
//             </Link>
//           </div>
//           {/* Calendar */}
//           <div className="relative col-span-1 xl:col-span-1">
//             <DashboardCalendarWidget />
//             <Link to="/calendar" className="absolute top-2 right-2 text-muted-foreground hover:text-primary">
//               <Maximize2 className="w-4 h-4" />
//             </Link>
//           </div>
//           {/* Course Grades Chart */}
//           <div className="relative col-span-1 xl:col-span-2">
//             <DashboardGradesWidget />
//             <Link to="/progress" className="absolute top-2 right-2 text-muted-foreground hover:text-primary">
//               <Maximize2 className="w-4 h-4" />
//             </Link>
//           </div>
//         </div>
//       </div>
//     </MainLayout>
//   );
// };

// export default DashboardPage; 