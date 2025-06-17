document.addEventListener('DOMContentLoaded', () => {
  const dropArea = document.getElementById('dropArea');
  const dropText = document.getElementById('dropText');
  const fileName = document.getElementById('fileName');
  const fileInput = document.getElementById('fileInput');
  const uploadForm = document.getElementById('uploadForm');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const progressBar = document.querySelector('.progress-bar');

  // Drag-and-drop event listeners
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
    dropText.textContent = 'Drop your file here!';
  });

  dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    dropText.textContent = 'Drag & drop your resume here or click to upload';
    // Clear background color to rely on CSS
    dropArea.style.backgroundColor = '';
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    dropText.textContent = 'Drag & drop your resume here or click to upload';
    dropArea.style.backgroundColor = '';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileName.textContent = files[0].name;
      fileInput.files = files; // Update the file input with the dropped file
    }
  });

  // File input change event (for click-to-upload)
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      fileName.textContent = files[0].name;
    } else {
      fileName.textContent = '';
    }
  });

  // Form submission to show spinner and animate progress bar
  uploadForm.addEventListener('submit', (e) => {
    // Note: The form submission causes a page reload, so we can't directly hide the spinner
    // after the response. We're showing the spinner and starting the progress bar here.
    loadingSpinner.classList.remove('hidden');

    // Start progress bar animation
    progressBar.style.width = '100%';

    // Update aria-valuenow for accessibility
    let progress = 0;
    const duration = 3000; // 3 seconds, matching the CSS transition
    const increment = 100 / (duration / 50); // Update every 50ms
    const interval = setInterval(() => {
      progress = Math.min(progress + increment, 100);
      progressBar.setAttribute('aria-valuenow', Math.round(progress));
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 50);
  });

  // Ensure spinner and progress bar are reset on page load
  window.addEventListener('load', () => {
    loadingSpinner.classList.add('hidden');
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', '0');
  });
});