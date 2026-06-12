/* Admin Dashboard JavaScript Logic */

// Global variables
let authToken = localStorage.getItem('token');
let projects = [];
let certificates = [];
let achievements = [];
let messages = [];
let chartInstances = {};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auth Guard Checks
  if (!authToken) {
    window.location.href = '/admin/login';
    return;
  }
  verifyAuthentication();

  // 2. Tab Navigation Logic (Sidebar)
  const navLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const panels = document.querySelectorAll('.dash-tab-panel');
  const tabTitle = document.getElementById('tab-title');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.getAttribute('data-tab');
      setActiveTab(tab);
    });
  });

  // Mobile Bottom Tab Navigation Switcher
  const mobileBtns = document.querySelectorAll('.mobile-dash-btn');
  mobileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      setActiveTab(tab);
    });
  });

  function setActiveTab(tab) {
    // Sync sidebar active links
    navLinks.forEach(l => {
      if (l.getAttribute('data-tab') === tab) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });

    // Sync mobile bottom buttons active status
    mobileBtns.forEach(b => {
      if (b.getAttribute('data-tab') === tab) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Update panel visibility
    panels.forEach(p => p.classList.remove('active'));
    const activePanel = document.getElementById(`panel-${tab}`);
    if (activePanel) activePanel.classList.add('active');

    // Update panel header title
    if (tabTitle) {
      tabTitle.textContent = getTabHeaderText(tab);
    }

    // Trigger specific load scripts depending on selected tab
    triggerTabLoad(tab);

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.remove('show');
  }

  function getTabHeaderText(tab) {
    switch (tab) {
      case 'overview': return 'Dashboard Overview';
      case 'projects': return 'Website Management';
      case 'certificates': return 'Certificate Management';
      case 'achievements': return 'Achievement Management';
      case 'profile': return 'Profile Settings';
      case 'inbox': return 'Inbox Inquiries';
      default: return 'Admin Panel';
    }
  }

  // 3. Theme Toggle Sync
  const themeBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      // Re-render charts to sync theme colors
      setTimeout(rebuildCharts, 200);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeBtn) return;
    const icon = themeBtn.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // 4. Mobile sidebar toggle
  const hamburger = document.getElementById('dash-hamburger');
  const sidebar = document.getElementById('sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
  }

  // 5. Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      showToast('Logged out successfully.', 'success');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 1000);
    });
  }

  // 6. Register Form Submit Listeners & Drag Drop Boxes
  registerFormListeners();
  setupDragAndDropZones();
  setupTableSearchControls();

  // Load initial Overview stats
  loadOverviewStats();

  // Setup dynamic Profile settings event listeners
  document.getElementById('add-skill-field-btn')?.addEventListener('click', () => renderSkillRow());
  document.getElementById('add-edu-field-btn')?.addEventListener('click', () => renderTimelineRow('education-edit-container'));
  document.getElementById('add-exp-field-btn')?.addEventListener('click', () => renderTimelineRow('experience-edit-container'));

  // Event delegation to remove dynamic fields
  document.getElementById('profile-settings-form')?.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-field-btn');
    if (removeBtn) {
      const row = removeBtn.closest('.skill-edit-row, .timeline-edit-row');
      if (row) row.remove();
    }
  });
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
  toast.innerHTML = `<i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'}"></i> ${message}`;
  toastContainer.appendChild(toast);

  // Force reflow
  toast.offsetHeight;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Check if current token is valid
