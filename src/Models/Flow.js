const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const Flow = sequelize.define('Flow', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Apenas um fluxo deve estar ativo por vez'
    },
    trigger_keyword: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Palavra-chave que inicia o fluxo. Ex: "oi", "agendar"'
    },
    nodes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Objeto onde a chave é o node_id e o valor contém: { type, content, options, next_node }'
    }
}, {
    tableName: 'flows',
    timestamps: true
});

/**
 * Estrutura esperada do campo nodes:
 * {
 *   "start": {
 *     "type": "question",
 *     "content": "É a primeira vez que você consulta com o Dr. Marcelo?",
 *     "options": [
 *       { "id": "1", "label": "Sim", "next_node": "welcome", "save_as": "primeira_vez" },
 *       { "id": "2", "label": "Não", "next_node": "check_recurrent", "save_as": "primeira_vez" }
 *     ]
 *   },
 *   "welcome": {
 *     "type": "message",
 *     "content": "Seja bem-vindo! Vou fazer algumas perguntas...",
 *     "next_node": "q_region"
 *   },
 *   "handover": {
 *     "type": "handover",
 *     "content": "Aguarde, um atendente entrará em contato em breve.",
 *     "tags": ["PREMIUM"]
 *   },
 *   "descarte": {
 *     "type": "disqualify",
 *     "content": "Obrigado pelo contato. Infelizmente não podemos ajudá-lo no momento."
 *   }
 * }
 * 
 * Tipos de nós:
 * - message: Envia texto e avança automaticamente para next_node
 * - question: Envia botões/lista e aguarda resposta do usuário
 * - handover: Transfere para atendimento humano (status -> PENDING)
 * - disqualify: Encerra fluxo e marca como descartado (status -> DISQUALIFIED)
 */

module.exports = Flow;
