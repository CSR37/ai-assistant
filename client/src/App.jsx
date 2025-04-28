import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { FaRobot, FaUserAstronaut, FaMicrophoneAlt, FaPaperPlane, FaSatellite, FaBroom } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import userIcon from './assets/user-icon.png';  // adjust the path according to where you saved it
import aiIcon from './assets/ai-icon.jpeg';       // adjust path too

function App() {
  const [question, setQuestion] = useState('');
  const [chats, setChats] = useState(() => {
    const savedChats = localStorage.getItem('ai-chats');
    return savedChats ? JSON.parse(savedChats) : [];
  });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null); // ✅ NEW - recognition stored in a ref

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error('Please type something!');
      return;
    }

    const timestamp = new Date().toLocaleString();
    const newChat = { user: question, ai: '', userTime: timestamp, aiTime: '' };

    setChats(prevChats => {
      const updated = [...prevChats, newChat];
      localStorage.setItem('ai-chats', JSON.stringify(updated));
      return updated;
    });

    setLoading(true);

    try {
      const conversation = [];
      const recentChats = chats.slice(-3);

      recentChats.forEach(chat => {
        conversation.push({ role: 'user', content: chat.user });
        conversation.push({ role: 'assistant', content: chat.ai });
      });

      conversation.push({ role: 'user', content: question });

      const response = await axios.post('http://localhost:5000/ask', { conversation });

      let aiReplyRaw = response.data.reply;

      let aiReply = typeof aiReplyRaw === 'string'
        ? aiReplyRaw
        : JSON.stringify(aiReplyRaw, null, 2);

      if (aiReply.startsWith('"') && aiReply.endsWith('"')) {
        aiReply = aiReply.slice(1, -1);
      }

      if (!aiReply || aiReply.trim() === '') {
        aiReply = "Sorry, I couldn't understand that. 😔";
      }

      setChats(prevChats => {
        const updatedChats = [...prevChats];
        if (updatedChats.length > 0) {
          updatedChats[updatedChats.length - 1].ai = aiReply;
          updatedChats[updatedChats.length - 1].aiTime = new Date().toLocaleString();
        }
        localStorage.setItem('ai-chats', JSON.stringify(updatedChats));
        return updatedChats;
      });
      setQuestion('');
      toast.success('AI replied!');
    } catch (error) {
      console.error(error);
      simulateTyping("Something went wrong. 😔");
      toast.error('Failed to get AI response!');
    } finally {
      setLoading(false);
    }
  };

  const simulateTyping = (fullText) => {
    let index = 0;
    const typingSpeed = 20;
    const aiTimeStamp = new Date().toLocaleString();

    function typeNextChar() {
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        if (updatedChats.length > 0 && index < fullText.length) {
          updatedChats[updatedChats.length - 1].ai += fullText[index];
          updatedChats[updatedChats.length - 1].aiTime = aiTimeStamp;
        }
        localStorage.setItem('ai-chats', JSON.stringify(updatedChats));
        return updatedChats;
      });

      index++;
      if (index < fullText.length) {
        setTimeout(typeNextChar, typingSpeed);
      }
    }

    typeNextChar();
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech Recognition not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        toast('🎙️ Listening...', { icon: '🎤' });
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        toast.success('Voice captured!');
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast.error('Voice recognition failed.');
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
  };

  const handleExportChats = async () => {
    if (chats.length === 0) {
      Swal.fire('No chats to export!', '', 'info');
      return;
    }
  
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleString();
  
    // Cover Page
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 180);
    doc.text('Chat History Export', 105, 60, { align: 'center' });
  
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exported on: ${currentDate}`, 105, 80, { align: 'center' });
  
    doc.setFontSize(12);
    doc.text('Exported by: YourAppName', 105, 90, { align: 'center' });
  
    doc.addPage();
  
    // Load images
    const userImg = await loadImageFromFile(userIcon);
    const aiImg = await loadImageFromFile(aiIcon);
  
    let y = 10;
  
    for (let index = 0; index < chats.length; index++) {
      const chat = chats[index];
  
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
  
      // Chat Header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Chat #${index + 1}`, 10, y);
      y += 8;
  
      // User Message
      doc.setDrawColor(0, 0, 255);
      doc.setFillColor(230, 240, 255);
      let userLines = doc.splitTextToSize(chat.user, 160);
      doc.rect(15, y, 180, (userLines.length * 7) + 10, 'FD');
  
      doc.addImage(userImg, 'PNG', 18, y + 4, 6, 6);
  
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 200);
      doc.text(`User (${chat.userTime}):`, 26, y + 9);
  
      doc.setFont('helvetica', 'normal');
      doc.text(userLines, 18, y + 16);
  
      y += (userLines.length * 7) + 16;
  
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
  
      // AI Message
      doc.setDrawColor(0, 150, 0);
      doc.setFillColor(230, 255, 230);
      let aiLines = doc.splitTextToSize(chat.ai, 160);
      doc.rect(15, y, 180, (aiLines.length * 7) + 10, 'FD');
  
      doc.addImage(aiImg, 'PNG', 18, y + 4, 6, 6);
  
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 150, 0);
      doc.text(`AI (${chat.aiTime}):`, 26, y + 9);
  
      doc.setFont('helvetica', 'normal');
      doc.text(aiLines, 18, y + 16);
  
      y += (aiLines.length * 7) + 20;
    }
  
    doc.save('chat-history.pdf');
    Swal.fire('Chats exported beautifully with avatars! 🎨', '', 'success');
  };
  
  const loadImageFromFile = (filePath) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = filePath;
    });
  };
  
  
  
  
  

  const handleClearChats = async () => {
    const result = await Swal.fire({
      title: 'Clear all chats?',
      text: "This action is permanent and cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear it!',
      background: darkMode ? '#111' : '#fff',
      color: darkMode ? '#f9f871' : '#333',
    });

    if (result.isConfirmed) {
      setChats([]);
      localStorage.removeItem('ai-chats');
      Swal.fire('Cleared!', 'All chats have been erased.', 'success');
      toast.success('All chats cleared!');
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, loading]);

  const theme = {
    backgroundImage: darkMode
      ? 'url(https://www.transparenttextures.com/patterns/dark-wood.png), linear-gradient(to right, rgb(22, 21, 21), rgb(51, 49, 49))'
      : 'url(https://www.transparenttextures.com/patterns/dark-wood.png), linear-gradient(to right, rgba(244, 24, 24, 0.99), rgb(18, 99, 240))',
    textColor: darkMode ? 'rgb(255, 243, 20)' : 'rgb(250, 246, 5)',
    inputBg: darkMode ? '#111' : '#f8f8f8',
    inputText: darkMode ? 'rgb(255, 243, 20)' : '#000',
    buttonBg: loading ? '#999' : darkMode ? '#FF2079' : '#141e30',
    chatBg: darkMode ? '#0f0f0f' : 'rgb(206, 233, 241)',
    userMsgBg: darkMode ? '#222' : 'rgb(38 36 36)',
    aiMsgBg: darkMode ? '#333' : '#333',
    iconColor: darkMode ? 'rgb(0, 255, 21, 0.78)' : 'rgb(4, 243, 24)'
  };

  return (
    <div style={{
      minHeight: '80vh',
      width: '1430px',
      maxWidth: '1430px',
      backgroundImage: theme.backgroundImage,
      backgroundRepeat: 'repeat',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      color: theme.textColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      fontFamily: "'Press Start 2P', cursive",
      overflowX: 'hidden',
      letterSpacing: '1px',
      transition: 'all 0.5s ease'
    }}>
      {/* Toasts */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: darkMode ? '#333' : '#fff',
            color: darkMode ? '#f9f871' : '#333',
            fontSize: '0.7rem',
            fontFamily: "'Press Start 2P', cursive",
          },
        }}
      />

      <button
        onClick={() => setDarkMode(prev => !prev)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '0.6rem 1.2rem',
          borderRadius: '10px',
          border: '2px solid',
          borderColor: theme.iconColor,
          backgroundColor: darkMode ? '#0f0f0f' : '#ffffff',
          color: theme.iconColor,
          cursor: 'pointer',
          fontSize: '0.7rem',
          zIndex: 1000
        }}>
        {darkMode ? "LIGHT 🌞" : "DARK 🌙"}
      </button>

      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        ASK AI 🤖
      </h1>

      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        width: '100%',
        maxWidth: '700px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          style={{
            flexGrow: 1,
            padding: '1rem',
            borderRadius: '10px',
            border: '2px solid rgb(255, 243, 20)',
            backgroundColor: theme.inputBg,
            color: theme.inputText,
            fontSize: '1rem',
            outline: 'none',
            boxShadow: '0 0 5px rgb(255, 243, 20)'
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          style={{
            padding: '1rem',
            borderRadius: '10px',
            border: '2px solid',
            backgroundColor: theme.buttonBg,
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <FaPaperPlane />
        </button>
        <button
          onClick={startListening}
          style={{
            padding: '1rem',
            borderRadius: '10px',
            border: '2px solid',
            backgroundColor: 'transparent',
            color: theme.iconColor,
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}>
          <FaMicrophoneAlt />
        </button>
        <button
          onClick={handleExportChats}
          style={{
            padding: '1rem',
            borderRadius: '10px',
            border: '2px solid',
            backgroundColor: 'transparent',
            color: theme.iconColor,
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}>
          <FaSatellite />
        </button>
        <button
          onClick={handleClearChats}
          style={{
            padding: '1rem',
            borderRadius: '10px',
            border: '2px solid',
            backgroundColor: 'transparent',
            color: theme.iconColor,
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}>
          <FaBroom />
        </button>
      </div>

      {/* Chat Messages */}
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        backgroundColor: theme.chatBg,
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        overflowY: 'auto',
        maxHeight: '65vh',
        boxSizing: 'border-box'
      }}>
        {chats.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#bbb' }}>Start chatting! 👾</p>
        ) : (
          chats.map((chat, index) => (
            <div key={index} style={{ marginBottom: '2rem', animation: 'bounce 0.6s' }}>
              <div style={{
                backgroundColor: theme.userMsgBg,
                padding: '1.2rem',
                borderRadius: '10px',
                marginBottom: '0.5rem',
                textAlign: 'right',
                whiteSpace: 'pre-wrap'
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                  <div>{chat.user}</div>
                  <FaUserAstronaut style={{ color: theme.iconColor }} />
                </div>
                <div style={{ fontSize: '0.35rem', marginTop: '0.5rem' }}>{chat.userTime}</div>
              </div>

              <div style={{
                backgroundColor: theme.aiMsgBg,
                padding: '1.1rem',
                borderRadius: '10px',
                textAlign: 'left',
                whiteSpace: 'pre-wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FaRobot style={{ color: theme.iconColor }} />
                  <div>{chat.ai}</div>
                </div>
                {chat.ai && (
                  <div style={{ fontSize: '0.35rem', marginTop: '0.5rem' }}>{chat.aiTime}</div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        button {
          transition: all 0.3s ease;
        }
        button:hover:not(:disabled) {
          transform: scale(1.05);
          background-color: #ffd700;
          color: #111;
        }
        button:disabled:hover {
          cursor: not-allowed;
          background-color: #999;
        }
        div > button:nth-child(3):hover {
          background-color: #00ff00;
          color: #111;
        }
        @media (max-width: 768px) {
          h1 {
            font-size: 1.2rem;
          }
          input, button {
            font-size: 0.6rem !important;
          }
          div[style*="max-width: 700px"] {
            flex-direction: column;
            gap: 0.5rem;
          }
          div[style*="max-width: 1000px"] {
            padding: 1rem;
            max-height: 60vh;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
