import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import "../styles/InstructionsModal.css";

// Instructions popup for how to play when a user enters the site for the first time
const InstructionsModal = ({ open, onClose }) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
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
                    For example, from "Ocean" you could enter "Sea" because they are
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
            <button onClick={onClose}>Play</button>
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
    );
};

export default InstructionsModal;