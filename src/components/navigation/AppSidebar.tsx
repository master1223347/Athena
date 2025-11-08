import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, TrendingUp, Settings, HelpCircle, Moon, Sun, GraduationCap, Award, Send, LogOut, Trophy, CreditCard, User, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { trackFeedbackSubmission } from "@/utils/eventTracker";

const AppSidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Handle the feedback form click
  const handleFeedbackClick = () => {
    trackFeedbackSubmission("issue", {
      source: "sidebar_button"
    });
    window.open("https://forms.gle/6QjGfGKcVgfARgGT7", "_blank");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center space-x-1">
          <div className="w-6 h-6 bg-transparent p-0 rounded-md flex items-center justify-center">
            <img 
              src={theme === "dark" ? "/white-icon.svg" : "/black-icon.svg"} 
              alt="Athena" 
              className="h-5 w-5"
            />
          </div>
          <span className="font-bold text-lg">Athena</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className={isActive("/") ? "font-bold text-primary flex items-center gap-2" : "flex items-center gap-2"}>
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/leaderboard" className={isActive("/leaderboard") ? "font-bold text-primary flex items-center gap-2" : "flex items-center gap-2"}>
                    <Trophy className="w-5 h-5" />
                    <span>Leaderboard</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenu className="pl-7 mt-0">
                  <SidebarMenuItem className="mt-0">
                    <SidebarMenuButton asChild>
                      <Link to="/leaderboard/groups" className={isActive("/leaderboard/groups") ? "font-bold text-primary flex items-center gap-2" : "flex items-center gap-2 text-sm text-muted-foreground"}>
                        <span>Leaderboard Groups</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/gambling" className={isActive("/gambling") ? "font-bold text-primary flex items-center gap-2" : "flex items-center gap-2"}>
                    <TrendingUp className="w-5 h-5" />
                    <span>Gambling</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/ai-assistant" className={isActive("/ai-assistant") ? "font-bold text-primary flex items-center gap-2" : "flex items-center gap-2"}>
                    <GraduationCap className="w-5 h-5" />
                    <span>AI Study Tools</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/pricing"
                    className={`flex items-center mt-1 text-white justify-center gap-2 rounded-xl w-full py-5 ${
                      theme === "dark" 
                        ? "bg-journey-secondary"
                        : "bg-[#a16bff] duration-200 transition-all opacity-100"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="align-center">Upgrade to Premium</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 ">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2 text-primary"
        >
          <Link to="/settings">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="w-full flex items-center gap-2 text-red-500" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;