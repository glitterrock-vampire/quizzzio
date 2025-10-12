import React, { useState } from "react";
import { QuizQuestionService } from "../services/quizQuestionService";
import { Upload, FileJson, CheckCircle2, AlertCircle, ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils/routing";
import { motion } from "framer-motion";

export default function UploadPage() {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleJsonUpload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const questions = JSON.parse(jsonInput);
      
      if (!Array.isArray(questions)) {
        throw new Error("JSON must be an array of questions");
      }

      await QuizQuestionService.bulkCreate(questions);
      setSuccess(`Successfully uploaded ${questions.length} questions!`);
      setJsonInput("");
    } catch (err) {
      setError(err.message || "Error uploading questions");
    }
    setLoading(false);
  };


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
          <h1 className="text-3xl font-bold mb-2">Add Questions</h1>
          <p className="text-gray-600">
            Add your own quiz questions via JSON format
          </p>
        </motion.div>

        {success && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white border-none shadow-lg rounded-xl">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-b rounded-t-xl">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <FileJson className="w-5 h-5 text-blue-600" />
                JSON Format
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <pre className="text-xs">{`[
  {
    "subject": "Mathematics",
    "question": "What is 2+2?",
    "options": ["3", "4", "5", "6"],
    "correct_answer": "4",
    "difficulty": "easy",
    "explanation": "Basic addition",
    "points": 10
  }
]`}</pre>
              </div>
              <textarea
                placeholder="Paste your JSON here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full min-h-[300px] p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleJsonUpload}
                disabled={!jsonInput || loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Adding Questions..." : "Add Questions"}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 bg-white border-none shadow-lg rounded-xl">
          <div className="p-6 border-b">
            <h2 className="font-bold text-lg">Field Specifications</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Required Fields</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div>
                      <strong>subject:</strong> Mathematics, Science, History, Geography, Literature, General Knowledge, Caribbean History, French Caribbean
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div>
                      <strong>question:</strong> The question text
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div>
                      <strong>options:</strong> Array of answer choices
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div>
                      <strong>correct_answer:</strong> Must match one of the options
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Optional Fields</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div>
                      <strong>difficulty:</strong> easy, medium, or hard (default: medium)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div>
                      <strong>explanation:</strong> Explanation for the correct answer
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div>
                      <strong>points:</strong> Points awarded (default: 10)
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


