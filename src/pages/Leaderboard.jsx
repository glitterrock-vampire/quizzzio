import React, { useState, useEffect } from "react";
import { UserService } from "../services/userService";
import { Trophy, Medal, Award, TrendingUp, Target, Zap, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils/routing";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const allUsers = await UserService.list();
      const sortedUsers = allUsers
        .filter(u => (u.total_points || 0) > 0)
        .sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
    setLoading(false);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Award className="w-5 h-5 text-gray-400" />;
  };

  const getRankColor = (index) => {
    if (index === 0) return "from-yellow-500 to-amber-500";
    if (index === 1) return "from-gray-400 to-gray-500";
    if (index === 2) return "from-amber-600 to-amber-700";
    return "from-purple-500 to-pink-500";
  };

  const currentUserRank = users.findIndex(u => u.id === user?.id) + 1;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-6 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-gray-600">
            See how you rank against other players
          </p>
        </motion.div>

        {user && currentUserRank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Your Rank</p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold">#{currentUserRank}</span>
                    <div>
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-sm text-white/80">{user.total_points} points</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-white/20 backdrop-blur rounded-xl p-3">
                    <Target className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-2xl font-bold">
                      {user.total_answers > 0 
                        ? Math.round((user.correct_answers / user.total_answers) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-white/80">Accuracy</p>
                  </div>
                  <div className="text-center bg-white/20 backdrop-blur rounded-xl p-3">
                    <Zap className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{user.best_streak || 0}</p>
                    <p className="text-xs text-white/80">Best Streak</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-white border-none shadow-lg rounded-xl">
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Top Players
            </h2>
          </div>
          <div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No players on the leaderboard yet.</p>
                <p className="text-sm">Be the first to play and earn points!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((rankUser, index) => (
                  <motion.div
                    key={rankUser.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      rankUser.id === user?.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(index)} flex items-center justify-center text-white font-bold text-lg`}>
                          {index + 1}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1">
                            {getRankIcon(index)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-lg">{rankUser.full_name || 'Anonymous'}</p>
                          {rankUser.id === user?.id && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {rankUser.quizzes_completed || 0} quizzes
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {rankUser.total_answers > 0 
                              ? Math.round((rankUser.correct_answers / rankUser.total_answers) * 100)
                              : 0}% accuracy
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            {rankUser.best_streak || 0} best streak
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          {rankUser.total_points || 0}
                        </p>
                        <p className="text-sm text-gray-500">points</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


