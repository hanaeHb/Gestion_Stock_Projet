import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';

const AdminChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello Administrator. I am your Strategic AI Advisor, connected to your predictive stock and supplier performance models. How can I assist you with your procurement, budget, or inventory strategy today?",
            isBot: true
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to the bottom
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

        // Show user message
        setMessages(prev => [...prev, { id: Date.now(), text: userQuestion, isBot: false }]);
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            // API Call
            const response = await axios.post(
                "http://localhost:8888/prediction-service/prediction/assistant/secure/admin/chat",
                { question: userQuestion },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Add AI response
            setMessages(prev => [...prev, { id: Date.now() + 1, text: response.data.answer, isBot: true }]);
        } catch (err) {
            console.error("Predictive Admin Chat Error:", err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "System Error: Unable to compile predictive model data. Please ensure the analytics backend is active.",
                isBot: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="g-chatbot-wrapper">
            {/* Toggle Button */}
            <button className="g-chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <FaRobot />}
                <span className="g-btn-text">{isOpen ? "Close" : "Strategic AI Advisor"}</span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="g-chatbot-window">
                    <div className="g-chatbot-header">
                        <div className="g-bot-info">
                            <div className="g-avatar-ring">
                                <FaRobot className="g-bot-icon-avatar" />
                                <div className="g-pulse-dot"></div>
                            </div>
                            <div>
                                <h4>GOSTOCK AI</h4>
                                <span>Strategic Analytics & Budget</span>
                            </div>
                        </div>
                    </div>

                    <div className="g-chatbot-messages">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`g-message-bubble ${msg.isBot ? 'bot' : 'user'}`}
                            >
                                <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                            </div>
                        ))}

                        {loading && (
                            <div className="g-message-bubble bot" style={{ padding: '6px 12px' }}>
                                <div className="g-loading">
                                    <div className="g-dot"></div>
                                    <div className="g-dot"></div>
                                    <div className="g-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <form className="g-chatbot-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Ask about restock, suppliers, or budget..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="g-chatbot-send-btn"
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

export default AdminChatbot;