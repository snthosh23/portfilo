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
  toast.innerHTML = message;
  toastContainer.appendChild(toast);

  // Force reflow
  toast.offsetHeight;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
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

    // Populate Social profiles
    const githubLinks = document.querySelectorAll('.dev-github');
    githubLinks.forEach(el => el.href = profile.githubUrl);

    const linkedinLinks = document.querySelectorAll('.dev-linkedin');
    linkedinLinks.forEach(el => el.href = profile.linkedinUrl);

    // Dynamic WhatsApp floating button injection & linkage
    const whatsappLinks = document.querySelectorAll('.dev-whatsapp');
    if (profile.whatsappNumber) {
      const cleanNum = profile.whatsappNumber.replace(/[^\d]/g, '');
      const waUrl = `https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(profile.name)},%20I%20visited%20your%20portfolio!`;
      
      whatsappLinks.forEach(el => {
        el.href = waUrl;
        el.style.display = 'inline-flex';
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
    } else {
      whatsappLinks.forEach(el => el.style.display = 'none');
      const floatBtn = document.getElementById('whatsapp-float-widget');
      if (floatBtn) floatBtn.remove();
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const subject = document.getElementById('form-subject').value.trim();
    const message = document.getElementById('form-message').value.trim();

    if (!name || !email || !subject || !message) {
      showToast('All form fields are required!', 'error');
      return;
    }

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
