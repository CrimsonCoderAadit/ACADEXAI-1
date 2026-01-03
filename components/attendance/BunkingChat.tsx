"use client";

import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  text: "Hi! Ask me if you can bunk a class. For example: 'Can I bunk Math?' or 'Is it safe to skip Physics?'",
  isUser: false,
  timestamp: new Date(),
};

export default function BunkingChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, "users", user.uid, "bunkChatMessages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          text: data.text,
          isUser: data.isUser,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });

      // If no messages exist, show welcome message only
      if (loadedMessages.length === 0) {
        setMessages([WELCOME_MESSAGE]);
      } else {
        // Show welcome + loaded messages
        setMessages([WELCOME_MESSAGE, ...loadedMessages]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to API
  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    setSending(true);
    const userMessage = inputText;
    setInputText("");

    try {
      // Call API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      // Messages are automatically added via Firestore listener
      // The API stores them in Firestore, and onSnapshot updates the UI

      if (!result.response) {
        console.warn('API returned no response text');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: `❌ Error: ${errorMessage}. Please try again.`,
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  // Clear chat history
  const handleClearChat = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to clear all chat history? This cannot be undone.")) return;

    setClearingChat(true);
    try {
      const messagesRef = collection(db, "users", user.uid, "bunkChatMessages");
      const snapshot = await getDocs(messagesRef);

      // Delete all messages
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Reset to welcome message only
      setMessages([WELCOME_MESSAGE]);
    } catch (error) {
      console.error("Error clearing chat:", error);
      alert("Failed to clear chat history");
    } finally {
      setClearingChat(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-gray-800 border border-cyan-500/30 rounded-xl shadow-lg shadow-cyan-900/20 flex flex-col h-[500px] neon-glow-cyan">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Bunking Assistant</h2>
            <p className="text-xs text-gray-400">Ask if you can safely skip a class</p>
          </div>
        </div>

        {/* Clear Chat Button */}
        <button
          onClick={handleClearChat}
          disabled={clearingChat || messages.length <= 1}
          className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear chat history"
        >
          {clearingChat ? "Clearing..." : "Clear Chat"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                message.isUser
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                  : "bg-gray-800 border border-gray-700 text-gray-200"
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/80">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about bunking a class..."
            disabled={sending}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/50 hover:shadow-xl hover:shadow-cyan-900/60"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
