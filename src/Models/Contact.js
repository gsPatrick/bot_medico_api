const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const Contact = sequelize.define('Contact', {
    phone: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    current_flow_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'flows',
            key: 'id'
        }
    },
    current_node_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Rastreia onde o paciente está no JSON do fluxo'
    },
    status: {
        type: DataTypes.ENUM('BOT', 'PENDING', 'FINISHED', 'DISQUALIFIED', 'HUMAN'),
        defaultValue: 'BOT',
        comment: 'BOT=em atendimento automático, PENDING=aguardando humano, FINISHED=concluído, DISQUALIFIED=descartado'
    },
    variables: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Armazena as respostas coletadas. Ex: { "dor": "ombro", "financeiro": "particular" }'
    },
    tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array de strings para categorização. Ex: ["PREMIUM", "OMBRO"]'
    },
    last_interaction_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'contacts',
    timestamps: true
});

module.exports = Contact;
