import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { QuizQuestionService } from '../services/quizQuestionService';
import { Database, Search, Filter, Eye, Edit, Trash2, Plus, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(10);

  const subjects = [
    'Mathematics', 'Science', 'History', 'Geography', 'Literature', 'General Knowledge', 'Caribbean History', 'French Caribbean'
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    if (hasRole('admin')) {
      loadQuestions();
    }
  }, [hasRole]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const allQuestions = await QuizQuestionService.getAll();
      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || question.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + questionsPerPage);

  const getSubjectStats = () => {
    const stats = {};
    subjects.forEach(subject => {
      const subjectQuestions = questions.filter(q => q.subject === subject);
      stats[subject] = {
        total: subjectQuestions.length,
        easy: subjectQuestions.filter(q => q.difficulty === 'easy').length,
        medium: subjectQuestions.filter(q => q.difficulty === 'medium').length,
        hard: subjectQuestions.filter(q => q.difficulty === 'hard').length
      };
    });
    return stats;
  };

  const subjectStats = getSubjectStats();

  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage questions and view statistics</p>
            </div>
            <button 
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Questions
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Total Questions</h3>
              <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Subjects</h3>
              <p className="text-2xl font-bold text-green-600">{subjects.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Filtered Results</h3>
              <p className="text-2xl font-bold text-purple-600">{filteredQuestions.length}</p>
            </div>
          </div>

          {/* Subject Statistics */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Questions by Subject</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(subject => (
                <div key={subject} className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold capitalize mb-2">{subject.replace('_', ' ')}</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-semibold">{subjectStats[subject]?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">Easy:</span>
                      <span>{subjectStats[subject]?.easy || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-yellow-600">Medium:</span>
                      <span>{subjectStats[subject]?.medium || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">Hard:</span>
                      <span>{subjectStats[subject]?.hard || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Questions Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : paginatedQuestions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No questions found
                      </td>
                    </tr>
                  ) : (
                    paginatedQuestions.map((question, index) => (
                      <tr key={question.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                            {question.question}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {question.subject?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-800">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + questionsPerPage, filteredQuestions.length)} of {filteredQuestions.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
