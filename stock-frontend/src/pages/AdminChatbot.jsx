import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './AdminChatbot.css';

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
                "http://localhost:8888/prediction-service/prediction/assistant/secure/admin/chat",
                { question: userQuestion },
                { headers: { Authorization: `Bearer ${token}` } }
            );


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
        <div className="a-chatbot-wrapper">

            <button className="a-chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <FaRobot />}
                <span className="a-btn-text">{isOpen ? "Close" : "AI Administrator"}</span>
            </button>


            {isOpen && (
                <div className="a-chatbot-window">
                    <div className="a-chatbot-header">
                        <div className="a-bot-info">
                            <div className="a-avatar-ring">
                                <FaRobot className="a-bot-icon-avatar" />
                                <div className="a-pulse-dot"></div>
                            </div>
                            <div>
                                <h4>GOSTOCK AI</h4>
                                <span>Strategic Analytics & Budget</span>
                            </div>
                        </div>
                    </div>

                    <div className="a-chatbot-messages">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`a-message-bubble ${msg.isBot ? 'bot' : 'user'}`}
                            >
                                <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                            </div>
                        ))}

                        {loading && (
                            <div className="a-message-bubble bot" style={{ padding: '6px 12px' }}>
                                <div className="a-loading">
                                    <div className="a-dot"></div>
                                    <div className="a-dot"></div>
                                    <div className="a-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>


                    <form className="a-chatbot-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Ask about restock, suppliers, or budget..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="a-chatbot-send-btn"
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