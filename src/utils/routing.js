export function createPageUrl(pageName) {
    const routes = {
      'Home': '/',
      'Quiz': '/quiz',
      'Upload': '/upload',
      'Leaderboard': '/leaderboard'
    };
    return routes[pageName] || '/';
  }