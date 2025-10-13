import React, { useState } from "react";
import { Play, Sparkles, Database, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const subjects = [
  { id: "Mathematics", name: "Mathematics", icon: "🔢" },
  { id: "Science", name: "Science", icon: "🔬" },
  { id: "History", name: "History", icon: "📜" },
  { id: "Geography", name: "Geography", icon: "🌍" },
  { id: "Literature", name: "Literature", icon: "📚" },
  { id: "General Knowledge", name: "General Knowledge", icon: "🧠" },
  { id: "Caribbean History", name: "Caribbean History", icon: "🏝️" },
  { id: "French Caribbean", name: "French Caribbean", icon: "🇫🇷" }
];

export default function QuizSetup({ onStart, loading, initialConfig }) {
  const [config, setConfig] = useState(
    initialConfig || {
      subject: "Mathematics",
      difficulty: "mixed",
      questionCount: 10,
      mode: "existing"
    }
  );

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: "easy", label: "Easy", color: "green", time: "30s" },
                { value: "medium", label: "Medium", color: "yellow", time: "45s" },
                { value: "hard", label: "Hard", color: "red", time: "60s" },
                { value: "mixed", label: "Mixed", color: "purple", time: "Variable" }
              ].map((diff) => (
                <div
                  key={diff.value}
                  onClick={() => setConfig({ ...config, difficulty: diff.value })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                    config.difficulty === diff.value
                      ? `border-${diff.color}-500 bg-${diff.color}-50 shadow-lg`
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 mx-auto mb-2 flex items-center justify-center ${
                    config.difficulty === diff.value
                      ? `border-${diff.color}-500 bg-${diff.color}-500`
                      : 'border-gray-300'
                  }`}>
                    {config.difficulty === diff.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold block">{diff.label}</span>
                    <span className="text-xs text-gray-500">{diff.time}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { value: "ai", icon: Sparkles, label: "AI Generated", description: "Fresh questions created by AI" },
                { value: "existing", icon: Database, label: "Database Questions", description: "Questions from our database" }
              ].map((source) => (
                <div
                  key={source.value}
                  onClick={() => setConfig({ ...config, mode: source.value })}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    config.mode === source.value
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <source.icon className="w-6 h-6 text-purple-600" />
                    <span className="font-semibold text-lg">{source.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{source.description}</p>
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


