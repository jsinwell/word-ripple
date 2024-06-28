import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { signInWithEmailAndPassword, signInWithPopup, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
import { auth, provider } from '../firebase/firebase-config';
import 'react-responsive-modal/styles.css';
import "../styles/AuthModal.css";

const LoginModal = ({ open, onClose, onSignUpClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false); // For session/local persistence
    const [loginError, setLoginError] = useState(''); // If email/password is wrong

    // Reset modal to clean state
    const resetModalState = () => {
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setRememberMe(false);
        setLoginError('');
    };

    // Reset the modal upon closing
    const handleClose = () => {
        resetModalState();
        onClose();
    };

    // Reset modal when switching to signup
    const handleSignupClick = () => {
        resetModalState();
        onSignUpClick();
    };

    // If remember me isn't checked, default to session persistence
    const handleEmailLogin = (e) => {
        e.preventDefault();
        setLoginError(''); // Clear any previous error

        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;

        setPersistence(auth, persistenceType)
            .then(() => {
                return signInWithEmailAndPassword(auth, email, password);
            })
            .then(() => {
                onClose();
            })
            .catch((error) => {
                if (error.code === 'auth/invalid-credential') {
                    setLoginError('Invalid email or password.');
                } else {
                    setLoginError('An error occurred. Please try again.');
                    console.error("Error signing in with email/password", error);
                }
            });
    };

    const handleGoogleLogin = () => {
        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        setPersistence(auth, persistenceType)
            .then(() => {
                return signInWithPopup(auth, provider);
            })
            .then(() => {
                onClose();
            })
            .catch((error) => {
                console.error("Error signing in with Google", error);
            });
    };

    return (
        <Modal open={open} onClose={handleClose} center classNames={{ modal: 'auth-modal' }}>
            <h2>Login</h2>
            <form onSubmit={handleEmailLogin} className="auth-form">
                <div className="input-group">
                    <input
                        className="auth-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                </div>
                <div className="input-group">
                    <div className="password-input-wrapper">
                        <input
                            className="auth-input"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>
                <div className="remember-me">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="rememberMe">Remember me</label>
                </div>
                <div className="forgot-password">Forgot password?</div>
                
                <div className="error-messages">
                    {loginError && <p className="error-message">{loginError}</p>}
                </div>

                <button type="submit" className="auth-button">Login</button>
            </form>
            <div className="auth-divider"><span>Or</span></div>
            <button onClick={handleGoogleLogin} className="social-button">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
                Login with Google
            </button>
            <div className="auth-switch">
                Don't have an account? <button onClick={handleSignupClick}>Signup</button>
            </div>
        </Modal>
    );
};

export default LoginModal;