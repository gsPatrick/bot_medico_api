const express = require('express');
const router = express.Router();

// Importar rotas das features
const webhookRoutes = require('../Features/Webhook/webhook.routes');
const flowRoutes = require('../Features/Flows/flow.routes');
const contactRoutes = require('../Features/Contacts/contact.routes');
const notificationRoutes = require('./notifications');

// Rota de health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Bot Médico API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Montar rotas
router.use('/webhook', webhookRoutes);
router.use('/api/flows', flowRoutes);
router.use('/api/contacts', contactRoutes);
console.log('[Routes] Mounting /api/notifications...');
router.use('/api/notifications', notificationRoutes);

// Rota 404 para API
router.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
    });
});

module.exports = router;
