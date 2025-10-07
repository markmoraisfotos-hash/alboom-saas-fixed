const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 GITHUB VERSION - Cache definitivamente quebrado!');
console.log('🔥 Timestamp GitHub:', Date.now());
console.log('⚡ Deploy via GitHub Integration');

app.get('/', (req, res) => {
    res.send('🎉 VERSÃO GITHUB FUNCIONANDO! Deploy: ' + new Date().toISOString());
});

app.get('/ping', (req, res) => {
    res.json({ 
        status: 'pong-github', 
        version: 'github-deploy',
        timestamp: Date.now(),
        source: 'GitHub Integration'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        source: 'GitHub',
        timestamp: new Date().toISOString()
    });
});

// Teste de variáveis - ADICIONE AQUI
app.get('/test-vars', (req, res) => {
    res.json({
        message: 'Teste de variáveis de ambiente',
        timestamp: new Date().toISOString(),
        jwt_secret_exists: !!process.env.JWT_SECRET,
        jwt_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
        total_env_vars: Object.keys(process.env).length,
        server_info: {
            source: 'GitHub Integration',
            version: 'github-deploy-with-vars'
        }
    });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ GITHUB SERVER rodando na porta ' + PORT);
});

// Anti-crash configurations
server.timeout = 120000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

process.on('SIGTERM', () => {
    console.log('📋 SIGTERM GITHUB - fechando graciosamente...');
    server.close(() => {
        console.log('✅ GitHub server fechado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📋 SIGINT GITHUB - fechando graciosamente...');
    server.close(() => {
        console.log('✅ GitHub server fechado');
        process.exit(0);
    });
});
