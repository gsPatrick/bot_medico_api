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
    // NÓ INICIAL
    // ============================================
    start: {
        type: 'question',
        content: 'Primeira vez com Dr Marcelo ?',
        save_as: 'primeira_vez',
        options: [
            { id: '1', label: 'Sim', value: 'sim', next_node: 'q_name' },
            { id: '2', label: 'Não', value: 'nao', next_node: 'check_recurrent' }
        ]
    },

    // ============================================
    // NOME (Mantido para coletar nome de novos)
    // ============================================
    q_name: {
        type: 'question',
        content: '📝 *Qual é o seu nome completo?*',
        save_as: 'name',
        accept_free_text: true,
        next_node: 'welcome'
    },

    // ============================================
    // RECORRÊNCIA
    // ============================================
    check_recurrent: {
        type: 'question',
        content: 'O problema atual já foi ou esta em tratamento com o Dr Marcelo ?',
        save_as: 'problema_recorrente',
        options: [
            { id: '1', label: 'Sim', value: 'sim', next_node: 'handover_recorrente' },
            { id: '2', label: 'Não', value: 'nao', next_node: 'welcome_recurrent' }
        ]
    },

    handover_recorrente: {
        type: 'handover',
        content: '✅ Encaminhando para a secretaria...',
        tags: ['RECORRENTE', 'RETORNO']
    },

    // ============================================
    // BOAS VINDAS (NOVO PACIENTE)
    // ============================================
    welcome: {
        type: 'message',
        content: 'Olá! Seja bem-vindo(a) ao consultório do Dr. Marcelo Giovanini Martins – Ortopedia especializada em Ombro e Joelho.\n\nTrabalhamos com uma abordagem moderna da ortopedia, mais resolutiva, buscando sempre tratamentos mais resolutivos e menos cirúrgicos, quando clinicamente indicados.\n\nPor essa característica da medicina atual, muitos dos procedimentos utilizados — como infiltrações avançadas e terapias regenerativas — ainda não são cobertos pelos planos de saúde, podendo envolver investimento particular.\n\nNosso objetivo é sempre avaliar cada caso individualmente e discutir, de forma transparente, as melhores opções de tratamento.\n\nPara entendermos se conseguimos te ajudar da melhor forma, por favor responda:',
        next_node: 'q_region'
    },

    // ============================================
    // BOAS VINDAS (RECORRENTE - NOVO PROBLEMA)
    // ============================================
    welcome_recurrent: {
        type: 'message',
        content: 'Atualmente Dr Marcelo está trabalhando com uma abordagem moderna da ortopedia, mais resolutiva, buscando sempre tratamentos mais resolutivos e menos cirúrgicos, quando clinicamente indicados.\n\nPor essa característica da medicina atual, muitos dos procedimentos utilizados — como infiltrações avançadas e terapias regenerativas — ainda não são cobertos pelos planos de saúde, podendo envolver investimento particular.\n\nNosso objetivo é sempre avaliar cada caso individualmente e discutir, de forma transparente, as melhores opções de tratamento.\n\nPara entendermos se conseguimos te ajudar da melhor forma, por favor responda:',
        next_node: 'q_region'
    },

    // ============================================
    // 1. REGIÃO
    // ============================================
    q_region: {
        type: 'question',
        content: 'Qual região você deseja tratar?',
        save_as: 'regiao',
        options: [
            { id: '1', label: 'Ombro', value: 'ombro', next_node: 'q_problem' },
            { id: '2', label: 'Joelho', value: 'joelho', next_node: 'q_problem' },
            { id: '3', label: 'Outra região', value: 'outra', next_node: 'q_problem' }
        ]
    },

    // ============================================
    // 2. PROBLEMA
    // ============================================
    q_problem: {
        type: 'question',
        content: 'Seu problema está mais relacionado a:',
        save_as: 'tipo_problema',
        options: [
            { id: '1', label: 'Dor crônica / desgaste / artrose', value: 'dor_cronica', next_node: 'q_modern' },
            { id: '2', label: 'Lesão de tendão, ligamento ou cartilagem', value: 'lesao', next_node: 'q_modern' },
            { id: '3', label: 'Avaliação para cirurgia', value: 'cirurgia', next_node: 'q_modern' },
            // Regra mantida: não descartar (mesmo que PDF diga "não me interessa", user pediu para não descartar antes)
            { id: '4', label: 'Dor recente por esforço físico ou trabalho', value: 'dor_recente', next_node: 'q_modern' },
            { id: '5', label: 'Não sei ao certo', value: 'nao_sei', next_node: 'q_modern' }
        ]
    },

    // ============================================
    // 3. TRATAMENTOS MODERNOS
    // ============================================
    q_modern: {
        type: 'question',
        content: 'Você estaria aberto(a) a conhecer e, se indicado clinicamente, utilizar tratamentos modernos como infiltrações, procedimentos guiados por ultrassom e terapias regenerativas?',
        save_as: 'interesse_moderno',
        options: [
            { id: '1', label: 'Sim, tenho interesse', value: 'sim', next_node: 'q_finance' },
            { id: '2', label: 'Talvez, gostaria de entender melhor', value: 'talvez', next_node: 'q_finance' },
            { id: '3', label: 'Prefiro apenas tratamentos tradicionais', value: 'tradicional', next_node: 'descarte_frio' }
        ]
    },

    // ============================================
    // 4. FINANCEIRO
    // ============================================
    q_finance: {
        type: 'question',
        content: 'Alguns tratamentos podem envolver investimento particular. Você se sente confortável em avaliar opções terapêuticas que eventualmente não sejam cobertas pelo convênio?',
        save_as: 'financeiro',
        options: [
            { id: '1', label: 'Sim', value: 'sim', next_node: 'q_goal' },
            { id: '2', label: 'Depende do custo', value: 'depende', next_node: 'q_goal' },
            { id: '3', label: 'Prefiro somente opções cobertas pelo plano', value: 'somente_plano', next_node: 'descarte_convenio' }
        ]
    },

    // ============================================
    // 5. OBJETIVO
    // ============================================
    q_goal: {
        type: 'question',
        content: 'Qual é o seu principal objetivo com o tratamento?',
        save_as: 'objetivo',
        options: [
            { id: '1', label: 'Reduzir dor e melhorar qualidade de vida', value: 'qualidade_vida', next_node: 'q_location' },
            { id: '2', label: 'Retornar ao esporte / atividade física', value: 'esporte', next_node: 'q_location' },
            { id: '3', label: 'Evitar ou planejar cirurgia', value: 'evitar_cirurgia', next_node: 'q_location' },
            { id: '4', label: 'Apenas uma avaliação simples', value: 'avaliacao_simples', next_node: 'descarte_frio' }
        ]
    },

    // ============================================
    // 6. LOCALIZAÇÃO
    // ============================================
    q_location: {
        type: 'question',
        content: 'Você mora em:',
        save_as: 'localizacao',
        options: [
            { id: '1', label: 'Grande Vitória', value: 'grande_vitoria', next_node: 'success_handover' },
            { id: '2', label: 'Outra cidade / outro estado', value: 'outra_cidade', next_node: 'msg_telemedicina' }
        ]
    },

    // ============================================
    // TELEMEDICINA
    // ============================================
    msg_telemedicina: {
        type: 'question', // Mudado para question pois tem botões
        content: 'Atendemos pacientes de várias cidades e estados.\n\nPara maior comodidade, alguns pacientes optam por iniciar o atendimento por consulta online, que funciona como uma consulta médica normal, com avaliação, orientação e prescrição quando indicado.\n\nA consulta online é um atendimento médico particular, com honorários próprios.\n\nOutros pacientes preferem vir presencialmente desde a primeira consulta.\n\nVocê tem alguma preferência inicial?',
        save_as: 'preferencia_consulta',
        options: [
            { id: '1', label: 'Prefiro iniciar por consulta online', value: 'online', next_node: 'success_handover' },
            { id: '2', label: 'Prefiro consulta presencial', value: 'presencial', next_node: 'success_handover' },
            { id: '3', label: 'Ainda não sei', value: 'nao_sei', next_node: 'success_handover' }
        ]
    },

    // ============================================
    // SUCESSO
    // ============================================
    success_handover: {
        type: 'handover',
        content: '🎉 Obrigado pelas respostas! Um atendente entrará em contato em breve.',
        tags: ['PREMIUM', 'QUALIFICADO']
    },

    // ============================================
    // DESCARTES (Texto Padrão Aprovado)
    // ============================================
    descarte_frio: {
        type: 'disqualify',
        content: 'Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade'
    },

    descarte_convenio: {
        type: 'disqualify',
        content: 'Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade'
    },

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
        console.log('[Seeder] Verificando fluxo de triagem existente... (FORCE UPDATE v3)');

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
