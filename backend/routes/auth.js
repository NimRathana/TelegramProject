const express = require('express');
const Router = express.Router();
const TelegramController = require('../controllers/TelegramController.js');

Router.post('/api/SendCode', TelegramController.SendCode);
Router.post('/api/VerifyCode', TelegramController.VerifyCode);
Router.post('/api/CheckPassword', TelegramController.CheckPassword);
Router.post('/api/Reconnect', TelegramController.Reconnect);
Router.post('/api/Logout', TelegramController.Logout);
Router.post('/api/GetAllGroups', TelegramController.GetAllGroups);
Router.post('/api/GetAllGroupMembers', TelegramController.GetAllGroupMembers);
Router.post('/api/SendMessage', TelegramController.SendMessage);
Router.post('/api/GetPosts', TelegramController.GetPosts);
Router.post('/api/GetPhotos', TelegramController.GetPhotos);
Router.post('/api/GetArchivedChats', TelegramController.GetArchivedChats);
Router.post('/api/GetContacts', TelegramController.GetContacts);
Router.post('/api/GetAbout', TelegramController.GetAbout);
Router.get('/api/test', TelegramController.Test);

module.exports = Router;
