const { Contact, Flow, Message } = require('../Models');
const ZApiService = require('./ZApi.service');

/**
 * FlowEngine - O Cérebro do Chatbot
 * Processa mensagens recebidas e executa o fluxo dinâmico
 */
class FlowEngineService {

    /**
     * Processa uma mensagem recebida do webhook
     * @param {string} phone - Telefone do contato
     * @param {object} messageData - Dados da mensagem { text, buttonPayload, listPayload }
     */
    async processMessage(phone, messageData) {
        try {
            console.log(`[FlowEngine] Processando mensagem de ${phone}:`, messageData);

            // 1. Busca ou cria o contato
            let contact = await this.getOrCreateContact(phone);

            // GUARDA: Se o status for HUMAN, o bot não deve interferir, mas DEVE salvar a mensagem
            if (contact.status === 'HUMAN') {
                console.log(`[FlowEngine] Contato ${phone} está em atendimento humano. Salvando mensagem e silenciando bot.`);

                // Salva a mensagem no histórico mesmo com bot desligado
                const userResponse = this.extractUserResponse(messageData);
                await this.logMessage(phone, 'in', userResponse, 'text', null); // null pois não está em nenhum nó

                return;
            }

            // 2. Se não tiver fluxo ativo, inicia o fluxo padrão
            if (!contact.current_flow_id || !contact.current_node_id) {
                contact = await this.startDefaultFlow(contact);
                if (!contact) {
                    console.log(`[FlowEngine] Nenhum fluxo ativo encontrado`);
                    return;
                }
                // Se acabou de iniciar o fluxo, a mensagem atual foi apenas o gatilho ("Oi").
                // Não devemos processá-la como resposta para o primeiro nó.
                // O startDefaultFlow já executou o primeiro nó (enviou a pergunta).
                return;
            }

            // 3. Carrega o fluxo atual
            const flow = await Flow.findByPk(contact.current_flow_id);
            if (!flow) {
                console.error(`[FlowEngine] Fluxo não encontrado: ${contact.current_flow_id}`);
                return;
            }

            // 4. Obtém o nó atual
            const currentNode = flow.nodes[contact.current_node_id];
            if (!currentNode) {
                console.error(`[FlowEngine] Nó não encontrado: ${contact.current_node_id}`);
                return;
            }

            // 5. Processa o input (valida resposta)
            const processResult = await this.processInput(contact, currentNode, messageData, flow);

            // Se a mensagem foi ignorada (texto quando esperava botão), não faz nada
            if (processResult.ignored) {
                console.log(`[FlowEngine] Mensagem ignorada silenciosamente de ${phone}`);
                return;
            }

            if (!processResult.valid) {
                // Resposta inválida - reenvia a pergunta
                await this.executeNode(contact, currentNode, flow);
                return;
            }

            // 6. Atualiza variáveis se necessário
            if (processResult.saveAs && processResult.value) {
                const updatedVariables = { ...contact.variables, [processResult.saveAs]: processResult.value };
                await contact.update({ variables: updatedVariables });
            }

            // 7. Avança para o próximo nó
            if (processResult.nextNode) {
                await this.advanceToNode(contact, processResult.nextNode, flow);
            }

        } catch (error) {
            console.error('[FlowEngine] Erro ao processar mensagem:', error);
            throw error;
        }
    }

    /**
     * Busca ou cria um contato pelo telefone
     */
    async getOrCreateContact(phone) {
        let contact = await Contact.findByPk(phone);

        if (!contact) {
            contact = await Contact.create({
                phone,
                status: 'BOT',
                variables: {},
                tags: []
            });
            console.log(`[FlowEngine] Novo contato criado: ${phone}`);
        }

        // Atualiza última interação
        await contact.update({ last_interaction_at: new Date() });

        return contact;
    }

