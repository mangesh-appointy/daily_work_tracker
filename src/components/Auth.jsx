
import { useState } from 'react';
import { dataService } from '../services/dataService';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        const { error } = await dataService.signInWithEmail(email);
        setLoading(false);

        if (error) {
            setMessage('Error sending login link: ' + error.message);
        } else {
            setMessage('Check your email for the login link!');
        }
    };

    return (
        <div className="center-screen">
            <div className="glass-panel auth-card">
                <h1 className="title">Daily Work Tracker</h1>
                <p className="subtitle">Sign in to sync your timesheets</p>

                <form onSubmit={handleLogin} className="create-user-form">
                    <input
                        type="email"
                        placeholder="Your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        required
                        className="auth-input"
                    />

                    {message && <div className="auth-message">{message}</div>}

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Sending link...' : 'Send Magic Link'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
