class Order {
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.orderNumber || this.generateOrderNumber();
    this.sessionCode = data.sessionCode;
    this.packageId = data.packageId;
    this.packageName = data.packageName;
    this.packageDetails = data.packageDetails || {};
    
    this.client = {
      name: data.clientName || '',
      email: data.clientEmail || '',
      phone: data.clientPhone || '',
      address: data.clientAddress || {}
    };
    
    this.selectedPhotos = data.selectedPhotos || [];
    this.totalPhotos = data.selectedPhotos?.length || 0;
    this.price = data.price || 0;
    this.discount = data.discount || 0;
    this.finalPrice = this.calculateFinalPrice();
    
    this.status = data.status || 'pending';
    this.paymentStatus = data.paymentStatus || 'pending';
    this.deliveryStatus = data.deliveryStatus || 'pending';
    
    this.payment = {
      method: data.paymentMethod || '',
      transactionId: data.transactionId || '',
      paidAt: data.paidAt || null,
      amount: data.paymentAmount || this.finalPrice
    };
    
    this.delivery = {
      method: data.deliveryMethod || 'digital',
      address: data.deliveryAddress || {},
      trackingCode: data.trackingCode || '',
      estimatedDate: data.estimatedDeliveryDate || null,
      deliveredAt: data.deliveredAt || null
    };
    
    this.files = {
      lightroomPresets: data.lightroomPresetsUrl || '',
      processedPhotos: data.processedPhotosUrl || '',
      album: data.albumUrl || '',
      invoice: data.invoiceUrl || ''
    };
    
    this.notes = data.notes || '';
    this.internalNotes = data.internalNotes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateOrderNumber() {<span class="cursor">█</span>
