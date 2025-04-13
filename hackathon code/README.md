# Career Compass - Intelligent Virtual Career Advisor

Career Compass is an AI-powered platform that helps users choose appropriate careers based on their skills, market demands, and personal preferences. The application provides personalized career suggestions, skills assessment, networking opportunities, and resume/interview preparation assistance.

## Features

- **Skills Assessment:** Comprehensive questionnaire covering technical, soft, and industry-specific skills
- **AI Advisor:** Chatbot providing personalized career guidance and advice
- **Career Matching:** Algorithm that compares user skills with current job market demands
- **Resume & Interview Preparation:** Tips and resources tailored to specific career paths
- **Responsive Design:** Works seamlessly across desktop and mobile devices

## Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js with Express.js
- **Real-time Communication:** Socket.io
- **AI Integration:** OpenAI API (planned for production)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/career-compass.git
   cd career-compass
   ```

2. Install backend dependencies:

   ```
   cd backend\ js
   npm install
   ```

3. Create a `.env` file in the `backend js` directory with the following content:

   ```
   PORT=3000
   CORS_ORIGIN=*
   ```

4. Start the backend server:

   ```
   npm run dev
   ```

5. Open `index.html` in your browser or set up a local server to serve the static files.

## Project Structure

```
career-compass/
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── script.js           # Frontend JavaScript
├── backend js/         # Backend code
│   ├── server/         # Server configuration
│   ├── routes/         # API routes
│   ├── controllers/    # Business logic
│   ├── models/         # Data models
│   ├── package.json    # Backend dependencies
│   └── .env            # Environment variables
└── README.md           # This file
```

## Usage

1. Open the application in your browser.
2. Complete the skills assessment by rating your proficiency in various skills.
3. Receive personalized career recommendations based on your assessment.
4. Use the AI advisor chatbot to ask questions about specific careers or get guidance.
5. Explore resume tips and interview preparation resources.

## Development Roadmap

- [ ] Implement user authentication and profiles
- [ ] Integrate OpenAI API for more sophisticated AI advisor responses
- [ ] Add career path visualization with progression opportunities
- [ ] Create resume builder functionality
- [ ] Expand career database with more detailed information
- [ ] Implement job market trend analytics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Career data sources: [List your sources]
- Icons: Font Awesome
- Images: Unsplash
