import React, { useState, useRef, useEffect } from "react";
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from "react-icons/fa";
import axios from "axios"; // Darori n-importiw axios l l-connexion API
import "./homeChatbot.css";

const HomeChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Bonjour! 👋 Je suis l'assistant intelligent de IN GO STOCK. Comment puis-je vous aider à optimiser votre gestion de stock aujourd'hui?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input;
        // 1. Affiche l'avis de l'utilisateur sur l'écran
        setMessages((prev) => [...prev, { sender: "user", text: userText }]);
        setInput("");
        setIsLoading(true);

        try {
            // 2. Appel Réel de l'API via ton API Gateway (port 8080)
            const response = await axios.post("http://localhost:8888/prediction-service/prediction/assistant/public/chat", {
                question: userText
            });

            // 3. Récupère la réponse générée par Phi-3 localement
            const botResponse = response.data.answer || "Désolé, je n'ai pas pu générer de réponse.";

            setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
        } catch (error) {
            console.error("Erreur connexion Chatbot:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Désolé, le service d'assistance rencontre un problème de connexion. Veuillez réessayer." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-wrapper">
            {/* L-Icon floating dyal l-Chatbot */}
            <button className="chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <FaComments />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="bot-info">
                            <FaRobot className="bot-icon-avatar" />
                            <div>
                                <h4>GO STOCK Agent</h4>
                                <span>En ligne (IA Locale)</span>
                            </div>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-bubble ${msg.sender}`}>
                                <p>{msg.text}</p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-bubble bot loading">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input-form" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Posez votre question à l'IA..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading} // Bloque l'input pendant le calcul de l'IA
                        />
                        <button type="submit" className="chatbot-send-btn" disabled={isLoading}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default HomeChatbot;