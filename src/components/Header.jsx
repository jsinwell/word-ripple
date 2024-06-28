import React from 'react';
import "../styles/Header.css";

const Header = ({ user, handleLogout, openLoginModal, openSignUpModal }) => {
    // Get first name of user
    const getFirstName = (fullName) => {
        return fullName ? fullName.split(' ')[0] : '';
    };

    return (
    <header className="app-header">
        <h1 className="title">Word Ripple</h1>
        <div className="auth-container">
        {user ? (
            <>
            <span className="user-greeting">Welcome, {getFirstName(user.displayName || user.email)}</span>
            <button onClick={handleLogout} className="header-auth-button">
                <i className="fas fa-sign-out-alt"></i> Logout
            </button>
            </>
        ) : (
            <>
            <button onClick={openLoginModal} className="header-auth-button">
                <i className="fas fa-sign-in-alt"></i> Login
            </button>
            <button onClick={openSignUpModal} className="header-auth-button">
                <i className="fas fa-user-plus"></i> Sign Up
            </button>
            </>
        )}
        </div>
    </header>
    );
};

export default Header;