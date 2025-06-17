const express = require('express');
const Router = express.Router();
const TelegramController = require('../controllers/TelegramController.js');

Router.post('/api/SendCode', TelegramController.SendCode);
Router.post('/api/VerifyCode', TelegramController.VerifyCode);
Router.post('/api/CheckPassword', TelegramController.CheckPassword);

module.exports = Router;
