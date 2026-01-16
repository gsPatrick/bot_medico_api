const FlowEngine = require('../../Services/FlowEngine.service');

/**
 * Parseia o payload recebido da Z-API
 * Extrai telefone, mensagem e informações relevantes
 */
function parseZApiPayload(body) {
    // Formato padrão do webhook Z-API
    const phone = body.phone || body.from;
    const isFromMe = body.fromMe === true;

    // Extrai texto da mensagem
    let text = '';
    if (body.text?.message) {
        text = body.text.message;
    } else if (body.message) {
        text = body.message;
    }

    // Extrai payload de botão (quando usuário clica em botão)
    let buttonPayload = null;
    if (body.buttonsResponseMessage) {
        buttonPayload = body.buttonsResponseMessage.selectedButtonId ||
            body.buttonsResponseMessage.buttonId ||
            body.buttonsResponseMessage.selectedDisplayText;
    } else if (body.buttonResponse) {
        buttonPayload = body.buttonResponse.selectedButtonId || body.buttonResponse.buttonId;
    }

    // Extrai payload de lista (quando usuário seleciona item da lista)
    let listPayload = null;
    if (body.listResponseMessage) {
        listPayload = body.listResponseMessage.singleSelectReply?.selectedRowId ||
            body.listResponseMessage.rowId ||
            body.listResponseMessage.title;
    } else if (body.listResponse) {
        listPayload = body.listResponse.rowId || body.listResponse.selectedRowId;
    }

    return {
        phone,
        isFromMe,
        text,
        buttonPayload,
        listPayload,
        messageId: body.messageId || body.id?.id,
        timestamp: body.momment || body.timestamp || Date.now(),
        type: body.type || 'text',
        raw: body
    };
}

/**
 * Controller principal do Webhook
 * Recebe mensagens da Z-API e processa via FlowEngine
 */
const handleWebhook = async (req, res) => {
    try {
        const parsed = parseZApiPayload(req.body);

        console.log('[Webhook] Mensagem recebida:', {
            phone: parsed.phone,
            text: parsed.text,
            buttonPayload: parsed.buttonPayload,
            listPayload: parsed.listPayload,
            isFromMe: parsed.isFromMe
        });

        // Ignora mensagens enviadas por mim (evita loop)
        if (parsed.isFromMe) {
            console.log('[Webhook] Mensagem própria ignorada');
            return res.json({ message: 'Ignored (fromMe)' });
        }

        // Restrição removida para liberar todos os números
        console.log(`[Webhook] Mensagem recebida de: ${parsed.phone}`);

        // Ignora se não tiver telefone
        if (!parsed.phone) {
            console.log('[Webhook] Mensagem sem telefone ignorada');
            return res.sendStatus(200);
        }

        // Ignora mensagens sem conteúdo (evita processar status/acks como mensagens vazias)
        if (!parsed.text && !parsed.buttonPayload && !parsed.listPayload) {
            console.log('[Webhook] Mensagem sem conteúdo (ignorada):', parsed.raw ? 'Raw content exists' : 'Empty');
            return res.sendStatus(200);
        }

        // --- BLOCK GROUP MESSAGES ---
        // Verifica se a mensagem veio de um grupo e ignora
        if (parsed.phone.includes('@g.us') || parsed.phone.includes('group')) {
            console.log(`[Webhook] Mensagem de grupo ignorada: ${parsed.phone}`);
            return res.sendStatus(200);
        }

        // Processa via FlowEngine
        await FlowEngine.processMessage(parsed.phone, {
            text: parsed.text,
            buttonPayload: parsed.buttonPayload,
            listPayload: parsed.listPayload
        });

        return res.sendStatus(200);

    } catch (error) {
        console.error('[Webhook] Erro ao processar:', error);
        // Retorna 200 mesmo em erro para não fazer a Z-API reenviar
        return res.sendStatus(200);
    }
};

/**
 * Controller para verificação do webhook (health check)
 */
const verifyWebhook = async (req, res) => {
    res.json({
        status: 'ok',
        message: 'Webhook ativo',
        timestamp: new Date().toISOString()
    });
};

/**
 * Controller para receber status de mensagens
 */
const handleMessageStatus = async (req, res) => {
    try {
        const { messageId, status, phone } = req.body;
        console.log('[Webhook] Status de mensagem:', { messageId, status, phone });

        // TODO: Atualizar status da mensagem no banco se necessário

        return res.sendStatus(200);
    } catch (error) {
        console.error('[Webhook] Erro ao processar status:', error);
        return res.sendStatus(200);
    }
};

module.exports = {
    handleWebhook,
    verifyWebhook,
    handleMessageStatus,
    parseZApiPayload
};
