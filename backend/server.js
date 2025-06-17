
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const Router = require('./routes/auth');
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(Router);

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
