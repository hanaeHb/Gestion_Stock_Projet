import React, { useState, useRef, useEffect } from "react";
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from "react-icons/fa";
import axios from "axios";
import "./homeChatbot.css";

const HomeChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hello! 👋 I am the IN GO STOCK AI assistant. How can I help you optimize your inventory management today?"
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

        setMessages((prev) => [...prev, { sender: "user", text: userText }]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost:8888/prediction-service/prediction/assistant/public/chat", {
                question: userText
            });

            const botResponse = response.data.answer || "Sorry, I couldn't generate a response.";

            setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
        } catch (error) {
            console.error("Chatbot connection error:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Sorry, I'm currently unable to connect. Please try again later." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-wrapper">
            <button className="chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <FaComments />}
            </button>

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="bot-info">
                            <FaRobot className="bot-icon-avatar" />
                            <div>
                                <h4>GO STOCK Agent</h4>
                                <span>Online (AI Support)</span>
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
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
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