    /**
     * Inicia o fluxo padrão (is_active = true)
     */
    async startDefaultFlow(contact) {
        const activeFlow = await Flow.findOne({ where: { is_active: true } });

        if (!activeFlow) {
            console.log('[FlowEngine] Nenhum fluxo ativo no sistema');
            return null;
        }

        console.log(`[FlowEngine] Fluxo iniciado para ${contact.phone}: ${activeFlow.name}`);

        // Lógica de Retorno do Usuário:
        // Se o usuário já interagiu antes (tem variáveis salvas ou last_interaction_at antigo),
        // e o fluxo tem um nó de verificação de recorrência, começa por lá.
        const isReturningUser = contact.last_interaction_at && Object.keys(contact.variables || {}).length > 0;
        const hasRecurrentNode = activeFlow.nodes['check_recurrent'];

        let startNodeId = 'start';
        let tags = [...(contact.tags || [])];

        if (isReturningUser) {
            // Se já interagiu, marcamos como "Segundo Contato"
            if (!tags.includes('SEGUNDO_CONTATO')) {
                tags.push('SEGUNDO_CONTATO');
            }

            if (hasRecurrentNode) {
                console.log(`[FlowEngine] Usuário recorrente detectado: ${contact.phone}. Iniciando em check_recurrent.`);
                startNodeId = 'check_recurrent';
            }
        }

        // Se o usuário foi desqualificado anteriormente, marcamos para evitar loop de handover
        let variables = { ...contact.variables };
        if (contact.status === 'DISQUALIFIED') {
            console.log(`[FlowEngine] Usuário anteriormente desqualificado: ${contact.phone}`);
            variables.previously_disqualified = 'true';
        }

        await contact.update({
            current_flow_id: activeFlow.id,
            current_node_id: startNodeId,
            status: 'BOT',
            variables: variables,
            tags: tags // Atualiza tags com SEGUNDO_CONTATO se aplicável
        });

        // Executa o primeiro nó (start ou check_recurrent)
        const startNode = activeFlow.nodes[startNodeId];
        await this.executeNode(contact, startNode, activeFlow);

        return contact;
    }

    /**
     * Processa o input do usuário e valida contra as opções do nó atual
     */
    async processInput(contact, currentNode, messageData, flow) {
        // Se o nó não tem opções (é uma mensagem simples), considera válido
        if (currentNode.type === 'message') {
            return { valid: true, nextNode: currentNode.next_node };
        }

        // Para nós de pergunta
        if (currentNode.type === 'question') {
            const userResponse = this.extractUserResponse(messageData);
            const hasButtonPayload = !!messageData.buttonPayload || !!messageData.listPayload;

            // 1. Se tem opções, REQUER clique em botão (ignora texto digitado)
            if (currentNode.options && currentNode.options.length > 0) {
                // Se não é um clique de botão, ignora completamente a mensagem
                if (!hasButtonPayload) {
                    console.log(`[FlowEngine] Mensagem de texto ignorada (esperando botão) de ${contact.phone}: "${userResponse}"`);
                    // Retorna null para indicar que a mensagem deve ser ignorada silenciosamente
                    return { ignored: true };
                }

                const matchedOption = currentNode.options.find(opt => {
                    return opt.id === userResponse ||
                        opt.label.toLowerCase() === userResponse.toLowerCase() ||
                        opt.title?.toLowerCase() === userResponse.toLowerCase();
                });

                if (matchedOption) {
                    await this.logMessage(contact.phone, 'in', matchedOption.label, 'text', contact.current_node_id);

                    return {
                        valid: true,
                        nextNode: matchedOption.next_node,
                        saveAs: matchedOption.save_as || currentNode.save_as,
                        value: matchedOption.value || matchedOption.label
                    };
                }

                // Botão clicado mas não reconhecido (pode ser de uma mensagem antiga)
                console.log(`[FlowEngine] Botão não reconhecido de ${contact.phone}: "${userResponse}"`);
                return { ignored: true };
            }

            // 2. Perguntas SEM opções (como nome) aceitam texto livre
            await this.logMessage(contact.phone, 'in', userResponse, 'text', contact.current_node_id);

            // Se o nó salva em 'name', atualizamos o nome do contato também
            if (currentNode.save_as === 'name') {
                await contact.update({ name: userResponse });
            }

            return {
                valid: true,
                nextNode: currentNode.next_node,
                saveAs: currentNode.save_as,
                value: userResponse
            };
        }

        return { valid: true, nextNode: currentNode.next_node };
    }

