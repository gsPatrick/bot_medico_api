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
        // Se for enviado por mim (fromMe), o 'phone' alvo é o 'to' (removendo @s.whatsapp.net se houver)
        // Se for recebido, o 'phone' é o 'from' ou 'phone'
        phone: isFromMe ? (body.to || '').replace('@s.whatsapp.net', '') : (phone || '').replace('@s.whatsapp.net', ''),
        isFromMe,
        text,
        buttonPayload,
        listPayload,
        messageId: body.messageId || body.id?.id || body.id,
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
        const ZApiService = require('../../Services/ZApi.service');
        const { Contact } = require('../../Models');

        console.log('[Webhook] Mensagem recebida:', {
            phone: parsed.phone,
            text: parsed.text,
            isFromMe: parsed.isFromMe,
            id: parsed.messageId
        });

        // =========================================================================
        // LÓGICA DE INTERVENÇÃO HUMANA (CELULAR/MOBILE)
        // =========================================================================
        // Se a mensagem foi enviada "por mim" (pela empresa), precisamos distinguir:
        // 1. Foi o ROBÔ que enviou? (ignorar eco)
        // 2. Foi o HUMANO (dono) que enviou pelo celular? (pausar robô)

        if (parsed.isFromMe) {
            // Verifica se este ID foi gerado pelo nosso bot recentemente
            if (ZApiService.isBotMessage(parsed.messageId)) {
                console.log('[Webhook] ECO de mensagem do Bot ignorado.');
                return res.json({ message: 'Ignored (Bot Echo)' });
            }

            // Se NÃO foi o bot, então é um humano respondendo pelo celular!
            console.log(`[Webhook] 🚨 INTERVENÇÃO HUMANA DETECTADA (Mobile) para ${parsed.phone}`);

            if (parsed.phone) {
                const contact = await Contact.findByPk(parsed.phone);
                if (contact && contact.status !== 'HUMAN') {
                    await contact.update({
                        status: 'HUMAN',
                        current_node_id: null
                    });
                    console.log(`[Webhook] Bot pausado para ${parsed.phone} devido a resposta manual via celular.`);
                }
            }

            return res.json({ message: 'Human Takeover Activated' });
        }
        // =========================================================================

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
