// PhotoFlow SaaS - Sistema de Pedidos e Vendas
// Plataforma completa para fotógrafos profissionais

// Base de dados temporária em memória
let orders = [];
let packages = [];
let payments = [];
let nextOrderId = 1;
let nextPackageId = 1;
let nextPaymentId = 1;

class Order {
    constructor(data) {
        this.id = data.id;
        this.session_id = data.session_id;
        this.client_name = data.client_name;
        this.client_email = data.client_email;
        this.photographer_id = data.photographer_id;
        this.order_type = data.order_type; // 'selection', 'extra_photos', 'print_package'
        this.status = data.status || 'pending'; // pending, approved, processing, completed, cancelled
        this.items = data.items || []; // Array de itens do pedido
        this.subtotal = data.subtotal || 0;
        this.tax = data.tax || 0;
        this.total = data.total || 0;
        this.payment_status = data.payment_status || 'pending'; // pending, paid, failed, refunded
        this.delivery_method = data.delivery_method; // 'download', 'physical', 'both'
        this.delivery_address = data.delivery_address || null;
        this.notes = data.notes || '';
        this.deadline = data.deadline;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    // Criar novo pedido
    static create(orderData) {
        const newOrder = {
            id: nextOrderId++,
            session_id: orderData.session_id,
            client_name: orderData.client_name,
            client_email: orderData.client_email,
            photographer_id: orderData.photographer_id,
            order_type: orderData.order_type,
            status: 'pending',
            items: orderData.items || [],
            subtotal: orderData.subtotal || 0,
            tax: orderData.tax || 0,
            total: orderData.total || 0,
            payment_status: 'pending',
            delivery_method: orderData.delivery_method || 'download',
            delivery_address: orderData.delivery_address,
            notes: orderData.notes || '',
            deadline: orderData.deadline,
            created_at: new Date(),
            updated_at: new Date()
        };

        orders.push(newOrder);
        console.log('✅ Pedido criado:', newOrder.id, 'para', newOrder.client_name);
        
        return new Order(newOrder);
    }

    // Buscar pedidos por fotógrafo
    static findByPhotographer(photographerId) {
        return orders
            .filter(o => o.photographer_id === parseInt(photographerId))
            .map(o => new Order(o));
    }

    // Buscar pedido por ID
    static findById(id) {
        const order = orders.find(o => o.id === parseInt(id));
        return order ? new Order(order) : null;
    }

    // Buscar pedidos por sessão
    static findBySession(sessionId) {
        return orders
            .filter(o => o.session_id === parseInt(sessionId))
            .map(o => new Order(o));
    }

    // Atualizar status do pedido
    updateStatus(newStatus) {
        const orderIndex = orders.findIndex(o => o.id === this.id);
        if (orderIndex === -1) return false;

        orders[orderIndex].status = newStatus;
        orders[orderIndex].updated_at = new Date();
        
        console.log(`✅ Status do pedido ${this.id} atualizado para: ${newStatus}`);
        return true;
    }

    // Processar pagamento
    processPayment(paymentData) {
        const payment = Payment.create({
            order_id: this.id,
            amount: this.total,
            method: paymentData.method,
            gateway: paymentData.gateway,
            transaction_id: paymentData.transaction_id
        });

        // Atualizar status do pagamento no pedido
        const orderIndex = orders.findIndex(o => o.id === this.id);
        if (orderIndex !== -1) {
            orders[orderIndex].payment_status = 'paid';
            orders[orderIndex].status = 'approved';
            orders[orderIndex].updated_at = new Date();
        }

        return payment;
    }

    // Retornar dados públicos
    toPublic() {
        return {
            id: this.id,
            session_id: this.session_id,
            order_type: this.order_type,
            status: this.status,
            items: this.items,
            subtotal: this.subtotal,
            tax: this.tax,
            total: this.total,
            payment_status: this.payment_status,
            delivery_method: this.delivery_method,
            deadline: this.deadline,
            created_at: this.created_at
        };
    }
}

// Modelo de Pacotes/Produtos
class Package {
    constructor(data) {
        this.id = data.id;
        this.photographer_id = data.photographer_id;
        this.name = data.name;
        this.description = data.description;
        this.type = data.type; // 'digital', 'print', 'album', 'extra_photo'
        this.price = data.price;
        this.options = data.options || {}; // Configurações específicas
        this.active = data.active !== false;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    // Criar novo pacote
    static create(packageData) {
        const newPackage = {
            id: nextPackageId++,
            photographer_id: packageData.photographer_id,
            name: packageData.name,
            description: packageData.description,
            type: packageData.type,
            price: packageData.price,
            options: packageData.options || {},
            active: true,
            created_at: new Date(),
            updated_at: new Date()
        };

        packages.push(newPackage);
        console.log('✅ Pacote criado:', newPackage.name);
        
        return new Package(newPackage);
    }

    // Buscar pacotes por fotógrafo
    static findByPhotographer(photographerId) {
        return packages
            .filter(p => p.photographer_id === parseInt(photographerId) && p.active)
            .map(p => new Package(p));
    }

    // Buscar por tipo
    static findByType(photographerId, type) {
        return packages
            .filter(p => p.photographer_id === parseInt(photographerId) && p.type === type && p.active)
            .map(p => new Package(p));
    }

    // Retornar dados públicos
    toPublic() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            price: this.price,
            options: this.options
        };
    }
}

// Modelo de Pagamentos
class Payment {
    constructor(data) {
        this.id = data.id;
        this.order_id = data.order_id;
        this.amount = data.amount;
        this.method = data.method; // 'credit_card', 'pix', 'bank_transfer'
        this.gateway = data.gateway; // 'stripe', 'pagseguro', 'mercadopago'
        this.transaction_id = data.transaction_id;
        this.status = data.status || 'completed';
        this.created_at = data.created_at || new Date();
    }

    // Criar novo pagamento
    static create(paymentData) {
        const newPayment = {
            id: nextPaymentId++,
            order_id: paymentData.order_id,
            amount: paymentData.amount,
            method: paymentData.method,
            gateway: paymentData.gateway,
            transaction_id: paymentData.transaction_id,
            status: 'completed',
            created_at: new Date()
        };

        payments.push(newPayment);
        console.log('✅ Pagamento processado:', newPayment.amount, 'para pedido', newPayment.order_id);
        
        return new Payment(newPayment);
    }

    // Buscar pagamentos por pedido
    static findByOrder(orderId) {
        return payments
            .filter(p => p.order_id === parseInt(orderId))
            .map(p => new Payment(p));
    }
}

// Configurações de Marca d'água
class WatermarkSettings {
    constructor(data) {
        this.photographer_id = data.photographer_id;
        this.enabled = data.enabled !== false;
        this.type = data.type || 'text'; // 'text', 'image', 'both'
        this.text = data.text || '';
        this.image_url = data.image_url || '';
        this.position = data.position || 'bottom-right'; // 'center', 'bottom-right', etc.
        this.opacity = data.opacity || 0.7;
        this.size = data.size || 'medium'; // 'small', 'medium', 'large'
        this.color = data.color || '#FFFFFF';
        this.apply_to_previews = data.apply_to_previews !== false;
        this.apply_to_downloads = data.apply_to_downloads || false;
    }

    // Aplicar marca d'água (simulado)
    applyToImage(imagePath) {
        // Aqui seria integrado com biblioteca de processamento de imagem
        console.log(`🏷️ Aplicando marca d'água em: ${imagePath}`);
        return `${imagePath}_watermarked`;
    }
}

module.exports = { 
    Order, 
    Package, 
    Payment, 
    WatermarkSettings 
};