const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura_photoflow_2024';

// Middleware de autenticação principal
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido',
      code: 'NO_TOKEN'
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(403).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    req.user = decoded;
    next();
  });
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação requerida',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores.',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

// Middleware para verificar se é fotógrafo ou admin
const requirePhotographer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação requerida',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  if (!['photographer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas fotógrafos ou administradores.',
      code: 'PHOTOGRAPHER_REQUIRED'
    });
  }
  
  next();
};

// Middleware opcional - não falha se não houver token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded;
      }
    });
  }
  
  next();
};

// Middleware para verificar propriedade de recursos
const requireOwnership = (resourceParam = 'id') => {
  return (req, res, next) => {
    if (!req.<span class="cursor">█</span>
