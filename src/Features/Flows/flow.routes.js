const express = require('express');
const router = express.Router();
const {
    listFlows,
    getFlow,
    createFlow,
    updateFlow,
    deleteFlow,
    activateFlow,
    duplicateFlow
} = require('./flow.controller');

// GET /api/flows - Lista todos os fluxos
router.get('/', listFlows);

// GET /api/flows/:id - Obtém um fluxo específico
router.get('/:id', getFlow);

// POST /api/flows - Cria um novo fluxo
router.post('/', createFlow);

// PUT /api/flows/:id - Atualiza um fluxo
router.put('/:id', updateFlow);

// DELETE /api/flows/:id - Remove um fluxo
router.delete('/:id', deleteFlow);

// POST /api/flows/:id/activate - Ativa um fluxo
router.post('/:id/activate', activateFlow);

// POST /api/flows/seed - Roda o seeder de triagem
router.post('/seed', require('./flow.controller').runSeeder);

// POST /api/flows/:id/duplicate - Duplica um fluxo
router.post('/:id/duplicate', duplicateFlow);

// GET /api/flows/:id/export - Exporta o fluxo como JSON
router.get('/:id/export', require('./flow.controller').exportFlow);

// POST /api/flows/update-v2 - Aplica a atualização de lógica (Skip Questions)
router.post('/update-v2', require('./flow.controller').runUpdateV2);

module.exports = router;
