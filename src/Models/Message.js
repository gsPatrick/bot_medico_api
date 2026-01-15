const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    contact_phone: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'contacts',
            key: 'phone'
        }
    },
    direction: {
        type: DataTypes.ENUM('in', 'out'),
        allowNull: false,
        comment: 'in = mensagem recebida, out = mensagem enviada'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    message_type: {
        type: DataTypes.ENUM('text', 'button', 'list', 'image', 'audio', 'document', 'location'),
        defaultValue: 'text'
    },
    zapi_message_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID da mensagem retornado pela Z-API'
    },
    node_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID do nó do fluxo que gerou/recebeu esta mensagem'
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Dados extras como payload de botões, etc'
    }
}, {
    tableName: 'messages',
    timestamps: true
});

module.exports = Message;
