require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./Models');
const routes = require('./Routes');
const { seedTriagemFlow } = require('./Seeders/default-triage-flow');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES
// ============================================

// CORS - permite requisições de qualquer origem
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Log de requisições (desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// ============================================
// ROTAS
// ============================================

app.use(routes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        name: 'Bot Médico API',
        version: '1.0.0',
        description: 'Motor de Chatbot Dinâmico para WhatsApp - Triagem Médica',
        endpoints: {
            health: '/health',
            webhook: '/webhook',
            flows: '/api/flows'
        },
        status: 'running'
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// Middleware de erro global
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
    });
});

// ============================================
// INICIALIZAÇÃO
// ============================================

async function startServer() {
    try {
        // 1. Conecta ao banco de dados
        console.log('[Database] Conectando ao PostgreSQL...');
        await sequelize.authenticate();
        console.log('[Database] ✅ Conexão estabelecida com sucesso!');

        // 2. Sincroniza os models (cria tabelas se não existirem)
        console.log('[Database] Sincronizando models...');
        await sequelize.sync({ alter: true }); // Updates tables without dropping them
        console.log('[Database] ✅ Models sincronizados!');

        // 3. Executa o seeder do fluxo de triagem
        console.log('[Seeder] Inicializando fluxo de triagem...');
        await seedTriagemFlow();
        console.log('[Seeder] ✅ Fluxo de triagem pronto!');

        // 4. Inicia o servidor
        app.listen(PORT, () => {
            console.log('');
            console.log('╔════════════════════════════════════════════════════╗');
            console.log('║                                                    ║');
            console.log('║   🏥 BOT MÉDICO API - SERVIDOR INICIADO           ║');
            console.log('║                                                    ║');
            console.log(`║   🌐 URL: http://localhost:${PORT}                    ║`);
            console.log('║   📡 Webhook: POST /webhook                        ║');
            console.log('║   🔧 Fluxos: GET /api/flows                        ║');
            console.log('║                                                    ║');
            console.log('╚════════════════════════════════════════════════════╝');
            console.log('');
        });

    } catch (error) {
        console.error('[Startup] ❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
    console.log('\n[Shutdown] Encerrando servidor...');
    await sequelize.close();
    console.log('[Shutdown] Conexão com banco fechada.');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n[Shutdown] Encerrando servidor...');
    await sequelize.close();
    console.log('[Shutdown] Conexão com banco fechada.');
    process.exit(0);
});

// Inicia o servidor
startServer();

module.exports = app;
