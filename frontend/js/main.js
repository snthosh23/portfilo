/* Main Frontend JavaScript for Portfolio */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Toggle Logic
  const themeBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';

  // Set initial theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeBtn) return;
    const icon = themeBtn.querySelector('i');
    if (icon) {
      if (theme === 'dark') {
        icon.className = 'fas fa-sun';
      } else {
        icon.className = 'fas fa-moon';
      }
    }
  }

  // 2. Scroll Events (Navbar Styling, Back-to-Top, and Scroll Progress)
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('back-to-top');
  const progressBar = document.getElementById('scroll-progress-bar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }

    if (window.scrollY > 300) {
      backToTopBtn?.classList.add('show');
    } else {
      backToTopBtn?.classList.remove('show');
    }

    if (progressBar) {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 3. Mobile Hamburger Menu Toggle
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = hamburger.querySelector('i');
      if (icon) {
        icon.className = navMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
      }
    });

    // Close menu when clicking link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = hamburger.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });
  }

  // 4. Highlight Active Page Link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath === href || (href !== '/' && currentPath.includes(href))) {
      link.classList.add('active');
    }
  });

  // 5. Hero Mouse Parallax Effect
  const heroSection = document.querySelector('.hero-section');
  const heroImage = document.querySelector('.profile-img-wrapper');
  if (heroSection && heroImage) {
    heroSection.addEventListener('mousemove', (e) => {
      const x = (window.innerWidth / 2 - e.clientX) / 45;
      const y = (window.innerHeight / 2 - e.clientY) / 45;
      heroImage.style.transform = `translateX(${x}px) translateY(${y}px)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroImage.style.transform = 'translateX(0px) translateY(0px)';
    });
  }

  // 6. Dynamic Bio Loading
  fetchDeveloperProfile();

  // 7. Typewriter Effect (Homepage only)
  initializeTypewriter();

  // 8. Contact Form Dispatcher (Contact page only)
  initializeContactForm();

  // 9. Statistics Counter Fetcher (Homepage or About page only)
  initializeStatsCounter();
});

// Toast notification helper
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  
  let iconHtml = '<i class="fas fa-info-circle"></i>';
  if (type === 'success') {
    iconHtml = '<i class="fas fa-check-circle"></i>';
  } else if (type === 'error') {
    iconHtml = '<i class="fas fa-exclamation-circle"></i>';
  }

  toast.innerHTML = `${iconHtml}<span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Force reflow
  toast.offsetHeight;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 350);
  }, 4000);
}

