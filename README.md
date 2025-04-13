# Career Compass

Welcome to the **Career Compass** repository! 🎉  
This project is designed to help users discover optimal career paths based on their skills and interests using AI-powered recommendations.  
It leverages modern web technologies and artificial intelligence to deliver personalized career guidance.

---

## 📖 Table of Contents

- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🚀 Project Overview

**Career Compass** is developed to help individuals navigate their career journeys with confidence through AI-powered guidance.  
Key features include:

- ✅ Skills Assessment - Evaluate your technical, soft, and industry-specific skills
- ✅ Personalized Career Recommendations - Get career suggestions based on your skill profile
- ✅ AI Career Advisor - Chat with an intelligent virtual career counselor for personalized advice
- ✅ User Authentication - Securely store your data and access it from anywhere

The goal of this project is to simplify career planning by providing data-driven insights and personalized recommendations.

---

## 🛠️ Technologies Used

| Technology          | Description                       |
| ------------------- | --------------------------------- |
| HTML/CSS/JavaScript | Frontend development              |
| Firebase            | Authentication and database       |
| Firebase Firestore  | NoSQL cloud database              |
| LocalStorage        | Client-side storage               |
| OpenAI API          | AI-powered conversational advisor |
| Socket.io           | Real-time communication           |

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

| Software     | Version | Command to Check     |
| ------------ | ------- | -------------------- |
| Node.js      | >=14.x  | `node -v`            |
| npm          | >=6.x   | `npm -v`             |
| Firebase CLI | >=9.x   | `firebase --version` |

---

## 📦 Installation

Follow these steps to set up the project locally:

```bash
# Clone the repository
   git clone https://github.com/yourusername/career-compass.git

# Navigate into the project directory
   cd career-compass

# Install dependencies (if using npm)
   npm install

# Configure Firebase
# Create a .env file with your Firebase configuration
```

## ⚙️ Configuration

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication with Email/Password and Google sign-in methods
3. Create a Firestore database
4. Replace the Firebase configuration in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## 🚀 Usage

To run the application locally:

```bash
# Using a local server (e.g., with Node.js http-server)
npx http-server

# Or simply open index.html in your browser
```

## 💡 Features

### Skills Assessment

- Rate your proficiency in technical skills, soft skills, and industry knowledge
- Visualize your strengths and areas for improvement
- Get personalized recommendations based on your skills profile

### AI Career Advisor

- Chat with an AI-powered virtual career counselor
- Get answers to your career-related questions
- Receive personalized advice based on your skills and interests

### User Authentication

- Create an account to save your progress
- Login with email/password or Google account
- Access your data from any device

## 📁 Project Structure

```
career-compass/
├── index.html         # Main landing page
├── login.html         # User authentication page
├── ai-advisor.html    # AI chat interface
├── style.css          # Main styles
├── auth.css           # Authentication page styles
├── script.js          # Main JavaScript file
├── firebase-config.js # Firebase configuration
├── firestore-utils.js # Firestore database utilities
└── ai-advisor.js      # AI advisor functionality
```

## ❓ Troubleshooting

Common issues and solutions:

- **Authentication errors**: Ensure your Firebase configuration is correct and authentication methods are enabled in the Firebase console.
- **AI Advisor not working**: Check your browser console for errors. The AI advisor requires a valid API connection.
- **Skills assessment not saving**: Verify you're logged in, as skill data requires authentication to save to your profile.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Project Link: [https://github.com/yourusername/career-compass](https://github.com/yourusername/career-compass)

---

Made with ❤️ by the Career Compass Team
