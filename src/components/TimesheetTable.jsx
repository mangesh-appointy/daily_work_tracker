import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import './TimesheetTable.css';

export default function TimesheetTable({ userId, currentDate, viewMode, onDateClick }) {
    const [entries, setEntries] = useState({});
    const [days, setDays] = useState([]);

    // Calculate days based on Grid View (Month/Week/Day)
    useEffect(() => {
        // Clone date to avoid mutation side effects
        const date = new Date(currentDate);
        const year = date.getFullYear();
        const month = date.getMonth();
        const dayDate = date.getDate();

        let daysArray = [];

        if (viewMode === 'day') {
            daysArray.push(new Date(year, month, dayDate));
        }
        else if (viewMode === 'week') {
            // Logic: Start from Sunday (or Monday? let's do Monday for work tracker)
            const day = date.getDay(); // 0 (Sun) - 6 (Sat)
            // Adjust for Monday start: Mon(1)...Sun(0 -> 7)
            const dist = day === 0 ? 6 : day - 1;
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - dist);

            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                daysArray.push(d);
            }
        }
        else {
            // Month View
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                daysArray.push(new Date(year, month, i));
            }
        }

        // Format for render
        const formattedDays = daysArray.map(d => ({
            dateObject: d,
            dateString: d.toLocaleDateString('en-GB'), // DD/MM/YYYY key
            dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
            isWeekend: d.getDay() === 0 || d.getDay() === 6
        }));

        setDays(formattedDays);

        // Load saved entries via Service
        const loadEntries = async () => {
            const userEntries = await dataService.getEntries(userId);

            // ... (Migration logic same as before, preserving it)
            // Note: Ideally migration moves to backend or service, keeping it here for now to ensure data integrity during transition
            let hasChanges = false;
            Object.keys(userEntries).forEach(dateStr => {
                const entry = userEntries[dateStr];
                if (!entry.tasks && (entry.task || entry.hours)) {
                    userEntries[dateStr] = {
                        isLeave: entry.isLeave || false,
                        tasks: [{
                            id: dataService.generateId(), // Use service generator
                            description: entry.task || '',
                            hours: entry.hours || ''
                        }]
                    };
                    hasChanges = true;
                } else if (!entry.tasks) {
                    userEntries[dateStr] = { ...entry, tasks: [] };
                }
            });

            if (hasChanges) {
                // For migration, we might just save day by day?
                // Or since it's a one-time thing on load, maybe just loop.
                for (const [dKey, dData] of Object.entries(userEntries)) {
                    await dataService.saveEntry(userId, dKey, dData);
                }
            }

            setEntries(userEntries);
        };

        loadEntries();

    }, [userId, currentDate, viewMode]);

    const saveEntryToStorage = async (dateStr, dayData) => {
        // Optimistic update for UI speed
        setEntries(prev => ({
            ...prev,
            [dateStr]: dayData
        }));
        await dataService.saveEntry(userId, dateStr, dayData);
    };

    const updateTask = (dateStr, taskId, field, value) => {
        // Create a deep copy of the specific day's data
        const currentEntry = entries[dateStr] || { isLeave: false, tasks: [] };
        const updatedEntry = {
            ...currentEntry,
            tasks: currentEntry.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
        };

        // If task doesn't exist (safety), append it
        if (!updatedEntry.tasks.find(t => t.id === taskId)) {
            updatedEntry.tasks.push({ id: taskId, [field]: value });
        }

        saveEntryToStorage(dateStr, updatedEntry);
    };

    const addTask = (dateStr) => {
        const currentEntry = entries[dateStr] || { isLeave: false, tasks: [] };
        const updatedEntry = {
            ...currentEntry,
            tasks: [
                ...currentEntry.tasks,
                {
                    id: dataService.generateId(),
                    description: '',
                    hours: ''
                }
            ]
        };

        saveEntryToStorage(dateStr, updatedEntry);
    };

    const removeTask = (dateStr, taskId) => {
        const currentEntry = entries[dateStr];
        if (!currentEntry) return;

        const updatedEntry = {
            ...currentEntry,
            tasks: currentEntry.tasks.filter(t => t.id !== taskId)
        };
        saveEntryToStorage(dateStr, updatedEntry);
    };

    const toggleLeave = (dateStr) => {
        const currentEntry = entries[dateStr] || { isLeave: false, tasks: [] };
        const updatedEntry = {
            ...currentEntry,
            isLeave: !currentEntry.isLeave
        };
        saveEntryToStorage(dateStr, updatedEntry);
    };

    // Calculate stats based on visible days
    const visibleTotalHours = days.reduce((sum, day) => {
        const entry = entries[day.dateString];
        if (!entry || !entry.tasks) return sum;
        return sum + entry.tasks.reduce((tSum, t) => tSum + (Number(t.hours) || 0), 0);
    }, 0);

    let hoursLabel = "Total Hours logged this month";
    if (viewMode === 'week') {
        hoursLabel = "Total Hours logged this week";
    } else if (viewMode === 'day') {
        const todayStr = new Date().toLocaleDateString('en-GB');
        if (days.length > 0 && days[0].dateString === todayStr) {
            hoursLabel = "Total Hours logged today";
        } else {
            hoursLabel = `Total Hours logged on ${days[0]?.dateString || ''}`;
        }
    }

    return (
        <div className="timesheet-container glass-panel">
            <div className="stats-bar">
                <span>{hoursLabel}: <strong>{visibleTotalHours} hrs</strong></span>
            </div>

            <div className="table-responsive">
                <table className="tracker-table">
                    <thead>
                        <tr>
                            <th width="120">Date</th>
                            <th width="100">Day</th>
                            <th>Task / Jira Link</th>
                            <th width="80">Hrs</th>
                            <th width="50"></th> {/* Actions */}
                            <th width="120">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {days.map(day => {
                            const dateKey = day.dateString;
                            const entry = entries[dateKey] || { isLeave: false, tasks: [] };
                            const tasks = entry.tasks.length > 0 ? entry.tasks : [{ id: 'empty', description: '', hours: '' }];
                            const isLeave = entry.isLeave;
                            const isWeekend = day.isWeekend;

                            // If it's a weekend or leave, we might visually treat the whole block
                            const rowDescriptionClass = isLeave ? 'row-leave' : (isWeekend ? 'row-weekend' : '');

                            return tasks.map((task, index) => {
                                const isFirstRow = index === 0;

                                return (
                                    <tr key={`${dateKey}-${task.id || index}`} className={rowDescriptionClass} data-last-task={index === tasks.length - 1}>
                                        {/* Date and Day columns span all tasks for the day */}
                                        {isFirstRow && (
                                            <>
                                                <td
                                                    className="cell-date group-cell clickable-date"
                                                    rowSpan={tasks.length}
                                                    onClick={(e) => {
                                                        // Only trigger if not clicking the button (button stops propagation, but just to be safe)
                                                        if (onDateClick) onDateClick(day.dateObject);
                                                    }}
                                                    title="Go to Day View"
                                                >
                                                    <div className="date-content">
                                                        <span>{day.dateString}</span>
                                                        {!isWeekend && !isLeave && (
                                                            <button
                                                                className="btn-add-task"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    addTask(dateKey);
                                                                }}
                                                                title="Add another task for this day"
                                                            >
                                                                +
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td
                                                    className="cell-day group-cell clickable-date"
                                                    rowSpan={tasks.length}
                                                    onClick={() => onDateClick && onDateClick(day.dateObject)}
                                                    title="Go to Day View"
                                                >
                                                    {day.dayName}
                                                </td>
                                            </>
                                        )}

                                        {/* Task Inputs */}
                                        <td>
                                            <input
                                                type="text"
                                                className="task-input"
                                                placeholder={isWeekend ? "Weekend" : "Enter task..."}
                                                value={task.description || ''}
                                                onChange={(e) => {
                                                    if (task.id === 'empty') {
                                                        // If typing in the empty placeholder, treat it as adding a new task essentially
                                                        addTask(dateKey);
                                                        // NOTE: This UX is a bit tricky because the state update happens async
                                                        // and the focus might be lost.
                                                        // A better way for 'empty' is to just treat it as a real task with ID 'empty'
                                                        // but we need to generate an ID once they start typing.
                                                        // For now, let's just make the "empty" task have a real ID but flagged as "virtual"
                                                        // or just rely on the + button mostly?
                                                        // Actually, let's keep it simple:
                                                        // If the array is empty, we render one row with an "empty" dummy task.
                                                        // If user types, we trigger 'addTask' which pushes a REAL task.
                                                        // But we need to capture what they just typed.
                                                    } else {
                                                        updateTask(dateKey, task.id, 'description', e.target.value);
                                                    }
                                                }}
                                                disabled={isLeave}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="hours-input"
                                                placeholder="0"
                                                min="0"
                                                value={task.hours || ''}
                                                onChange={(e) => task.id !== 'empty' && updateTask(dateKey, task.id, 'hours', e.target.value)}
                                                disabled={isLeave}
                                            />
                                        </td>

                                        {/* Remove Action */}
                                        <td className="cell-actions">
                                            {task.id !== 'empty' && !isWeekend && !isLeave && tasks.length > 1 && (
                                                <button
                                                    className="btn-remove-task"
                                                    onClick={() => removeTask(dateKey, task.id)}
                                                    title="Remove task"
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </td>

                                        {/* Status Column (First row only) */}
                                        {isFirstRow && (
                                            <td className="group-cell" rowSpan={tasks.length}>
                                                {!isWeekend && (
                                                    <button
                                                        className={`btn-leave ${isLeave ? 'active' : ''}`}
                                                        onClick={() => toggleLeave(dateKey)}
                                                    >
                                                        {isLeave ? 'On Leave' : 'Mark Leave'}
                                                    </button>
                                                )}
                                                {isWeekend && <span className="weekend-badge">Weekend</span>}
                                            </td>
                                        )}
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