// Fetch Profile and populate UI fields
async function fetchDeveloperProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const profile = await res.ok ? await res.json() : {};

    // Populate common UI fields if they exist
    const devNameElements = document.querySelectorAll('.dev-name');
    const devRoleElements = document.querySelectorAll('.dev-role');
    const devBioElements = document.querySelectorAll('.dev-bio');
    const devImageElements = document.querySelectorAll('.dev-image');
    
    devNameElements.forEach(el => el.textContent = profile.name);
    devRoleElements.forEach(el => el.textContent = profile.role);
    devBioElements.forEach(el => el.textContent = profile.bio);
    
    devImageElements.forEach(el => {
      if (el.tagName === 'IMG') {
        el.src = profile.profileImage;
        el.alt = profile.name;
      }
    });

    // Populate Resume buttons
    const resumeLinks = document.querySelectorAll('.dev-resume');
    resumeLinks.forEach(el => {
      el.href = profile.resumeUrl;
      el.setAttribute('target', '_blank');
    });

    // Populate Email
    const emailLinks = document.querySelectorAll('.dev-email');
    emailLinks.forEach(el => {
      if (profile.email) {
        el.href = `mailto:${profile.email}`;
        el.textContent = profile.email;
        el.style.display = '';
        const parentCard = el.closest('.contact-info-card');
        if (parentCard) parentCard.style.display = '';
      } else {
        if (el.classList.contains('social-icon')) {
          el.style.display = 'none';
        } else {
          const parentCard = el.closest('.contact-info-card');
          if (parentCard) parentCard.style.display = 'none';
          else el.style.display = 'none';
        }
      }
    });

    // Populate Social profiles
    const githubLinks = document.querySelectorAll('.dev-github');
    const cleanGithub = profile.githubUrl ? profile.githubUrl.replace(/https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, '') : '';
    githubLinks.forEach(el => {
      if (profile.githubUrl) {
        el.href = profile.githubUrl;
        if (!el.classList.contains('social-icon')) {
          el.textContent = cleanGithub ? `github.com/${cleanGithub}` : 'GitHub';
        }
        el.style.display = '';
        const parentCard = el.closest('.contact-info-card');
        if (parentCard) parentCard.style.display = '';
      } else {
        if (el.classList.contains('social-icon')) {
          el.style.display = 'none';
        } else {
          const parentCard = el.closest('.contact-info-card');
          if (parentCard) parentCard.style.display = 'none';
          else el.style.display = 'none';
        }
      }
    });

    const linkedinLinks = document.querySelectorAll('.dev-linkedin');
    const cleanLinkedIn = profile.linkedinUrl ? profile.linkedinUrl.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '') : '';
    linkedinLinks.forEach(el => {
      if (profile.linkedinUrl) {
        el.href = profile.linkedinUrl;
        if (!el.classList.contains('social-icon')) {
          el.textContent = cleanLinkedIn ? `linkedin.com/in/${cleanLinkedIn}` : 'LinkedIn';
        }
        el.style.display = '';
        const parentCard = el.closest('.contact-info-card');
        if (parentCard) parentCard.style.display = '';
      } else {
        if (el.classList.contains('social-icon')) {
          el.style.display = 'none';
        } else {
          const parentCard = el.closest('.contact-info-card');
          if (parentCard) parentCard.style.display = 'none';
          else el.style.display = 'none';
        }
      }
    });

    // Dynamic WhatsApp floating button injection & linkage
    const whatsappLinks = document.querySelectorAll('.dev-whatsapp');
    if (profile.whatsappNumber) {
      const cleanNum = profile.whatsappNumber.replace(/[^\d]/g, '');
      const waUrl = `https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(profile.name)},%20I%20visited%20your%20portfolio!`;
      
      whatsappLinks.forEach(el => {
        el.href = waUrl;
        el.style.display = '';
        if (!el.classList.contains('social-icon') && !el.classList.contains('whatsapp-float')) {
          el.textContent = `+${cleanNum}`;
        }
        const parentCard = el.closest('.contact-info-card');
        if (parentCard) parentCard.style.display = '';
      });

      // Inject floating WhatsApp button dynamically to body if not already present
      let floatBtn = document.getElementById('whatsapp-float-widget');
      if (!floatBtn) {
        floatBtn = document.createElement('a');
        floatBtn.id = 'whatsapp-float-widget';
        floatBtn.className = 'whatsapp-float dev-whatsapp';
        floatBtn.target = '_blank';
        floatBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
        document.body.appendChild(floatBtn);
      }
      floatBtn.href = waUrl;
      floatBtn.style.display = '';
    } else {
      whatsappLinks.forEach(el => {
        if (el.classList.contains('social-icon')) {
          el.style.display = 'none';
        } else {
          const parentCard = el.closest('.contact-info-card');
          if (parentCard) parentCard.style.display = 'none';
          else el.style.display = 'none';
        }
      });
      const floatBtn = document.getElementById('whatsapp-float-widget');
      if (floatBtn) floatBtn.style.display = 'none';
    }

    // Save developer settings in window object
    window.developerProfile = profile;
  } catch (error) {
    console.error('Error loading profile info:', error);
  }
}

// Typewriter animation
function initializeTypewriter() {
  const target = document.getElementById('typewriter-text');
  if (!target) return;

  const roles = [
    'Full Stack Developer',
    'Node.js & Express Specialist',
    'MongoDB Database Architect',
    'Modern Web Designer'
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let delay = 150;

  function type() {
    const currentRole = roles[roleIndex];
    if (isDeleting) {
      target.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
      delay = 50;
    } else {
      target.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
      delay = 100;
    }

    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      delay = 2000; // Wait before deleting
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 500; // Pause before typing next word
    }

    setTimeout(type, delay);
  }

  setTimeout(type, 1000);
}

