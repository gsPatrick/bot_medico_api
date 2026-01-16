const { Flow, Contact } = require('../../Models');

/**
 * Lista todos os fluxos
 */
const listFlows = async (req, res) => {
    try {
        const flows = await Flow.findAll({
            attributes: ['id', 'name', 'description', 'is_active', 'trigger_keyword', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: flows
        });
    } catch (error) {
        console.error('[FlowController] Erro ao listar fluxos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtém um fluxo por ID (com nodes)
 */
const getFlow = async (req, res) => {
    try {
        const { id } = req.params;

        const flow = await Flow.findByPk(id);

        if (!flow) {
            return res.status(404).json({ success: false, error: 'Fluxo não encontrado' });
        }

        res.json({
            success: true,
            data: flow
        });
    } catch (error) {
        console.error('[FlowController] Erro ao obter fluxo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Cria um novo fluxo
 */
const createFlow = async (req, res) => {
    try {
        const { name, description, trigger_keyword, nodes, is_active } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
        }

        // Se is_active = true, desativa outros fluxos
        if (is_active) {
            await Flow.update({ is_active: false }, { where: { is_active: true } });
        }

        const flow = await Flow.create({
            name,
            description,
            trigger_keyword,
            nodes: nodes || {},
            is_active: is_active || false
        });

        res.status(201).json({
            success: true,
            data: flow
        });
    } catch (error) {
        console.error('[FlowController] Erro ao criar fluxo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Atualiza um fluxo existente
 */
const updateFlow = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, trigger_keyword, nodes, is_active } = req.body;

        const flow = await Flow.findByPk(id);

        if (!flow) {
            return res.status(404).json({ success: false, error: 'Fluxo não encontrado' });
        }

        // Se is_active = true, desativa outros fluxos
        if (is_active && !flow.is_active) {
            await Flow.update({ is_active: false }, { where: { is_active: true } });
        }

        await flow.update({
            name: name !== undefined ? name : flow.name,
            description: description !== undefined ? description : flow.description,
            trigger_keyword: trigger_keyword !== undefined ? trigger_keyword : flow.trigger_keyword,
            nodes: nodes !== undefined ? nodes : flow.nodes,
            is_active: is_active !== undefined ? is_active : flow.is_active
        });

        res.json({
            success: true,
            data: flow
        });
    } catch (error) {
        console.error('[FlowController] Erro ao atualizar fluxo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Remove um fluxo
 */
const deleteFlow = async (req, res) => {
    try {
        const { id } = req.params;

        const flow = await Flow.findByPk(id);

        if (!flow) {
            return res.status(404).json({ success: false, error: 'Fluxo não encontrado' });
        }

        // Verifica se há contatos usando este fluxo
        const contactsCount = await Contact.count({ where: { current_flow_id: id } });
        if (contactsCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Existem ${contactsCount} contatos usando este fluxo. Finalize-os primeiro.`
            });
        }

        await flow.destroy();

        res.json({
            success: true,
            message: 'Fluxo removido com sucesso'
        });
    } catch (error) {
        console.error('[FlowController] Erro ao remover fluxo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Ativa um fluxo (desativa os outros)
 */
const activateFlow = async (req, res) => {
    try {
        const { id } = req.params;

        const flow = await Flow.findByPk(id);

        if (!flow) {
            return res.status(404).json({ success: false, error: 'Fluxo não encontrado' });
        }

        // Desativa todos os outros
        await Flow.update({ is_active: false }, { where: { is_active: true } });

        // Ativa este
        await flow.update({ is_active: true });

        res.json({
            success: true,
            data: flow,
            message: 'Fluxo ativado com sucesso'
        });
    } catch (error) {
        console.error('[FlowController] Erro ao ativar fluxo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Duplica um fluxo
 */
const duplicateFlow = async (req, res) => {
    try {
        const { id } = req.params;

        const originalFlow = await Flow.findByPk(id);

        if (!originalFlow) {
            return res.status(404).json({ success: false, error: 'Fluxo não encontrado' });
        }

        const newFlow = await Flow.create({
            name: `${originalFlow.name} (Cópia)`,
            description: originalFlow.description,
            trigger_keyword: originalFlow.trigger_keyword,
            nodes: originalFlow.nodes,
            is_active: false
        });

        res.status(201).json({
            success: true,
            data: newFlow
        });
    } catch (error) {
        console.error('[FlowController] Erro ao duplicar fluxo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Executa o Seeder de Triagem
 */
const runSeeder = async (req, res) => {
    try {
        const { seedTriagemFlow } = require('../../Seeders/default-triage-flow');
        const flow = await seedTriagemFlow();

        res.status(201).json({
            success: true,
            message: 'Fluxo de triagem semeado com sucesso!',
            data: flow
        });
    } catch (error) {
        console.error('[FlowController] Erro ao rodar seeder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    listFlows,
    getFlow,
    createFlow,
    updateFlow,
    deleteFlow,
    activateFlow,
    duplicateFlow,
    runSeeder
};
