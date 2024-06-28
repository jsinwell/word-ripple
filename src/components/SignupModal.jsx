import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { createUserWithEmailAndPassword, signInWithPopup, setPersistence, browserSessionPersistence, browserLocalPersistence } from "firebase/auth";
import { auth, provider } from '../firebase/firebase-config';
import 'react-responsive-modal/styles.css';
import "../styles/AuthModal.css";

const SignUpModal = ({ open, onClose, onLoginClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Relevant error messages for authentication
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // Blank modal state
    const resetModalState = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
    };

    // Reset modal upon close
    const handleClose = () => {
        resetModalState();
        onClose();
    };

    // Reset signup modal upon switching to login modal
    const handleLoginClick = () => {
        resetModalState();
        onLoginClick();
    };

    // Default to session persistence when signing up for the first time
    const handleSignUp = (e) => {
        e.preventDefault();

        // Reset error messages
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        if (password !== confirmPassword) {
            setConfirmPasswordError("Passwords don't match.");
            return;
        }

        setPersistence(auth, browserSessionPersistence)
            .then(() => {
                return createUserWithEmailAndPassword(auth, email, password);
            })
            .then(() => {
                onClose();
            })
            // Displaying error messages (email in use, weak password, generic)
            .catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                    setEmailError('Email is already in use.');
                } 
                else if(error.code == 'auth/weak-password') {
                    setPasswordError('Password should be at least 6 characters.')
                }
                else {
                    console.error("Error signing up with email/password", error);
                }
            });
    };

    const handleGoogleSignUp = () => {
        setPersistence(auth, browserSessionPersistence)
            .then(() => {
                return signInWithPopup(auth, provider);
            })
            .then(() => {
                onClose();
            })
            .catch((error) => {
                console.error("Error signing up with Google", error);
            });
    };

    return (
        <Modal open={open} onClose={handleClose} center classNames={{ modal: 'auth-modal' }}>
            <h2>Signup</h2>
            <form onSubmit={handleSignUp} className="auth-form">
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
                            placeholder="Create password"
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
                <div className="input-group">
                    <div className="password-input-wrapper">
                        <input
                            className="auth-input"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>
                <div className="error-messages">
                    {emailError && <p className="error-message">{emailError}</p>}
                    {passwordError && <p className="error-message">{passwordError}</p>}
                    {confirmPasswordError && <p className="error-message">{confirmPasswordError}</p>}
                </div>
                <button type="submit" className="auth-button">Create Account</button>
            </form>
            <div className="auth-divider"><span>Or</span></div>
            <button onClick={handleGoogleSignUp} className="social-button">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
                Signup with Google
            </button>
            <div className="auth-switch">
                Already have an account? <button onClick={handleLoginClick}>Login</button>
            </div>
        </Modal>
    );
};

export default SignUpModal;