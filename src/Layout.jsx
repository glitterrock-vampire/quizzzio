import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils/routing";
import { Home, Play, Upload, Trophy, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User } from "@/entities/User";

const navigationItems = [
  { title: "Home", url: createPageUrl("Home"), icon: Home },
  { title: "Play Quiz", url: createPageUrl("Quiz"), icon: Play },
  { title: "Upload Questions", url: createPageUrl("Upload"), icon: Upload },
  { title: "Leaderboard", url: createPageUrl("Leaderboard"), icon: Trophy },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await User.me();
      setUserData(user);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --success-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          --warning-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
      `}</style>
      
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Sidebar className="border-r border-purple-100 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-purple-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Quizzio
                </h2>
                <p className="text-xs text-gray-500">Challenge Yourself!</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <Link 
                        to={item.url} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 font-medium transition-all duration-200 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:text-white' 
                            : 'hover:bg-purple-50 hover:text-purple-700'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {userData && (
              <SidebarGroup className="mt-4">
                <div className="px-4 py-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <h3 className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-3">
                    Your Stats
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Points</span>
                      <span className="font-bold text-purple-900">{userData.total_points || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Best Streak</span>
                      <span className="font-bold text-purple-900">🔥 {userData.best_streak || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Accuracy</span>
                      <span className="font-bold text-purple-900">
                        {userData.total_answers > 0 
                          ? Math.round((userData.correct_answers / userData.total_answers) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-purple-100 p-4">
            {userData && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {userData.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {userData.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Level {Math.floor((userData.total_points || 0) / 100) + 1}
                  </p>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-purple-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Quizzio
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}


