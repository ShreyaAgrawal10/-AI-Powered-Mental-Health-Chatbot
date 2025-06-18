import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;
  padding: 85px 20px 20px;
  background: linear-gradient(135deg, #a8e6cf, #dcedc1);
`;

const ChatBox = styled.div`
  width: 90%;
  max-width: 650px;
  height: 75vh;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  padding: 25px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  margin: 15px 0;
  justify-content: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
`;

const MessageBubble = styled.div`
  max-width: 75%;
  padding: 14px;
  border-radius: 25px;
  font-size: 1.1rem;
  background: ${({ isUser }) => (isUser ? "#4CAF50" : "#f1f1f1")};
  color: ${({ isUser }) => (isUser ? "white" : "black")};
  margin-left: ${({ isUser }) => (isUser ? "10px" : "0")};
  margin-right: ${({ isUser }) => (isUser ? "0" : "10px")};
`;

const UserEmoji = styled.span`
  font-size: 30px;
  margin: 0 10px;
`;

const InputContainer = styled.div`
  display: flex;
  width: 90%;
  max-width: 650px;
  margin-top: 15px;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 14px;
  border-radius: 25px;
  border: 2px solid #4CAF50;
  font-size: 1rem;
  outline: none;
`;

const Button = styled.button`
  margin-left: 10px;
  padding: 14px 20px;
  border-radius: 25px;
  border: none;
  background: ${({ isListening }) => (isListening ? "#E91E63" : "#4CAF50")};
  color: white;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.3s;

  &:hover {
    background: ${({ isListening }) => (isListening ? "#C2185B" : "#388E3C")};
  }
`;

const Chat = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", isUser: false }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("🎙️ Speech recognition started");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("📢 Transcript received:", transcript);
      setInput(""); // Clear text input
      sendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error("❌ Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("🛑 Speech recognition ended");
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { text, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      const botText = data.response || "Sorry, I didn't understand that.";
      const botMessage = { text: botText, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
      speak(botText);
    } catch (error) {
      console.error("🚨 Fetch error:", error);
      const errorText = "Error connecting to server. Please try again.";
      setMessages((prev) => [...prev, { text: errorText, isUser: false }]);
      speak(errorText);
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <ChatContainer>
      <ChatBox>
        {messages.map((msg, idx) => (
          <Message key={idx} isUser={msg.isUser}>
            {!msg.isUser && <UserEmoji>🤖</UserEmoji>}
            <MessageBubble isUser={msg.isUser}>{msg.text}</MessageBubble>
            {msg.isUser && <UserEmoji>🧑</UserEmoji>}
          </Message>
        ))}
      </ChatBox>
      <InputContainer>
        <TextInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
        />
        <Button onClick={() => sendMessage(input)}>Send</Button>
        <Button isListening={isListening} onClick={isListening ? stopListening : startListening}>
          {isListening ? "🎙️ Stop" : "🎤 Speak"}
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat;
