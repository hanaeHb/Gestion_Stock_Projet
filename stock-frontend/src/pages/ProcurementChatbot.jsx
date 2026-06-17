import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './ProcurementChatbot.css';

const ProcurementChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello Procurement Manager! 🛒 I am your AI Sourcing Assistant. I can help you with:\n\n• 📊 Budget tracking & analysis\n• 📦 Quotes & supplier offers comparison\n• 🚚 Shipment tracking & confirmations\n• 📋 Replenishment orders\n• 👥 Supplier management\n\nHow can I assist you today?",
            isBot: true
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userQuestion = input.trim();
        setInput("");
        setMessages(prev => [...prev, { id: Date.now(), text: userQuestion, isBot: false }]);
        setLoading(true);

        try {
            const token = localStorage.getItem("token");


            const response = await axios.post(
                "http://localhost:8888/prediction-service/prediction/assistant/secure/procurement/chat",
                { question: userQuestion },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages(prev => [...prev, { id: Date.now() + 1, text: response.data.answer, isBot: true }]);
        } catch (err) {
            console.error("Procurement Chatbot Error:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "System Error: Unable to connect to procurement data. Please ensure the backend services are active.",
                isBot: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-chatbot-wrapper">
            <button className="p-chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <FaRobot />}
                <span className="p-btn-text">{isOpen ? "Close" : "AI Procurement Manager"}</span>
            </button>

            {isOpen && (
                <div className="p-chatbot-window">
                    <div className="p-chatbot-header">
                        <div className="p-bot-info">
                            <div className="p-avatar-ring">
                                <FaRobot className="p-bot-icon-avatar" />
                                <div className="p-pulse-dot"></div>
                            </div>
                            <div>
                                <h4>GOSTOCK AI</h4>
                                <span>Sourcing & Budget Assistant</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-chatbot-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`p-message-bubble ${msg.isBot ? 'bot' : 'user'}`}>
                                <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                            </div>
                        ))}
                        {loading && (
                            <div className="p-message-bubble bot" style={{ padding: '6px 12px' }}>
                                <div className="p-loading">
                                    <div className="p-dot"></div>
                                    <div className="p-dot"></div>
                                    <div className="p-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="p-chatbot-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="e.g. What's the budget status? Show me pending quotes..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="p-chatbot-send-btn"
                            disabled={loading || !input.trim()}
                        >
                            <FaPaperPlane style={{ fontSize: '0.85rem' }} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ProcurementChatbot;