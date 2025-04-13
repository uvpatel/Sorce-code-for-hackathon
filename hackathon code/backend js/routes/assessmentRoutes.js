// assessmentRoutes.js - Routes for skills assessment functionality
const express = require('express');
const router = express.Router();

// Process skills assessment
router.post('/skills', (req, res) => {
    try {
        const { skills } = req.body;
        
        if (!skills) {
            return res.status(400).json({ error: 'Skills data is required' });
        }
        
        // Process skills assessment
        const results = processSkillsAssessment(skills);
        
        res.json({ success: true, results });
    } catch (error) {
        console.error('Error processing skills assessment:', error);
        res.status(500).json({ error: 'Failed to process skills assessment' });
    }
});

// Process skills and return recommendations (for API fallback)
router.post('/process', (req, res) => {
    try {
        const { skills } = req.body;
        
        if (!skills) {
            return res.status(400).json({ error: 'Skills data is required' });
        }
        
        // Process skills to get recommendations
        const results = processSkillsAssessment(skills);
        
        // Return just the recommendations for the frontend
        res.json({ 
            success: true, 
            recommendations: results.careerRecommendations 
        });
    } catch (error) {
        console.error('Error processing skills for recommendations:', error);
        res.status(500).json({ error: 'Failed to process skills for recommendations' });
    }
});

// Get skills for a specific career
router.get('/skills-for-career/:career', (req, res) => {
    try {
        const { career } = req.params;
        
        // Get required skills for career
        const skills = getSkillsForCareer(career);
        
        res.json({ success: true, skills });
    } catch (error) {
        console.error('Error fetching skills for career:', error);
        res.status(500).json({ error: 'Failed to fetch skills for career' });
    }
});

// Get trending skills in job market
router.get('/trending-skills', (req, res) => {
    try {
        // Get trending skills
        const trendingSkills = getTrendingSkills();
        
        res.json({ success: true, trendingSkills });
    } catch (error) {
        console.error('Error fetching trending skills:', error);
        res.status(500).json({ error: 'Failed to fetch trending skills' });
    }
});

// Helper function to process skills assessment (simplified for demo)
function processSkillsAssessment(skills) {
    // Calculate strongest skill categories
    const technicalSkills = ['programming', 'data-analysis', 'web-development', 'security', 'cloud'];
    const softSkills = ['communication', 'leadership', 'problem-solving', 'teamwork', 'adaptability'];
    const industrySkills = ['healthcare', 'finance', 'technology', 'marketing', 'education'];
    
    // Calculate average scores
    const technicalScore = calculateCategoryScore(skills, technicalSkills);
    const softScore = calculateCategoryScore(skills, softSkills);
    const industryScore = calculateCategoryScore(skills, industrySkills);
    
    // Find top industry
    let topIndustry = '';
    let topIndustryScore = 0;
    
    for (const skill of industrySkills) {
        if (skills[skill] > topIndustryScore) {
            topIndustryScore = skills[skill];
            topIndustry = skill;
        }
    }
    
    // Find strongest and weakest skills
    const allSkills = [...technicalSkills, ...softSkills, ...industrySkills];
    let strongestSkills = [];
    let weakestSkills = [];
    
    for (const skill of allSkills) {
        if (skills[skill] >= 4) {
            strongestSkills.push(skill);
        } else if (skills[skill] <= 2 && skills[skill] > 0) {
            weakestSkills.push(skill);
        }
    }
    
    // Limit to top 3 skills
    strongestSkills = strongestSkills.slice(0, 3);
    weakestSkills = weakestSkills.slice(0, 3);
    
    // Generate career recommendations
    const careerRecommendations = generateRecommendations(technicalScore, softScore, topIndustry);
    
    // Generate skill improvement recommendations
    const skillImprovements = generateSkillImprovements(weakestSkills);
    
    return {
        scores: {
            technical: technicalScore,
            soft: softScore,
            industry: industryScore
        },
        topIndustry,
        strongestSkills,
        weakestSkills,
        careerRecommendations,
        skillImprovements
    };
}

// Calculate average score for a category
function calculateCategoryScore(skills, category) {
    let total = 0;
    let count = 0;
    
    for (const skill of category) {
        if (skills[skill]) {
            total += skills[skill];
            count++;
        }
    }
    
    return count > 0 ? total / count : 0;
}

// Generate career recommendations
function generateRecommendations(technicalScore, softScore, topIndustry) {
    const recommendations = [];
    
    // Technical-focused careers
    if (technicalScore >= 4) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Healthcare IT Specialist');
            recommendations.push('Medical Data Analyst');
        } else if (topIndustry === 'finance') {
            recommendations.push('Financial Systems Analyst');
            recommendations.push('Blockchain Developer');
        } else if (topIndustry === 'technology') {
            recommendations.push('Software Engineer');
            recommendations.push('DevOps Engineer');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Marketing Technology Specialist');
            recommendations.push('Digital Marketing Analyst');
        } else if (topIndustry === 'education') {
            recommendations.push('Educational Technology Specialist');
            recommendations.push('E-Learning Developer');
        }
    } else if (technicalScore >= 3) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Health Informatics Specialist');
        } else if (topIndustry === 'finance') {
            recommendations.push('Financial Technology Consultant');
        } else if (topIndustry === 'technology') {
            recommendations.push('IT Project Manager');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Digital Marketing Manager');
        } else if (topIndustry === 'education') {
            recommendations.push('Instructional Designer');
        }
    }
    
    // Soft skills focused careers
    if (softScore >= 4) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Healthcare Administrator');
        } else if (topIndustry === 'finance') {
            recommendations.push('Financial Advisor');
        } else if (topIndustry === 'technology') {
            recommendations.push('Technology Consultant');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Brand Manager');
        } else if (topIndustry === 'education') {
            recommendations.push('Education Administrator');
        }
    } else if (softScore >= 3) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Health Services Coordinator');
        } else if (topIndustry === 'finance') {
            recommendations.push('Account Manager');
        } else if (topIndustry === 'technology') {
            recommendations.push('Customer Success Manager');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Communications Specialist');
        } else if (topIndustry === 'education') {
            recommendations.push('Academic Advisor');
        }
    }
    
    // If no strong preferences, add general recommendations
    if (recommendations.length === 0) {
        recommendations.push('Career Development Coach');
        recommendations.push('Administrative Coordinator');
        recommendations.push('Customer Service Representative');
    }
    
    return recommendations;
}

