# 🚀 Quizzio - AI-Powered Quiz Application

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.2-green.svg)](https://expressjs.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-orange.svg)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC.svg)](https://tailwindcss.com/)

> An intelligent quiz application powered by AI that generates personalized quizzes and tracks user progress with a beautiful, responsive interface.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Quiz Generation** - Create unique quizzes using OpenAI's GPT models
- **Multiple Question Types** - Support for various subjects and difficulty levels
- **Real-time Progress Tracking** - Monitor your learning journey with detailed statistics
- **Responsive Design** - Works seamlessly on desktop and mobile devices

### 🔐 Authentication & Security
- **JWT Authentication** - Secure user sessions with JSON Web Tokens
- **Session Management** - Persistent login across browser sessions
- **Protected Routes** - Secure API endpoints and user data

### 🎨 User Interface
- **Modern Design** - Beautiful gradients and smooth animations
- **Dark/Light Theme** - Eye-friendly interface options
- **Sidebar Navigation** - Intuitive navigation with collapsible menu
- **Mobile-First** - Optimized for all screen sizes

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **React Router** - Client-side routing for SPA navigation
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and development server

### Backend
- **Express.js** - Fast, unopinionated web framework
- **OpenAI API** - AI-powered quiz generation
- **JWT** - Secure authentication tokens
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variable management

### Database & Storage
- **In-Memory Storage** - Fast development (configurable for PostgreSQL/MongoDB)
- **Session Storage** - User session persistence

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/glitterrock-vampire/quizzio.git
   cd quizzio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Add your OpenAI API key to `.env`:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Start the development servers**

   **Terminal 1 - Backend:**
   ```bash
   npm run server
   ```

   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:5173`

## 📖 Usage

### Creating Quizzes

1. **Select Subject** - Choose from mathematics, science, history, and more
2. **Set Difficulty** - Easy, medium, or hard levels
3. **Specify Questions** - Number of questions to generate
4. **AI Generation** - Watch as unique questions are created

### Taking Quizzes

- **Interactive Interface** - Answer questions with immediate feedback
- **Progress Tracking** - See your progress in real-time
- **Scoring System** - Points based on difficulty and accuracy
- **Detailed Results** - Review correct answers and explanations

### User Dashboard

- **Statistics** - Track your quiz performance over time
- **Achievements** - Unlock badges for milestones
- **Leaderboards** - Compare scores with other users
- **Profile Management** - Customize your experience

## 🔧 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/me` | Get current user |

### Quiz Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-questions` | Generate quiz questions |
| GET | `/api/quiz-questions` | Get available questions |
| POST | `/api/quiz-sessions` | Start new quiz session |
| PUT | `/api/quiz-sessions/:id` | Update quiz session |

### Example API Usage

```javascript
// Generate questions
const response = await fetch('/api/ai/generate-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'mathematics',
    questionCount: 5,
    difficulty: 'hard'
  })
});

const data = await response.json();
console.log(data.questions);
```

## 🏗 Project Structure

```
quizzio/
├── public/                 # Static assets
├── server/                 # Backend code
│   ├── middleware/         # Express middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── server.js          # Main server file
├── src/                   # Frontend code
│   ├── components/        # React components
│   │   ├── quiz/         # Quiz-related components
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── utils/            # Utility functions
├── .env.example           # Environment template
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
└── vite.config.js         # Vite configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow ESLint configuration
- **Commits**: Use conventional commit format
- **Testing**: Add tests for new features
- **Documentation**: Update README for API changes

## 🚀 Deployment

### Frontend Deployment

**Vercel (Recommended):**
```bash
npm run build
vercel --prod
```

**Netlify:**
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Backend Deployment

**Railway/Heroku:**
```bash
# Deploy server directory
railway deploy
```

**Environment Variables:**
```env
NODE_ENV=production
PORT=8080
OPENAI_API_KEY=your-production-key
JWT_SECRET=your-production-secret
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the AI-powered quiz generation
- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first styling
- **shadcn/ui** for the beautiful component library

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues** page on GitHub
2. **Create a new issue** with detailed information
3. **Contact the maintainers**

---

**⭐ If you found this project helpful, please give it a star!**

Made with ❤️ by [Glitterrock Vampire](https://github.com/glitterrock-vampire)
