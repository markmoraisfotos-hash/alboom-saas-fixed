const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { WatermarkSettings } = require('../models/Order');
const { Photo } = require('../models/Photo');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Armazenamento temporário das configurações de marca d'água
let watermarkConfigs = [];

// ============= CONFIGURAÇÕES DE MARCA D'ÁGUA =============

// ⚙️ GET /api/watermark/settings - Buscar configurações do fotógrafo
router.get('/settings', authenticateToken, (req, res) => {
    try {
        const photographerId = req.user.id;
        
        // Buscar configuração existente
        let config = watermarkConfigs.find(w => w.photographer_id === photographerId);
        
        // Se não existe, criar configuração padrão
        if (!config) {
            config = new WatermarkSettings({
                photographer_id: photographerId,
                enabled: true,
                type: 'text',
                text: req.user.name || 'PhotoFlow',
                position: 'bottom-right',
                opacity: 0.7,
                size: 'medium',
                color: '#FFFFFF',
                apply_to_previews: true,
                apply_to_downloads: false
            });
            
            watermarkConfigs.push(config);
        }

        res.json({
            message: 'Configurações de marca d\'água',
            settings: config,
            available_positions: [
                'center',
                'top-left',
                'top-center', 
                'top-right',
                'middle-left',
                'middle-right',
                'bottom-left',
                'bottom-center',
                'bottom-right'
            ],
            available_sizes: ['small', 'medium', 'large'],
            available_types: ['text', 'image', 'both']
        });

    } catch (error) {
        console.log('❌ Erro ao buscar configurações:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ⚙️ PUT /api/watermark/settings - Atualizar configurações
router.put('/settings', authenticateToken, [
    body('enabled').isBoolean().withMessage('Campo enabled deve ser boolean'),
    body('type').optional().isIn(['text', 'image', 'both']).withMessage('Tipo inválido'),
    body('text').optional().trim().isLength({ max: 100 }).withMessage('Texto muito longo'),
    body('position').optional().isIn([
        'center', 'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'
    ]).withMessage('Posição inválida'),
    body('opacity').optional().isFloat({ min: 0, max: 1 }).withMessage('Opacidade deve ser entre 0 e 1'),
    body('size').optional().isIn(['small', 'medium', 'large']).withMessage('Tamanho inválido'),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Cor deve estar em formato hex'),
    body('apply_to_previews').optional().isBoolean().withMessage('Campo apply_to_previews deve ser boolean'),
    body('apply_to_downloads').optional().isBoolean().withMessage('Campo apply_to_downloads deve ser boolean')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const photographerId = req.user.id;
        const updateData = req.body;
        
        // Buscar configuração existente
        let configIndex = watermarkConfigs.findIndex(w => w.photographer_id === photographerId);
        
        if (configIndex === -1) {
            // Criar nova configuração
            const newConfig = new WatermarkSettings({
                photographer_id: photographerId,
                ...updateData
            });
            watermarkConfigs.push(newConfig);
            configIndex = watermarkConfigs.length - 1;
        } else {
            // Atualizar configuração existente
            Object.assign(watermarkConfigs[configIndex], updateData);
        }

        console.log(`✅ Configurações de marca d'água atualizadas para ${req.user.name}`);

        res.json({
            message: 'Configurações atualizadas com sucesso',
            settings: watermarkConfigs[configIndex]
        });

    } catch (error) {
        console.log('❌ Erro ao atualizar configurações:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🖼️ POST /api/watermark/apply/:photoId - Aplicar marca d'água em foto específica
router.post('/apply/:photoId', authenticateToken, [
    param('photoId').isInt().withMessage('ID da foto inválido'),
    body('force_apply').optional().isBoolean().withMessage('Campo force_apply deve ser boolean')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const photoId = parseInt(req.params.photoId);
        const { force_apply = false } = req.body;
        const photographerId = req.user.id;

        // Buscar foto
        const photo = Photo.findById(photoId);
        if (!photo || photo.photographer_id !== photographerId) {
            return res.status(404).json({
                error: 'Foto não encontrada',
                code: 'PHOTO_NOT_FOUND'
            });
        }

        // Buscar configurações de marca d'água
        const config = watermarkConfigs.find(w => w.photographer_id === photographerId);
        if (!config || (!config.enabled && !force_apply)) {
            return res.status(400).json({
                error: 'Marca d\'água não configurada ou desabilitada',
                code: 'WATERMARK_DISABLED'
            });
        }

        // Simular aplicação da marca d'água
        const watermarkedPath = config.applyToImage(photo.file_path);
        
        // Aqui seria integrado com biblioteca de processamento real
        // Exemplo: Sharp, Canvas, ou serviço externo

        console.log(`✅ Marca d'água aplicada na foto ${photo.filename}`);

        res.json({
            message: 'Marca d\'água aplicada com sucesso',
            photo: {
                id: photo.id,
                filename: photo.filename,
                original_path: photo.file_path,
                watermarked_path: watermarkedPath
            },
            watermark_settings: {
                type: config.type,
                text: config.text,
                position: config.position,
                opacity: config.opacity,
                size: config.size
            }
        });

    } catch (error) {
        console.log('❌ Erro ao aplicar marca d\'água:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🖼️ POST /api/watermark/batch/:sessionId - Aplicar marca d'água em lote
router.post('/batch/:sessionId', authenticateToken, [
    param('sessionId').isInt().withMessage('ID da sessão inválido'),
    body('apply_to').isIn(['all', 'selected', 'unprocessed']).withMessage('Tipo de aplicação inválido'),
    body('override_settings').optional().isObject().withMessage('Override settings deve ser um objeto')
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const sessionId = parseInt(req.params.sessionId);
        const { apply_to, override_settings } = req.body;
        const photographerId = req.user.id;

        // Buscar fotos da sessão
        const sessionPhotos = Photo.findBySession(sessionId);
        if (sessionPhotos.length === 0) {
            return res.status(404).json({
                error: 'Sessão não encontrada ou sem fotos',
                code: 'SESSION_NOT_FOUND'
            });
        }

        // Verificar se a sessão pertence ao fotógrafo
        if (sessionPhotos[0].photographer_id !== photographerId) {
            return res.status(403).json({
                error: 'Acesso negado',
                code: 'ACCESS_DENIED'
            });
        }

        // Filtrar fotos baseado no tipo de aplicação
        let photosToProcess = [];
        switch (apply_to) {
            case 'all':
                photosToProcess = sessionPhotos;
                break;
            case 'selected':
                photosToProcess = sessionPhotos.filter(p => 
                    p.selected_by_client || p.selected_for_album || p.selected_for_editing
                );
                break;
            case 'unprocessed':
                // Simular verificação de fotos não processadas
                photosToProcess = sessionPhotos.filter(p => !p.file_path.includes('_watermarked'));
                break;
        }

        if (photosToProcess.length === 0) {
            return res.status(400).json({
                error: 'Nenhuma foto encontrada para processar',
                code: 'NO_PHOTOS_TO_PROCESS'
            });
        }

        // Buscar configurações
        let config = watermarkConfigs.find(w => w.photographer_id === photographerId);
        
        // Aplicar override se fornecido
        if (override_settings) {
            config = { ...config, ...override_settings };
        }

        if (!config || !config.enabled) {
            return res.status(400).json({
                error: 'Marca d\'água não configurada ou desabilitada',
                code: 'WATERMARK_DISABLED'
            });
        }

        // Processar fotos em lote
        const processedPhotos = photosToProcess.map(photo => {
            const watermarkedPath = config.applyToImage(photo.file_path);
            return {
                id: photo.id,
                filename: photo.filename,
                original_path: photo.file_path,
                watermarked_path: watermarkedPath,
                status: 'processed'
            };
        });

        console.log(`✅ Marca d'água aplicada em lote: ${processedPhotos.length} fotos processadas`);

        res.json({
            message: 'Marca d\'água aplicada em lote com sucesso',
            processed_count: processedPhotos.length,
            total_photos: sessionPhotos.length,
            apply_to,
            processed_photos: processedPhotos,
            watermark_settings: {
                type: config.type,
                text: config.text,
                position: config.position,
                opacity: config.opacity,
                size: config.size
            }
        });

    } catch (error) {
        console.log('❌ Erro no processamento em lote:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🔍 GET /api/watermark/preview - Visualizar prévia da marca d'água
router.get('/preview', authenticateToken, (req, res) => {
    try {
        const photographerId = req.user.id;
        
        // Buscar configuração
        const config = watermarkConfigs.find(w => w.photographer_id === photographerId);
        if (!config) {
            return res.status(404).json({
                error: 'Configurações de marca d\'água não encontradas',
                code: 'CONFIG_NOT_FOUND'
            });
        }

        // Gerar prévia (simulado)
        const preview = {
            enabled: config.enabled,
            type: config.type,
            content: config.type === 'text' ? config.text : config.image_url,
            position: config.position,
            opacity: config.opacity,
            size: config.size,
            color: config.color,
            preview_url: `/api/watermark/preview/render?photographer_id=${photographerId}`, // URL simulada
            css_styles: {
                position: 'absolute',
                opacity: config.opacity,
                color: config.color,
                fontSize: config.size === 'small' ? '12px' : config.size === 'large' ? '24px' : '18px',
                ...getPositionStyles(config.position)
            }
        };

        res.json({
            message: 'Prévia da marca d\'água',
            preview,
            instructions: 'Use esta prévia para ajustar as configurações antes de aplicar nas fotos'
        });

    } catch (error) {
        console.log('❌ Erro na prévia:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Função auxiliar para estilos de posição CSS
function getPositionStyles(position) {
    const styles = {};
    
    switch (position) {
        case 'top-left':
            styles.top = '10px';
            styles.left = '10px';
            break;
        case 'top-center':
            styles.top = '10px';
            styles.left = '50%';
            styles.transform = 'translateX(-50%)';
            break;
        case 'top-right':
            styles.top = '10px';
            styles.right = '10px';
            break;
        case 'middle-left':
            styles.top = '50%';
            styles.left = '10px';
            styles.transform = 'translateY(-50%)';
            break;
        case 'center':
            styles.top = '50%';
            styles.left = '50%';
            styles.transform = 'translate(-50%, -50%)';
            break;
        case 'middle-right':
            styles.top = '50%';
            styles.right = '10px';
            styles.transform = 'translateY(-50%)';
            break;
        case 'bottom-left':
            styles.bottom = '10px';
            styles.left = '10px';
            break;
        case 'bottom-center':
            styles.bottom = '10px';
            styles.left = '50%';
            styles.transform = 'translateX(-50%)';
            break;
        case 'bottom-right':
        default:
            styles.bottom = '10px';
            styles.right = '10px';
            break;
    }
    
    return styles;
}

module.exports = router;