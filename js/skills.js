document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Star rating system
  const ratings = document.querySelectorAll('.rating');
  const skillRatings = {};

  ratings.forEach(rating => {
    const stars = rating.querySelectorAll('i');
    
    stars.forEach(star => {
      // Hover effect
      star.addEventListener('mouseover', () => {
        const value = parseInt(star.getAttribute('data-rating'));
        highlightStars(stars, value);
      });

      star.addEventListener('mouseout', () => {
        const selectedValue = parseInt(rating.getAttribute('data-value')) || 0;
        highlightStars(stars, selectedValue);
      });

      // Click event
      star.addEventListener('click', () => {
        const value = parseInt(star.getAttribute('data-rating'));
        rating.setAttribute('data-value', value);
        highlightStars(stars, value);
        
        // Store the rating
        const skillItem = star.closest('.skill-item');
        const skillName = skillItem.querySelector('span').textContent;
        skillRatings[skillName] = value;

        // Save to localStorage
        localStorage.setItem('skillRatings', JSON.stringify(skillRatings));
      });
    });
  });

  // Load saved ratings if they exist
  const savedRatings = localStorage.getItem('skillRatings');
  if (savedRatings) {
    const parsed = JSON.parse(savedRatings);
    Object.keys(parsed).forEach(skillName => {
      const skillItem = Array.from(document.querySelectorAll('.skill-item')).find(
        item => item.querySelector('span').textContent === skillName
      );
      if (skillItem) {
        const rating = skillItem.querySelector('.rating');
        const stars = rating.querySelectorAll('i');
        const value = parsed[skillName];
        rating.setAttribute('data-value', value);
        highlightStars(stars, value);
        skillRatings[skillName] = value;
      }
    });
  }

  function highlightStars(stars, value) {
    stars.forEach(s => {
      const starValue = parseInt(s.getAttribute('data-rating'));
      if (starValue <= value) {
        s.classList.remove('far');
        s.classList.add('fas');
        s.classList.add('active');
      } else {
        s.classList.remove('fas');
        s.classList.add('far');
        s.classList.remove('active');
      }
    });
  }

  // Get recommendations button
  const getRecommendationsBtn = document.querySelector('.get-recommendations');
  getRecommendationsBtn.addEventListener('click', () => {
    // Check if user has rated at least 3 skills
    const ratedSkills = Object.keys(skillRatings).length;
    if (ratedSkills < 3) {
      const toast = document.createElement('div');
      toast.className = 'toast error';
      toast.textContent = 'Please rate at least 3 skills to get personalized recommendations.';
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.remove();
      }, 3000);
      return;
    }

    // Save ratings and redirect to AI advisor
    localStorage.setItem('skillRatings', JSON.stringify(skillRatings));
    window.location.href = 'ai-advisor.html';
  });
});
