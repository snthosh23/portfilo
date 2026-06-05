const Message = require('../models/Message');
const jsonDb = require('../config/jsonDb');

// @route   POST api/messages
// @desc    Submit a contact message
// @access  Public
exports.submitMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (global.dbFallback) {
      const data = jsonDb.read();
      const newMessage = {
        _id: 'msg-' + Date.now(),
        name,
        email,
        subject,
        message,
        createdAt: new Date().toISOString()
      };
      data.messages.push(newMessage);
      jsonDb.write(data);
      return res.json({ message: 'Message sent successfully!', data: newMessage });
    }

    const newMessage = new Message({
      name,
      email,
      subject,
      message
    });

    const savedMessage = await newMessage.save();
    res.json({ message: 'Message sent successfully!', data: savedMessage });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/messages
// @desc    Get all messages (for inbox overview)
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const sorted = (data.messages || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return res.json(sorted);
    }

    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   DELETE api/messages/:id
// @desc    Delete a message
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    if (global.dbFallback) {
      const data = jsonDb.read();
      const index = data.messages.findIndex(m => m._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Message not found' });
      }

      data.messages.splice(index, 1);
      jsonDb.write(data);
      return res.json({ message: 'Message deleted successfully' });
    }

    const msg = await Message.findById(req.params.id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.status(500).send('Server error');
  }
};
