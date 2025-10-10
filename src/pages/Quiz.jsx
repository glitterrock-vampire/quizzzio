import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { QuizQuestionService } from '../services/quizQuestionService';
import { AIService } from '../services/aiService';
import QuizSetup from '../components/quiz/QuizSetup';
import QuestionCard from '../components/quiz/QuestionCard';
import QuizResults from '../components/quiz/QuizResults';

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
  const [error, setError] = useState(null);

  useEffect(() => {
    const subject = searchParams.get("subject");
    if (subject) {
      const config = { subject, questionCount: 10, difficulty: "mixed", mode: "existing" };
      setQuizConfig(config);
      handleStartQuiz(config);
    }
  }, [searchParams]);

  useEffect(() => {
    if (stage === "playing" && currentQuestionIndex < questions.length) {
      setTimeLeft(30);
    }
  }, [stage, currentQuestionIndex, questions]);

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
      setTimeLeft(30);
    } catch (error) {
      console.error("Error starting quiz:", error);
      setError("Failed to load questions. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;

    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setAnswers([...answers, { question: currentQuestion, answer, isCorrect }]);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const handleTimeUp = () => {
    handleAnswer(null);
  };

  const handleQuizComplete = async () => {
    setStage("results");
    setLoading(true);

    try {
      // Update user stats
      if (user) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Error updating user stats:", error);
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
  };

  if (stage === "setup") {
    return (
      <QuizSetup
        onStart={handleStartQuiz}
        loading={loading}
        error={error}
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
      />
    );
  }

  if (stage === "results") {
    return (
      <QuizResults
        answers={answers}
        score={score}
        totalQuestions={questions.length}
        onRetake={resetQuiz}
        loading={loading}
      />
    );
  }

  return null;
}
