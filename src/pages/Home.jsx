import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils/routing";
import { QuizSessionService } from "../services/quizSessionService";
import { Play, Trophy, Target, Zap, TrendingUp, Award, Book, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext.jsx";

const subjectIcons = {
  math: "🔢",
  science: "🔬",
  history: "📜",
  geography: "🌍",
  literature: "📚",
  general_knowledge: "🧠"
};

const subjects = [
  { id: "Mathematics", name: "Mathematics", color: "from-blue-500 to-cyan-500", icon: "🔢" },
  { id: "Science", name: "Science", color: "from-green-500 to-emerald-500", icon: "🔬" },
  { id: "History", name: "History", color: "from-amber-500 to-orange-500", icon: "📜" },
  { id: "Geography", name: "Geography", color: "from-teal-500 to-cyan-500", icon: "🌍" },
  { id: "Literature", name: "Literature", color: "from-purple-500 to-pink-500", icon: "📚" },
  { id: "General Knowledge", name: "General Knowledge", color: "from-indigo-500 to-purple-500", icon: "🧠" },
  { id: "Caribbean History", name: "Caribbean History", color: "from-orange-500 to-red-500", icon: "🏝️" },
  { id: "French Caribbean", name: "French Caribbean", color: "from-blue-500 to-indigo-500", icon: "🇫🇷" }
];

const achievements = [
  { id: "first_quiz", name: "Getting Started", icon: "🎯", description: "Complete your first quiz" },
  { id: "streak_5", name: "On Fire", icon: "🔥", description: "Get 5 correct answers in a row" },
  { id: "100_points", name: "Century", icon: "💯", description: "Earn 100 points" },
  { id: "perfect_quiz", name: "Perfectionist", icon: "⭐", description: "Complete a quiz with 100% accuracy" },
  { id: "speedster", name: "Speedster", icon: "⚡", description: "Complete a quiz in under 2 minutes" },
  { id: "scholar", name: "Scholar", icon: "🎓", description: "Complete 10 quizzes" }
];

export default function HomePage() {
  const { user } = useAuth();
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const sessions = await QuizSessionService.getUserSessions(user.id, 5);
      setRecentSessions(sessions);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const unlockedAchievements = user?.achievements || [];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-8 md:p-12 text-white"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wider">Welcome Back!</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Challenge<br />Your Knowledge?
            </h1>
            <p className="text-lg text-white/90 mb-8 max-w-2xl">
              Test yourself across multiple subjects, earn points, unlock achievements, and climb the leaderboard!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl("Quiz")}>
                <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Start Quiz
                </button>
              </Link>
              <Link to={createPageUrl("Leaderboard")}>
                <button className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {user && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white border-none shadow-lg rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Points</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{user.total_points || 0}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-white border-none shadow-lg rounded-xl p-6 bg-gradient-to-br from-orange-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Best Streak</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">🔥 {user.best_streak || 0}</p>
                  </div>
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="bg-white border-none shadow-lg rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Accuracy</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {user.accuracy !== undefined && user.accuracy !== null
                        ? `${Math.round(user.accuracy)}%`
                        : user.total_answers > 0
                          ? `${Math.round((user.correct_answers / user.total_answers) * 100)}%`
                          : '0%'}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="bg-white border-none shadow-lg rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Quizzes Done</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{user.quizzes_completed || 0}</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <Book className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Choose Your Subject</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject, index) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link to={`${createPageUrl("Quiz")}?subject=${subject.id}`}>
                      <div className="bg-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden rounded-xl">
                        <div className={`h-2 bg-gradient-to-r ${subject.color}`} />
                        <div className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="text-4xl">{subject.icon}</div>
                            <div>
                              <h3 className="font-bold text-lg">{subject.name}</h3>
                              <p className="text-sm text-gray-500">Start learning</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {recentSessions.length > 0 && (
              <div className="bg-white border-none shadow-lg rounded-xl">
                <div className="p-6 border-b">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Activity
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{subjectIcons[session.subject]}</div>
                          <div>
                            <p className="font-medium capitalize">{session.subject.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-500">
                              {session.correct_answers}/{session.total_questions} correct
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-gray-200 rounded-full text-sm font-semibold">
                          {session.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white border-none shadow-lg rounded-xl">
              <div className="p-6 border-b">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {achievements.map((achievement) => {
                    const isUnlocked = unlockedAchievements.includes(achievement.id);
                    return (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
                            : 'bg-gray-50 border-gray-200 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div>
                            <p className="font-semibold text-sm">{achievement.name}</p>
                            <p className="text-xs text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


