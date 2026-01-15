const { Flow } = require('../Models');

/**
 * Seeder: Fluxo de Triagem Médica - Dr. Marcelo
 * 
 * Este seeder cria o fluxo completo de triagem baseado nas regras do PDF:
 * - Identificação de paciente novo/recorrente
 * - Qualificação por região do corpo, tipo de problema, interesse em tratamento moderno
 * - Filtro financeiro (particular vs convênio)
 * - Verificação de objetivo e localização
 * - Redirecionamento para telemedicina ou presencial
 */

const triagemFlowNodes = {
    // ============================================
    // NÓ INICIAL - Primeira vez com Dr. Marcelo?
    // ============================================
    start: {
        type: 'question',
        content: '👋 Olá! Seja bem-vindo ao consultório do *Dr. Marcelo*.\n\nÉ a primeira vez que você consulta com o Dr. Marcelo?',
        save_as: 'primeira_vez',
        options: [
            { id: '1', label: 'Sim, primeira vez', value: 'sim', next_node: 'q_name' },
            { id: '2', label: 'Não, já consultei', value: 'nao', next_node: 'check_recurrent' }
        ]
    },

    // ============================================
    // PERGUNTA: NOME SO CLIENTE 
    // ============================================
    q_name: {
        type: 'question',
        content: '📝 *Qual é o seu nome completo?*',
        save_as: 'name',
        accept_free_text: true, // Habilita campo de texto livre
        next_node: 'welcome'
    },

    // ============================================
    // VERIFICAÇÃO DE RECORRÊNCIA
    // ============================================
    check_recurrent: {
        type: 'question',
        content: 'Entendi! O problema que você quer tratar agora *já foi tratado anteriormente* com o Dr. Marcelo?',
        save_as: 'problema_recorrente',
        options: [
            { id: '1', label: 'Sim, o mesmo problema', value: 'sim', next_node: 'handover_recorrente' },
            { id: '2', label: 'Não, é um novo problema', value: 'nao', next_node: 'q_name' }
        ]
    },

    // Handover para paciente recorrente com mesmo problema
    handover_recorrente: {
        type: 'handover',
        content: '✅ Perfeito! Como você já é nosso paciente e está com um problema que já tratamos, vou transferir você diretamente para nossa equipe de atendimento.\n\nAguarde um momento, por favor! 🙏',
        tags: ['RECORRENTE', 'RETORNO']
    },

    // ============================================
    // BOAS-VINDAS (ATUALIZADO COPYWRITING)
    // ============================================
    welcome: {
        type: 'message',
        // Usa {{name}} se disponível, que o FlowEngine substitui
        content: 'Olá! Seja bem-vindo(a) ao consultório do Dr. Marcelo Giovanini Martins – Ortopedia especializada em Ombro e Joelho.\n\nTrabalhamos com uma abordagem moderna da ortopedia, mais resolutiva, buscando sempre tratamentos mais resolutivos e menos cirúrgicos, quando clinicamente indicados.\n\nPor essa característica da medicina atual, muitos dos procedimentos utilizados — como infiltrações avançadas e terapias regenerativas — ainda não são cobertos pelos planos de saúde, podendo envolver investimento particular.\n\nNosso objetivo é sempre avaliar cada caso individualmente e discutir, de forma transparente, as melhores opções de tratamento.',
        next_node: 'q_region'
    },

    // ============================================
    // PERGUNTA: REGIÃO DO CORPO
    // ============================================
    q_region: {
        type: 'question',
        content: '🦴 Para entendermos se conseguimos te ajudar... *Qual região você deseja tratar?*',
        save_as: 'regiao',
        options: [
            { id: '1', label: '💪 Ombro', value: 'ombro', next_node: 'q_problem' },
            { id: '2', label: '🦵 Joelho', value: 'joelho', next_node: 'q_problem' },
            { id: '3', label: '📍 Outra região', value: 'outra', next_node: 'q_problem' }
        ]
    },

    // ============================================
    // PERGUNTA: TIPO DE PROBLEMA (ATUALIZADO LÓGICA)
    // ============================================
    q_problem: {
        type: 'question',
        content: '🔍 *Como você descreveria seu problema?*\n\nEscolha a opção que mais se aproxima da sua situação:',
        save_as: 'tipo_problema',
        title: 'Tipo de Problema',
        button_text: 'Ver opções',
        list_title: 'Opções',
        options: [
            { id: '1', label: 'Dor crônica (há meses)', value: 'dor_cronica', description: 'Dor persistente há bastante tempo', next_node: 'q_modern' },
            { id: '2', label: 'Lesão esportiva', value: 'lesao', description: 'Machucado durante atividade física', next_node: 'q_modern' },
            { id: '3', label: 'Pós-cirurgia', value: 'cirurgia', description: 'Reabilitação ou problema pós-operatório', next_node: 'q_modern' },
            // MUDANÇA: Dores recentes e Não sei definir NÃO DESCARTAM MAIS. Seguem para q_modern.
            { id: '4', label: 'Dor recente (poucos dias)', value: 'dor_recente', description: 'Começou a sentir há pouco tempo', next_node: 'q_modern' },
            { id: '5', label: 'Não sei definir', value: 'nao_sei', description: 'Não tenho certeza do problema', next_node: 'q_modern' }
        ]
    },

    // ============================================
    // PERGUNTA: INTERESSE EM TRATAMENTO MODERNO
    // ============================================
    q_modern: {
        type: 'question',
        content: '💡 O Dr. Marcelo utiliza *tratamentos modernos e inovadores*, como infiltrações guiadas, terapia por ondas de choque e técnicas regenerativas.\n\nVocê tem interesse em conhecer essas opções?',
        save_as: 'interesse_moderno',
        options: [
            { id: '1', label: '✅ Sim, tenho interesse', value: 'sim', next_node: 'q_finance' },
            { id: '2', label: '🤔 Quero saber mais', value: 'saber_mais', next_node: 'q_finance' },
            { id: '3', label: '❌ Prefiro tradicionais', value: 'tradicional', next_node: 'descarte_frio' }
        ]
    },

    // ============================================
    // PERGUNTA: FINANCEIRO (PARTICULAR vs CONVÊNIO)
    // ============================================
    q_finance: {
        type: 'question',
        content: '💰 Nossos tratamentos especializados são realizados de forma *particular* (não cobrimos por plano de saúde).\n\nVocê estaria disposto a avaliar opções de investimento para sua saúde?',
        save_as: 'financeiro',
        options: [
            { id: '1', label: '✅ Sim, posso avaliar', value: 'particular', next_node: 'q_goal' },
            { id: '2', label: '💳 Tenho flexibilidade', value: 'flexivel', next_node: 'q_goal' },
            { id: '3', label: '❌ Somente convênio', value: 'convenio', next_node: 'descarte_convenio' }
        ]
    },

    // ============================================
    // PERGUNTA: OBJETIVO DO TRATAMENTO
    // ============================================
    q_goal: {
        type: 'question',
        content: '🎯 *Qual é seu principal objetivo com o tratamento?*',
        save_as: 'objetivo',
        options: [
            { id: '1', label: '🌟 Melhorar qualidade de vida', value: 'qualidade_vida', next_node: 'q_location' },
            { id: '2', label: '⚽ Voltar ao esporte', value: 'esporte', next_node: 'q_location' },
            { id: '3', label: '🏥 Evitar cirurgia', value: 'evitar_cirurgia', next_node: 'q_location' },
            { id: '4', label: '🔎 Só quero uma avaliação', value: 'so_avaliacao', next_node: 'descarte_frio' }
        ]
    },

    // ============================================
    // PERGUNTA: LOCALIZAÇÃO
    // ============================================
    q_location: {
        type: 'question',
        content: '📍 *Onde você mora?*\n\nIsso nos ajuda a definir a melhor modalidade de atendimento.',
        save_as: 'localizacao',
        options: [
            { id: '1', label: '🏙️ Grande Vitória (ES)', value: 'grande_vitoria', next_node: 'q_modalidade' },
            { id: '2', label: '🗺️ Interior do ES', value: 'interior_es', next_node: 'msg_telemedicina' },
            { id: '3', label: '✈️ Outro estado', value: 'outro_estado', next_node: 'msg_telemedicina' }
        ]
    },

    // Mensagem sobre telemedicina para quem mora longe
    msg_telemedicina: {
        type: 'message',
        content: '📱 *Ótima notícia!*\n\nPara pacientes que moram fora da Grande Vitória, o Dr. Marcelo oferece *consultas por telemedicina* (videochamada), com a mesma qualidade do atendimento presencial.\n\nAssim você pode fazer uma avaliação inicial sem precisar se deslocar! 🎉',
        next_node: 'q_modalidade'
    },

    // ============================================
    // PERGUNTA: MODALIDADE (ONLINE vs PRESENCIAL)
    // ============================================
    q_modalidade: {
        type: 'question',
        content: '🖥️ *Como você prefere realizar sua consulta?*',
        save_as: 'modalidade',
        options: [
            { id: '1', label: '📱 Online (telemedicina)', value: 'online', next_node: 'success_handover' },
            { id: '2', label: '🏥 Presencial', value: 'presencial', next_node: 'success_handover' }
        ]
    },

    // ============================================
    // SUCESSO - HANDOVER PARA ATENDIMENTO
    // ============================================
    success_handover: {
        type: 'handover',
        content: '🎉 *Excelente! Você está qualificado para agendar sua consulta!*\n\n✅ Analisei suas respostas e você é um ótimo candidato para os tratamentos do Dr. Marcelo.\n\nUm membro da nossa equipe entrará em contato em breve para agendar o melhor horário para você.\n\n⏰ Horário de atendimento: Segunda a Sexta, 8h às 18h\n\nAguarde um momento! 🙏',
        tags: ['PREMIUM', 'QUALIFICADO']
    },

    // ============================================
    // DESCARTES (ATUALIZADO COPYWRITING EM TODOS)
    // ============================================

    // Descarte frio - não se encaixa no perfil
    descarte_frio: {
        type: 'disqualify',
        content: 'Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade'
    },

    // Descarte convênio - só aceita plano
    descarte_convenio: {
        type: 'disqualify',
        content: 'Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade'
    },

    // Descarte recorrente - bloqueia retorno de disqualificados
    descarte_recorrente: {
        type: 'disqualify',
        content: 'Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade'
    }
};

