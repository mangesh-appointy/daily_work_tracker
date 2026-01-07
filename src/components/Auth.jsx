
import { useState } from 'react';
import { dataService } from '../services/dataService';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Sign Up
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            let result;
            if (isSignUp) {
                result = await dataService.signUpWithPassword(email, password);
            } else {
                result = await dataService.signInWithPassword(email, password);
            }

            if (result.error) {
                setError(result.error.message);
            } else {
                if (isSignUp) {
                    if (result.data?.user && !result.data.session) {
                        setMessage('Sign up successful! Please check your email to confirm your account.');
                    }
                    // Else: Session active, redirect happens in App.jsx
                }
                // Else: Signed in, redirect happens in App.jsx
            }
        } catch (err) {
            console.error(err);
            // Show the actual error message for debugging
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="center-screen">
            <div className="glass-panel auth-card">
                <h1 className="title">Daily Work Tracker</h1>
                <p className="subtitle">
                    {isSignUp ? 'Create a new account' : 'Sign in to your account'}
                </p>

                <form onSubmit={handleSubmit} className="create-user-form">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-input"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input"
                        minLength={6}
                    />

                    {error && <div className="auth-message" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>{error}</div>}
                    {message && <div className="auth-message">{message}</div>}

                    <div className="form-actions" style={{ flexDirection: 'column', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>

                        <button
                            type="button"
                            className="btn-text"
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                            style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}
                        >
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
