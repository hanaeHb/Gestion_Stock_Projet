import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './SupplierChatbot.css';

const SupplierChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello Supplier! 🏪 I am your AI Supplier Assistant. I can help you with:\n\n• 📦 Order requests & RFQs\n• 🏷️ Category specializations\n• 📊 Analytics & performance metrics\n• 🔔 Notifications & approvals\n• 💰 Quotes & pricing\n• 📈 AI competitive rankings\n\nHow can I assist you today?",
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
                "http://localhost:8888/prediction-service/prediction/assistant/secure/supplier/chat",
                { question: userQuestion },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages(prev => [...prev, { id: Date.now() + 1, text: response.data.answer, isBot: true }]);
        } catch (err) {
            console.error("Supplier Chatbot Error:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "System Error: Unable to connect to supplier services. Please ensure the backend is active.",
                isBot: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="s-chatbot-wrapper">
            <button className="s-chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <FaRobot />}
                <span className="s-btn-text">{isOpen ? "Close" : "AI Supplier"}</span>
            </button>

            {isOpen && (
                <div className="s-chatbot-window">
                    <div className="s-chatbot-header">
                        <div className="s-bot-info">
                            <div className="s-avatar-ring">
                                <FaRobot className="s-bot-icon-avatar" />
                                <div className="s-pulse-dot"></div>
                            </div>
                            <div>
                                <h4>StockFlow Supplier AI</h4>
                                <span>RFQ & Order Assistant</span>
                            </div>
                        </div>
                    </div>

                    <div className="s-chatbot-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`s-message-bubble ${msg.isBot ? 'bot' : 'user'}`}>
                                <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                            </div>
                        ))}
                        {loading && (
                            <div className="s-message-bubble bot" style={{ padding: '6px 12px' }}>
                                <div className="s-loading">
                                    <div className="s-dot"></div>
                                    <div className="s-dot"></div>
                                    <div className="s-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="s-chatbot-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="e.g. Show me pending orders, my specializations, AI ranking..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="s-chatbot-send-btn"
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

export default SupplierChatbot;