async function verifyAuthentication() {
  try {
    const res = await fetch('/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!res.ok) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
  } catch (err) {
    console.error('Auth verification error:', err);
    localStorage.removeItem('token');
    window.location.href = '/admin/login';
  }
}

// Fetch resources for tab dynamically
function triggerTabLoad(tab) {
  switch (tab) {
    case 'overview':
      loadOverviewStats();
      break;
    case 'projects':
      loadProjectsTable();
      break;
    case 'certificates':
      loadCertificatesTable();
      break;
    case 'achievements':
      loadAchievementsTable();
      break;
    case 'profile':
      loadProfileForm();
      break;
    case 'inbox':
      loadInboxMessages();
      break;
  }
}

/* ========================================================================= */
/* Overview Stats & Chart.js Visualizations                                  */
/* ========================================================================= */
async function loadOverviewStats() {
  try {
    const [projRes, certRes, achRes, msgRes, profRes] = await Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/certificates').then(r => r.json()),
      fetch('/api/achievements').then(r => r.json()),
      fetch('/api/messages', { headers: { 'Authorization': `Bearer ${authToken}` } }).then(r => r.json()),
      fetch('/api/profile').then(r => r.json())
    ]);

    projects = Array.isArray(projRes) ? projRes : [];
    certificates = Array.isArray(certRes) ? certRes : [];
    achievements = Array.isArray(achRes) ? achRes : [];
    messages = Array.isArray(msgRes) ? msgRes : [];

    const visitorsCount = profRes && profRes.visitorsCount ? profRes.visitorsCount : 0;

    document.getElementById('overview-visitors-count').textContent = visitorsCount;
    document.getElementById('overview-projects-count').textContent = projects.length;
    document.getElementById('overview-certs-count').textContent = certificates.length;
    document.getElementById('overview-achievements-count').textContent = achievements.length;
    document.getElementById('overview-messages-count').textContent = messages.length;

    // Update unread count indicator in sidebar
    const unreadEl = document.getElementById('unread-count');
    if (unreadEl) {
      if (messages.length > 0) {
        unreadEl.textContent = messages.length;
        unreadEl.style.display = 'inline-block';
      } else {
        unreadEl.style.display = 'none';
      }
    }

    // Build Chart.js widgets
    renderAnalyticsCharts(visitorsCount, messages, projects);

  } catch (err) {
    console.error('Error fetching overview counts:', err);
  }
}

function renderAnalyticsCharts(visitorsCount, messageList, projectList) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textPrimary = isDark ? '#F3F4F6' : '#1F2937';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const gridBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  // Destroy previous instances if they exist
  if (chartInstances.visitorChart) chartInstances.visitorChart.destroy();
  if (chartInstances.categoryChart) chartInstances.categoryChart.destroy();

  // 1. Visitor and Message Analytics Chart
  const vCtx = document.getElementById('visitorChart')?.getContext('2d');
  if (vCtx) {
    // Generate trend metrics
    const visitorPoints = [
      Math.round(visitorsCount * 0.15),
      Math.round(visitorsCount * 0.35),
      Math.round(visitorsCount * 0.52),
      Math.round(visitorsCount * 0.73),
      Math.round(visitorsCount * 0.88),
      visitorsCount
    ];
    const messagePoints = [
      Math.round(messageList.length * 0.2),
      Math.round(messageList.length * 0.3),
      Math.round(messageList.length * 0.4),
      Math.round(messageList.length * 0.7),
      Math.round(messageList.length * 0.9),
      messageList.length
    ];

    chartInstances.visitorChart = new Chart(vCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Web Visitors',
            data: visitorPoints,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            borderWidth: 3,
            tension: 0.35,
            fill: true
          },
          {
            label: 'Messages',
            data: messagePoints,
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textPrimary, font: { family: 'Inter', weight: '500' } }
          }
        },
        scales: {
          x: {
            grid: { color: gridBorder },
            ticks: { color: textMuted }
          },
          y: {
            grid: { color: gridBorder },
            ticks: { color: textMuted, precision: 0 }
          }
        }
      }
    });
  }

  // 2. Category Pie Chart
  const cCtx = document.getElementById('categoryChart')?.getContext('2d');
  if (cCtx) {
    const categories = {
      'Web Applications': 0,
      'Full Stack': 0,
      'AI Projects': 0,
      'Academic Projects': 0
    };
    projectList.forEach(p => {
      const cat = p.category || 'Web Applications';
      if (categories[cat] !== undefined) {
        categories[cat]++;
      } else {
        categories['Web Applications']++;
      }
    });

    chartInstances.categoryChart = new Chart(cCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B'],
          borderWidth: isDark ? 2 : 1,
          borderColor: isDark ? '#0F1527' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: textPrimary, font: { family: 'Inter', size: 11 } }
          }
        },
        cutout: '65%'
      }
    });
  }
}

function rebuildCharts() {
  const profCount = parseInt(document.getElementById('overview-visitors-count').textContent) || 0;
  renderAnalyticsCharts(profCount, messages, projects);
}

