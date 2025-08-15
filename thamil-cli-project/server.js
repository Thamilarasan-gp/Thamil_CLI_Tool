require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator'); // For input validation

const app = express();
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema and Model
const commandSchema = new mongoose.Schema({
  keyword: { type: String, unique: true },
  commands: [String],
  prerequisites: [{
    check: String,
    install: String,
  }],
});

const Command = mongoose.model('Command', commandSchema);

// Routes

app.post('/commands', [
  body('keyword').isString().notEmpty(),
  body('commands').isArray().notEmpty(),
  body('prerequisites').isArray(),
], async (req, res) => {
  console.log('POST /commands received:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const cmd = new Command(req.body);
    await cmd.save();
    console.log('Command saved:', cmd);
    res.status(201).json({ status: 'success', command: cmd });
  } catch (err) {
    console.error('Error saving command:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.post('/test', (req, res) => {
  console.log('POST /test received:', req.body);
  res.json({ status: 'success', received: req.body });
});

app.get('/commands/:keyword', async (req, res) => {
  const keyword = req.params.keyword.trim();
  console.log('GET /commands/:keyword - Searching for:', JSON.stringify(keyword));
  try {
    const cmd = await Command.findOne({ keyword });
    if (!cmd) return res.status(404).json({ error: 'Command not found' });
    res.json(cmd);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));