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

/**
 * Reseta TODOS os contatos para o estado inicial (limpa o sistema)
 */
exports.resetAllContacts = async (req, res) => {
    try {
        // Deleta todos os contatos e mensagens
        await Message.destroy({ where: {} });
        await Contact.destroy({ where: {} });

        console.log('[Contacts] RESET GERAL - Todos os contatos e mensagens foram removidos');

        res.json({
            success: true,
            message: 'Todos os contatos foram resetados. O sistema está limpo!'
        });

    } catch (error) {
        console.error('[Contacts] Erro ao resetar contatos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao resetar contatos'
        });
    }
};

/**
 * Envia mensagem manual (Human Takeover)
 */
exports.sendMessage = async (req, res) => {
    try {
        const { phone } = req.params;
        const { message } = req.body;
        const ZApiService = require('../../Services/ZApi.service');
        const NotificationSetting = require('../../Models/NotificationSetting');

        const contact = await Contact.findByPk(phone);

        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado'
            });
        }

        // 1. Envia a mensagem pelo WhatsApp
        await ZApiService.sendText(phone, message);

        // 2. Salva a mensagem no banco como 'out' (saída) e 'text'
        await Message.create({
            contact_phone: phone,
            direction: 'out',
            message_type: 'text',
            content: message
        });

        // 3. HUMAN TAKEOVER LOGIC
        // Se o bot não estava em modo humano, ativamos a intervenção agora
        if (contact.status !== 'HUMAN') {
            console.log(`[HumanTakeover] Pausando IA para ${phone} por intervenção manual`);

            await contact.update({
                status: 'HUMAN',
                current_node_id: null // Reseta o nó atual para travar o fluxo
            });

            // 4. NOTIFICAÇÃO AOS ADMS
            // Busca configurações de notificação ativas
            const admins = await NotificationSetting.findAll({ where: { active: true } });

            for (const admin of admins) {
                try {
                    const alertMsg = `⚠️ *Intervenção Humana Detectada*\n\n` +
                        `O bot foi pausado para o cliente: *${contact.name || phone}*\n` +
                        `Motivo: Mensagem manual enviada pelo painel.\n\n` +
                        `Para reativar o bot, use o botão "Reativar" no painel.`;

                    await ZApiService.sendText(admin.phone, alertMsg);
                } catch (notifyError) {
                    console.error(`[HumanTakeover] Erro ao notificar admin ${admin.name}:`, notifyError.message);
                }
            }
        }

        res.json({
            success: true,
            message: 'Mensagem enviada e modo humano ativado!'
        });

    } catch (error) {
        console.error('[Contacts] Erro ao enviar mensagem manual:', error);

        // Verifica erro da API do WhatsApp
        const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';

        res.status(500).json({
            success: false,
            error: 'Erro ao enviar mensagem: ' + errorMessage
        });
    }
};
