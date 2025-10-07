const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Order, Package, Payment } = require('../models/Order');
const { Photo, Session } = require('../models/Photo');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============= ROTAS PARA FOTÓGRAFOS - GESTÃO COMERCIAL =============

// 📊 GET /api/commerce/dashboard - Dashboard comercial
router.get('/dashboard', authenticateToken, (req, res) => {
    try {
        const photographerId = req.user.id;
        
        // Buscar pedidos do fotógrafo
        const orders = Order.findByPhotographer(photographerId);
        const packages = Package.findByPhotographer(photographerId);
        
        // Calcular estatísticas
        const stats = {
            total_orders: orders.length,
            pending_orders: orders.filter(o => o.status === 'pending').length,
            completed_orders: orders.filter(o => o.status === 'completed').length,
            total_revenue: orders
                .filter(o => o.payment_status === 'paid')
                .reduce((sum, o) => sum + o.total, 0),
            pending_revenue: orders
                .filter(o => o.payment_status === 'pending')
                .reduce((sum, o) => sum + o.total, 0),
            active_packages: packages.length
        };

        // Pedidos recentes
        const recentOrders = orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)
            .map(o => o.toPublic());

        res.json({
            message: 'Dashboard Comercial PhotoFlow',
            photographer: req.user,
            stats,
            recent_orders: recentOrders,
            packages: packages.map(p => p.toPublic())
        });

    } catch (error) {
        console.log('❌ Erro no dashboard comercial:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📦 GET /api/commerce/packages - Listar pacotes
router.get('/packages', authenticateToken, (req, res) => {
    try {
        const photographerId = req.user.id;
        const packages = Package.findByPhotographer(photographerId);

        res.json({
            packages: packages.map(p => p.toPublic()),
            total: packages.length
        });

    } catch (error) {
        console.log('❌ Erro ao listar pacotes:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📦 POST /api/commerce/packages - Criar pacote
router.post('/packages', authenticateToken, [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome é obrigatório'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Descrição é obrigatória'),
    body('type').isIn(['digital', 'print', 'album', 'extra_photo']).withMessage('Tipo inválido'),
    body('price').isFloat({ min: 0 }).withMessage('Preço deve ser um número positivo')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const { name, description, type, price, options } = req.body;

        const package = Package.create({
            photographer_id: req.user.id,
            name,
            description,
            type,
            price: parseFloat(price),
            options: options || {}
        });

        res.status(201).json({
            message: 'Pacote criado com sucesso',
            package: package.toPublic()
        });

    } catch (error) {
        console.log('❌ Erro ao criar pacote:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📋 GET /api/commerce/orders - Listar pedidos
router.get('/orders', authenticateToken, (req, res) => {
    try {
        const photographerId = req.user.id;
        const { status, session_id } = req.query;
        
        let orders = Order.findByPhotographer(photographerId);
        
        // Filtrar por status se especificado
        if (status) {
            orders = orders.filter(o => o.status === status);
        }
        
        // Filtrar por sessão se especificado
        if (session_id) {
            orders = orders.filter(o => o.session_id === parseInt(session_id));
        }

        // Ordenar por data de criação (mais recentes primeiro)
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            orders: orders.map(o => o.toPublic()),
            total: orders.length,
            filters_applied: { status, session_id }
        });

    } catch (error) {
        console.log('❌ Erro ao listar pedidos:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📋 PUT /api/commerce/orders/:orderId/status - Atualizar status do pedido
router.put('/orders/:orderId/status', authenticateToken, [
    param('orderId').isInt().withMessage('ID do pedido inválido'),
    body('status').isIn(['pending', 'approved', 'processing', 'completed', 'cancelled']).withMessage('Status inválido')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const orderId = parseInt(req.params.orderId);
        const { status } = req.body;

        const order = Order.findById(orderId);
        if (!order || order.photographer_id !== req.user.id) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }

        order.updateStatus(status);

        res.json({
            message: 'Status do pedido atualizado',
            order: order.toPublic()
        });

    } catch (error) {
        console.log('❌ Erro ao atualizar pedido:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ============= ROTAS PÚBLICAS PARA CLIENTES =============

// 🛒 GET /api/commerce/session/:accessCode/packages - Ver pacotes disponíveis
router.get('/session/:accessCode/packages', [
    param('accessCode').isLength({ min: 6, max: 6 }).withMessage('Código de acesso inválido')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Código de acesso inválido',
                details: errors.array()
            });
        }

        const accessCode = req.params.accessCode.toUpperCase();
        
        // Buscar sessão
        const session = Session.findByAccessCode(accessCode);
        if (!session || session.status !== 'active') {
            return res.status(404).json({
                error: 'Galeria não encontrada ou inativa',
                code: 'GALLERY_NOT_FOUND'
            });
        }

        // Buscar pacotes do fotógrafo
        const packages = Package.findByPhotographer(session.photographer_id);

        res.json({
            session: session.toPublic(),
            packages: packages.map(p => p.toPublic()),
            message: 'Pacotes disponíveis para esta sessão'
        });

    } catch (error) {
        console.log('❌ Erro ao buscar pacotes:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🛒 POST /api/commerce/session/:accessCode/order - Cliente cria pedido
router.post('/session/:accessCode/order', [
    param('accessCode').isLength({ min: 6, max: 6 }).withMessage('Código de acesso inválido'),
    body('order_type').isIn(['selection', 'extra_photos', 'print_package']).withMessage('Tipo de pedido inválido'),
    body('items').isArray({ min: 1 }).withMessage('Items do pedido são obrigatórios'),
    body('delivery_method').optional().isIn(['download', 'physical', 'both']).withMessage('Método de entrega inválido')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const accessCode = req.params.accessCode.toUpperCase();
        const { order_type, items, delivery_method, delivery_address, notes } = req.body;
        
        // Buscar sessão
        const session = Session.findByAccessCode(accessCode);
        if (!session) {
            return res.status(404).json({
                error: 'Galeria não encontrada',
                code: 'GALLERY_NOT_FOUND'
            });
        }

        // Calcular totais
        let subtotal = 0;
        const processedItems = items.map(item => {
            const package = Package.findByPhotographer(session.photographer_id)
                .find(p => p.id === item.package_id);
            
            if (!package) {
                throw new Error(`Pacote ${item.package_id} não encontrado`);
            }

            const itemTotal = package.price * (item.quantity || 1);
            subtotal += itemTotal;

            return {
                package_id: package.id,
                package_name: package.name,
                quantity: item.quantity || 1,
                unit_price: package.price,
                total: itemTotal,
                options: item.options || {}
            };
        });

        const tax = subtotal * 0.1; // 10% de taxa (ajustar conforme necessário)
        const total = subtotal + tax;

        // Criar pedido
        const order = Order.create({
            session_id: session.id,
            client_name: session.client_name,
            client_email: session.client_email,
            photographer_id: session.photographer_id,
            order_type,
            items: processedItems,
            subtotal,
            tax,
            total,
            delivery_method: delivery_method || 'download',
            delivery_address,
            notes,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
        });

        console.log(`✅ Pedido criado pelo cliente: ${session.client_name}`);

        res.status(201).json({
            message: 'Pedido criado com sucesso',
            order: order.toPublic(),
            payment_instructions: {
                total: total,
                methods: ['credit_card', 'pix', 'bank_transfer'],
                deadline: '24 horas para confirmar pagamento'
            }
        });

    } catch (error) {
        console.log('❌ Erro ao criar pedido:', error.message);
        res.status(500).json({
            error: error.message.includes('não encontrado') ? error.message : 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 💳 POST /api/commerce/orders/:orderId/payment - Processar pagamento (simulado)
router.post('/orders/:orderId/payment', [
    param('orderId').isInt().withMessage('ID do pedido inválido'),
    body('method').isIn(['credit_card', 'pix', 'bank_transfer']).withMessage('Método de pagamento inválido'),
    body('gateway').isIn(['stripe', 'pagseguro', 'mercadopago']).withMessage('Gateway inválido')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const orderId = parseInt(req.params.orderId);
        const { method, gateway } = req.body;

        const order = Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                error: 'Pedido não encontrado',
                code: 'ORDER_NOT_FOUND'
            });
        }

        if (order.payment_status === 'paid') {
            return res.status(400).json({
                error: 'Pedido já pago',
                code: 'ALREADY_PAID'
            });
        }

        // Simular processamento de pagamento
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const payment = order.processPayment({
            method,
            gateway,
            transaction_id: transactionId
        });

        console.log(`✅ Pagamento processado: ${order.total} - ${method}`);

        res.json({
            message: 'Pagamento processado com sucesso',
            payment: {
                id: payment.id,
                amount: payment.amount,
                method: payment.method,
                transaction_id: payment.transaction_id,
                status: payment.status
            },
            order: order.toPublic()
        });

    } catch (error) {
        console.log('❌ Erro no pagamento:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;