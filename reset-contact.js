require('dotenv').config();
const { sequelize, Contact } = require('./src/Models');

async function resetContact() {
    // Pega o número do argumento da linha de comando
    const phone = process.argv[2];

    if (!phone) {
        console.error('❌ Por favor, forneça o número de telefone.');
        console.error('Uso: node reset-contact.js 5571999999999');
        process.exit(1);
    }

    try {
        await sequelize.authenticate();
        console.log('[Database] Conectado.');

        const contact = await Contact.findByPk(phone);

        if (!contact) {
            console.error(`❌ Contato ${phone} não encontrado.`);
            process.exit(1);
        }

        console.log(`[Info] Status atual: ${contact.status}`);
        console.log(`[Info] Tags atuais: ${contact.tags}`);

        await contact.update({
            status: 'BOT',
            current_node_id: null,
            current_flow_id: null,
            tags: contact.tags ? contact.tags.filter(t => t !== 'SEGUNDO_CONTATO') : [] // Remove tag de segundo contato para testar do zero se quiser? Não, melhor manter. Apenas status.
        });

        // Força status BOT e limpa nó atual para reiniciar fluxo
        await contact.update({
            status: 'BOT',
            current_node_id: null
        });

        console.log(`✅ Contato ${phone} resetado para status BOT com sucesso!`);
        console.log('O bot deve responder à próxima mensagem.');

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await sequelize.close();
    }
}

resetContact();
