import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Lightbulb, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function QuestionCard({ 
  question, 
  onAnswer, 
  showExplanation, 
  selectedAnswer,
  timeLeft = 30,
  onTimeUp,
  questionNumber,
  totalQuestions
}) {
  const [displayTime, setDisplayTime] = useState(timeLeft);
  const isCorrect = selectedAnswer === question.correct_answer;

  useEffect(() => {
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 || showExplanation) return;

    const timer = setInterval(() => {
      setDisplayTime(prev => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showExplanation, onTimeUp]);

  const getTimerColor = () => {
    if (displayTime > 10) return "text-green-600";
    if (displayTime > 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getTimerBgColor = () => {
    if (displayTime > 10) return "bg-green-100";
    if (displayTime > 5) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-2xl bg-white overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
        
        <CardHeader className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {question.question}
            </h2>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="secondary" className="capitalize">
                {question.difficulty || 'medium'}
              </Badge>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${getTimerBgColor()}`}>
                <Clock className={`w-4 h-4 ${getTimerColor()}`} />
                <span className={`font-bold ${getTimerColor()}`}>
                  {displayTime}s
                </span>
              </div>
            </div>
          </div>
          
          {questionNumber && totalQuestions && (
            <div className="text-sm text-gray-600">
              Question {questionNumber} of {totalQuestions}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 space-y-4">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === question.correct_answer;
            
            let buttonClasses = "w-full p-6 rounded-xl border-2 text-left transition-all duration-300 font-medium ";
            
            if (showExplanation) {
              if (isCorrectAnswer) {
                buttonClasses += "border-green-500 bg-green-50 text-green-900";
              } else if (isSelected && !isCorrect) {
                buttonClasses += "border-red-500 bg-red-50 text-red-900";
              } else {
                buttonClasses += "border-gray-200 bg-gray-50 text-gray-400";
              }
            } else {
              buttonClasses += "border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-lg active:scale-95";
            }

            return (
              <motion.button
                key={index}
                onClick={() => !showExplanation && onAnswer(option)}
                disabled={showExplanation}
                className={buttonClasses}
                whileHover={!showExplanation ? { scale: 1.02 } : {}}
                whileTap={!showExplanation ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-lg">{option}</span>
                  {showExplanation && isCorrectAnswer && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  )}
                  {showExplanation && isSelected && !isCorrect && (
                    <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                  )}
                </div>
              </motion.button>
            );
          })}

          {showExplanation && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Explanation</h3>
                  <p className="text-blue-800">{question.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