/* ========================================================================= */
/* Projects / Websites CRUD                                                  */
/* ========================================================================= */
async function loadProjectsTable() {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

  try {
    const res = await fetch('/api/projects');
    projects = await res.json();

    renderProjectsTableRows(projects);
  } catch (err) {
    console.error('Projects table render error:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#EF4444;">Failed to load websites list.</td></tr>';
  }
}

function renderProjectsTableRows(list) {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No websites matched search query.</td></tr>';
    return;
  }

  list.forEach(project => {
    const techList = project.technologies.slice(0, 3).map(tech => `<span class="tech-tag" style="margin:2px; font-size:10px; padding:2px 8px;">${tech}</span>`).join('');
    
    const row = `
      <tr>
        <td><img src="${project.image}" alt="Preview" class="table-img" onerror="this.src='/images/default-project.jpg'"></td>
        <td style="font-weight:600;">${project.title}</td>
        <td><span class="tech-tag" style="background:#2563EB; color:white;">${project.category || 'Web Applications'}</span></td>
        <td>${techList} ${project.technologies.length > 3 ? '...' : ''}</td>
        <td>${project.order}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-edit btn-sm" onclick="openEditModal('project', '${project._id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteResource('project', '${project._id}')">
              <i class="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

/* ========================================================================= */
/* Certificates CRUD                                                         */
/* ========================================================================= */
async function loadCertificatesTable() {
  const tbody = document.getElementById('certs-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

  try {
    const res = await fetch('/api/certificates');
    certificates = await res.json();

    renderCertificatesTableRows(certificates);
  } catch (err) {
    console.error('Certs table load error:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#EF4444;">Failed to load certificates list.</td></tr>';
  }
}

function renderCertificatesTableRows(list) {
  const tbody = document.getElementById('certs-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No certificates matched search query.</td></tr>';
    return;
  }

  list.forEach(cert => {
    const row = `
      <tr>
        <td><img src="${cert.image}" alt="Preview" class="table-img" onerror="this.src='/images/default-certificate.jpg'"></td>
        <td style="font-weight:600;">${cert.title}</td>
        <td>${cert.issuer}</td>
        <td><code>${cert.credentialId || 'N/A'}</code></td>
        <td>${cert.issueDate}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-edit btn-sm" onclick="openEditModal('certificate', '${cert._id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteResource('certificate', '${cert._id}')">
              <i class="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

/* ========================================================================= */
/* Achievements CRUD                                                         */
/* ========================================================================= */
async function loadAchievementsTable() {
  const tbody = document.getElementById('achievements-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

  try {
    const res = await fetch('/api/achievements');
    achievements = await res.json();

    renderAchievementsTableRows(achievements);
  } catch (err) {
    console.error('Achievements load error:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#EF4444;">Failed to load achievements list.</td></tr>';
  }
}

function renderAchievementsTableRows(list) {
  const tbody = document.getElementById('achievements-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No achievements matched search query.</td></tr>';
    return;
  }

  list.forEach(ach => {
    const row = `
      <tr>
        <td><img src="${ach.image}" alt="Preview" class="table-img" onerror="this.src='/images/default-achievement.jpg'"></td>
        <td style="font-weight:600;">${ach.title}</td>
        <td><span class="ach-category-tag ach-tag-${ach.category ? ach.category.toLowerCase() : 'award'}">${ach.category}</span></td>
        <td>${ach.organization}</td>
        <td>${ach.date}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-edit btn-sm" onclick="openEditModal('achievement', '${ach._id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteResource('achievement', '${ach._id}')">
              <i class="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

/* ========================================================================= */
/* Profile Settings Settings Form                                            */
/* ========================================================================= */
async function loadProfileForm() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const profile = await res.json();

    // Prefill form values
    document.getElementById('profile-name').value = profile.name || '';
    document.getElementById('profile-role').value = profile.role || '';
    document.getElementById('profile-bio').value = profile.bio || '';
    document.getElementById('profile-github').value = profile.githubUrl || '';
    document.getElementById('profile-linkedin').value = profile.linkedinUrl || '';
    document.getElementById('profile-whatsapp').value = profile.whatsappNumber || '';
    document.getElementById('profile-email').value = profile.email || '';

    // Reset drag drop files preview states
    document.querySelectorAll('.drag-drop-box').forEach(box => {
      resetDragDropBox(box);
    });

    // Populate dynamic skills and timelines
    const skillsContainer = document.getElementById('skills-edit-container');
    const eduContainer = document.getElementById('education-edit-container');
    const expContainer = document.getElementById('experience-edit-container');

    if (skillsContainer) {
      skillsContainer.innerHTML = '';
      if (profile.skills && profile.skills.length > 0) {
        profile.skills.forEach(s => renderSkillRow(s));
      }
    }

    if (eduContainer) {
      eduContainer.innerHTML = '';
      if (profile.education && profile.education.length > 0) {
        profile.education.forEach(e => renderTimelineRow('education-edit-container', e));
      }
    }

    if (expContainer) {
      expContainer.innerHTML = '';
      if (profile.experience && profile.experience.length > 0) {
        profile.experience.forEach(ex => renderTimelineRow('experience-edit-container', ex));
      }
    }
  } catch (err) {
    console.error('Error prefilling profile form:', err);
    showToast('Failed to load profile settings.', 'error');
  }
}

/* ========================================================================= */
/* Inbox Messages Management                                                */
/* ========================================================================= */
async function loadInboxMessages() {
  const container = document.getElementById('inbox-messages-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:12px;">Loading inbox...</p></div>';

  try {
    const res = await fetch('/api/messages', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    messages = await res.json();

    renderInboxMessages(messages);
  } catch (err) {
    console.error('Inbox loading error:', err);
    container.innerHTML = '<div style="text-align:center; padding:40px; color:#EF4444;">Failed to load inbox messages.</div>';
  }
}

function renderInboxMessages(list) {
  const container = document.getElementById('inbox-messages-container');
  if (!container) return;

  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary);">No messages matches the query.</div>';
    return;
  }

  list.forEach(msg => {
    const formattedDate = new Date(msg.createdAt).toLocaleString();
    const item = `
      <div class="glass-card message-item">
        <button class="delete-message-btn" onclick="deleteResource('message', '${msg._id}')" title="Delete Message">
          <i class="fas fa-trash-alt"></i>
        </button>
        <div class="message-item-header">
          <div class="message-sender">
            <h4>${msg.name}</h4>
            <p><i class="far fa-envelope"></i> <a href="mailto:${msg.email}" style="color:var(--primary-blue); text-decoration:none;">${msg.email}</a></p>
          </div>
          <span class="message-date">${formattedDate}</span>
        </div>
        <div style="font-weight:600; margin-bottom:8px;">Subject: ${msg.subject}</div>
        <div class="message-body">
          ${msg.message}
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', item);
  });
}

/* ========================================================================= */
/* Modal Windows & Form Controls - CRITICAL ID BUG FIXES                     */
/* ========================================================================= */
function resetDragDropBox(box) {
  if (!box) return;
  box.classList.remove('has-file');
  box.classList.remove('dragover');
  const span = box.querySelector('span');
  if (span) {
    if (box.id.includes('image') || box.id.includes('img') || box.id.includes('profile')) {
      span.textContent = 'Drag & drop image here or click to browse';
    } else if (box.id.includes('resume')) {
      span.textContent = 'Drag & drop PDF here or click to browse';
    } else {
      span.textContent = 'Drag & drop image here or click to browse';
    }
  }
  const img = box.querySelector('.drag-drop-preview-img');
  if (img) img.style.display = 'none';
  const icon = box.querySelector('i');
  if (icon) icon.style.display = 'block';
}

window.openAddModal = function(type) {
  const modal = document.getElementById(`${type}-modal`);
  const form = document.getElementById(`${type}-form`);
  const idType = type === 'certificate' ? 'cert' : type === 'achievement' ? 'ach' : type;
  
  if (form) {
    form.reset();
    
    // BUG RESOLVED: Correct selector for specific resource ID fields
    const idField = form.querySelector(`#${idType}-id`);
    if (idField) idField.value = '';
    
    // Reset drag drop states
    const dropBox = form.querySelector('.drag-drop-box');
    if (dropBox) {
      resetDragDropBox(dropBox);
    }
  }

  // Hide edit preview block
  const previewBlock = document.getElementById(`${idType}-edit-preview`);
  if (previewBlock) previewBlock.style.display = 'none';

  // Update modal header title text
  const title = document.getElementById(`${idType}-modal-title`);
  if (title) {
    title.textContent = `Add New ${type === 'project' ? 'Website' : capitalize(type)}`;
  }

  modal?.classList.add('show');
};

window.openEditModal = async function(type, id) {
  const modal = document.getElementById(`${type}-modal`);
  const form = document.getElementById(`${type}-form`);
  if (!modal || !form) return;

  form.reset();

  const titleType = type === 'certificate' ? 'cert' : type === 'achievement' ? 'ach' : type;

  // Reset drag drop state text
  const dropBox = form.querySelector('.drag-drop-box');
  if (dropBox) {
    resetDragDropBox(dropBox);
    const span = dropBox.querySelector('span');
    if (span) span.textContent = 'Drag & drop new image to overwrite, or leave empty';
  }

  // BUG RESOLVED: Correct selector mapping for modal edit titles
  const titleEl = document.getElementById(`${titleType}-modal-title`);
  if (titleEl) titleEl.textContent = `Edit ${type === 'project' ? 'Website' : capitalize(type)}`;

  try {
    const res = await fetch(`/api/${type}s/${id}`);
    if (!res.ok) {
      showToast('Failed to fetch details.', 'error');
      return;
    }
    const item = await res.json();

    // BUG RESOLVED: Correct selector mapping for ID inputs
    const idField = document.getElementById(`${titleType}-id`);
    if (idField) idField.value = item._id;

    // Show current image edit preview if available
    const previewBlock = document.getElementById(`${titleType}-edit-preview`);
    const previewImg = document.getElementById(`${titleType}-edit-preview-img`);
    const previewLink = document.getElementById(`${titleType}-edit-preview-link`);
    
    const defaultImg = type === 'project' ? '/images/default-project.jpg' : type === 'certificate' ? '/images/default-certificate.jpg' : '/images/default-achievement.jpg';
    const itemImg = item.image && item.image !== defaultImg ? item.image : '';

    if (previewBlock && previewImg && itemImg) {
      previewImg.src = itemImg;
      if (previewLink) previewLink.href = itemImg;
      previewBlock.style.display = 'flex';
    } else if (previewBlock) {
      previewBlock.style.display = 'none';
    }

    if (type === 'project') {
      document.getElementById('project-title-input').value = item.title;
      document.getElementById('project-category-input').value = item.category || 'Web Applications';
      document.getElementById('project-desc-input').value = item.description;
      document.getElementById('project-tech-input').value = item.technologies.join(', ');
      document.getElementById('project-github-input').value = item.githubUrl || '';
      document.getElementById('project-live-input').value = item.liveUrl || '';
      document.getElementById('project-order-input').value = item.order || 0;
    } 
    else if (type === 'certificate') {
      document.getElementById('cert-title-input').value = item.title;
      document.getElementById('cert-issuer-input').value = item.issuer;
      document.getElementById('cert-date-input').value = item.issueDate;
      document.getElementById('cert-cred-id-input').value = item.credentialId || '';
      document.getElementById('cert-cred-input').value = item.credentialUrl || '';
      document.getElementById('cert-down-input').value = item.downloadUrl || '';
    } 
    else if (type === 'achievement') {
      document.getElementById('ach-title-input').value = item.title;
      document.getElementById('ach-category-input').value = item.category;
      document.getElementById('ach-org-input').value = item.organization;
      document.getElementById('ach-date-input').value = item.date;
      document.getElementById('ach-desc-input').value = item.description;
    }

    modal.classList.add('show');
  } catch (err) {
    console.error(`Error loading edit modal details for ${type}:`, err);
    showToast('Failed to load details.', 'error');
  }
};

window.closeModal = function(type) {
  const modal = document.getElementById(`${type}-modal`);
  modal?.classList.remove('show');
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/* ========================================================================= */
/* Drag & Drop Handlers Setup                                                */
/* ========================================================================= */
function setupDragAndDropZones() {
  const dropZones = [
    { boxId: 'project-drag-box', inputId: 'project-image-input' },
    { boxId: 'cert-drag-box', inputId: 'cert-image-input' },
    { boxId: 'ach-drag-box', inputId: 'ach-image-input' },
    { boxId: 'profile-img-drag-box', inputId: 'profile-image-file' },
    { boxId: 'profile-resume-drag-box', inputId: 'profile-resume-file' }
  ];

  dropZones.forEach(zone => {
    const box = document.getElementById(zone.boxId);
    const input = document.getElementById(zone.inputId);
    if (!box || !input) return;

    // Trigger input click when drag box is clicked
    box.addEventListener('click', () => input.click());

    // Toggle border active classes during hover dragover
    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      box.classList.add('dragover');
    });

    box.addEventListener('dragleave', () => {
      box.classList.remove('dragover');
    });

    // Handle file drop interception
    box.addEventListener('drop', (e) => {
      e.preventDefault();
      box.classList.remove('dragover');
      
      if (e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        updateBoxFileState(box, e.dataTransfer.files[0]);
      }
    });

    // Detect browser file dialog selection
    input.addEventListener('change', () => {
      if (input.files.length) {
        updateBoxFileState(box, input.files[0]);
      }
    });
  });
}

function updateBoxFileState(box, file) {
  box.classList.add('has-file');
  const span = box.querySelector('span');
  if (span) {
    span.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
  }

  // Generate dynamic thumbnail preview for image files
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      let img = box.querySelector('.drag-drop-preview-img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'drag-drop-preview-img';
        img.style.width = '50px';
        img.style.height = '50px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.style.marginTop = '8px';
        img.style.border = '1px solid var(--border-color)';
        box.appendChild(img);
      }
      img.src = e.target.result;
      img.style.display = 'block';

      // Hide default cloud upload icon
      const icon = box.querySelector('i');
      if (icon) icon.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

/* ========================================================================= */
/* Real-time Search Filters                                                 */
/* ========================================================================= */
function setupTableSearchControls() {
  // Websites Search
  document.getElementById('search-projects')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = projects.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) ||
      p.technologies.some(tech => tech.toLowerCase().includes(query))
    );
    renderProjectsTableRows(filtered);
  });

  // Certificates Search
  document.getElementById('search-certificates')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = certificates.filter(c => 
      c.title.toLowerCase().includes(query) || 
      c.issuer.toLowerCase().includes(query) ||
      (c.credentialId && c.credentialId.toLowerCase().includes(query))
    );
    renderCertificatesTableRows(filtered);
  });

  // Achievements Search
  document.getElementById('search-achievements')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = achievements.filter(a => 
      a.title.toLowerCase().includes(query) || 
      a.category.toLowerCase().includes(query) ||
      a.organization.toLowerCase().includes(query)
    );
    renderAchievementsTableRows(filtered);
  });

  // Messages / Inbox Search
  document.getElementById('search-messages')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = messages.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.email.toLowerCase().includes(query) ||
      m.subject.toLowerCase().includes(query) ||
      m.message.toLowerCase().includes(query)
    );
    renderInboxMessages(filtered);
  });
}

