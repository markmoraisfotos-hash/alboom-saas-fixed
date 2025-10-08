// Modelo de dados para pedidos
class Order {
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber || this.generateOrderNumber();
    this.sessionCode = data.sessionCode;
    this.packageId = data.packageId;
    this.packageName = data.packageName;
    this.packageDetails = data.packageDetails || {};
    
    // Dados do cliente
    this.client = {
      name: data.clientName || '',
      email: data.clientEmail || '',
      phone: data.clientPhone || '',
      address: data.clientAddress || {}
    };
    
    // Detalhes do pedido
    this.selectedPhotos = data.selectedPhotos || [];
    this.totalPhotos = data.selectedPhotos?.length || 0;
    this.price = data.price || 0;
    this.discount = data.discount || 0;
    this.finalPrice = this.calculateFinalPrice();
    
    // Status do pedido
    this.status = data.status || 'pending'; // pending, confirmed, processing, ready, delivered, cancelled
    this.paymentStatus = data.paymentStatus || 'pending'; // pending, paid, refunded, failed
    this.deliveryStatus = data.deliveryStatus || 'pending'; // pending, preparing, shipped, delivered
    
    // Dados de pagamento
    this.payment = {
      method: data.paymentMethod || '',
      transactionId: data.transactionId || '',
      paidAt: data.paidAt || null,
      amount: data.paymentAmount || this.finalPrice
    };
    
    // Dados de entrega
    this.delivery = {
      method: data.deliveryMethod || 'digital', // digital, physical, both
      address: data.deliveryAddress || {},
      trackingCode: data.trackingCode || '',
      estimatedDate: data.estimatedDeliveryDate || null,
      deliveredAt: data.deliveredAt || null
    };
    
    // Arquivos e links
    this.files = {<span class="cursor">█</span>
