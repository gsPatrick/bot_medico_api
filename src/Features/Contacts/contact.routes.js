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

// Enviar mensagem manual (aciona Human Takeover)
router.post('/:phone/messages', contactController.sendMessage);

// Reativar bot para um contato
router.post('/:phone/reactivate', contactController.reactivateContact);

// RESET GERAL - Remove todos os contatos e mensagens
router.post('/reset-all', contactController.resetAllContacts);

module.exports = router;
