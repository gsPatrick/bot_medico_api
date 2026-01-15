const { Contact, Message, Flow } = require('../../Models');

/**
 * Lista todos os contatos
 */
exports.getAllContacts = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status) {
            where.status = status;
        }

        const contacts = await Contact.findAll({
            where,
            order: [['last_interaction_at', 'DESC']]
        });

        res.json({
            success: true,
            data: contacts
        });
    } catch (error) {
        console.error('[Contacts] Erro ao listar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar contatos'
        });
    }
};

/**
 * Obtém um contato por telefone
 */
exports.getContactByPhone = async (req, res) => {
    try {
        const { phone } = req.params;

        const contact = await Contact.findByPk(phone);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado'
            });
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('[Contacts] Erro ao buscar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar contato'
        });
    }
};

/**
 * Atualiza um contato
 */
exports.updateContact = async (req, res) => {
    try {
        const { phone } = req.params;
        const { name, status, variables, tags } = req.body;

        const contact = await Contact.findByPk(phone);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado'
            });
        }

        await contact.update({
            name,
            status,
            variables,
            tags
        });

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('[Contacts] Erro ao atualizar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar contato'
        });
    }
};

/**
 * Lista mensagens de um contato
 */
exports.getMessages = async (req, res) => {
    try {
        const { phone } = req.params;

        const messages = await Message.findAll({
            where: { contact_phone: phone },
            order: [['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('[Contacts] Erro ao listar mensagens:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar mensagens'
        });
    }
};

/**
 * Reativa o bot para um contato
 */
exports.reactivateContact = async (req, res) => {
    try {
        const { phone } = req.params;

        const contact = await Contact.findByPk(phone);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado'
            });
        }

        await contact.update({
            status: 'BOT',
            current_node_id: null
        });

        res.json({
            success: true,
            message: 'Bot reativado com sucesso',
            data: contact
        });

    } catch (error) {
        console.error('[Contacts] Erro ao reativar bot:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao reativar bot'
        });
    }
};