/* ========================================================================= */
/* API Actions (Submit / Delete)                                            */
/* ========================================================================= */
function registerFormListeners() {
  // Website Form
  document.getElementById('project-form')?.addEventListener('submit', (e) => {
    handleFormSubmit(e, 'project');
  });

  // Certificate Form
  document.getElementById('certificate-form')?.addEventListener('submit', (e) => {
    handleFormSubmit(e, 'certificate');
  });

  // Achievement Form
  document.getElementById('achievement-form')?.addEventListener('submit', (e) => {
    handleFormSubmit(e, 'achievement');
  });

  // Profile Form
  document.getElementById('profile-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Pack dynamic skills
    const skills = [];
    document.querySelectorAll('.skill-edit-row').forEach(row => {
      const name = row.querySelector('.skill-name-val').value.trim();
      const percentage = parseInt(row.querySelector('.skill-percent-val').value) || 0;
      const icon = row.querySelector('.skill-icon-val').value.trim();
      const color = row.querySelector('.skill-color-val').value;
      if (name) {
        skills.push({ name, percentage, icon, color });
      }
    });
    formData.set('skills', JSON.stringify(skills));

    // Pack dynamic education
    const education = [];
    document.querySelectorAll('#education-edit-container .timeline-edit-row').forEach(row => {
      const year = row.querySelector('.item-year-val').value.trim();
      const title = row.querySelector('.item-title-val').value.trim();
      const subtitle = row.querySelector('.item-subtitle-val').value.trim();
      const description = row.querySelector('.item-desc-val').value.trim();
      if (year && title) {
        education.push({ year, title, subtitle, description });
      }
    });
    formData.set('education', JSON.stringify(education));

    // Pack dynamic experience
    const experience = [];
    document.querySelectorAll('#experience-edit-container .timeline-edit-row').forEach(row => {
      const year = row.querySelector('.item-year-val').value.trim();
      const title = row.querySelector('.item-title-val').value.trim();
      const subtitle = row.querySelector('.item-subtitle-val').value.trim();
      const description = row.querySelector('.item-desc-val').value.trim();
      if (year && title) {
        experience.push({ year, title, subtitle, description });
      }
    });
    formData.set('experience', JSON.stringify(experience));

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (res.ok) {
        showToast('Profile settings saved successfully!', 'success');
        loadProfileForm();
      } else {
        const data = await res.json();
        showToast(data.message || 'Failed to save profile settings.', 'error');
      }
    } catch (err) {
      console.error('Profile form save error:', err);
      showToast('Error saving profile settings.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

async function handleFormSubmit(e, type) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const id = formData.get('id');

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

  // Determine endpoint and method
  let url = `/api/${type}s`;
  let method = 'POST';

  if (id) {
    url = `/api/${type}s/${id}`;
    method = 'PUT';
  }

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      showToast(`${type === 'project' ? 'Website' : capitalize(type)} successfully saved!`, 'success');
      closeModal(type);
      triggerTabLoad(`${type}s`);
    } else {
      showToast(data.message || `Failed to save ${type}.`, 'error');
    }
  } catch (err) {
    console.error(`${type} submission error:`, err);
    showToast(`Error submitting form.`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

window.deleteResource = async function(type, id) {
  if (!confirm(`Are you sure you want to delete this ${type === 'project' ? 'website' : type}? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/${type}s/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      showToast(`${type === 'project' ? 'Website' : capitalize(type)} successfully deleted.`, 'success');
      
      // Reload tab list
      if (type === 'message') {
        loadInboxMessages();
      } else {
        triggerTabLoad(`${type}s`);
      }
    } else {
      showToast(data.message || `Failed to delete ${type}.`, 'error');
    }
  } catch (err) {
    console.error(`Error deleting ${type}:`, err);
    showToast(`Error deleting resource.`, 'error');
  }
};

// Helper to render a Skill row in settings panel
function renderSkillRow(skill = {}) {
  const container = document.getElementById('skills-edit-container');
  if (!container) return;

  const name = skill.name || '';
  const percentage = skill.percentage !== undefined ? skill.percentage : 80;
  const icon = skill.icon || 'fab fa-html5';
  const color = skill.color || '#2563EB';

  const html = `
    <div class="skill-edit-row" style="display:grid; grid-template-columns: 1.5fr 1fr 1.5fr 1fr auto; gap:12px; margin-bottom:12px; align-items:end;">
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" style="font-size:12px;">Skill Name</label>
        <input type="text" class="form-control skill-name-val" value="${name}" placeholder="e.g. HTML5" required>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" style="font-size:12px;">Percentage</label>
        <input type="number" class="form-control skill-percent-val" min="0" max="100" value="${percentage}" placeholder="e.g. 90" required>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" style="font-size:12px;">Icon Class</label>
        <input type="text" class="form-control skill-icon-val" value="${icon}" placeholder="e.g. fab fa-html5" required>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" style="font-size:12px;">Color (Hex)</label>
        <input type="color" class="form-control skill-color-val" style="padding:4px; height:48px;" value="${color}">
      </div>
      <button type="button" class="btn btn-danger btn-sm remove-field-btn" style="height:48px; width:48px; display:flex; align-items:center; justify-content:center; padding:0;">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}

// Helper to render a Timeline row (Education or Experience) in settings panel
function renderTimelineRow(containerId, item = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const year = item.year || '';
  const title = item.title || '';
  const subtitle = item.subtitle || '';
  const description = item.description || '';

  const html = `
    <div class="timeline-edit-row" style="border:1px solid var(--border-color); padding:16px; border-radius:var(--radius-sm); margin-bottom:16px; position:relative; background:var(--bg-primary);">
      <button type="button" class="btn btn-danger btn-sm remove-field-btn" style="position:absolute; top:12px; right:12px; height:36px; width:36px; padding:0; display:flex; align-items:center; justify-content:center;">
        <i class="fas fa-trash-alt"></i>
      </button>
      <div style="display:grid; grid-template-columns: 1fr 1.5fr 1.5fr; gap:16px; margin-bottom:12px; margin-top:20px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:12px;">Years</label>
          <input type="text" class="form-control item-year-val" value="${year}" placeholder="e.g. 2020 - 2024" required>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:12px;">Title / Degree / Role</label>
          <input type="text" class="form-control item-title-val" value="${title}" placeholder="e.g. BCA Degree" required>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:12px;">Subtitle / School / Company</label>
          <input type="text" class="form-control item-subtitle-val" value="${subtitle}" placeholder="e.g. State University" required>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label class="form-label" style="font-size:12px;">Description</label>
        <textarea class="form-control item-desc-val" style="min-height:60px;" placeholder="Explain timeline details..." required>${description}</textarea>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
}
