const { Flow } = require('../Models');

const updateFlowV2 = async () => {
    // JSON ORIGINAL DO CLIENTE (RECUPERADO VIA EXPORT)
    const flowData = {
        "id": "28f751d6-b9a1-4573-b336-00d47e25aafb",
        "name": "Triagem Médica - Dr. Marcelo (V2)",
        "description": "Fluxo atualizado: Encurtado para ir direto ao Handover após interesse.",
        "is_active": true,
        "trigger_keyword": "oi",
        "nodes": {
            "start": {
                "type": "question",
                "content": "Primeira vez com Dr Marcelo ?",
                "options": [{ "id": "1", "label": "Sim", "value": "sim", "next_node": "q_name" }, { "id": "2", "label": "Não", "value": "nao", "next_node": "check_recurrent" }],
                "save_as": "primeira_vez"
            },
            "q_goal": {
                "type": "question",
                "content": "Qual é o seu principal objetivo com o tratamento?",
                "options": [{ "id": "1", "label": "Reduzir dor e melhorar qualidade de vida", "value": "qualidade_vida", "next_node": "q_location" }, { "id": "2", "label": "Retornar ao esporte / atividade física", "value": "esporte", "next_node": "q_location" }, { "id": "3", "label": "Evitar ou planejar cirurgia", "value": "evitar_cirurgia", "next_node": "q_location" }, { "id": "4", "label": "Apenas uma avaliação simples", "value": "avaliacao_simples", "next_node": "descarte_frio" }],
                "save_as": "objetivo"
            },
            "q_name": {
                "type": "question",
                "content": "📝 *Qual é o seu nome completo?*",
                "save_as": "name",
                "next_node": "welcome",
                "accept_free_text": true
            },
            "welcome": {
                "type": "message",
                "content": "Olá! Seja bem-vindo(a) ao consultório do Dr. Marcelo Giovanini Martins – Ortopedia especializada em Ombro e Joelho.\n\nTrabalhamos com uma abordagem moderna da ortopedia, mais resolutiva, buscando sempre tratamentos mais resolutivos e menos cirúrgicos, quando clinicamente indicados.\n\nPor essa característica da medicina atual, muitos dos procedimentos utilizados — como infiltrações avançadas e terapias regenerativas — ainda não são cobertos pelos planos de saúde, podendo envolver investimento particular.\n\nNosso objetivo é sempre avaliar cada caso individualmente e discutir, de forma transparente, as melhores opções de tratamento.\n\nPara entendermos se conseguimos te ajudar da melhor forma, por favor responda:",
                "next_node": "q_region"
            },
            "q_modern": {
                "type": "question",
                "content": "Você estaria aberto(a) a conhecer e, se indicado clinicamente, utilizar tratamentos modernos como infiltrações, procedimentos guiados por ultrassom e terapias regenerativas?",
                "options": [
                    { "id": "1", "label": "Sim, tenho interesse", "value": "sim", "next_node": "success_handover" },
                    { "id": "2", "label": "Talvez, gostaria de entender melhor", "value": "talvez", "next_node": "q_finance_soft" }, // Caminho 'tênue' - igual ao tradicional
                    { "id": "3", "label": "Prefiro apenas tratamentos tradicionais", "value": "tradicional", "next_node": "q_finance_soft" } // Caminho 'tênue'
                ],
                "save_as": "interesse_moderno"
            },

            // --- CAMINHO DE REJEIÇÃO SUAVE (SOFT REJECTION PATH) ---
            "q_finance_soft": {
                "type": "question",
                "content": "Alguns tratamentos podem envolver investimento particular. Você se sente confortável em avaliar opções terapêuticas que eventualmente não sejam cobertas pelo convênio?",
                "content": "Alguns tratamentos podem envolver investimento particular. Você se sente confortável em avaliar opções terapêuticas que eventualmente não sejam cobertas pelo convênio?",
                "options": [{ "id": "1", "label": "Sim", "value": "sim", "next_node": "q_goal_soft" }, { "id": "2", "label": "Depende do custo", "value": "depende", "next_node": "q_goal_soft" }, { "id": "3", "label": "Prefiro somente opções cobertas pelo plano", "value": "somente_plano", "next_node": "q_goal_soft" }], // Agora continua o fluxo suave
                "save_as": "financeiro_soft"
            },
            "q_goal_soft": {
                "type": "question",
                "content": "Qual é o seu principal objetivo com o tratamento?",
                "options": [{ "id": "1", "label": "Reduzir dor e melhorar qualidade de vida", "value": "qualidade_vida", "next_node": "q_location_soft" }, { "id": "2", "label": "Retornar ao esporte / atividade física", "value": "esporte", "next_node": "q_location_soft" }, { "id": "3", "label": "Evitar ou planejar cirurgia", "value": "evitar_cirurgia", "next_node": "q_location_soft" }, { "id": "4", "label": "Apenas uma avaliação simples", "value": "avaliacao_simples", "next_node": "descarte_frio" }],
                "save_as": "objetivo_soft"
            },
            "q_location_soft": {
                "type": "question",
                "content": "Você mora em:",
                "options": [{ "id": "1", "label": "Grande Vitória", "value": "grande_vitoria", "next_node": "descarte_frio" }, { "id": "2", "label": "Outra cidade / outro estado", "value": "outra_cidade", "next_node": "descarte_frio" }], // Fim da linha: Descarte
                "save_as": "localizacao_soft"
            },
            // -------------------------------------------------------

            "q_region": {
                "type": "question",
                "content": "Qual região você deseja tratar?",
                "options": [{ "id": "1", "label": "Ombro", "value": "ombro", "next_node": "q_problem" }, { "id": "2", "label": "Joelho", "value": "joelho", "next_node": "q_problem" }, { "id": "3", "label": "Outra região", "value": "outra", "next_node": "q_problem" }],
                "save_as": "regiao"
            },
            "q_finance": {
                "type": "question",
                "content": "Alguns tratamentos podem envolver investimento particular. Você se sente confortável em avaliar opções terapêuticas que eventualmente não sejam cobertas pelo convênio?",
                "content": "Alguns tratamentos podem envolver investimento particular. Você se sente confortável em avaliar opções terapêuticas que eventualmente não sejam cobertas pelo convênio?",
                "options": [{ "id": "1", "label": "Sim", "value": "sim", "next_node": "q_goal" }, { "id": "2", "label": "Depende do custo", "value": "depende", "next_node": "q_goal" }, { "id": "3", "label": "Prefiro somente opções cobertas pelo plano", "value": "somente_plano", "next_node": "q_goal" }], // Agora continua o fluxo normal
                "save_as": "financeiro"
            },
            "q_problem": {
                "type": "question",
                "content": "Seu problema está mais relacionado a:",
                "options": [{ "id": "1", "label": "Dor crônica / desgaste / artrose", "value": "dor_cronica", "next_node": "q_modern" }, { "id": "2", "label": "Lesão de tendão, ligamento ou cartilagem", "value": "lesao", "next_node": "q_modern" }, { "id": "3", "label": "Avaliação para cirurgia", "value": "cirurgia", "next_node": "q_modern" }, { "id": "4", "label": "Dor recente por esforço físico ou trabalho", "value": "dor_recente", "next_node": "q_modern" }, { "id": "5", "label": "Não sei ao certo", "value": "nao_sei", "next_node": "q_modern" }],
                "save_as": "tipo_problema"
            },
            "q_location": {
                "type": "question",
                "content": "Você mora em:",
                "options": [{ "id": "1", "label": "Grande Vitória", "value": "grande_vitoria", "next_node": "success_handover" }, { "id": "2", "label": "Outra cidade / outro estado", "value": "outra_cidade", "next_node": "msg_telemedicina" }],
                "save_as": "localizacao"
            },
            "descarte_frio": {
                "type": "disqualify",
                "content": "Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade"
            },
            "check_recurrent": {
                "type": "question",
                "content": "O problema atual já foi ou esta em tratamento com o Dr Marcelo ?",
                "options": [{ "id": "1", "label": "Sim", "value": "sim", "next_node": "handover_recorrente" }, { "id": "2", "label": "Não", "value": "nao", "next_node": "welcome_recurrent" }],
                "save_as": "problema_recorrente"
            },
            "msg_telemedicina": {
                "type": "question",
                "content": "Atendemos pacientes de várias cidades e estados.\n\nPara maior comodidade, alguns pacientes optam por iniciar o atendimento por consulta online, que funciona como uma consulta médica normal, com avaliação, orientação e prescrição quando indicado.\n\nA consulta online é um atendimento médico particular, com honorários próprios.\n\nOutros pacientes preferem vir presencialmente desde a primeira consulta.\n\nVocê tem alguma preferência inicial?",
                "options": [{ "id": "1", "label": "Prefiro iniciar por consulta online", "value": "online", "next_node": "success_handover" }, { "id": "2", "label": "Prefiro consulta presencial", "value": "presencial", "next_node": "success_handover" }, { "id": "3", "label": "Ainda não sei", "value": "nao_sei", "next_node": "success_handover" }],
                "save_as": "preferencia_consulta"
            },
            "success_handover": {
                "tags": ["PREMIUM", "QUALIFICADO"],
                "type": "handover",
                "content": "🎉 Obrigado pelas respostas! Um atendente entrará em contato em breve."
            },
            "descarte_convenio": {
                "type": "disqualify",
                "content": "Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade"
            },
            "welcome_recurrent": {
                "type": "message",
                "content": "Atualmente Dr Marcelo está trabalhando com uma abordagem moderna da ortopedia, mais resolutiva, buscando sempre tratamentos mais resolutivos e menos cirúrgicos, quando clinicamente indicados.\n\nPor essa característica da medicina atual, muitos dos procedimentos utilizados — como infiltrações avançadas e terapias regenerativas — ainda não são cobertos pelos planos de saúde, podendo envolver investimento particular.\n\nNosso objetivo é sempre avaliar cada caso individualmente e discutir, de forma transparente, as melhores opções de tratamento.\n\nPara entendermos se conseguimos te ajudar da melhor forma, por favor responda:",
                "next_node": "q_region"
            },
            "descarte_recorrente": {
                "type": "disqualify",
                "content": "Obrigado pelo seu contato, porém como você não preenche os quesitos da forma de atendimento que o Dr Marcelo está mais habituado e para dinamizar sua melhora, te encaminharemos para um outro profissional que preenche melhor seu perfil de necessidade"
            },
            "handover_recorrente": {
                "tags": ["RECORRENTE", "RETORNO"],
                "type": "handover",
                "content": "✅ Encaminhando para a secretaria..."
            }
        }
    };

    try {
        // Encontra o fluxo existente ou cria um novo se não existir (embora devêssemos atualizar)
        // Vamos buscar o PRIMEIRO fluxo ativo
        let flow = await Flow.findOne({ where: { is_active: true } });

        if (!flow) {
            console.log('[UpdateV2] Nenhum fluxo ativo encontrado. Criando novo...');
            flow = await Flow.create(flowData);
        } else {
            console.log(`[UpdateV2] Atualizando fluxo existente: ${flow.name}`);
            await flow.update({
                nodes: flowData.nodes,
                name: flow.name, // Mantém nome original ou atualiza se quiser
                description: "Fluxo atualizado via V2 (Skip Questions)"
            });
        }

        return flow;
    } catch (error) {
        console.error('[UpdateV2] Erro ao atualizar fluxo:', error);
        throw error;
    }
};

module.exports = { updateFlowV2 };
