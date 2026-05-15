"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Halo! Saya **BEMI**, asisten virtual BEM ITESA Muhammadiyah Semarang 👋\n\nSaya siap membantu menjawab pertanyaanmu seputar kampus ITESA, BEM, dan website ini. Ada yang bisa saya bantu? 😊",
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fokus ke input saat chat dibuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Kirim semua pesan kecuali pesan selamat datang
          messages: updatedMessages.filter((_, i) => i > 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendapat respons");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Maaf, terjadi kesalahan saat menghubungi server. Coba lagi nanti ya.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render teks dengan bold markdown sederhana
  const renderText = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Tutup chatbot" : "Buka chatbot BEMI"}
        className={`
          fixed bottom-6 right-6 z-[9999]
          w-14 h-14 rounded-full shadow-2xl
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? "bg-red-500 hover:bg-red-600 rotate-0"
              : "bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 hover:scale-110"
          }
        `}
      >
        {isOpen ? (
          // Close icon
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // Chat icon
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Notif badge saat belum dibuka */}
      {!isOpen && (
        <span className="fixed bottom-[72px] right-5 z-[9999] bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow animate-bounce">
          BEMI
        </span>
      )}

      {/* Chat Window */}
      <div
        id="chatbot-window"
        className={`
          fixed bottom-24 right-6 z-[9998]
          w-[340px] sm:w-[380px] rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-6 pointer-events-none"
          }
          bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
        `}
        style={{ height: "480px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            B
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">BEMI</p>
            <p className="text-xs text-blue-200 leading-tight">
              Asisten Virtual BEM ITESA
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-blue-200">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Avatar asisten */}
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                  B
                </div>
              )}
              <div
                className={`
                  max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                  }
                `}
              >
                {renderText(msg.content)}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                B
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1 items-center">
                  <span
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {[
              "Apa itu BEM ITESA?",
              "Program studi apa saja?",
              "Fitur website ini apa?",
              "Kegiatan BEM apa saja?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => sendMessage(), 50);
                }}
                className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-full hover:bg-blue-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <input
            ref={inputRef}
            id="chatbot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya seputar kampus & BEM..."
            disabled={isLoading}
            className="
              flex-1 text-sm px-3 py-2 rounded-xl
              bg-gray-100 dark:bg-gray-800
              text-gray-800 dark:text-gray-200
              placeholder-gray-400 dark:placeholder-gray-500
              border border-transparent focus:border-blue-400 focus:outline-none
              disabled:opacity-60 transition-colors
            "
          />
          <button
            id="chatbot-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            aria-label="Kirim pesan"
            className="
              w-9 h-9 rounded-xl flex items-center justify-center
              bg-blue-600 hover:bg-blue-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors flex-shrink-0
            "
          >
            <svg
              className="w-4 h-4 text-white rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-400 dark:text-gray-600 pb-2 flex-shrink-0">
          Powered by Gemini · BEM ITESA Muhammadiyah Semarang
        </div>
      </div>
    </>
  );
}