    /**
     * Extrai a resposta do usuário do payload da mensagem
     */
    extractUserResponse(messageData) {
        // Prioridade: payload de botão > payload de lista > texto
        if (messageData.buttonPayload) {
            return messageData.buttonPayload;
        }
        if (messageData.listPayload) {
            return messageData.listPayload;
        }
        return messageData.text || '';
    }

    /**
     * Avança para um nó específico do fluxo
     */
    async advanceToNode(contact, nodeId, flow) {
        const nextNode = flow.nodes[nodeId];

        if (!nextNode) {
            console.error(`[FlowEngine] Próximo nó não encontrado: ${nodeId}`);
            return;
        }

        // Atualiza o nó atual do contato
        await contact.update({ current_node_id: nodeId });

        // Executa o nó
        await this.executeNode(contact, nextNode, flow);
    }

    /**
     * Executa um nó do fluxo (envia mensagem, botões, etc)
     */
    async executeNode(contact, node, flow) {
        console.log(`[FlowEngine] Executando nó ${contact.current_node_id} para ${contact.phone}`);

        switch (node.type) {
            case 'message':
                await this.executeMessageNode(contact, node, flow);
                break;

            case 'question':
                await this.executeQuestionNode(contact, node);
                break;

            case 'handover':
                await this.executeHandoverNode(contact, node);
                break;

            case 'disqualify':
                await this.executeDisqualifyNode(contact, node);
                break;

            default:
                console.error(`[FlowEngine] Tipo de nó desconhecido: ${node.type}`);
        }
    }

    /**
     * Executa nó do tipo MESSAGE - envia texto e avança automaticamente
     */
    async executeMessageNode(contact, node, flow) {
        // Processa variáveis no conteúdo
        const content = this.replaceVariables(node.content, contact.variables);

        // Envia a mensagem
        await ZApiService.sendText(contact.phone, content);
        await this.logMessage(contact.phone, 'out', content, 'text', contact.current_node_id);

        // Avança automaticamente para o próximo nó
        if (node.next_node) {
            // Pequeno delay para não sobrecarregar
            await this.delay(1000);
            await this.advanceToNode(contact, node.next_node, flow);
        }
    }

    /**
     * Executa nó do tipo QUESTION - envia botões/lista e PAUSA
     */
    async executeQuestionNode(contact, node) {
        const content = this.replaceVariables(node.content, contact.variables);

        // Se não tiver opções, é uma pergunta de texto livre
        if (!node.options || node.options.length === 0) {
            await ZApiService.sendText(contact.phone, content);
            await this.logMessage(contact.phone, 'out', content, 'text', contact.current_node_id);
            console.log(`[FlowEngine] Aguardando resposta de texto de ${contact.phone} no nó ${contact.current_node_id}`);
            return;
        }

        if (node.options.length <= 3) {
            // Usa botões para até 3 opções
            const buttons = node.options.map(opt => ({
                id: opt.id,
                label: opt.label
            }));

            await ZApiService.sendButtons(
                contact.phone,
                content,
                buttons,
                node.title || '',
                node.footer || ''
            );
            await this.logMessage(contact.phone, 'out', content, 'button', contact.current_node_id, { buttons });

        } else {
            // Se houver mais de 3 opções, divide em blocos de 3
            const chunkSize = 3;
            for (let i = 0; i < node.options.length; i += chunkSize) {
                const chunk = node.options.slice(i, i + chunkSize);

                const buttons = chunk.map(opt => ({
                    id: opt.id,
                    label: opt.label
                }));

                let chunkMessage = i === 0 ? content : '👇 Mais opções:';
                const chunkFooter = (i + chunkSize >= node.options.length) ? (node.footer || '') : '';

                await ZApiService.sendButtons(
                    contact.phone,
                    chunkMessage,
                    buttons,
                    node.title || 'Escolha uma opção:',
                    chunkFooter
                );

                // Registra CADA bloco como uma mensagem separada, para ficar igual ao WhatsApp
                await this.logMessage(contact.phone, 'out', chunkMessage, 'button', contact.current_node_id, { buttons });

                await this.delay(500);
            }
        }

        // PAUSA - aguarda próxima mensagem do webhook
        console.log(`[FlowEngine] Aguardando resposta de ${contact.phone} no nó ${contact.current_node_id}`);
    }

