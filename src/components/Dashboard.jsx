import { useState } from 'react';
import TimesheetTable from './TimesheetTable';
import MiniCalendar from './MiniCalendar';

export default function Dashboard({ user, onLogout, theme, onToggleTheme }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  const [showCalendar, setShowCalendar] = useState(false);

  // Helper to normalize date to midnight to avoid time mismatches
  const getNormalizedDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const handleNavigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date, close = true) => {
    setCurrentDate(date);
    if (close) setShowCalendar(false);
  };

  const handleSetToday = () => {
    setCurrentDate(getNormalizedDate(new Date()));
    setViewMode('day');
  };

  const handleDateClick = (date) => {
    setCurrentDate(getNormalizedDate(date));
    setViewMode('day');
  };

  const formattedDate = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header glass-panel sticky-header">
        <div className="header-content">
          <div className="header-left">
            <h2 className="welcome-text">Welcome, {user.name}</h2>
          </div>

          <div className="header-center">
            <div className="nav-group">
              <button onClick={() => handleNavigate(-1)} className="btn-icon" title="Previous">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className="date-display-wrapper">
                <span onClick={() => setShowCalendar(!showCalendar)} className="date-trigger">
                  {formattedDate}
                </span>
                {showCalendar && (
                  <MiniCalendar
                    currentDate={currentDate}
                    onDateSelect={handleDateSelect}
                    onClose={() => setShowCalendar(false)}
                  />
                )}
              </div>

              <button onClick={() => handleNavigate(1)} className="btn-icon" title="Next">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

            </div>
          </div>

          <div className="header-right">
            <div className="view-toggle-group">
              <button
                className={`view-btn ${viewMode === 'day' && currentDate.getTime() === getNormalizedDate(new Date()).getTime() ? 'active' : ''}`}
                onClick={handleSetToday}
              >
                Today
              </button>
              {['day', 'week', 'month'].map(mode => {
                const isToday = currentDate.getTime() === getNormalizedDate(new Date()).getTime();
                let isActive = viewMode === mode;

                // Special case: If it's effectively "Today" mode, don't highlight generic "Day" button
                if (mode === 'day' && isToday && viewMode === 'day') {
                  isActive = false;
                }

                return (
                  <button
                    key={mode}
                    className={`view-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                );
              })}
            </div>

            <div className="action-group">
              <button className="theme-toggle btn-icon" onClick={onToggleTheme} title="Toggle Theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button onClick={onLogout} className="btn-logout">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <TimesheetTable
          userId={user.id}
          currentDate={currentDate}
          viewMode={viewMode}
          onDateClick={handleDateClick}
        />
      </main>
    </div>
  );
}
