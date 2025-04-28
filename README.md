AI Assistant
A simple yet powerful AI Assistant project with separate Frontend and Backend components.
Built using HTML, CSS, JavaScript, and Node.js.


🌐 Project Links
repository link: https://github.com/CSR37/ai-assistant


✨ Features
Interactive assistant that understands user input
Clean and responsive user interface
Backend server handling and processing AI responses
Easy to extend with more functionality (e.g., APIs, AI models)
Lightweight and beginner-friendly


🛠️ Tech Stack
Frontend	     Backend
 HTML	          Node.js
 CSS	          Express.js
 JavaScript     Groq API

 
📂 Project Structure
Frontend:
/client
├── index.html      # Main HTML structure
├── style.css       # Stylesheet for UI
└── script.js       # JavaScript for handling user events and communication with backend

Backend:
/server
├── server.js       # Main server file (Express app)
├── package.json    # Project configuration and dependencies


Instructions for deployment:
1. While deploying first you have to deploy in render backend without .env file and add env variables in render while deploying. then you will receive the deployed url of server.

2. Add this url to app.jsx in client in api call then deploy frontend with no env files, no need to run build file for deployment it will automatically happen in netlify/ vercel.

3. Also don't forget to mention base directories in both render/netlify while deploying if our client and server are both in the same repo.
   Render: base directory is /server
   Netlify: base directory is /client

4. Also get your own api key for Groq(Free tier availaible as of april 2025).



📜 Credits
1.  Groq API(https://groq.com/) — This project uses the Groq API for AI-powered responses. Special thanks to Groq for providing fast and efficient model inference.
Built using: React.js, Node.js, Express.js, HTML, CSS, and JavaScript.

2. Deployed with: Render (for backend) and Netlify (for frontend). 
