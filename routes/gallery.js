const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Photo, Session } = require('../models/Photo');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ============= ROTAS PARA FOTÓGRAFOS =============

// 📊 GET /api/gallery/dashboard - Dashboard do fotógrafo
router.get('/dashboard', authenticateToken, (req, res) => {
    try {
        const photographerId = req.user.id;
        
        // Buscar sessões do fotógrafo
        const sessions = Session.findByPhotographer(photographerId);
        
        // Estatísticas gerais
        const stats = {
            total_sessions: sessions.length,
            active_sessions: sessions.filter(s => s.status === 'active').length,
            total_photos: 0,
            selected_photos: 0
        };

        // Calcular estatísticas de fotos
        sessions.forEach(session => {
            const sessionStats = Photo.getSessionStats(session.id);
            stats.total_photos += sessionStats.total_photos;
            stats.selected_photos += sessionStats.selected_by_client;
        });

        res.json({
            message: 'Dashboard PhotoFlow',
            photographer: req.user,
            stats,
            recent_sessions: sessions.slice(-5).map(s => ({
                ...s.toPublic(),
                photo_stats: Photo.getSessionStats(s.id)
            }))
        });

    } catch (error) {
        console.log('❌ Erro no dashboard:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📁 POST /api/gallery/sessions - Criar nova sessão
router.post('/sessions', authenticateToken, [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome da sessão deve ter entre 2 e 100 caracteres'),
    body('client_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome do cliente deve ter entre 2 e 100 caracteres'),
    body('client_email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email do cliente inválido'),
    body('session_date')
        .isISO8601()
        .withMessage('Data da sessão inválida (formato ISO 8601)')
], (req, res) => {
    try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const { name, description, client_name, client_email, session_date, max_album_selections, max_editing_selections } = req.body;

        // Criar sessão
        const session = Session.create({
            photographer_id: req.user.id,
            name,
            description,
            client_name,
            client_email,
            session_date,
            max_album_selections: max_album_selections || null,
            max_editing_selections: max_editing_selections || null
        });

        console.log('✅ Nova sessão criada por:', req.user.email);

        res.status(201).json({
            message: 'Sessão criada com sucesso',
            session: session.toPublic(),
            access_code: session.access_code,
            share_url: `/gallery/${session.access_code}`
        });

    } catch (error) {
        console.log('❌ Erro ao criar sessão:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📁 GET /api/gallery/sessions - Listar sessões do fotógrafo
router.get('/sessions', authenticateToken, (req, res) => {
    try {
        const photographerId = req.user.id;
        const sessions = Session.findByPhotographer(photographerId);

        const sessionsWithStats = sessions.map(session => ({
            ...session.toPublic(),
            access_code: session.access_code,
            status: session.status,
            photo_stats: Photo.getSessionStats(session.id),
            share_url: `/gallery/${session.access_code}`
        }));

        res.json({
            sessions: sessionsWithStats,
            total: sessionsWithStats.length
        });

    } catch (error) {
        console.log('❌ Erro ao listar sessões:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📸 POST /api/gallery/sessions/:sessionId/photos - Upload de fotos (simulado)
router.post('/sessions/:sessionId/photos', authenticateToken, [
    param('sessionId').isInt().withMessage('ID da sessão inválido'),
    body('photos').isArray({ min: 1 }).withMessage('Lista de fotos é obrigatória')
], (req, res) => {
    try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }

        const sessionId = parseInt(req.params.sessionId);
        const { photos } = req.body;

        // Verificar se a sessão existe e pertence ao fotógrafo
        const session = Session.findById(sessionId);
        if (!session || session.photographer_id !== req.user.id) {
            return res.status(404).json({
                error: 'Sessão não encontrada',
                code: 'SESSION_NOT_FOUND'
            });
        }

        // Simular upload de fotos
        const uploadedPhotos = photos.map(photoData => {
            return Photo.create({
                session_id: sessionId,
                photographer_id: req.user.id,
                filename: photoData.filename,
                original_filename: photoData.original_filename,
                file_path: photoData.file_path || `/uploads/${sessionId}/${photoData.filename}`,
                thumbnail_path: photoData.thumbnail_path || `/thumbnails/${sessionId}/${photoData.filename}`,
                file_size: photoData.file_size,
                dimensions: photoData.dimensions,
                metadata: photoData.metadata
            });
        });

        console.log(`✅ ${uploadedPhotos.length} fotos adicionadas à sessão ${session.name}`);

        res.status(201).json({
            message: `${uploadedPhotos.length} fotos enviadas com sucesso`,
            session: session.toPublic(),
            photos: uploadedPhotos.map(p => p.toPhotographerView()),
            stats: Photo.getSessionStats(sessionId)
        });

    } catch (error) {
        console.log('❌ Erro no upload:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📊 GET /api/gallery/sessions/:sessionId/stats - Estatísticas da sessão
router.get('/sessions/:sessionId/stats', authenticateToken, [
    param('sessionId').isInt().withMessage('ID da sessão inválido')
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
        
        // Verificar se a sessão existe e pertence ao fotógrafo
        const session = Session.findById(sessionId);
        if (!session || session.photographer_id !== req.user.id) {
            return res.status(404).json({
                error: 'Sessão não encontrada',
                code: 'SESSION_NOT_FOUND'
            });
        }

        const stats = Photo.getSessionStats(sessionId);
        const lightroomFilters = Photo.generateLightroomFilters(sessionId);

        res.json({
            session: session.toPublic(),
            stats,
            lightroom_filters: lightroomFilters
        });

    } catch (error) {
        console.log('❌ Erro ao buscar estatísticas:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ============= ROTAS PÚBLICAS PARA CLIENTES =============

// 🔍 GET /api/gallery/session/:accessCode - Galeria pública do cliente
router.get('/session/:accessCode', [
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
        
        // Buscar sessão pelo código
        const session = Session.findByAccessCode(accessCode);
        if (!session || session.status !== 'active') {
            return res.status(404).json({
                error: 'Galeria não encontrada ou inativa',
                code: 'GALLERY_NOT_FOUND'
            });
        }

        // Buscar fotos da sessão
        const photos = Photo.findBySession(session.id);

        res.json({
            message: 'Galeria PhotoFlow',
            session: session.toPublic(),
            photos: photos.map(p => p.toClientView()),
            total_photos: photos.length,
            instructions: {
                album_selection: session.settings.allow_album_selection ? 'Selecione suas fotos favoritas para o álbum' : null,
                editing_selection: session.settings.allow_editing_selection ? 'Marque fotos que precisam de edição especial' : null,
                max_album: session.settings.max_album_selections,
                max_editing: session.settings.max_editing_selections
            }
        });

    } catch (error) {
        console.log('❌ Erro ao acessar galeria:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// ✅ POST /api/gallery/session/:accessCode/select - Cliente seleciona fotos
router.post('/session/:accessCode/select', [
    param('accessCode').isLength({ min: 6, max: 6 }).withMessage('Código de acesso inválido'),
    body('photo_id').isInt().withMessage('ID da foto é obrigatório'),
    body('selection_type').isIn(['album', 'editing', 'general']).withMessage('Tipo de seleção inválido')
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
        const { photo_id, selection_type, selected, client_notes = '' } = req.body;
        
        // Buscar sessão
        const session = Session.findByAccessCode(accessCode);
        if (!session || session.status !== 'active') {
            return res.status(404).json({
                error: 'Galeria não encontrada ou inativa',
                code: 'GALLERY_NOT_FOUND'
            });
        }

        // Buscar foto
        const photo = Photo.findById(photo_id);
        if (!photo || photo.session_id !== session.id) {
            return res.status(404).json({
                error: 'Foto não encontrada',
                code: 'PHOTO_NOT_FOUND'
            });
        }

        // Verificar limites de seleção
        if (selected) {
            const currentSelections = Photo.findSelected(session.id, selection_type);
            
            if (selection_type === 'album' && session.settings.max_album_selections) {
                if (currentSelections.length >= session.settings.max_album_selections) {
                    return res.status(400).json({
                        error: `Limite de ${session.settings.max_album_selections} fotos para álbum atingido`,
                        code: 'SELECTION_LIMIT_REACHED'
                    });
                }
            }
            
            if (selection_type === 'editing' && session.settings.max_editing_selections) {
                if (currentSelections.length >= session.settings.max_editing_selections) {
                    return res.status(400).json({
                        error: `Limite de ${session.settings.max_editing_selections} fotos para edição atingido`,
                        code: 'SELECTION_LIMIT_REACHED'
                    });
                }
            }
        }

        // Atualizar seleção
        const updateData = { client_notes };
        
        switch(selection_type) {
            case 'album':
                updateData.selected_for_album = selected;
                break;
            case 'editing':
                updateData.selected_for_editing = selected;
                break;
            case 'general':
                updateData.selected_by_client = selected;
                break;
        }

        photo.updateSelection(updateData);

        console.log(`✅ Foto ${selected ? 'selecionada' : 'desmarcada'} pelo cliente - ${selection_type}`);

        res.json({
            message: `Foto ${selected ? 'selecionada' : 'desmarcada'} com sucesso`,
            photo: photo.toClientView(),
            session_stats: Photo.getSessionStats(session.id)
        });

    } catch (error) {
        console.log('❌ Erro na seleção:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📤 GET /api/gallery/sessions/:sessionId/export - Exportar filtros Lightroom
router.get('/sessions/:sessionId/export', authenticateToken, [
    param('sessionId').isInt().withMessage('ID da sessão inválido')
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
        
        // Verificar se a sessão existe e pertence ao fotógrafo
        const session = Session.findById(sessionId);
        if (!session || session.photographer_id !== req.user.id) {
            return res.status(404).json({
                error: 'Sessão não encontrada',
                code: 'SESSION_NOT_FOUND'
            });
        }

        const filters = Photo.generateLightroomFilters(sessionId);
        const stats = Photo.getSessionStats(sessionId);

        // Gerar texto para copiar no Lightroom
        const lightroomText = {
            album_filter: filters.selected_for_album.join(' OR '),
            editing_filter: filters.selected_for_editing.join(' OR '),
            client_filter: filters.client_selected.join(' OR '),
            all_selected_filter: filters.all_selected.join(' OR ')
        };

        res.json({
            message: 'Filtros Lightroom gerados',
            session: session.toPublic(),
            stats,
            filters,
            lightroom_text,
            instructions: 'Copie os filtros acima e cole no campo de busca do Lightroom'
        });

    } catch (error) {
        console.log('❌ Erro na exportação:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;