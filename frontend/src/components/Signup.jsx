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
                    {isLoading ? 'Creating account...' : 'Sign Up'}
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
