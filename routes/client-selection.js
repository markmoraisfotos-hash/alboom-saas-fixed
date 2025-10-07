const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Photo, Session } = require('../models/Photo');

const router = express.Router();

// 🎯 POST /api/client/:accessCode/finalize - Cliente finaliza seleção
router.post('/:accessCode/finalize', [
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

        // Buscar fotos selecionadas
        const selectedPhotos = Photo.findSelected(session.id, 'all');
        
        if (selectedPhotos.length === 0) {
            return res.status(400).json({
                error: 'Nenhuma foto foi selecionada',
                code: 'NO_PHOTOS_SELECTED'
            });
        }

        // Gerar filtros para Lightroom
        const filters = Photo.generateLightroomFilters(session.id);
        
        // Criar código de filtro simples
        const filterCode = `PHOTOFLOW_${session.access_code}_${Date.now().toString().slice(-6)}`;
        
        // Gerar filtro para Lightroom (busca por nome de arquivo)
        const lightroomFilter = selectedPhotos
            .map(photo => photo.original_filename.replace('.NEF', '').replace('.CR2', '').replace('.ARW', ''))
            .join(' OR ');

        // Atualizar status da sessão
        session.status = 'completed';
        
        console.log(`✅ Seleção finalizada - ${selectedPhotos.length} fotos - Código: ${filterCode}`);

        res.json({
            message: 'Seleção finalizada com sucesso!',
            filter_code: filterCode,
            selected_count: selectedPhotos.length,
            total_photos: Photo.findBySession(session.id).length,
            lightroom_filter: lightroomFilter,
            instructions: {
                title: 'Como usar no Adobe Lightroom:',
                steps: [
                    '1. Abra o Adobe Lightroom com seus arquivos RAW',
                    '2. Na barra de filtros (acima das fotos), clique na lupa',
                    '3. Selecione "Nome do arquivo"',
                    '4. Cole o filtro abaixo no campo de busca:',
                    '5. Pressione Enter - apenas as fotos selecionadas aparecerão',
                    '6. Agora você pode editar apenas os RAWs escolhidos pelo cliente!'
                ],
                filter_to_copy: lightroomFilter,
                tip: 'Copie exatamente como está, incluindo o "OR" entre os nomes'
            },
            session_summary: {
                client_name: session.client_name,
                session_name: session.name,
                selection_date: new Date().toISOString(),
                photographer_notification: `Cliente ${session.client_name} finalizou a seleção de fotos da sessão "${session.name}"`
            }
        });

    } catch (error) {
        console.log('❌ Erro ao finalizar seleção:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 📊 GET /api/client/:accessCode/summary - Resumo da seleção
router.get('/:accessCode/summary', [
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
        if (!session) {
            return res.status(404).json({
                error: 'Galeria não encontrada',
                code: 'GALLERY_NOT_FOUND'
            });
        }

        const stats = Photo.getSessionStats(session.id);
        const selectedPhotos = Photo.findSelected(session.id, 'all');

        res.json({
            session: session.toPublic(),
            selection_summary: {
                total_photos: stats.total_photos,
                selected_photos: selectedPhotos.length,
                selection_percentage: Math.round((selectedPhotos.length / stats.total_photos) * 100),
                can_finalize: selectedPhotos.length > 0,
                status: session.status
            },
            selected_photos: selectedPhotos.map(photo => ({
                id: photo.id,
                filename: photo.filename,
                original_filename: photo.original_filename,
                client_notes: photo.client_notes
            }))
        });

    } catch (error) {
        console.log('❌ Erro no resumo:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// 🔄 POST /api/client/:accessCode/reset - Resetar seleções (se necessário)
router.post('/:accessCode/reset', [
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
        if (!session || session.status === 'completed') {
            return res.status(404).json({
                error: 'Galeria não encontrada ou já finalizada',
                code: 'GALLERY_NOT_AVAILABLE'
            });
        }

        // Resetar todas as seleções
        const photos = Photo.findBySession(session.id);
        photos.forEach(photo => {
            photo.updateSelection({
                selected_by_client: false,
                selected_for_album: false,
                selected_for_editing: false,
                client_notes: ''
            });
        });

        console.log(`✅ Seleções resetadas para sessão ${session.name}`);

        res.json({
            message: 'Todas as seleções foram removidas',
            total_photos: photos.length,
            reset_count: photos.length
        });

    } catch (error) {
        console.log('❌ Erro ao resetar:', error.message);
        res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;