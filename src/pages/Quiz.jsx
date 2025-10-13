import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { QuizQuestionService } from '../services/quizQuestionService';
import { QuizSessionService } from '../services/quizSessionService';
import { AIService } from '../services/aiService';
import QuizSetup from '../components/quiz/QuizSetup';
import QuestionCard from '../components/quiz/QuestionCard';
import QuizResults from '../components/quiz/QuizResults';

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [stage, setStage] = useState("setup");
  const [quizConfig, setQuizConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const subject = searchParams.get("subject");
    if (subject) {
      // Pre-populate quiz config but still show setup screen for user to choose AI/DB questions
      setQuizConfig({
        subject,
        questionCount: 10,
        difficulty: "mixed",
        mode: "existing" // Default to existing, but user can change in setup
      });
      setStage("setup");
    }
  }, [searchParams]);
  const [startTime, setStartTime] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    const subject = searchParams.get("subject");
    if (subject) {
      // Pre-populate quiz config but still show setup screen for user to choose AI/DB questions
      setQuizConfig({
        subject,
        questionCount: 10,
        difficulty: "mixed",
        mode: "existing" // Default to existing, but user can change in setup
      });
      setStage("setup");
    }
  }, [searchParams]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null; // Component will redirect in useEffect
  }

  }, [stage, currentQuestionIndex, questions]);



  useEffect(() => {
    if (stage !== "playing" || showExplanation || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, currentQuestionIndex, showExplanation, timeLeft]);

  const getTimerDuration = (difficulty) => {
    if (difficulty === 'easy') return 30;
    if (difficulty === 'medium') return 45;
    if (difficulty === 'hard' || difficulty === 'difficult') return 60;
    return 30; // default
  };

  const handleStartQuiz = async (config) => {
    setLoading(true);
    setError(null);
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
        setError("No questions available for the selected subject. Please try a different subject or generate AI questions.");
        setLoading(false);
        return;
      }

      setQuestions(quizQuestions);
      setStage("playing");
      setStartTime(Date.now());
      const firstQ = quizQuestions[0];
      setTimeLeft(getTimerDuration(firstQ.difficulty));
    } catch (error) {
      console.error("Error starting quiz:", error);
      setError("Failed to load questions. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    if (showExplanation) return; // Prevent multiple answers
    
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;

    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setAnswers([...answers, { question: currentQuestion, answer, isCorrect }]);
    
    // Auto-advance after showing explanation for 3 seconds
    setTimeout(() => {
      setShowExplanation(false);
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex >= questions.length) {
        handleQuizComplete();
      } else {
        setCurrentQuestionIndex(nextIndex);
      }
    }, 3000);
  };

  const handleTimeUp = () => {
    handleAnswer(null);
  };

  const handleQuizComplete = async () => {
    setStage("results");
    setLoading(true);

    try {
      // Save quiz session and update user stats
      if (user) {
        const sessionData = {
          user_id: user.id,
          subject: quizConfig.subject,
          difficulty: quizConfig.difficulty,
          total_questions: questions.length,
          correct_answers: score,
          score: score * 10, // 10 points per correct answer
          time_taken: Math.round((Date.now() - startTime) / 1000),
          answers: answers
        };

        await QuizSessionService.create(sessionData);
        await refreshUser();
      }
    } catch (error) {
      console.error("Error saving quiz session:", error);
    }

    setLoading(false);
  };

  const resetQuiz = () => {
    setStage("setup");
    setQuizConfig(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    setError(null);
    setLoading(false);
    setShowExplanation(false);
    setSelectedAnswer(null);
  };

  if (stage === "setup") {
    return (
      <QuizSetup
        onStart={handleStartQuiz}
        loading={loading}
        error={error}
        initialConfig={quizConfig}
      />
    );
  }

  if (stage === "playing") {
    return (
      <QuestionCard
        question={questions[currentQuestionIndex]}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        onTimeUp={handleTimeUp}
        streak={streak}
        showExplanation={showExplanation}
        selectedAnswer={selectedAnswer}
        timeLeft={timeLeft}
      />
    );
  }

  if (stage === "results") {
    return (
      <QuizResults
        answers={answers}
        score={score}
        totalQuestions={questions.length}
        onPlayAgain={resetQuiz}
        onBackHome={() => navigate('/')}
        loading={loading}
      />
    );
  }

  return null;
}
