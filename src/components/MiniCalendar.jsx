import React from 'react';

export default function MiniCalendar({ currentDate, onDateSelect, onClose }) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayIndex = firstDay.getDay(); // 0 = Sun

    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < startDayIndex; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const handlePrevMonth = () => {
        onDateSelect(new Date(year, month - 1, 1), false); // false = don't close, just nav
    };

    const handleNextMonth = () => {
        onDateSelect(new Date(year, month + 1, 1), false);
    };

    return (
        <div className="material-calendar">
            <div className="mc-header">
                <button onClick={handlePrevMonth} className="mc-nav-btn" title="Previous Month">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <div className="mc-title">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} className="mc-nav-btn" title="Next Month">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </button>
            </div>

            <div className="mc-body">
                <div className="mc-weekdays">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={i} className="mc-weekday">{d}</span>
                    ))}
                </div>
                <div className="mc-days-grid">
                    {days.map((date, idx) => {
                        if (!date) return <div key={idx} />;
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === currentDate.toDateString();

                        return (
                            <button
                                key={idx}
                                className={`mc-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => onDateSelect(date, true)}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mc-footer">
                <button className="mc-close-btn" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}
