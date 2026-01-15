const express = require('express');
const router = express.Router();
const { NotificationSetting } = require('../Models');

// Listar configurações
console.log('[Routes] Loading notifications routes...');
router.get('/', async (req, res) => {
    try {
        const settings = await NotificationSetting.findAll();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar configuração
router.post('/', async (req, res) => {
    try {
        const { name, phone } = req.body;
        const setting = await NotificationSetting.create({ name, phone });
        res.status(201).json(setting);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Deletar configuração
router.delete('/:id', async (req, res) => {
    try {
        await NotificationSetting.destroy({ where: { id: req.params.id } });
        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
