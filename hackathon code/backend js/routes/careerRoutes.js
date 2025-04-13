// careerRoutes.js - Routes for career-related functionality
const express = require('express');
const router = express.Router();

// Get career recommendations based on skills
router.post('/recommendations', (req, res) => {
    try {
        const { skills } = req.body;
        
        if (!skills) {
            return res.status(400).json({ error: 'Skills data is required' });
        }
        
        // Process skills to get recommendations
        const recommendations = processSkills(skills);
        
        res.json({ success: true, recommendations });
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// Get details about a specific career
router.get('/details/:career', (req, res) => {
    try {
        const { career } = req.params;
        
        // Get career details
        const details = getCareerDetails(career);
        
        if (!details) {
            return res.status(404).json({ error: 'Career not found' });
        }
        
        res.json({ success: true, details });
    } catch (error) {
        console.error('Error fetching career details:', error);
        res.status(500).json({ error: 'Failed to fetch career details' });
    }
});

// Get market demand data for careers
router.get('/market-demand', (req, res) => {
    try {
        // Get market demand data
        const marketData = getMarketDemandData();
        
        res.json({ success: true, marketData });
    } catch (error) {
        console.error('Error fetching market demand data:', error);
        res.status(500).json({ error: 'Failed to fetch market demand data' });
    }
});

// Helper function to process skills and generate recommendations
function processSkills(skills) {
    // Calculate strongest skill categories
    const technicalSkills = ['programming', 'data-analysis', 'web-development', 'security', 'cloud'];
    const softSkills = ['communication', 'leadership', 'problem-solving', 'teamwork', 'adaptability'];
    const industrySkills = ['healthcare', 'finance', 'technology', 'marketing', 'education'];
    
    // Calculate average scores
    const technicalScore = calculateCategoryScore(skills, technicalSkills);
    const softScore = calculateCategoryScore(skills, softSkills);
    
    // Find top industry
    let topIndustry = '';
    let topIndustryScore = 0;
    
    for (const skill of industrySkills) {
        if (skills[skill] > topIndustryScore) {
            topIndustryScore = skills[skill];
            topIndustry = skill;
        }
    }
    
    // Generate recommendations based on skills
    return generateRecommendations(technicalScore, softScore, topIndustry);
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

// Helper function to get career details (simplified for demo)
function getCareerDetails(career) {
    // Map of career details
    const careerDetails = {
        'Software Engineer': {
            description: 'Software engineers design, develop, and maintain software systems and applications.',
            skills: ['Programming', 'Problem Solving', 'Debugging', 'Algorithm Design', 'Software Architecture'],
            education: 'Bachelor\'s degree in Computer Science or related field',
            salary: '$90,000 - $150,000',
            growth: 'Faster than average (22% through 2029)',
            paths: ['Senior Software Engineer', 'Software Architect', 'Engineering Manager', 'CTO']
        },
        'Data Analyst': {
            description: 'Data analysts collect, process, and analyze data to help organizations make better decisions.',
            skills: ['SQL', 'Data Visualization', 'Statistical Analysis', 'Excel', 'Critical Thinking'],
            education: 'Bachelor\'s degree in Analytics, Statistics, or related field',
            salary: '$65,000 - $110,000',
            growth: 'Much faster than average (31% through 2029)',
            paths: ['Senior Data Analyst', 'Data Scientist', 'Business Intelligence Manager', 'Analytics Director']
        },
        'Healthcare Administrator': {
            description: 'Healthcare administrators manage healthcare facilities, departments, or medical practices.',
            skills: ['Leadership', 'Healthcare Regulations', 'Budgeting', 'Communication', 'Strategic Planning'],
            education: 'Bachelor\'s or Master\'s degree in Healthcare Administration',
            salary: '$70,000 - $120,000',
            growth: 'Faster than average (32% through 2029)',
            paths: ['Department Director', 'Chief Operating Officer', 'Healthcare Executive', 'Hospital CEO']
        }
        // Add more career details as needed
    };
    
    // Return career details if found, otherwise return a default message
    return careerDetails[career] || null;
}

// Helper function to get market demand data (simplified for demo)
function getMarketDemandData() {
    // Simulated market demand data
    return {
        'technology': {
            growth: 22,
            demand: 'High',
            topSkills: ['JavaScript', 'Python', 'Cloud Computing', 'Data Analysis', 'Machine Learning']
        },
        'healthcare': {
            growth: 15,
            demand: 'Very High',
            topSkills: ['Patient Care', 'Electronic Medical Records', 'Healthcare IT', 'Medical Terminology', 'Healthcare Administration']
        },
        'finance': {
            growth: 8,
            demand: 'Moderate',
            topSkills: ['Financial Analysis', 'Risk Management', 'Accounting', 'Blockchain', 'Regulatory Compliance']
        },
        'marketing': {
            growth: 10,
            demand: 'Moderate',
            topSkills: ['Digital Marketing', 'Social Media', 'SEO', 'Content Strategy', 'Data Analytics']
        },
        'education': {
            growth: 5,
            demand: 'Stable',
            topSkills: ['Instructional Design', 'E-Learning', 'Educational Technology', 'Curriculum Development', 'Student Assessment']
        }
    };
}

module.exports = router; 