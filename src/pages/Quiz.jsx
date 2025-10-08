import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "../utils/routing";
import { QuizQuestionService } from "../services/quizQuestionService";
import { QuizSessionService } from "../services/quizSessionService";
import { UserService } from "../services/userService";
import { AIService } from "../services/aiService";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext.jsx";

import QuizSetup from "../components/quiz/QuizSetup.jsx";
import QuestionCard from "../components/quiz/QuestionCard.jsx";
import QuizResults from "../components/quiz/QuizResults.jsx";

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [stage, setStage] = useState("setup");
  const [quizConfig, setQuizConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const subject = searchParams.get("subject");
    if (subject) {
      const config = { subject, questionCount: 10, difficulty: "mixed", mode: "existing" };
      setQuizConfig(config);
      handleStartQuiz(config);
    }
  }, [searchParams]);

  useEffect(() => {
    if (stage === "playing" && !showExplanation) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAnswer(null);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage, currentQuestionIndex, showExplanation]);

  const handleStartQuiz = async (config) => {
    setLoading(true);
    setQuizConfig(config);

    try {
      let quizQuestions = [];

      if (config.mode === "ai") {
        quizQuestions = await AIService.generateQuestions(config);
      } else {
        const filters = { subject: config.subject };
        if (config.difficulty !== "mixed") {
          filters.difficulty = config.difficulty;
        }
        const allQuestions = await QuizQuestionService.filter(filters);
        quizQuestions = allQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, config.questionCount);
      }

      if (quizQuestions.length === 0) {
        alert("No questions available. Try generating AI questions or uploading some!");
        setLoading(false);
        return;
      }

      setQuestions(quizQuestions);
      setStage("playing");
      setStartTime(Date.now());
      setTimeLeft(30);
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert("Error loading questions. Please try again.");
    }
    setLoading(false);
  };

  const handleAnswer = (selectedAnswer) => {
    if (showExplanation) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    const newAnswers = [...answers, {
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.correct_answer,
      isCorrect,
      points: isCorrect ? currentQuestion.points : 0
    }];
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + currentQuestion.points);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setShowExplanation(true);
    
    setTimeout(() => {
      setShowExplanation(false);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeLeft(30);
      } else {
        finishQuiz(newAnswers);
      }
    }, 3000);
  };

  const finishQuiz = async (finalAnswers) => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correctCount = finalAnswers.filter(a => a.isCorrect).length;
    const finalScore = finalAnswers.reduce((sum, a) => sum + a.points, 0);

    try {
      await QuizSessionService.create({
        user_id: user.id,
        subject: quizConfig.subject,
        score: finalScore,
        correct_answers: correctCount,
        total_questions: questions.length,
        time_taken: timeTaken,
        difficulty: quizConfig.difficulty
      });

      const newTotalPoints = (user.total_points || 0) + finalScore;
      const newCorrectAnswers = (user.correct_answers || 0) + correctCount;
      const newTotalAnswers = (user.total_answers || 0) + questions.length;
      const newQuizzesCompleted = (user.quizzes_completed || 0) + 1;
      const newBestStreak = Math.max(user.best_streak || 0, streak);

      const newAchievements = [...(user.achievements || [])];
      if (newQuizzesCompleted === 1 && !newAchievements.includes("first_quiz")) {
        newAchievements.push("first_quiz");
      }
      if (newBestStreak >= 5 && !newAchievements.includes("streak_5")) {
        newAchievements.push("streak_5");
      }
      if (newTotalPoints >= 100 && !newAchievements.includes("100_points")) {
        newAchievements.push("100_points");
      }
      if (correctCount === questions.length && !newAchievements.includes("perfect_quiz")) {
        newAchievements.push("perfect_quiz");
      }
      if (timeTaken < 120 && !newAchievements.includes("speedster")) {
        newAchievements.push("speedster");
      }
      if (newQuizzesCompleted >= 10 && !newAchievements.includes("scholar")) {
        newAchievements.push("scholar");
      }

      await UserService.update(user.id, {
        total_points: newTotalPoints,
        correct_answers: newCorrectAnswers,
        total_answers: newTotalAnswers,
        quizzes_completed: newQuizzesCompleted,
        best_streak: newBestStreak,
        achievements: newAchievements
      });

      await refreshUser();
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }

    setStage("results");
  };

  const resetQuiz = () => {
    setStage("setup");
    setQuizConfig(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setShowExplanation(false);
  };

  if (stage === "setup") {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(createPageUrl("Home"))}
            className="mb-6 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <QuizSetup onStart={handleStartQuiz} loading={loading} />
        </div>
      </div>
    );
  }

  if (stage === "results") {
    return (
      <QuizResults
        answers={answers}
        score={score}
        questions={questions}
        onPlayAgain={resetQuiz}
        onBackHome={() => navigate(createPageUrl("Home"))}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={resetQuiz}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-lg">Score: {score}</span>
                  {streak > 0 && (
                    <span className="text-orange-600 font-semibold">🔥 {streak}</span>
                  )}
                </div>
              </div>
            </div>
            <div className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
              {timeLeft}s
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <QuestionCard
              key={currentQuestionIndex}
              question={currentQuestion}
              onAnswer={handleAnswer}
              showExplanation={showExplanation}
              selectedAnswer={answers[currentQuestionIndex]?.selectedAnswer}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


