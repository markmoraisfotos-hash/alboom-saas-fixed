const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    // Pegar token do header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Token de acesso requerido',
            code: 'TOKEN_REQUIRED' 
        });
    }

    // Verificar se o token é válido
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Token inválido:', err.message);
            return res.status(403).json({ 
                error: 'Token inválido ou expirado',
                code: 'TOKEN_INVALID' 
            });
        }

        // Adicionar dados do usuário ao request
        req.user = user;
        console.log('✅ Usuário autenticado:', user.email);
        next();
    });
};

// Middleware opcional - não falha se não tiver token
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        req.user = err ? null : user;
        next();
    });
};

module.exports = {
    authenticateToken,
    optionalAuth
};