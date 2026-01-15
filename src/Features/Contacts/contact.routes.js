const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller');

// Listar todos os contatos
router.get('/', contactController.getAllContacts);

// Buscar contato por telefone
router.get('/:phone', contactController.getContactByPhone);

// Atualizar contato
router.put('/:phone', contactController.updateContact);

// Listar mensagens de um contato
router.get('/:phone/messages', contactController.getMessages);

// Reativar bot para um contato
router.post('/:phone/reactivate', contactController.reactivateContact);

module.exports = router;
