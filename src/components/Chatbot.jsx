import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, MessageCircle, X, Loader } from 'lucide-react';

const HealthcareBot = () => {
  const userId = "user123"; // Hardcoded userId
  
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    // {
    //   type: 'bot',
    //   content: "👋 Hello! I'm your healthcare assistant. I can help you with:\n\n• Booking doctor appointments\n• Understanding medical terms\n• Basic health queries\n• Prescription uploads and analysis\n\nHow can I assist you today?"
    // }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Immediately add user message
    setMessages(prev => [...prev, { type: 'user', content: text }]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(
        'https://krhh5ptj-3000.inc1.devtunnels.ms/api/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, message: text }),
        }
      );
      const data = await response.json();
      
      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { type: 'error', content: 'Error sending message. Please try again.' }
      ]);
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Immediately add upload message and image preview
    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        content: 'Uploaded prescription:',
        imageUrl: URL.createObjectURL(file)
      }
    ]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('userId', userId);

    try {
      const response = await fetch(
        'https://krhh5ptj-3000.inc1.devtunnels.ms/api/ocr',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: data.recognizedText }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { type: 'error', content: 'Error processing prescription. Please try again.' }
      ]);
    }
    setIsLoading(false);
  };

  const MessageBubble = ({ message }) => {
    if (message.type === 'error') {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-2">
          <div className="text-red-700">{message.content}</div>
        </div>
      );
    }

    const isUser = message.type === 'user';
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm mr-2">
            A
          </div>
        )}
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {message.imageUrl && (
            <div className="mb-2">
              <img 
                src={message.imageUrl} 
                alt="Uploaded prescription" 
                className="max-w-full rounded-lg"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-500 p-4 rounded-t-lg flex justify-between items-center">
        <div className="text-white">
          <h2 className="font-semibold">Healthcare Assistant</h2>
          <p className="text-sm opacity-75">Always here to help</p>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-blue-600 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-center items-center py-2">
            <Loader className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="file"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
            />
            <button
              onMouseEnter={() => setShowUploadTooltip(true)}
              onMouseLeave={() => setShowUploadTooltip(false)}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>
            {showUploadTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                Upload prescription
              </div>
            )}
          </div>
          
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(message);
              }
            }}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          
          <button
            onClick={() => handleSendMessage(message)}
            disabled={isLoading || !message.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthcareBot;