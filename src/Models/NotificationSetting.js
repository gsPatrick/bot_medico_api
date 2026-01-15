const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const NotificationSetting = sequelize.define('NotificationSetting', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'notification_settings',
    timestamps: true
});

module.exports = NotificationSetting;