// Generate skill improvement recommendations
function generateSkillImprovements(weakSkills) {
    const improvements = {};
    
    const improvementSuggestions = {
        'programming': [
            'Take an online coding course on platforms like Codecademy or freeCodeCamp',
            'Work on small coding projects and share them on GitHub',
            'Join coding communities like Stack Overflow or Dev.to'
        ],
        'data-analysis': [
            'Learn SQL through online courses on Khan Academy or W3Schools',
            'Practice with datasets on Kaggle',
            'Take a course on data visualization tools like Tableau or PowerBI'
        ],
        'web-development': [
            'Build a personal website or portfolio',
            'Take courses on HTML, CSS, and JavaScript',
            'Contribute to open-source web projects'
        ],
        'security': [
            'Get CompTIA Security+ certification',
            'Learn about cybersecurity fundamentals through online courses',
            'Practice with CTF (Capture The Flag) challenges'
        ],
        'cloud': [
            'Pursue AWS, Azure, or Google Cloud certifications',
            'Set up cloud environments for personal projects',
            'Take specialized cloud computing courses'
        ],
        'communication': [
            'Join Toastmasters or other public speaking groups',
            'Practice writing clear and concise emails and documentation',
            'Seek feedback on your communication from peers and mentors'
        ],
        'leadership': [
            'Take initiative on projects at work or in volunteer settings',
            'Read books on leadership principles',
            'Find opportunities to mentor others'
        ],
        'problem-solving': [
            'Practice logic puzzles and coding challenges',
            'Use design thinking or other structured problem-solving approaches',
            'Analyze how you approach challenges and identify patterns'
        ],
        'teamwork': [
            'Participate in team projects or sports',
            'Practice active listening and constructive feedback',
            'Learn about team dynamics and conflict resolution'
        ],
        'adaptability': [
            'Step outside your comfort zone regularly',
            'Learn new tools and technologies',
            'Practice mindfulness to help manage change'
        ]
        // Add more skill improvements as needed
    };
    
    for (const skill of weakSkills) {
        if (improvementSuggestions[skill]) {
            improvements[skill] = improvementSuggestions[skill];
        }
    }
    
    return improvements;
}

// Helper function to get skills for a career (simplified for demo)
function getSkillsForCareer(career) {
    // Map of career skills
    const careerSkills = {
        'Software Engineer': {
            technical: ['Programming', 'Data Structures', 'Algorithms', 'Version Control', 'Testing'],
            soft: ['Problem Solving', 'Teamwork', 'Communication', 'Attention to Detail', 'Continuous Learning'],
            tools: ['Git', 'Docker', 'IDE', 'CI/CD Pipelines', 'Cloud Platforms']
        },
        'Data Analyst': {
            technical: ['SQL', 'Statistical Analysis', 'Data Visualization', 'Python/R', 'Data Cleaning'],
            soft: ['Analytical Thinking', 'Communication', 'Attention to Detail', 'Business Acumen', 'Critical Thinking'],
            tools: ['Excel', 'Tableau/Power BI', 'Python Libraries (Pandas, NumPy)', 'SQL Databases', 'Statistical Software']
        },
        'Healthcare Administrator': {
            technical: ['Healthcare Regulations', 'Medical Terminology', 'Clinical Workflows', 'Healthcare IT Systems', 'Budget Management'],
            soft: ['Leadership', 'Communication', 'Problem Solving', 'Empathy', 'Decision Making'],
            tools: ['Electronic Medical Records (EMR)', 'Healthcare Analytics', 'Scheduling Systems', 'Microsoft Office Suite', 'Project Management Software']
        }
        // Add more careers as needed
    };
    
    // Return skills for the specified career, or a message if not found
    return careerSkills[career] || { message: 'Career not found in database' };
}

// Helper function to get trending skills (simplified for demo)
function getTrendingSkills() {
    // Simulated trending skills data
    return {
        'technical': [
            { name: 'Machine Learning', growth: 35 },
            { name: 'Data Science', growth: 32 },
            { name: 'Cloud Computing', growth: 29 },
            { name: 'DevOps', growth: 24 },
            { name: 'Cybersecurity', growth: 22 }
        ],
        'soft': [
            { name: 'Adaptability', growth: 20 },
            { name: 'Emotional Intelligence', growth: 18 },
            { name: 'Critical Thinking', growth: 15 },
            { name: 'Creativity', growth: 14 },
            { name: 'Communication', growth: 12 }
        ],
        'tools': [
            { name: 'TensorFlow', growth: 30 },
            { name: 'Docker', growth: 28 },
            { name: 'Kubernetes', growth: 25 },
            { name: 'React', growth: 22 },
            { name: 'Power BI', growth: 20 }
        ]
    };
}

module.exports = router; 