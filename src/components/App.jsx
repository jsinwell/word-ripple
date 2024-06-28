import React, { useState, useEffect } from "react";
import { Modal } from "react-responsive-modal";
import { isValidWord, getRandomWord } from "../services/dictionary";
import { checkSemanticRelation } from "../services/semantics";
import WordChain from "../components/WordChain";
import "react-responsive-modal/styles.css";
import "../styles/App.css";
import "../styles/Modal.css";

function App() {
  const [modalOpen, setModalOpen] = useState(true);

  const [currentWord, setCurrentWord] = useState("");
  const [inputWord, setInputWord] = useState("");
  const [message, setMessage] = useState(""); // Success & failure messages
  const [messageType, setMessageType] = useState("");
  const [showScore, setShowScore] = useState(false);

  const [wordSet, setWordSet] = useState(new Set()); // Look up previously used words
  const [usedWords, setUsedWords] = useState([]); // Track order of user's words

  const [timeLeft, setTimeLeft] = useState(60); // 5 minute timer
  const [points, setPoints] = useState(0); // Count how many points user has
  const [gameOver, setGameOver] = useState(false);
  const [fade, setFade] = useState(false); // Controls fading out the main screen

  useEffect(() => {
    resetGame();
  }, []);

  const handleCloseModal = () => {
    setModalOpen(false);
    resetGame();
  };

  // Reset the game to a clean state (fresh timer, new word, 0 points)
  const resetGame = () => {
    const newWord = getRandomWord();
    setCurrentWord(newWord.toUpperCase());
    setMessage("");
    setWordSet(new Set());
    setUsedWords([newWord.toUpperCase()]); // Include starting word in final chain
    setTimeLeft(60);
    setGameOver(false);
    setPoints(0);
    setFade(false);
  };

  // Timer countdown; when we reach 0, we fadeout to the game over screen
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && !fade) {
      setFade(true);
      setTimeout(() => setGameOver(true), 3000); // 2s pause + 1s fade out
    }
  }, [timeLeft, gameOver, fade]);

  const handleChange = (event) => {
    setInputWord(event.target.value.toUpperCase()); // Handle input in uppercase
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const wordToCheck = inputWord.toLowerCase(); // User's input word in lowercase

    // Check if the word has already been used
    if (wordSet.has(wordToCheck)) {
      setMessage("You have already used this word.");
      setMessageType("error");
      setInputWord("");
      return;
    }

    // Check if the word is in our dictionary
    if (!isValidWord(wordToCheck)) {
      setMessage("Invalid word.");
      setMessageType("error");
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
      setMessage("Good job! The words are semantically related.");
      setMessageType("success");
      setShowScore(true); // Show the score animation
      setTimeout(() => setShowScore(false), 1000); // Hide the score after 1 seconds
    } else {
      setMessage("The words are not semantically related.");
      setMessageType("error");
    }
    setInputWord("");
  };

  const renderWord = (word) => {
    return word
      .split("")
      .map((letter, index) => <span key={index}>{letter}</span>);
  };

  return (
    <div className="container">
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        center
        classNames={{
          modal: "customModal",
        }}
      >
        <h2>Welcome to Word Ripple!</h2>
        <p>Here’s how to play:</p>
        <ul>
          <li>
            Start with one word in the center of the screen, such as "Ocean".
          </li>
          <li>
            Enter a new word that is semantically related to the current one.
            For example, from "Ocean" you could enter "Water" because they are
            synonyms.
          </li>
          <li>
            Each valid word earns you points. The challenge is to see how far
            you can shift the meaning from the original word by the end of the
            game, like going from "Ocean" to "Glass" by making semantically
            related changes at each step.
          </li>
          <li>
            The goal is to form as many valid words as possible before the time
            runs out!
          </li>
        </ul>
        <p>Words can be related in several ways, including:</p>
        <ul>
          <li>
            <strong>Synonyms:</strong> (like "Ocean" and "Sea")
          </li>
          <li>
            <strong>Antonyms:</strong> (like "Late" and "Early")
          </li>
          <li>
            <strong>Homophones:</strong> (like "Course" and "Coarse")
          </li>
          <li>
            <strong>Hyponyms:</strong> (more specific instances, like "Gondola"
            is a kind of "Boat")
          </li>
          <li>
            <strong>Hypernyms:</strong> (more general terms, like "Boat" for
            "Gondola")
          </li>
          <li>
            <strong>Meronyms:</strong> (part-whole relations, like "Wheel" is
            part of "Car")
          </li>
          <li>
            <strong>Holonyms:</strong> (whole-part relations, like "Tree" is
            comprised of "Trunk" and "Branches")
          </li>
          <li>
            <strong>Other lexical relations</strong> based on context or usage,
            such as "Milk" and "Cow" (triggers)
          </li>
        </ul>
        <button onClick={handleCloseModal}>Play</button>
        <div className="modalFooter">
          Powered by{" "}
          <a
            href="https://www.datamuse.com/api/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Datamuse API
          </a>
        </div>
      </Modal>

      <div className="header">
        <h1 className="title">Word Ripple</h1>
        <div className={`game-info ${fade ? "fade-out" : ""}`}>
          <div>
            Time left: {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </div>
          <div>Points: {points}</div>
        </div>
      </div>
      {gameOver ? (
        <div
          className={`game-over-screen ${gameOver ? "game-over-active" : ""}`}
        >
          <h1 className="game-over-message fade-in">Game Over!</h1>
          <p className="total-points fade-in">Total points: {points}</p>
          <button className="restart-button fade-in" onClick={resetGame}>
            Restart Game
          </button>
        </div>
      ) : (
        <div className={`game-container ${fade ? "fade-out" : ""}`}>
          <p className="word-display">{renderWord(currentWord)}</p>
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputWord}
                onChange={handleChange}
                autoFocus
              />
              <button type="submit">Submit</button>
              <button type="button" onClick={resetGame}>
                Reset
              </button>
            </form>
            {showScore && <span className="score-animation">+10</span>}
          </div>
          <p
            className={
              messageType === "success" ? "message-success" : "message-error"
            }
          >
            {message}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