// Contact Form Dispatcher
function initializeContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput = document.getElementById('form-name');
  const emailInput = document.getElementById('form-email');
  const subjectInput = document.getElementById('form-subject');
  const messageInput = document.getElementById('form-message');
  const charCount = document.getElementById('char-count');

  // Character Counter for Message Textarea
  if (messageInput && charCount) {
    messageInput.addEventListener('input', () => {
      charCount.textContent = messageInput.value.length;
    });
  }

  const validators = {
    name: () => {
      const val = nameInput.value.trim();
      const errEl = document.getElementById('name-error');
      if (val.length === 0) {
        showInputStatus(nameInput, errEl, 'Full name is required.', false);
        return false;
      } else if (val.length < 3) {
        showInputStatus(nameInput, errEl, 'Name must be at least 3 characters.', false);
        return false;
      } else if (val.length > 50) {
        showInputStatus(nameInput, errEl, 'Name cannot exceed 50 characters.', false);
        return false;
      }
      showInputStatus(nameInput, errEl, '', true);
      return true;
    },
    email: () => {
      const val = emailInput.value.trim();
      const errEl = document.getElementById('email-error');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (val.length === 0) {
        showInputStatus(emailInput, errEl, 'Email address is required.', false);
        return false;
      } else if (!emailRegex.test(val)) {
        showInputStatus(emailInput, errEl, 'Please enter a valid email address.', false);
        return false;
      }
      showInputStatus(emailInput, errEl, '', true);
      return true;
    },
    subject: () => {
      const val = subjectInput.value.trim();
      const errEl = document.getElementById('subject-error');
      if (val.length === 0) {
        showInputStatus(subjectInput, errEl, 'Subject is required.', false);
        return false;
      } else if (val.length < 5) {
        showInputStatus(subjectInput, errEl, 'Subject must be at least 5 characters.', false);
        return false;
      } else if (val.length > 100) {
        showInputStatus(subjectInput, errEl, 'Subject cannot exceed 100 characters.', false);
        return false;
      }
      showInputStatus(subjectInput, errEl, '', true);
      return true;
    },
    message: () => {
      const val = messageInput.value.trim();
      const errEl = document.getElementById('message-error');
      if (val.length === 0) {
        showInputStatus(messageInput, errEl, 'Message is required.', false);
        return false;
      } else if (val.length < 10) {
        showInputStatus(messageInput, errEl, 'Message must be at least 10 characters.', false);
        return false;
      } else if (val.length > 1000) {
        showInputStatus(messageInput, errEl, 'Message cannot exceed 1000 characters.', false);
        return false;
      }
      showInputStatus(messageInput, errEl, '', true);
      return true;
    }
  };

  function showInputStatus(inputEl, errorEl, message, isValid) {
    if (isValid) {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.add('is-valid');
      if (errorEl) errorEl.textContent = '';
    } else {
      inputEl.classList.remove('is-valid');
      inputEl.classList.add('is-invalid');
      if (errorEl) errorEl.textContent = message;
    }
  }

  // Bind validation listeners (input, blur)
  if (nameInput) {
    nameInput.addEventListener('input', validators.name);
    nameInput.addEventListener('blur', validators.name);
  }
  if (emailInput) {
    emailInput.addEventListener('input', validators.email);
    emailInput.addEventListener('blur', validators.email);
  }
  if (subjectInput) {
    subjectInput.addEventListener('input', validators.subject);
    subjectInput.addEventListener('blur', validators.subject);
  }
  if (messageInput) {
    messageInput.addEventListener('input', validators.message);
    messageInput.addEventListener('blur', validators.message);
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Run all validations
    const isNameValid = validators.name();
    const isEmailValid = validators.email();
    const isSubjectValid = validators.subject();
    const isMessageValid = validators.message();

    if (!isNameValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
      showToast('Please correct the errors before sending.', 'error');
      // Focus first invalid element
      if (!isNameValid) nameInput.focus();
      else if (!isEmailValid) emailInput.focus();
      else if (!isSubjectValid) subjectInput.focus();
      else if (!isMessageValid) messageInput.focus();
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value.trim();
    const message = messageInput.value.trim();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Your message has been sent successfully!', 'success');
        form.reset();
        
        // Reset classes
        [nameInput, emailInput, subjectInput, messageInput].forEach(el => {
          el.classList.remove('is-valid', 'is-invalid');
        });
        if (charCount) charCount.textContent = '0';
      } else {
        showToast(data.message || 'Failed to send message.', 'error');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Animate numbers for stats cards
async function initializeStatsCounter() {
  const statsElements = {
    projects: document.getElementById('stat-projects-count'),
    certificates: document.getElementById('stat-certs-count'),
    achievements: document.getElementById('stat-achievements-count')
  };

  // If none of these exist, skip
  if (!statsElements.projects && !statsElements.certificates && !statsElements.achievements) return;

  try {
    // Fetch counts from api in parallel
    const [projRes, certRes, achRes] = await Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/certificates').then(r => r.json()),
      fetch('/api/achievements').then(r => r.json())
    ]);

    const counts = {
      projects: Array.isArray(projRes) ? projRes.length : 4,
      certificates: Array.isArray(certRes) ? certRes.length : 3,
      achievements: Array.isArray(achRes) ? achRes.length : 5
    };

    // Update and animate
    animateNumber(statsElements.projects, counts.projects);
    animateNumber(statsElements.certificates, counts.certificates);
    animateNumber(statsElements.achievements, counts.achievements);
  } catch (error) {
    console.error('Error fetching statistics counts:', error);
  }
}

function animateNumber(element, targetNum) {
  if (!element) return;
  let currentNum = 0;
  const duration = 1000; // 1s
  const stepTime = Math.max(Math.floor(duration / (targetNum || 1)), 20);
  
  if (targetNum === 0) {
    element.textContent = '0';
    return;
  }

  const timer = setInterval(() => {
    currentNum += 1;
    element.textContent = currentNum;
    if (currentNum >= targetNum) {
      element.textContent = targetNum + '+';
      clearInterval(timer);
    }
  }, stepTime);
}
