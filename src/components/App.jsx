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
const getDailyWords = () => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  let seed = parseInt(today.replace(/-/g, ''), 10); // Convert date to number for seeding

  // Use the seed to generate consistent random words for the day
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
  const [usedWords, setUsedWords] = useState([]); // Track order of user's words

  const [timeLeft, setTimeLeft] = useState(60); // 5 minute timer
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Is the timer running?

  const [points, setPoints] = useState(0); // Count how many points user has
  const [gameOver, setGameOver] = useState(false);
  const [fade, setFade] = useState(false); // Controls fading out the main screen

  const [gameMode, setGameMode] = useState('journey'); // 'classic' or 'journey' gamemode
  const [targetWord, setTargetWord] = useState(""); // Journey mode ending word
  const dailyWordsRef = useRef(null);

  // React responsive media queries
  const isSmallScreen = useMediaQuery({ maxWidth: 600 });
  const isMediumScreen = useMediaQuery({ minWidth: 601, maxWidth: 1024 });

  useEffect(() => {
    resetGame();
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser); // Add this line for debugging
      setUser(currentUser);
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
    if (mode === 'classic') {
      const newWord = getRandomWord();
      setCurrentWord(newWord.toUpperCase());
      setTargetWord("");
    } else if (mode === 'journey') {
      if (!dailyWordsRef.current) {
        dailyWordsRef.current = getDailyWords();
      }
      const { startWord, endWord } = dailyWordsRef.current;
      setCurrentWord(startWord.toUpperCase());
      setTargetWord(endWord.toUpperCase());
    }
  
    setTimeLeft(60);
    setIsTimerRunning(false);
    setGameOver(false);
    setPoints(0);
    setFade(false);
    setWordSet(new Set());
    setUsedWords([]);
  
    if (messageTimeoutRef.current) { clearTimeout(messageTimeoutRef.current); }
    setMessage("");
    setMessageType("");
    setMessageKey(0);
  }, [gameMode]);
  
  // Switch between classic/journey modes thru toggle button
  const toggleGameMode = useCallback(() => {
    setGameMode(prevMode => {
      const newMode = prevMode === 'classic' ? 'journey' : 'classic';
      resetGame(newMode);
      return newMode;
    });
  }, []);

  // Timer countdown; this is really fucked up isn't it
  useEffect(() => {
    let timerId;
    // Only decrement under these conditions
    if (isTimerRunning && timeLeft > 0 && !gameOver && !firstTimeModalOpen) {
      timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !fade) { // If the game is over, start fading
      timerId = setTimeout(async () => {
        setFade(true);
        saveScore(points);
        if (gameMode === 'journey') { // If we're in journey mode and time runs out, that's it
        }
        setTimeout(() => setGameOver(true), 2000); // Show game over after fade completes
      }, 1000); // 1 second delay before starting fade
    }
    return () => clearTimeout(timerId);
  }, [timeLeft, gameOver, fade, isTimerRunning, firstTimeModalOpen, points, gameMode]);

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
      setUsedWords((prevWords) => [...prevWords, wordToCheck.toUpperCase()]); // Add new word for in order display at the end
      setPoints(points + 10); // Each valid word is +10 pts
      setCurrentWord(inputWord);

      // If the user reaches the targetWord in journey mode, end the game
      // User won't be able to play again until midnight
      if (gameMode === 'journey' && inputWord.toUpperCase() === targetWord) {
        showMessage("You've reached the target word!", "success");
        setTimeout(() => setGameOver(true), 2000);
      }

      else { // Else we are in classic mode, just keep going
        showMessage("Good job! The words are semantically related.", "success");
      }

      setShowScore(true); // Show the score animation
      setTimeout(() => setShowScore(false), 1000); // Hide the score after 1 seconds
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
      const response = await fetch('http://localhost:3000/api/scores', {
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
        <div>
          Time left: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </div>
        <div>Points: {points}</div>
      </div>
      {gameOver ? (
        <div
          className={`game-over-screen ${gameOver ? "game-over-active" : ""}`}
        >
          <div className={`game-over-content ${isSmallScreen ? 'small-screen' : isMediumScreen ? 'medium-screen' : 'large-screen'}`}>
            <h1 className="game-over-message fade-in delay-1">Game Over!</h1>
            <div className="leaderboard-container fade-in delay-2">
              <Leaderboard />
            </div>
            <p className="total-points fade-in delay-3">Total points: {points}</p>
            <button className="restart-button game-button fade-in delay-4" onClick={() => resetGame()}>
              Go Back
            </button>
          </div>
        </div>
      ) : (
        <div className={`game-container main-app-content ${fade ? "fade-out" : ""}`}>
          {renderWordDisplay()}
          <div className="form-container">
            <div className="score-animation-container">
              {showScore && <span className="score-animation">+10</span>}
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
