import React, { useState, useRef, useEffect } from "react";
import { FaComments, FaTimes, FaPaperPlane, FaWarehouse } from "react-icons/fa";
import axios from "axios";
import "./gestionnaireChatbot.css"; // مِلَف الـ ستايل الخاص بيه

const GestionnaireChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Bonjour Gestionnaire ! 📊 Je suis votre assistant logistique IA connecté au stock live. Posez-moi vos questions sur les alertes, les seuils critiques ou les prévisions."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input;
        setMessages((prev) => [...prev, { sender: "user", text: userText }]);
        setInput("");
        setIsLoading(true);

        try {
            // 1. جلب الـ Token من الـ localStorage (تأكدي من الإسم لّي مخزناه بيه عندك)
            const token = localStorage.getItem("token") || localStorage.getItem("jwt");

            // 2. إرسال الطلب مع الـ Authorization Header
            const response = await axios.post(
                "http://localhost:8888/prediction-service/prediction/assistant/secure/gestionnaire/chat",
                { question: userText },
                {
                    headers: {
                        // صيفطنا الـ Token باش الـ Gateway والـ Security يخلوها تدوز
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const botResponse = response.data.answer || "Désolé, je n'ai pas pu analyser les données actuelles.";
            setMessages((prev) => [...prev, { sender: "bot", text: botResponse }]);
        } catch (error) {
            console.error("Erreur connexion Chatbot Gestionnaire:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Désolé, l'assistant rencontre un problème d'authentification (401)." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="g-chatbot-wrapper">
            {/* الزر العائم لفتح وإغلاق الشات */}
            <button className="g-chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <FaTimes /> : <><FaComments /> <span className="g-btn-text">AI Stock Core</span></>}
            </button>

            {/* نافذة المحادثة */}
            {isOpen && (
                <div className="g-chatbot-window">
                    <div className="g-chatbot-header">
                        <div className="g-bot-info">
                            <div className="g-avatar-ring">
                                <FaWarehouse className="g-bot-icon-avatar" />
                                <span className="g-pulse-dot"></span>
                            </div>
                            <div>
                                <h4>Stock Flow AI Core</h4>
                                <span>Espace Interne (Données Live)</span>
                            </div>
                        </div>
                    </div>

                    <div className="g-chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`g-message-bubble ${msg.sender}`}>
                                <p>{msg.text}</p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="g-message-bubble bot g-loading">
                                <span className="g-dot"></span>
                                <span className="g-dot"></span>
                                <span className="g-dot"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="g-chatbot-input-form" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Ex: Combien de produits sont sous le seuil ?"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" className="g-chatbot-send-btn" disabled={isLoading}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default GestionnaireChatbot;