const Project = require('../models/Project');
const { uploadToCloudinaryOrLocal } = require('../config/cloudinary');
const jsonDb = require('../config/jsonDb');
const fs = require('fs');
const path = require('path');

// @route   GET api/projects
// @desc    Get all projects
// @access  Public
exports.getProjects = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const sorted = (data.projects || []).sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      return res.json(sorted);
    }

    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Public
exports.getProjectById = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const project = data.projects.find(p => p._id === req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.json(project);
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
exports.createProject = async (req, res) => {
  const { title, description, technologies, githubUrl, liveUrl, order, category } = req.body;

  try {
    let techArray = [];
    if (technologies) {
      techArray = typeof technologies === 'string'
        ? technologies.split(',').map(t => t.trim()).filter(Boolean)
        : technologies;
    }

    let imageUrl = '/images/default-project.jpg';
    if (req.file) {
      imageUrl = await uploadToCloudinaryOrLocal(req.file);
    }

    if (global.dbFallback) {
      const data = jsonDb.read();
      const newProject = {
        _id: 'proj-' + Date.now(),
        title,
        description,
        image: imageUrl,
        technologies: techArray,
        category: category || 'Web Applications',
        githubUrl,
        liveUrl,
        order: order ? parseInt(order, 10) : 0,
        createdAt: new Date().toISOString()
      };
      data.projects.push(newProject);
      jsonDb.write(data);
      return res.json(newProject);
    }

    const newProject = new Project({
      title,
      description,
      image: imageUrl,
      technologies: techArray,
      category: category || 'Web Applications',
      githubUrl,
      liveUrl,
      order: order ? parseInt(order, 10) : 0
    });

    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
exports.updateProject = async (req, res) => {
  const { title, description, technologies, githubUrl, liveUrl, order, category } = req.body;

  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const index = data.projects.findIndex(p => p._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = data.projects[index];
      if (title) project.title = title;
      if (description) project.description = description;
      if (githubUrl !== undefined) project.githubUrl = githubUrl;
      if (liveUrl !== undefined) project.liveUrl = liveUrl;
      if (order !== undefined) project.order = parseInt(order, 10) || 0;
      if (category) project.category = category;

      if (technologies) {
        project.technologies = typeof technologies === 'string'
          ? technologies.split(',').map(t => t.trim()).filter(Boolean)
          : technologies;
      }

      if (req.file) {
        const imageUrl = await uploadToCloudinaryOrLocal(req.file);
        project.image = imageUrl;
      }

      data.projects[index] = project;
      jsonDb.write(data);
      return res.json(project);
    }

    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (githubUrl !== undefined) project.githubUrl = githubUrl;
    if (liveUrl !== undefined) project.liveUrl = liveUrl;
    if (order !== undefined) project.order = parseInt(order, 10) || 0;
    if (category) project.category = category;

    if (technologies) {
      project.technologies = typeof technologies === 'string'
        ? technologies.split(',').map(t => t.trim()).filter(Boolean)
        : technologies;
    }

    if (req.file) {
      const imageUrl = await uploadToCloudinaryOrLocal(req.file);
      project.image = imageUrl;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const index = data.projects.findIndex(p => p._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = data.projects[index];
      if (project.image && project.image.startsWith('/images/uploads/')) {
        const localFilePath = path.join(__dirname, '../../frontend', project.image);
        if (fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
          } catch (err) {
            console.error('Error deleting local file:', err.message);
          }
        }
      }

      data.projects.splice(index, 1);
      jsonDb.write(data);
      return res.json({ message: 'Project removed successfully' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Try deleting local file if it is stored locally
    if (project.image && project.image.startsWith('/images/uploads/')) {
      const localFilePath = path.join(__dirname, '../../frontend', project.image);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (err) {
          console.error('Error deleting local file:', err.message);
        }
      }
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server error');
  }
};
