'use client';

import { useState, useEffect, useCallback } from 'react';

export function DateRangeCalendar({ onRangeSelect }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rangeStart, setRangeStart] = useState(null);
    const [rangeEnd, setRangeEnd] = useState(null);
    const [dailySales, setDailySales] = useState({});

    useEffect(() => {
        let ignore = false;
        async function fetchDailySales() {
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                const res = await fetch(`/api/stats/daily-sales?year=${year}&month=${month}`);
                const data = await res.json();
                if (!ignore && data.data) {
                    // Transform array to object for easier heatmap lookup
                    const salesMap = {};
                    data.data.forEach(item => {
                        salesMap[item.date] = item.orders;
                    });
                    setDailySales(salesMap);
                }
            } catch (err) {
                console.error('Failed to fetch daily sales', err);
            }
        }
        fetchDailySales();
        return () => { ignore = true; };
    }, [currentDate]);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDate = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateClick = (day) => {
        const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

        if (!rangeStart || (rangeStart && rangeEnd)) {
            // New selection cycle
            setRangeStart(selected);
            setRangeEnd(null);
        } else {
            // Second click
            let start = rangeStart;
            let end = selected;
            if (end < start) {
                [start, end] = [end, start];
            }
            setRangeStart(start);
            setRangeEnd(end);
        }
    };

    const handleApply = () => {
        if (rangeStart) {
            onRangeSelect({
                startDate: formatDate(rangeStart),
                endDate: formatDate(rangeEnd || rangeStart),
                type: 'custom'
            });
        }
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setRangeStart(today);
        setRangeEnd(today);
    };
    
    const clearSelection = () => {
        setRangeStart(null);
        setRangeEnd(null);
    };

    const monthYear = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isDateInRange = (date) => {
        if (!rangeStart || !rangeEnd) return false;
        return date >= rangeStart && date <= rangeEnd;
    };

    const isSelectedDate = (day) => {
        if (!day) return false;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const startStr = rangeStart ? formatDate(rangeStart) : '';
        const endStr = rangeEnd ? formatDate(rangeEnd) : '';
        const dateStr = formatDate(date);
        return dateStr === startStr || dateStr === endStr;
    };

    const getHeatMapColor = (day) => {
        if (!day) return 'transparent';
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const count = dailySales[dateStr] || 0;

        if (count === 0) return '#000000'; // Black for no orders
        
        // 4 shades of green based on order count
        if (count <= 3) return '#064e3b'; // Very dark green
        if (count <= 8) return '#065f46'; // Dark green
        if (count <= 15) return '#10b981'; // Green
        return '#34d399'; // Bright green
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>📅 Date Range Selector</h3>
                <button onClick={goToToday} style={styles.todayBtn}>Today</button>
            </div>

            <div style={styles.calendarWrapper}>
                <div style={styles.monthHeader}>
                    <button onClick={previousMonth} style={styles.navBtn}>← Prev</button>
                    <span style={styles.monthYear}>{monthYear}</span>
                    <button onClick={nextMonth} style={styles.navBtn}>Next →</button>
                </div>

                <div style={styles.weekDays}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} style={styles.weekDay}>{day}</div>
                    ))}
                </div>

                <div style={styles.daysGrid}>
                    {days.map((day, idx) => {
                        const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                        const inRange = date && isDateInRange(date);
                        const isSelected = isSelectedDate(day);

                        return (
                            <div
                                key={idx}
                                onClick={() => day && handleDateClick(day)}
                                style={{
                                    ...styles.dayCell,
                                    ...(day ? styles.dayClickable : {}),
                                    backgroundColor: getHeatMapColor(day),
                                    ...(inRange ? styles.dayInRange : {}),
                                    ...(isSelected ? styles.daySelected : {}),
                                }}
                                title={day ? `Orders: ${dailySales[`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`] || 0}` : ''}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={styles.footer}>
                <div style={styles.selectedRange}>
                    {rangeStart ? (
                        <>
                            <strong>Selected:</strong> {formatDate(rangeStart)} {rangeEnd && `→ ${formatDate(rangeEnd)}`}
                        </>
                    ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Click two dates to select a range</span>
                    )}
                </div>
                <div style={styles.footerBtns}>
                    <button onClick={clearSelection} style={styles.clearBtn}>Clear</button>
                    <button 
                        onClick={handleApply} 
                        style={{
                            ...styles.applyBtn,
                            opacity: rangeStart ? 1 : 0.5,
                            cursor: rangeStart ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!rangeStart}
                    >
                        Apply Range
                    </button>
                </div>
            </div>

        </div>
    );
}

const styles = {
    container: {
        background: 'var(--bg-secondary, #1a1a2e)',
        border: '1px solid var(--border-color, rgba(100, 150, 255, 0.15))',
        borderRadius: '12px',
        padding: '0.75rem',
        marginBottom: '1rem',
        maxWidth: '320px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    title: {
        margin: 0,
        fontSize: '0.8rem',
        color: 'var(--text-primary, #fff)',
    },
    todayBtn: {
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        background: 'var(--accent-blue, #6496ff)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    calendarWrapper: {
        background: 'var(--bg-primary, #0f0f1e)',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '0.75rem',
    },
    monthHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
    },
    navBtn: {
        background: 'transparent',
        color: 'var(--accent-blue, #6496ff)',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: '500',
        transition: 'color 0.2s',
    },
    monthYear: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: 'var(--text-primary, #fff)',
    },
    weekDays: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.25rem',
        marginBottom: '0.25rem',
        textAlign: 'center',
    },
    weekDay: {
        fontSize: '0.7rem',
        fontWeight: '600',
        color: 'var(--text-secondary, #aaa)',
        padding: '0.25rem',
    },
    daysGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.25rem',
    },
    dayCell: {
        padding: '0.25rem',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--text-secondary, #aaa)',
        borderRadius: '4px',
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayClickable: {
        cursor: 'pointer',
        color: 'var(--text-primary, #fff)',
        transition: 'all 0.2s',
    },
    daySelected: {
        background: 'transparent',
        boxShadow: 'inset 0 0 0 2px #fff, 0 0 10px rgba(255,255,255,0.5)',
        color: 'white',
        fontWeight: 'bold',
        zIndex: 2,
    },
    dayInRange: {
        background: 'rgba(255, 255, 255, 0.15)',
        boxShadow: '0 0 5px rgba(255,255,255,0.1)',
        color: 'var(--text-primary, #fff)',
    },
    selectedRange: {
        fontSize: '0.75rem',
        color: 'var(--text-primary, #fff)',
        flex: 1,
    },
    footer: {
        marginTop: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '0.75rem',
        background: 'rgba(100, 150, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
    },
    footerBtns: {
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'flex-end',
    },
    clearBtn: {
        padding: '0.4rem 0.8rem',
        fontSize: '0.75rem',
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    applyBtn: {
        padding: '0.4rem 1rem',
        fontSize: '0.75rem',
        background: 'var(--accent-blue, #6496ff)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(100, 150, 255, 0.2)',
    },
};
