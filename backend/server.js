
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const Router = require('./routes/auth');
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(Router);

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing, return index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
