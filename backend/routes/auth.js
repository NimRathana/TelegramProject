const express = require('express');
const Router = express.Router();
const TelegramController = require('../controllers/TelegramController.js');

Router.post('/api/SendCode', TelegramController.SendCode);
Router.post('/api/VerifyCode', TelegramController.VerifyCode);
Router.post('/api/CheckPassword', TelegramController.CheckPassword);
Router.post('/api/Reconnect', TelegramController.Reconnect);
Router.post('/api/Logout', TelegramController.Logout);

module.exports = Router;
