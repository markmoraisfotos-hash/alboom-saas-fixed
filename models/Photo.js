// Modelo de dados para fotos
class Photo {
  constructor(data) {
    this.id = data.id;
    this.sessionCode = data.sessionCode;
    this.filename = data.filename;
    this.originalName = data.originalName;
    this.size = data.size; // em bytes
    this.width = data.width;
    this.height = data.height;
    this.format = data.format; // jpg, png, raw, etc.
    this.urls = {
      original: data.originalUrl || '',
      thumbnail: data.thumbnailUrl || '',
      watermarked: data.watermarkedUrl || '',
      preview: data.previewUrl || ''
    };
    this.metadata = {
      camera: data.camera || '',
      lens: data.lens || '',
      settings: {
        iso: data.iso || null,
        aperture: data.aperture || null,
        shutterSpeed: data.shutterSpeed || null,
        focalLength: data.focalLength || null
      },
      location: data.location || null,
      dateTaken: data.dateTaken || null
    };
    this.tags = data.tags || [];
    this.isSelected = data.isSelected || false;
    this.isProcessed = data.isProcessed || false;
    this.hasWatermark = data.hasWatermark || false;
    this.lightroomPreset = data.lightroomPreset || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Método para validar dados da foto
  static validate(data) {
    const errors = [];
    
    if (!data.sessionCode) {
      errors.push('Código da sessão é obrigatório');
    }
    
    if (!data.filename) {
      errors.push('Nome do arquivo é obrigatório');
    }
    
    if (!data.originalUrl) {
      errors.push('URL original é obrigatória');
    }
    
    const validFormats = ['jpg', 'jpeg', 'png', 'raw', 'cr2', 'nef', 'arw'];
    if (data.format && !validFormats.includes(data.format.toLowerCase())) {
      errors.push('Formato de arquivo não suportado');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Método para gerar thumbnail URL
  generateThumbnailUrl() {
    if (this.urls.original) {
      const extension = this.format || 'jpg';
      const baseUrl = this.urls.original.replace(/\.[^/.]+$/, '');
      this.urls.thumbnail = `${baseUrl}_thumb.${extension}`;
    }
    return this.urls.thumbnail;
  }

  // Método para gerar preview URL
  generatePreviewUrl() {
    if (this.urls.original) {
      const extension = this.format || 'jpg';
      const baseUrl = this.urls.original.replace(/\.[^/.]+$/, '');
      this.urls.preview = `${baseUrl}_preview.${extension}`;
    }
    return this.urls.preview;
  }

  // Método para aplicar marca d'água
  applyWatermark(watermarkSettings) {
    if (this.urls.original) {
      const extension = this.format || 'jpg';
      const baseUrl = this.urls.original.replace(/\.[^/.]+$/, '');
      this.urls.watermarked = `${baseUrl}_wm.${extension}`;
      this.hasWatermark = true;
      this.updatedAt = new Date().toISOString();
    }
    return this.urls.watermarked;
  }

  // Método para marcar como selecionada
  select() {
    this.isSelected = true;
    this.updatedAt = new Date().toISOString();
  }

  // Método para desmarcar seleção
  unselect() {
    this.isSelected = false;
    this.updatedAt = new Date().toISOString();
  }

  // Método para marcar como processada
  markAsProcessed(lightroomPreset = null) {
    this.isProcessed = true;
    if (lightroomPreset) {
      this.lightroomPreset = lightroomPreset;
    }
    this.updatedAt = new Date().toISOString();
  }

  // Método para adicionar tags
  addTags(newTags) {
    if (Array.isArray(newTags)) {
      this.tags = [...new Set([...this.tags, ...newTags])];
      this.updatedAt = new Date().toISOString();
    }
  }

  // Método para remover tags
  removeTags(tagsToRemove) {
    if (Array.isArray(tagsToRemove)) {
      this.tags = this.tags.filter(tag => !tagsToRemove.includes(tag));
      this.updatedAt = new Date().toISOString();
    }
  }

  // Método para obter informações resumidas
  getSummary() {
    return {
      id: this.id,
      filename: this.filename,
      size: this.size,
      dimensions: `${this.width}x${this.height}`,
      format: this.format,
      isSelected: this.isSelected,
      hasWatermark: this.hasWatermark,
      thumbnailUrl: this.urls.thumbnail,
      previewUrl: this.urls.preview
    };
  }

  // Método para converter para JSON
  toJSON() {
    return {
      id: this.id,
      sessionCode: this.sessionCode,
      filename: this.filename,
      originalName: this.originalName,
      size: this.size,
      width: this.width,
      height: this.height,
      format: this.format,
      urls: this.urls,
      metadata: this.metadata,
      tags: this.tags,
      isSelected: this.isSelected,
      isProcessed: this.isProcessed,
      hasWatermark: this.hasWatermark,
      lightroomPreset: this.lightroomPreset,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Método estático para criar uma instância a partir de dados de upload
  static fromUpload(uploadData, sessionCode) {
    return new Photo({
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionCode: sessionCode,
      filename: uploadData.filename,
      originalName: uploadData.originalname,
      size: uploadData.size,
      width: uploadData.width || 0,
      height: uploadData.height || 0,
      format: uploadData.mimetype?.split('/')[1] || 'jpg',
      originalUrl: uploadData.location || uploadData.path,
      camera: uploadData.camera,
      lens: uploadData.lens,
      iso: uploadData.iso,
      aperture: uploadData.aperture,
      shutterSpeed: uploadData.shutterSpeed,
      focalLength: uploadData.focalLength,
      dateTaken: uploadData.dateTaken,
      location: uploadData.location
    });
  }
}

module.exports = Photo;
