import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightToBracket, faUserPlus, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import "../styles/Header.css";

const Header = ({ user, handleLogout, openLoginModal, openSignUpModal, openHelpModal, gameMode, toggleGameMode }) => {
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
                            <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={openLoginModal} className="header-auth-button">
                            <FontAwesomeIcon icon={faArrowRightToBracket} /> Login
                        </button>
                        <button onClick={openSignUpModal} className="header-auth-button">
                            <FontAwesomeIcon icon={faUserPlus} /> Sign Up
                        </button>
                    </>
                )}

                <button className="help-button" onClick={openHelpModal}>
                    <FontAwesomeIcon icon={faCircleQuestion} />
                </button>

                <button onClick={toggleGameMode} className="header-auth-button">
                    {gameMode === 'classic' ? 'Journey Mode' : 'Classic Mode'}
                </button>
            </div>
        </header>
    );
};

export default Header;