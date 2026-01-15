require('dotenv').config();

const zapiConfig = {
    instanceId: process.env.ZAPI_INSTANCE_ID,
    token: process.env.ZAPI_TOKEN,
    clientToken: process.env.ZAPI_CLIENT_TOKEN,

    get baseUrl() {
        return `https://api.z-api.io/instances/${this.instanceId}/token/${this.token}`;
    },

    get headers() {
        return {
            'Content-Type': 'application/json',
            'Client-Token': this.clientToken || ''
        };
    }
};

module.exports = zapiConfig;
