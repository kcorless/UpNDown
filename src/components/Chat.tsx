// src/components/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext'; // Adjusted path
import { Auth } from 'aws-amplify'; // Added Auth import

const Chat: React.FC = () => {
  const { messages, sendMessage } = useGame();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Assuming sendMessage will handle Auth.user internally or receive it as a parameter
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div
            key={message.id} // Ensure message.id is unique and stable
            className={`mb-4 ${
              // Ensure message.playerId and Auth.user.username are available and correct
              message.playerId === Auth.user?.username 
                ? 'ml-auto' 
                : 'mr-auto'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">
                {/* Ensure message.playerName is available */}
                {message.playerName || 'User'} 
              </span>
              <div
                className={`rounded-lg px-4 py-2 max-w-xs ${
                  message.playerId === Auth.user?.username
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-lg border px-4 py-2"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
