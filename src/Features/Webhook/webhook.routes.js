const express = require('express');
const router = express.Router();
const { handleWebhook, verifyWebhook, handleMessageStatus } = require('./webhook.controller');

// POST - Recebe mensagens da Z-API
router.post('/', handleWebhook);

// GET - Health check / verificação
router.get('/', verifyWebhook);

// POST - Recebe status de mensagens (opcional)
router.post('/status', handleMessageStatus);

module.exports = router;
