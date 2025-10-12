import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Clock, Home, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function QuizResults({ answers, score, questions, onPlayAgain, onBackHome }) {
  React.useEffect(() => {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const accuracy = (correctCount / answers.length) * 100;
    
    if (accuracy >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, []);

  const correctCount = answers.filter(a => a.isCorrect).length;
  const accuracy = Math.round((correctCount / answers.length) * 100);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-none shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <CardContent className="relative p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
              >
                <Trophy className="w-12 h-12" />
              </motion.div>
              <h1 className="text-4xl font-bold mb-4">Quiz Complete!</h1>
              <p className="text-xl mb-8 text-white/90">Great job on finishing the quiz</p>
              
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="bg-white/20 backdrop-blur rounded-2xl p-6">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{score}</p>
                  <p className="text-sm text_white/80">Points Earned</p>
                </div>
                <div className="bg_white/20 backdrop-blur rounded-2xl p-6">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{accuracy}%</p>
                  <p className="text-sm text_white/80">Accuracy</p>
                </div>
                <div className="bg_white/20 backdrop-blur rounded-2xl p-6">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-3xl font-bold">{correctCount}/{answers.length}</p>
                  <p className="text-sm text_white/80">Correct</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center mt-8">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={onPlayAgain}
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onBackHome}
                  className="border-white text-white hover:bg-white/10"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Answer Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {answers.map((answer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border-2 ${
                  answer.isCorrect
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    {answer.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Question {index + 1}</p>
                    <p className="text-gray-700 mb-3">{answer.question.question}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                          Your answer
                        </Badge>
                        <span className="text-sm">{answer.selectedAnswer || "No answer"}</span>
                      </div>
                      {!answer.isCorrect && (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600">
                            Correct answer
                          </Badge>
                          <span className="text-sm">{answer.question.correct_answer}</span>
                        </div>
                      )}
                    </div>
                    {answer.isCorrect && (
                      <Badge variant="secondary" className="mt-2">
                        +{answer.question.points} points
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