    /**
     * Executa nó do tipo HANDOVER - transfere para atendimento humano
     */
    async executeHandoverNode(contact, node) {
        const content = this.replaceVariables(node.content, contact.variables);

        // Envia mensagem de transferência
        await ZApiService.sendText(contact.phone, content);
        await this.logMessage(contact.phone, 'out', content, 'text', contact.current_node_id);

        // Atualiza status e tags
        const newTags = [...(contact.tags || []), ...(node.tags || [])];
        await contact.update({
            status: 'HUMAN', // Status HUMAN desliga o bot para este contato
            tags: [...new Set(newTags)], // Remove duplicatas
            current_node_id: null
        });

        console.log(`[FlowEngine] HANDOVER - Contato ${contact.phone} transferido para atendimento humano`);

        // --- SISTEMA DE NOTIFICAÇÃO ---
        try {
            const { NotificationSetting } = require('../Models');
            const activeSettings = await NotificationSetting.findAll({ where: { active: true } });

            if (activeSettings.length > 0) {
                // Monta resumo do cliente
                let summary = `🚨 *Novo Atendimento Solicitado*\n\n`;
                summary += `👤 *Cliente:* ${contact.name || 'Sem nome'}\n`;
                summary += `📱 *Telefone:* ${contact.phone}\n`;
                summary += `🏷️ *Tags:* ${newTags.join(', ')}\n\n`;

                summary += `📋 *Resumo da Triagem:*\n`;
                for (const [key, value] of Object.entries(contact.variables || {})) {
                    // Formata a chave para ficar mais legível (ex: tipo_problema -> Tipo Problema)
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    summary += `- *${formattedKey}:* ${value}\n`;
                }

                summary += `\n🔗 *Link para o Chat:* http://localhost:3000/dashboard/chat/${contact.phone}`;

                // Envia para todos os números configurados
                for (const setting of activeSettings) {
                    await ZApiService.sendText(setting.phone, summary);
                    console.log(`[FlowEngine] Notificação enviada para ${setting.name} (${setting.phone})`);
                }
            }
        } catch (error) {
            console.error('[FlowEngine] Erro ao enviar notificações:', error);
        }
    }

    /**
     * Executa nó do tipo DISQUALIFY - encerra fluxo e descarta
     */
    async executeDisqualifyNode(contact, node) {
        const content = this.replaceVariables(node.content, contact.variables);

        // Envia mensagem de despedida
        await ZApiService.sendText(contact.phone, content);
        await this.logMessage(contact.phone, 'out', content, 'text', contact.current_node_id);

        // Atualiza status
        await contact.update({
            status: 'DISQUALIFIED',
            current_node_id: null
        });

        console.log(`[FlowEngine] DISQUALIFY - Contato ${contact.phone} descartado`);
        console.log(`[FlowEngine] Motivo/nó: ${contact.current_node_id}`);
    }

    /**
     * Substitui variáveis no texto (ex: {{nome}} -> valor)
     */
    replaceVariables(content, variables) {
        if (!content) return '';

        let result = content;
        for (const [key, value] of Object.entries(variables || {})) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
    }

    /**
     * Registra mensagem no log
     */
    async logMessage(phone, direction, content, type, nodeId, metadata = {}) {
        try {
            await Message.create({
                contact_phone: phone,
                direction,
                content,
                message_type: type,
                node_id: nodeId,
                metadata
            });
        } catch (error) {
            console.error('[FlowEngine] Erro ao registrar mensagem:', error);
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reinicia o fluxo de um contato
     */
    async resetContact(phone) {
        const contact = await Contact.findByPk(phone);
        if (contact) {
            await contact.update({
                current_flow_id: null,
                current_node_id: null,
                status: 'BOT',
                variables: {},
                tags: []
            });
            console.log(`[FlowEngine] Contato ${phone} resetado`);
        }
        return contact;
    }
}

// Exporta instância singleton
module.exports = new FlowEngineService();
