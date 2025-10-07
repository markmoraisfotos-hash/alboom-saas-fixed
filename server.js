const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const galleryRoutes = require('./routes/gallery');
const clientRoutes = require('./routes/client-selection');
const commerceRoutes = require('./routes/commerce');
const watermarkRoutes = require('./routes/watermark');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('📸 PhotoFlow SaaS - Plataforma Completa para Fotógrafos');
console.log('🔥 Timestamp:', Date.now());
console.log('⚡ Deploy via GitHub Integration');
console.log('🔐 JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🔐 JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
console.log('📊 Total ENV vars:', Object.keys(process.env).length);

// ============= MIDDLEWARES =============
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    next();
});

// ============= ROTAS =============

// Rotas básicas (mantendo as originais)
app.get('/', (req, res) => {
    res.json({
        message: '📸 PhotoFlow SaaS - Plataforma Completa!',
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        source: 'GitHub Integration',
        features: [
            '🔐 Autenticação JWT',
            '👥 Gestão de usuários',
            '📸 Sistema de galeria',
            '🎯 Seleção de fotos',
            '📤 Integração Lightroom',
            '💰 Sistema de vendas',
            '📦 Pacotes e pedidos',
            '🏷️ Marca d\'agua',
            '💳 Processamento de pagamentos',
            '🛡️ Middleware de segurança'
        ]
    });
});

app.get('/ping', (req, res) => {
    res.json({ 
        status: 'pong-auth-system', 
        version: 'v2.0.0-auth',
        timestamp: Date.now(),
        source: 'GitHub Integration'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        source: 'GitHub',
        timestamp: new Date().toISOString(),
        services: {
            auth: 'running',
            jwt: !!process.env.JWT_SECRET
        }
    });
});

// Teste de variáveis (mantido)
app.get('/test-vars', (req, res) => {
    res.json({
        message: 'Teste de variáveis de ambiente',
        timestamp: new Date().toISOString(),
        jwt_secret_exists: !!process.env.JWT_SECRET,
        jwt_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
        total_env_vars: Object.keys(process.env).length,
        server_info: {
            source: 'GitHub Integration',
            version: 'v2.0.0-auth-system'
        }
    });
});

// ============= API ROUTES =============
app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/commerce', commerceRoutes);
app.use('/api/watermark', watermarkRoutes);

// Rota 404 para APIs
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        code: 'NOT_FOUND',
        available_endpoints: [
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/me',
            'POST /api/auth/refresh',
            'POST /api/auth/logout',
            'GET /api/auth/users (admin only)'
        ]
    });
});

// ============= ERROR HANDLING =============
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', err);
    
    res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    });
});

// ============= SERVER START =============
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ ALBOOM SaaS Server rodando na porta ' + PORT);
    console.log('🔗 Endpoints disponíveis:');
    console.log('   GET  / - Homepage');
    console.log('   GET  /ping - Health check');
    console.log('   GET  /health - Status detalhado');
    console.log('   POST /api/auth/register - Cadastro');
    console.log('   POST /api/auth/login - Login');
    console.log('   GET  /api/auth/me - Perfil (requer token)');
    console.log('   POST /api/auth/refresh - Renovar token');
    console.log('   POST /api/auth/logout - Logout');
    console.log('   GET  /api/auth/users - Listar usuários (admin)');
});

// Anti-crash configurations
server.timeout = 120000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

process.on('SIGTERM', () => {
    console.log('📋 SIGTERM - fechando graciosamente...');
    server.close(() => {
        console.log('✅ Server fechado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📋 SIGINT - fechando graciosamente...');
    server.close(() => {
        console.log('✅ Server fechado');
        process.exit(0);
    });
});