class Order {
  constructor(data) {
    this.id = data.id || Math.random().toString(36);
    this.orderNumber = data.orderNumber || 'PF' + Date.now();
    this.sessionCode = data.sessionCode;
    this.packageId = data.packageId;
    this.packageName = data.packageName;
    this.clientName = data.clientName || '';
    this.clientEmail = data.clientEmail || '';
    this.selectedPhotos = data.selectedPhotos || [];
    this.price = data.price || 0;
    this.status = data.status || 'pending';
    this.paymentStatus = data.paymentStatus || 'pending';
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static validate(data) {
    const errors = [];
    if (!data.sessionCode) errors.push('Session code required');
    if (!data.packageId) errors.push('Package required');
    return { isValid: errors.length === 0, errors: errors };
  }

  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      sessionCode: this.sessionCode,
      packageId: this.packageId,
      packageName: this.packageName,
      clientName: this.clientName,
      clientEmail: this.clientEmail,
      selectedPhotos: this.selectedPhotos,
      price: this.price,
      status: this.status,
      paymentStatus: this.paymentStatus,
      createdAt: this.createdAt
    };
  }
}

module.exports = Order;
