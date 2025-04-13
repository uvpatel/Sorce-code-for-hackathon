// chatRoutes.js - Routes for chat/AI advisor functionality
const express = require('express');
const router = express.Router();
const openai = require('../config/openai');

// Process chat message and return response
router.post('/message', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Process the message using OpenAI
        const completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a career guidance advisor helping users with their career development. Provide helpful, professional advice about career paths, skill development, job searching, interviewing, and professional growth.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        });

        const response = completion.data.choices[0].message.content;
        
        res.json({ success: true, response });
    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

// Get interview preparation questions for a specific career
router.get('/interview-questions/:career', (req, res) => {
    try {
        const { career } = req.params;
        
        // Get interview questions
        const questions = getInterviewQuestions(career);
        
        res.json({ success: true, questions });
    } catch (error) {
        console.error('Error fetching interview questions:', error);
        res.status(500).json({ error: 'Failed to fetch interview questions' });
    }
});

// Get resume tips for a specific career
router.get('/resume-tips/:career', (req, res) => {
    try {
        const { career } = req.params;
        
        // Get resume tips
        const tips = getResumeTips(career);
        
        res.json({ success: true, tips });
    } catch (error) {
        console.error('Error fetching resume tips:', error);
        res.status(500).json({ error: 'Failed to fetch resume tips' });
    }
});

// Helper function to generate responses (simplified for demo)
function generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
        return 'To improve your resume, focus on quantifiable achievements rather than just listing job duties. Use action verbs, and tailor your resume for each job application by matching keywords from the job description.';
    } else if (lowerMessage.includes('interview')) {
        return 'For interview preparation, research the company thoroughly, prepare stories that demonstrate your skills, and practice the STAR method (Situation, Task, Action, Result) for answering behavioral questions.';
    } else if (lowerMessage.includes('networking')) {
        return 'To build your professional network, attend industry events, join relevant LinkedIn groups, and don\'t hesitate to reach out to people for informational interviews. Follow up with new connections to maintain relationships.';
    } else if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
        return 'To develop in-demand skills, consider online courses from platforms like Coursera, edX, or LinkedIn Learning. Look for skills that appear frequently in job postings for your target role.';
    } else if (lowerMessage.includes('thank')) {
        return 'You\'re welcome! I\'m happy to help with your career planning. Is there anything else you\'d like to know?';
    } else {
        return 'I\'m here to help with your career questions. You can ask me about resume tips, interview preparation, networking strategies, or specific careers you\'re interested in.';
    }
}

// Helper function to get interview questions (simplified for demo)
function getInterviewQuestions(career) {
    // Map of career interview questions
    const interviewQuestions = {
        'Software Engineer': [
            'Explain the difference between object-oriented and functional programming.',
            'How do you handle debugging complex issues in your code?',
            'Describe a challenging project you worked on and how you approached it.',
            'How do you stay updated with the latest technologies in software development?',
            'Can you explain your process for code reviews?'
        ],
        'Data Analyst': [
            'How do you approach cleaning and preparing data for analysis?',
            'Explain a time when you used data to solve a complex business problem.',
            'What tools and languages are you proficient in for data analysis?',
            'How do you ensure the accuracy of your analysis?',
            'How do you present technical findings to non-technical stakeholders?'
        ],
        'Healthcare Administrator': [
            'How do you stay current with healthcare regulations and policies?',
            'Describe a time when you had to manage conflicting priorities in a healthcare setting.',
            'How do you approach budget management for a healthcare department?',
            'What strategies do you use to improve patient satisfaction?',
            'How do you handle staff conflicts or performance issues?'
        ]
        // Add more careers as needed
    };
    
    // Return questions for the specified career, or general questions if not found
    const generalQuestions = [
        'Tell me about yourself and your background.',
        'What are your strengths and weaknesses?',
        'Why are you interested in this role?',
        'Where do you see yourself in 5 years?',
        'Describe a challenging situation you faced and how you resolved it.'
    ];
    
    return interviewQuestions[career] || generalQuestions;
}

// Helper function to get resume tips (simplified for demo)
function getResumeTips(career) {
    // Map of career-specific resume tips
    const resumeTips = {
        'Software Engineer': [
            'Highlight specific programming languages and technologies you\'re proficient in.',
            'Include links to your GitHub or portfolio showcasing your coding projects.',
            'Mention specific metrics or improvements from your projects (e.g., improved performance by 30%).',
            'List relevant certifications like AWS, Microsoft, or language-specific credentials.',
            'Include both technical skills and soft skills like teamwork and communication.'
        ],
        'Data Analyst': [
            'Showcase your technical skills with specific tools like SQL, Python, R, Tableau, etc.',
            'Highlight projects where you analyzed data to drive business decisions.',
            'Include quantifiable results from your analyses and visualizations.',
            'Mention your expertise with databases and data visualization tools.',
            'Include related certifications like Google Analytics or Tableau certifications.'
        ],
        'Healthcare Administrator': [
            'Highlight knowledge of healthcare regulations and compliance.',
            'Include experience with healthcare-specific software or EMR systems.',
            'Showcase achievements in improving operational efficiency or patient satisfaction.',
            'Include relevant healthcare certifications or licenses.',
            'Mention experience with budget management and staff supervision in healthcare settings.'
        ]
        // Add more careers as needed
    };
    
    // Return tips for the specified career, or general tips if not found
    const generalTips = [
        'Keep your resume concise and focused at 1-2 pages maximum.',
        'Tailor your resume for each job application, matching keywords from the job description.',
        'Use action verbs and quantify your achievements when possible.',
        'Proofread carefully for grammar and spelling errors.',
        'Include a professional summary at the top highlighting your key qualifications.'
    ];
    
    return resumeTips[career] || generalTips;
}

module.exports = router; 