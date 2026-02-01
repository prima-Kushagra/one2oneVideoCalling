import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Signup = ({ onSwitch }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        const result = await signup(username, email, password);
        if (!result.success) {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="auth-card glass">
            <h2>Create Account</h2>
            <p className="subtitle">Join V2V and start connecting</p>

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="auth-btn" disabled={isLoading}>
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
                                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4522" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            </svg>
                            Creating account...
                        </span>
                    ) : 'Sign Up'}
                </button>
            </form>

            <div className="auth-footer">
                <span>Already have an account?</span>
                <button onClick={onSwitch} className="link-btn">Sign In</button>
            </div>
        </div>
    );
};

export default Signup;
