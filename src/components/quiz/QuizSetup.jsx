import React, { useState } from "react";
import { Play, Sparkles, Database, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const subjects = [
  { id: "Mathematics", name: "Mathematics", icon: "🔢" },
  { id: "Science", name: "Science", icon: "🔬" },
  { id: "History", name: "History", icon: "📜" },
  { id: "Geography", name: "Geography", icon: "🌍" },
  { id: "Literature", name: "Literature", icon: "📚" },
  { id: "General Knowledge", name: "General Knowledge", icon: "🧠" }
];

export default function QuizSetup({ onStart, loading }) {
  const [config, setConfig] = useState({
    subject: "Mathematics",
    difficulty: "mixed",
    questionCount: 10,
    mode: "existing"
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-white border-none shadow-2xl rounded-xl">
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
          <h2 className="text-2xl font-bold">Setup Your Quiz</h2>
        </div>
        <div className="p-8 space-y-8">
          <div>
            <label className="text-base font-semibold mb-4 block">Choose Subject</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setConfig({ ...config, subject: subject.id })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    config.subject === subject.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{subject.icon}</div>
                  <p className="font-medium text-sm">{subject.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-base font-semibold mb-4 block">Difficulty Level</label>
            <div className="space-y-3">
              {["easy", "medium", "hard", "mixed"].map((diff) => (
                <div
                  key={diff}
                  onClick={() => setConfig({ ...config, difficulty: diff })}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    config.difficulty === diff
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    config.difficulty === diff
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {config.difficulty === diff && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">{diff[0].toUpperCase() + diff.slice(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="count" className="text-base font-semibold mb-4 block">
              Number of Questions
            </label>
            <select
              id="count"
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="5">5 Questions (Quick)</option>
              <option value="10">10 Questions (Standard)</option>
              <option value="15">15 Questions (Extended)</option>
              <option value="20">20 Questions (Marathon)</option>
            </select>
          </div>

          <div>
            <label className="text-base font-semibold mb-4 block">Question Source</label>
            <div className="space-y-3">
              {[
                { value: "ai", icon: Sparkles, label: "AI Generated" },
                { value: "existing", icon: Database, label: "Existing Database" }
              ].map((source) => (
                <div
                  key={source.value}
                  onClick={() => setConfig({ ...config, mode: source.value })}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    config.mode === source.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    config.mode === source.value
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {config.mode === source.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <source.icon className="w-4 h-4" />
                      <span className="font-semibold">{source.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart(config)}
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Questions...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}


