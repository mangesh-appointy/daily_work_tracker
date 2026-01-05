import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { dataService } from './services/dataService';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState('light');

  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setConfigError(true);
      return;
    }

    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Load theme
    const savedTheme = dataService.getTheme();
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await dataService.signOut();
    // onAuthStateChange will trigger setSession(null) automatically
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    dataService.saveTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (configError) {
    return (
      <div className="center-screen">
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <h2>Configuration Error</h2>
          <p>Supabase connection could not be established.</p>
          <p>Please check your <code>.env</code> file and restart the server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {!session ? (
        <Auth />
      ) : (
        <Dashboard
          user={{
            id: session.user.id,
            name: session.user.email.split('@')[0], // Fallback name
            email: session.user.email
          }}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;
