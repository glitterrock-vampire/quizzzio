import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Play,
  Upload,
  Trophy,
  LogIn,
  User as UserIcon,
  LogOut,
  Zap,
  Menu,
  X,
  Settings
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";

// Navigation items for authenticated users
const authenticatedNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Play Quiz", url: "/quiz", icon: Play },
  { title: "Upload Questions", url: "/upload", icon: Upload, adminOnly: true },
  { title: "Admin Panel", url: "/admin", icon: Settings, adminOnly: true },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
];

// Navigation items for guests
const guestNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Play Quiz", url: "/quiz", icon: Play },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Login", url: "/login", icon: LogIn },
];

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Get filtered navigation items based on authentication and admin status
  const getNavItems = () => {
    if (!isAuthenticated()) return guestNavItems;

    return authenticatedNavItems.filter(item => {
      if (item.adminOnly) {
        return user?.role === 'admin';
      }
      return true;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          {/* Sidebar Header */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <Zap className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">QuizMaster</span>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`${
                    location.pathname === item.url
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                >
                  <Icon className={`${
                    location.pathname === item.url
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-5 w-5`} />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            {isAuthenticated() ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
                <p className="text-xs text-center text-gray-500">
                  New user?{' '}
                  <Link
                    to="/register"
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">QuizMaster</span>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <X className="block h-6 w-6" />
            ) : (
              <Menu className="block h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">QuizMaster</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Sidebar Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {getNavItems().map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={toggleMobileMenu}
                    className={`${
                      location.pathname === item.url
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon className={`${
                      location.pathname === item.url
                        ? 'text-indigo-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-5 w-5`} />
                    {item.title}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Sidebar Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              {isAuthenticated() ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={toggleMobileMenu}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </Link>
                  <p className="text-xs text-center text-gray-500">
                    New user?{' '}
                    <Link
                      to="/register"
                      onClick={toggleMobileMenu}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Create account
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:py-6 pt-20 pb-6 md:pt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}