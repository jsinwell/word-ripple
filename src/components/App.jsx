import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import { isValidWord, getRandomWord } from "../services/dictionary";
import { checkSemanticRelation } from "../services/semantics";
import { logoutUser } from '../firebase/authService';
import { auth } from "../firebase/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import InstructionsModal from "../components/InstructionsModal";
import Header from "../components/Header";
import Leaderboard from "./Leaderboard";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignupModal";
import "../styles/App.css";

// Function to get a single daily word pair in journey mode for all users
// Regardless of local time
const getDailyWords = () => {
  const today = new Date().toLocaleDateString('en-CA'); // Get today's date in YYYY-MM-DD format
  let seed = parseInt(today.replace(/-/g, ''), 10); // Convert date to number for seeding

  // Use the seed to generate random words for the day
  const getSeededRandomWord = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return getRandomWord(seed / 233280);
  };

  const startWord = getSeededRandomWord();
  let endWord;
  do {
    endWord = getSeededRandomWord();
  } while (startWord === endWord);

  return { startWord, endWord };
};


function App() {
  const [user, setUser] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Instructions modal
  const [firstTimeModalOpen, setFirstTimeModalOpen] = useState(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedWordRipple');
    return !hasVisitedBefore;
  });

  const [helpModalOpen, setHelpModalOpen] = useState(false); // Help button state

  const [loginModalOpen, setLoginModalOpen] = useState(false); // Login modal
  const [signUpModalOpen, setSignUpModalOpen] = useState(false); // Signup modal

  const [currentWord, setCurrentWord] = useState("");
  const [inputWord, setInputWord] = useState("");

  const [message, setMessage] = useState(""); // Success & failure messages
  const [messageType, setMessageType] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const messageTimeoutRef = useRef(null); // Ref for message timeout

  const [showScore, setShowScore] = useState(false);

  const [wordSet, setWordSet] = useState(new Set()); // Look up previously used words

  const [timeLeft, setTimeLeft] = useState(300); // 5 minute timer for `classic` mode
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [elapsedTime, setElapsedTime] = useState(0); // timer for `journey` mode

  const [points, setPoints] = useState(0); // Count how many points user has
  const [gameOver, setGameOver] = useState(false);
  const [fade, setFade] = useState(false); // Controls fading out the main screen

  const [gameMode, setGameMode] = useState('journey'); // 'classic' or 'journey' gamemode
  const [targetWord, setTargetWord] = useState(""); // Journey mode ending word
  const [hasCompletedJourneyToday, setHasCompletedJourneyToday] = useState(false);

  const dailyWordsRef = useRef(null);

  // React responsive media queries
  const isSmallScreen = useMediaQuery({ maxWidth: 600 });
  const isMediumScreen = useMediaQuery({ minWidth: 601, maxWidth: 1024 });


  // Mark todays journey as completed
  const markJourneyAsCompletedToday = async () => {
    if (!auth.currentUser) {
      // Fall back to local storage for anonymous users
      const today = new Date().toLocaleDateString('en-CA');
      localStorage.setItem('lastCompletedJourneyDate', today);
      setHasCompletedJourneyToday(true);
      return;
    }

    // Post to database for authenticated users
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch('word-rippledb.c58ui0icepn4.us-west-1.rds.amazonaws.com/api/journey/complete', {
        method: 'POST',
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });
      setHasCompletedJourneyToday(true);
    } catch (error) {
      console.error('Error marking journey as completed:', error);
    }
  };

  // Check today's journey completed value
  const checkIfCompletedJourneyToday = async () => {
    if (!auth.currentUser) {
      // Fall back to local storage for anonymous users
      const lastCompletedDate = localStorage.getItem('lastCompletedJourneyDate');
      const today = new Date().toLocaleDateString('en-CA');
      const completed = lastCompletedDate === today;
      setHasCompletedJourneyToday(completed);
      return completed;
    }

    // Read from database for authenticated users
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('word-rippledb.c58ui0icepn4.us-west-1.rds.amazonaws.com/api/journey/check', {
        headers: {
          'Authorization': idToken
        }
      });
      const data = await response.json();
      // Data should return true if user has already completed today's journey
      setHasCompletedJourneyToday(data.completed);
      return data.completed;
    } catch (error) {
      console.error('Error checking journey completion:', error);
      setHasCompletedJourneyToday(false);
      return false;
    }
  };

  // Initialization and utility functions
  useEffect(() => {
    const initializeGame = async () => {
      await checkIfCompletedJourneyToday();
      resetGame();
    };

    initializeGame();

    // Set up a timer to check at midnight
    const timer = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        checkIfCompletedJourneyToday();
      }
    }, 60000); // Check every minute

    // Clean up the timer on unmount
    return () => clearInterval(timer);
  }, [auth.currentUser]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Check if the user's email is verified
        if (currentUser.emailVerified) {
          setUser(currentUser);
          setIsEmailVerified(true);
        } else {
          setUser(null);
          setIsEmailVerified(false);
          // Sign out the user
          auth.signOut();
        }
      } else {
        setUser(null);
        setIsEmailVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Only show the instruction modal if the user has visited the page for the first time
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedWordRipple');
    if (!hasVisitedBefore) {
      localStorage.setItem('hasVisitedWordRipple', 'true');
    }
  }, []);

  const handleCloseFirstTimeModal = () => {
    setFirstTimeModalOpen(false);
    localStorage.setItem('hasVisitedWordRipple', 'true');
    resetGame();
  };

  // Clicking on help button will re-open instructions modal
  const openHelpModal = () => {
    setHelpModalOpen(true);
  };

  const handleCloseHelpModal = () => {
    setHelpModalOpen(false);
  };

  // Handle logging out
  const handleLogout = () => {
    logoutUser()
      .then(() => {
        setUser(null);
        window.location.reload(); // Refresh the page
      })
      .catch((error) => console.error("Logout error:", error));
  };


  // Reset the game to a clean state. Depends on which game mode is selected
  // Seriously what the fuck is this
  const resetGame = useCallback((mode = gameMode) => {
    if (mode === 'journey' && hasCompletedJourneyToday) {
      return;
    }

    let newStartWord = "";
    let newTargetWord = "";

    if (mode === 'classic') {
      newStartWord = getRandomWord().toUpperCase();
    } else if (mode === 'journey') {
      if (!dailyWordsRef.current) {
        dailyWordsRef.current = getDailyWords();
      }
      const { startWord, endWord } = dailyWordsRef.current;
      newStartWord = startWord.toUpperCase();
      newTargetWord = endWord.toUpperCase();
    }

    if (mode === 'classic') {
      setTimeLeft(300);
    } else if (mode === 'journey') {
      setElapsedTime(0);
    }

    setIsTimerRunning(false);
    setCurrentWord(newStartWord);
    setTargetWord(newTargetWord);
    setGameOver(false);
    setPoints(0);
    setFade(false);
    setWordSet(new Set());

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setMessage("");
    setMessageType("");
    setMessageKey(0);
  }, [gameMode, hasCompletedJourneyToday]);


  // Switch between classic/journey modes thru toggle button
  const toggleGameMode = useCallback(() => {
    setGameMode(prevMode => {
      const newMode = prevMode === 'classic' ? 'journey' : 'classic';
      if (newMode === 'journey' && hasCompletedJourneyToday) {
        // Don't reset the game if switching to completed journey mode
        return newMode;
      }
      resetGame(newMode);
      return newMode;
    });
  }, [resetGame, hasCompletedJourneyToday]);


  // Timer countdown; this is really fucked up isn't it
  useEffect(() => {
    let timerId;
    if (isTimerRunning && !gameOver && !firstTimeModalOpen) {
      if (gameMode === 'classic') {
        if (timeLeft > 0) {
          timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (!fade) {
          setFade(true);
          saveScore(points);
          setTimeout(() => setGameOver(true), 2000);
        }
      } else if (gameMode === 'journey') {
        timerId = setTimeout(() => setElapsedTime(prevTime => prevTime + 1), 1000);
      }
    }

    return () => clearTimeout(timerId);
  }, [timeLeft, gameOver, fade, isTimerRunning, firstTimeModalOpen, points, gameMode, elapsedTime]);

  // Handles user input
  const handleChange = (event) => {
    setInputWord(event.target.value.toUpperCase());
    if (!isTimerRunning) {
      setIsTimerRunning(true); // Begin timer once user has typed something
    }
  }

  // Displaying success/failure messages
  const showMessage = (text, type) => {
    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setMessage(text);
    setMessageType(type);
    setMessageKey(prev => prev + 1);  // Force rerender of message

    // Set new timeout and save the ID; prevents previous message from
    // being cleared too soon if a new one comes in
    messageTimeoutRef.current = setTimeout(() => {
      setMessage("");
      setMessageType("");
      messageTimeoutRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    // Cleanup function of message timeout
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const wordToCheck = inputWord.toLowerCase(); // User's input word in lowercase

    // Check if the word has already been used
    if (wordSet.has(wordToCheck)) {
      showMessage("You have already used this word.", "error");
      setInputWord("");
      return;
    }

    // Check if the word is in our dictionary
    if (!isValidWord(wordToCheck)) {
      showMessage("Invalid word.", "error");
      setInputWord("");
      return;
    }

    // Check if the new word is semantically related to current
    const related = await checkSemanticRelation(
      currentWord.toLowerCase(),
      wordToCheck
    );
    if (related) {
      setWordSet((prevSet) => new Set(prevSet.add(wordToCheck))); // Add new word to used words set for later lookup
      setPoints(points + 10); // Each valid word is +10 pts
      setCurrentWord(inputWord);

      // If the user reaches the targetWord in journey mode, end the game
      // User won't be able to play again until midnight
      if (gameMode === 'journey' && inputWord.toUpperCase() === targetWord) {
        showMessage("You've reached the target word!", "success");
        markJourneyAsCompletedToday();
        setIsTimerRunning(false); // Stop incrementing timer when target is found
        setTimeout(() => setGameOver(true), 2000);
      }

      // Only show score animation in classic mode
      else {
        showMessage("Good job! The words are semantically related.", "success");
        setShowScore(true); // Show the score animation
        setTimeout(() => setShowScore(false), 1000); // Hide the score after 1 seconds
      }

    }

    else {
      showMessage("The words are not semantically related.", "error");
    }

    setInputWord("");
  };

  // Rendering a single start word
  const renderWord = (word) => {
    return word
      .split("")
      .map((letter, index) => <span key={index}>{letter}</span>);
  };

  // For journey mode, we render both words with an arrow in between
  const renderWordDisplay = () => {
    if (gameMode === 'classic') {
      return <p className="word-display">{renderWord(currentWord)}</p>;
    } else {
      return (
        <p className="word-display">
          {renderWord(currentWord)} → {renderWord(targetWord)}
        </p>
      );
    }
  };

  const saveScore = async (score) => {
    if (score <= 0) {
      return; // We don't want to flood the DB with 0 scores
    }

    // Only save score if user isn't anonymous
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('word-rippledb.c58ui0icepn4.us-west-1.rds.amazonaws.com/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken
        },
        body: JSON.stringify({ score }),
      });
      if (!response.ok) throw new Error('Failed to save score');
      console.log('Score saved successfully');
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  return (
    <div className="container">

      <InstructionsModal
        open={firstTimeModalOpen}
        onClose={handleCloseFirstTimeModal}
      />

      <InstructionsModal
        open={helpModalOpen}
        onClose={handleCloseHelpModal}
      />

      <Header
        user={user}
        isEmailVerified={isEmailVerified}
        handleLogout={handleLogout}
        openLoginModal={() => setLoginModalOpen(true)}
        openSignUpModal={() => setSignUpModalOpen(true)}
        openHelpModal={openHelpModal}
        gameMode={gameMode}
        toggleGameMode={toggleGameMode}
      />

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSignUpClick={() => {
          setLoginModalOpen(false);
          setSignUpModalOpen(true);
        }}
      />

      <SignUpModal
        open={signUpModalOpen}
        onClose={() => setSignUpModalOpen(false)}
        onLoginClick={() => {
          setSignUpModalOpen(false);
          setLoginModalOpen(true);
        }}
      />


      <div className={`game-info ${fade ? "fade-out" : ""}`}>
        {!(gameMode === 'journey' && hasCompletedJourneyToday) && (
          <div>
            {gameMode === 'classic' ? (
              `Time left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
            ) : (
              `Time elapsed: ${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, "0")}`
            )}
          </div>
        )}
        {gameMode === "classic" && <div>Points: {points}</div>}
      </div>

      {gameMode === 'journey' && hasCompletedJourneyToday ? (
        <div className="completed-journey-screen fade-in">
          <h2>Today's Journey Completed!</h2>
          <p>Check back at midnight for the next game, or continue in Classic Mode</p>
        </div>
      ) : gameOver ? (
        <div className={`game-over-screen ${gameOver ? "game-over-active" : ""}`}>
          {gameMode === 'classic' ? (
            <div className={`game-over-content ${isSmallScreen ? 'small-screen' : isMediumScreen ? 'medium-screen' : 'large-screen'}`}>
              <h1 className="game-over-message fade-in delay-1">Game Over!</h1>
              <div className="leaderboard-container fade-in delay-2">
                <Leaderboard />
              </div>
              <p className="total-points fade-in delay-3">Total points: {points}</p>
              <button className="restart-button game-button fade-in delay-4" onClick={() => resetGame()}>
                Play Again
              </button>
            </div>
          ) : (
            <div className="completed-journey-screen fade-in">
              <h2>Today's Journey Completed!</h2>
              <p>Check back at midnight for the next game, or continue in Classic Mode</p>
            </div>
          )}
        </div>
      ) : (
        <div className={`game-container main-app-content ${fade ? "fade-out" : ""}`}>
          {renderWordDisplay()}
          <div className="form-container">
            <div className="score-animation-container">
              {(showScore && gameMode === 'classic') && <span className="score-animation">+10</span>}
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputWord}
                onChange={handleChange}
                autoFocus
              />
              <button type="submit">Submit</button>
              {gameMode === 'classic' && (
                <button type="button" onClick={() => resetGame()}>
                  Reset
                </button>
              )}
            </form>
            <div className="message-container">
              {message && (
                <p
                  key={messageKey}
                  className={messageType === "success" ? "message-success" : "message-error"}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
