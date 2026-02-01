import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);
        if (!result.success) {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="auth-card glass">
            <h2>Welcome Back</h2>
            <p className="subtitle">Sign in to continue your video calls</p>

            <form onSubmit={handleSubmit}>
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
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="auth-footer">
                <span>Don't have an account?</span>
                <button onClick={onSwitch} className="link-btn">Sign Up</button>
            </div>
        </div>
    );
};

export default Login;
