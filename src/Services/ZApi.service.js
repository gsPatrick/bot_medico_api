const axios = require('axios');
const zapiConfig = require('../Config/zapi.config');

/**
 * Serviço wrapper para integração com Z-API
 * Documentação: https://developer.z-api.io/
 */
class ZApiService {
    constructor() {
        this.api = axios.create({
            baseURL: zapiConfig.baseUrl,
            headers: zapiConfig.headers
        });
    }

    /**
     * Formata o número de telefone para o padrão Z-API
     * Remove caracteres especiais e garante formato DDI+DDD+Número
     */
    formatPhone(phone) {
        // Remove tudo que não for número
        let formatted = phone.replace(/\D/g, '');

        // Se não começar com 55 (Brasil), adiciona
        if (!formatted.startsWith('55')) {
            formatted = '55' + formatted;
        }

        return formatted;
    }

    /**
     * Envia mensagem de texto simples
     * @param {string} phone - Telefone no formato 5511999999999
     * @param {string} message - Texto da mensagem
     */
    async sendText(phone, message) {
        try {
            const response = await this.api.post('/send-text', {
                phone: this.formatPhone(phone),
                message
            });
            console.log(`[Z-API] Texto enviado para ${phone}`);
            return response.data;
        } catch (error) {
            console.error('[Z-API] Erro ao enviar texto:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Envia mensagem com botões de ação (até 3 botões)
     * @param {string} phone - Telefone
     * @param {string} text - Texto principal
     * @param {Array} buttons - Array de botões [{ id: '1', label: 'Sim' }]
     * @param {string} title - Título opcional
     * @param {string} footer - Rodapé opcional
     */
    async sendButtons(phone, text, buttons, title = '', footer = '') {
        try {
            // Mapeia para o formato esperado pela Z-API (buttonList)
            const formattedButtons = buttons.map(btn => ({
                id: btn.id || Math.random().toString(36).substr(2, 9),
                label: btn.label
            }));

            const payload = {
                phone: this.formatPhone(phone),
                message: text,
                // Z-API às vezes exige título em certas versões/dispositivos
                title: title || 'Escolha uma opção:',
                footer: footer,
                buttonList: {
                    buttons: formattedButtons
                }
            };

            console.log(`[Z-API] Enviando botões para ${phone}:`, JSON.stringify(payload, null, 2));

            const response = await this.api.post('/send-button-list', payload);
            console.log(`[Z-API] Botões enviados com sucesso!`);
            return response.data;
        } catch (error) {
            console.error('[Z-API] Erro ao enviar botões:', error.response?.data || error.message);

            // FALLBACK: Tenta enviar como texto se falhar
            console.log('[Z-API] Tentando fallback para texto...');
            const textFallback = `${text}\n\n${title || 'Opções'}:\n` +
                buttons.map((b, i) => `${i + 1}. ${b.label}`).join('\n');

            return this.sendText(phone, textFallback);
        }
    }

    /**
     * Envia lista de opções (menu) - para mais de 3 opções
     * @param {string} phone - Telefone
     * @param {string} text - Texto principal
     * @param {string} title - Título do menu
     * @param {string} buttonText - Texto do botão que abre o menu
     * @param {Array} sections - Seções com opções [{ title: 'Seção', rows: [{ id, title, description }] }]
     */
    async sendList(phone, text, title, buttonText, sections) {
        try {
            const response = await this.api.post('/send-option-list', {
                phone: this.formatPhone(phone),
                message: text,
                title: title,
                buttonText: buttonText,
                options: sections
            });
            console.log(`[Z-API] Lista enviada para ${phone}`);
            return response.data;
        } catch (error) {
            console.error('[Z-API] Erro ao enviar lista:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Envia imagem com legenda opcional
     * @param {string} phone - Telefone
     * @param {string} imageUrl - URL pública da imagem
     * @param {string} caption - Legenda opcional
     */
    async sendImage(phone, imageUrl, caption = '') {
        try {
            const response = await this.api.post('/send-image', {
                phone: this.formatPhone(phone),
                image: imageUrl,
                caption
            });
            console.log(`[Z-API] Imagem enviada para ${phone}`);
            return response.data;
        } catch (error) {
            console.error('[Z-API] Erro ao enviar imagem:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Verifica status da instância
     */
    async checkStatus() {
        try {
            const response = await this.api.get('/status');
            return response.data;
        } catch (error) {
            console.error('[Z-API] Erro ao verificar status:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Obtém QR Code para conexão
     */
    async getQRCode() {
        try {
            const response = await this.api.get('/qr-code');
            return response.data;
        } catch (error) {
            console.error('[Z-API] Erro ao obter QR Code:', error.response?.data || error.message);
            throw error;
        }
    }
}

// Exporta instância singleton
module.exports = new ZApiService();
