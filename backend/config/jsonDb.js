const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../database/db.json');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initial default database structure
const getDefaultData = () => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('admin12345', salt);

  return {
    users: [
      {
        _id: 'default-admin-id',
        email: 'admin@portfolio.com',
        password: hashedPassword
      }
    ],
    profile: {
      name: 'Santhosh Kumar',
      role: 'Full Stack Developer',
      bio: 'A passionate developer specializing in Node.js, Express, MongoDB, and modern web interfaces.',
      profileImage: '/images/uploads/profile.jpg',
      resumeUrl: '#',
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
      whatsappNumber: '',
      email: 'santhosh@example.com',
      visitorsCount: 0
    },
    projects: [
      {
        _id: 'proj-1',
        title: "Student Course Management System",
        description: "A complete administrative system for enrolling students, assigning courses, tracking grades, and generating transcripts.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60",
        technologies: ["Node.js", "Express", "MongoDB", "Bootstrap 5"],
        category: "Web Applications",
        githubUrl: "https://github.com",
        liveUrl: "https://google.com",
        order: 0
      },
      {
        _id: 'proj-2',
        title: "Customer Support Chatbot",
        description: "An AI-powered automated chatbot designed to answer common queries, log support tickets, and delegate tasks to human operators.",
        image: "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?w=600&auto=format&fit=crop&q=60",
        technologies: ["JavaScript", "Node.js", "Dialogflow", "Socket.io"],
        category: "AI Projects",
        githubUrl: "https://github.com",
        liveUrl: "https://google.com",
        order: 1
      },
      {
        _id: 'proj-3',
        title: "Attendance Management System",
        description: "RFID-compatible management tool mapping daily employee or student attendance logs, leave balances, and custom monthly reports.",
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=60",
        technologies: ["Express", "MongoDB", "Vanilla JS", "CSS3"],
        category: "Full Stack",
        githubUrl: "https://github.com",
        liveUrl: "https://google.com",
        order: 2
      },
      {
        _id: 'proj-4',
        title: "Portfolio Website",
        description: "The very site you are viewing! Fully responsive, equipped with a custom glassmorphic admin dashboard to manage records.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
        technologies: ["JavaScript", "Node.js", "MongoDB", "JWT Auth"],
        category: "Web Applications",
        githubUrl: "https://github.com",
        liveUrl: "https://google.com",
        order: 3
      }
    ],
    certificates: [
      {
        _id: 'cert-1',
        title: "AWS Certified Cloud Practitioner",
        issuer: "Amazon Web Services",
        issueDate: "June 2024",
        credentialUrl: "https://aws.amazon.com",
        downloadUrl: "#",
        credentialId: "AWS-CCP-12345",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60"
      },
      {
        _id: 'cert-2',
        title: "MongoDB Certified Associate Developer",
        issuer: "MongoDB University",
        issueDate: "January 2024",
        credentialUrl: "https://university.mongodb.com",
        downloadUrl: "#",
        credentialId: "MONGO-DEV-67890",
        image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=60"
      },
      {
        _id: 'cert-3',
        title: "Full Stack Web Development Certification",
        issuer: "freeCodeCamp",
        issueDate: "September 2023",
        credentialUrl: "https://freecodecamp.org",
        downloadUrl: "#",
        credentialId: "FCC-FSWD-54321",
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=60"
      }
    ],
    achievements: [
      {
        _id: 'ach-1',
        title: "Best Innovator Award",
        category: "Award",
        organization: "National Innovation Council",
        date: "March 2025",
        description: "Awarded top innovator among 500+ participants for developing an eco-friendly automated power consumption logger."
      },
      {
        _id: 'ach-2',
        title: "Smart City Hackathon Winner",
        category: "Hackathon",
        organization: "Metropolitan Municipality",
        date: "November 2024",
        description: "Placed 1st for creating a Node.js-based public bus routing optimizer that reduced average transit delays by 18%."
      },
      {
        _id: 'ach-3',
        title: "Backend Engineering Internship",
        category: "Internship",
        organization: "Apex Software Labs",
        date: "May - August 2024",
        description: "Built automated data migration script pipelines and integrated JWT session credentials into student registers."
      }
    ],
    messages: []
  };
};

const read = () => {
  if (!fs.existsSync(dbPath)) {
    const defaultData = getDefaultData();
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading JSON fallback DB:', err.message);
    return getDefaultData();
  }
};

const write = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing JSON fallback DB:', err.message);
    return false;
  }
};

module.exports = {
  read,
  write
};