/**
 * Função para executar o seeder
 */
async function seedTriagemFlow() {
    try {
        console.log('[Seeder] Verificando fluxo de triagem existente...');

        // Verifica se já existe um fluxo de triagem
        const existingFlow = await Flow.findOne({
            where: { name: 'Triagem Médica - Dr. Marcelo' }
        });

        if (existingFlow) {
            console.log('[Seeder] Fluxo de triagem já existe. Atualizando...');
            await existingFlow.update({
                nodes: triagemFlowNodes,
                is_active: true
            });
            console.log('[Seeder] Fluxo atualizado com sucesso!');
            return existingFlow;
        }

        // Desativa outros fluxos
        await Flow.update({ is_active: false }, { where: { is_active: true } });

        // Cria o novo fluxo
        const flow = await Flow.create({
            name: 'Triagem Médica - Dr. Marcelo',
            description: 'Fluxo de qualificação de pacientes para consultas ortopédicas especializadas. Filtra por região, tipo de problema, interesse em tratamentos modernos, disponibilidade financeira e localização.',
            trigger_keyword: 'oi',
            is_active: true,
            nodes: triagemFlowNodes
        });

        console.log('[Seeder] ✅ Fluxo de triagem criado com sucesso!');
        console.log(`[Seeder] ID: ${flow.id}`);
        console.log(`[Seeder] Nós: ${Object.keys(triagemFlowNodes).length}`);

        return flow;

    } catch (error) {
        console.error('[Seeder] ❌ Erro ao criar fluxo de triagem:', error);
        throw error;
    }
}

// Exporta função e nodes para uso externo
module.exports = {
    seedTriagemFlow,
    triagemFlowNodes
};
