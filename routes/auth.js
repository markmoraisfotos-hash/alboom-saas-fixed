const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Função para gerar JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// 📝 POST /api/auth/register - Cadastro de usuário
router.post('/register', [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nome deve ter entre 2 e 50 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Senha deve conter pelo menos: 1 minúscula, 1 maiúscula, 1 número')
], async (req, res) => {
    try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Criar usuário
        const user = await User.create({ name, email, password });
        
        // Gerar token
        const token = generateToken(user);

        console.log('✅ Novo usuário registrado:', email);

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: user.toPublic(),
            token,
            expires_in: '24h'
        });

    } catch (error) {
        console.log('❌ Erro no registro:', error.message);
        
        if (error.message === 'Email já está em uso') {
            return res.status(409).json({
                error: 'Email já está em uso',
                code: 'EMAIL_EXISTS'
            });
        }

        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🔑 POST /api/auth/login - Login do usuário
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .notEmpty()
        .withMessage('Senha é obrigatória')
], async (req, res) => {
    try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuário
        const user = User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: 'Credenciais inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verificar senha
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Credenciais inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Gerar token
        const token = generateToken(user);

        console.log('✅ Login realizado:', email);

        res.json({
            message: 'Login realizado com sucesso',
            user: user.toPublic(),
            token,
            expires_in: '24h'
        });

    } catch (error) {
        console.log('❌ Erro no login:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 👤 GET /api/auth/me - Perfil do usuário autenticado
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            user: user.toPublic()
        });

    } catch (error) {
        console.log('❌ Erro ao buscar perfil:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🔄 POST /api/auth/refresh - Renovar token
router.post('/refresh', authenticateToken, (req, res) => {
    try {
        const user = User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        // Gerar novo token
        const token = generateToken(user);

        console.log('✅ Token renovado para:', user.email);

        res.json({
            message: 'Token renovado com sucesso',
            token,
            expires_in: '24h'
        });

    } catch (error) {
        console.log('❌ Erro ao renovar token:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🚪 POST /api/auth/logout - Logout (informativo apenas)
router.post('/logout', authenticateToken, (req, res) => {
    console.log('✅ Logout realizado:', req.user.email);
    
    res.json({
        message: 'Logout realizado com sucesso'
    });
});

// 📊 GET /api/auth/users - Listar usuários (apenas para debug)
router.get('/users', authenticateToken, (req, res) => {
    try {
        // Só admin pode listar todos os usuários
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Acesso negado - apenas administradores',
                code: 'ACCESS_DENIED'
            });
        }

        const users = User.getAll();
        
        res.json({
            users,
            total: users.length
        });

    } catch (error) {
        console.log('❌ Erro ao listar usuários:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;