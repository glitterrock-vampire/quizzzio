import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import Layout from './Layout.jsx'
import HomePage from './pages/Home.jsx'
import QuizPage from './pages/Quiz.jsx'
import UploadPage from './pages/Upload.jsx'
import LeaderboardPage from './pages/Leaderboard.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/quiz" element={<Layout><QuizPage /></Layout>} />
          <Route path="/upload" element={<Layout><UploadPage /></Layout>} />
          <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}


