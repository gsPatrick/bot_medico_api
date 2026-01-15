const sequelize = require('../Config/database');
const User = require('./User');
const Contact = require('./Contact');
const Flow = require('./Flow');
const Message = require('./Message');

// Definir associações

// Contact pertence a um Flow (fluxo atual)
Contact.belongsTo(Flow, {
    foreignKey: 'current_flow_id',
    as: 'currentFlow'
});

Flow.hasMany(Contact, {
    foreignKey: 'current_flow_id',
    as: 'contacts'
});

// Message pertence a um Contact
Message.belongsTo(Contact, {
    foreignKey: 'contact_phone',
    targetKey: 'phone',
    as: 'contact'
});

Contact.hasMany(Message, {
    foreignKey: 'contact_phone',
    sourceKey: 'phone',
    as: 'messages'
});

const NotificationSetting = require('./NotificationSetting');

module.exports = {
    User,
    Flow,
    Contact,
    Message,
    NotificationSetting,
    sequelize
};
