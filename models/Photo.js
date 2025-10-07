// PhotoFlow SaaS - Modelo de Fotos
// Sistema profissional de gestão de fotos para fotógrafos

// Base de dados temporária em memória
let photos = [];
let sessions = [];
let nextPhotoId = 1;
let nextSessionId = 1;

class Photo {
    constructor(data) {
        this.id = data.id;
        this.session_id = data.session_id;
        this.photographer_id = data.photographer_id;
        this.filename = data.filename;
        this.original_filename = data.original_filename;
        this.file_path = data.file_path;
        this.thumbnail_path = data.thumbnail_path;
        this.file_size = data.file_size;
        this.dimensions = data.dimensions; // { width, height }
        this.status = data.status || 'uploaded'; // uploaded, selected, edited, delivered
        this.selected_by_client = data.selected_by_client || false;
        this.selected_for_album = data.selected_for_album || false;
        this.selected_for_editing = data.selected_for_editing || false;
        this.client_notes = data.client_notes || '';
        this.metadata = data.metadata || {}; // EXIF, etc.
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    // Criar nova foto
    static create(photoData) {
        const newPhoto = {
            id: nextPhotoId++,
            session_id: photoData.session_id,
            photographer_id: photoData.photographer_id,
            filename: photoData.filename,
            original_filename: photoData.original_filename,
            file_path: photoData.file_path,
            thumbnail_path: photoData.thumbnail_path,
            file_size: photoData.file_size,
            dimensions: photoData.dimensions,
            status: 'uploaded',
            selected_by_client: false,
            selected_for_album: false,
            selected_for_editing: false,
            client_notes: '',
            metadata: photoData.metadata || {},
            created_at: new Date(),
            updated_at: new Date()
        };

        photos.push(newPhoto);
        console.log('✅ Foto adicionada:', newPhoto.filename);
        
        return new Photo(newPhoto);
    }

    // Buscar fotos por sessão
    static findBySession(sessionId) {
        return photos
            .filter(p => p.session_id === parseInt(sessionId))
            .map(p => new Photo(p));
    }

    // Buscar fotos por fotógrafo
    static findByPhotographer(photographerId) {
        return photos
            .filter(p => p.photographer_id === parseInt(photographerId))
            .map(p => new Photo(p));
    }

    // Buscar foto por ID
    static findById(id) {
        const photo = photos.find(p => p.id === parseInt(id));
        return photo ? new Photo(photo) : null;
    }

    // Buscar fotos selecionadas
    static findSelected(sessionId, type = 'all') {
        let filtered = photos.filter(p => p.session_id === parseInt(sessionId));
        
        switch(type) {
            case 'album':
                filtered = filtered.filter(p => p.selected_for_album);
                break;
            case 'editing':
                filtered = filtered.filter(p => p.selected_for_editing);
                break;
            case 'client':
                filtered = filtered.filter(p => p.selected_by_client);
                break;
            default:
                filtered = filtered.filter(p => p.selected_by_client || p.selected_for_album || p.selected_for_editing);
        }
        
        return filtered.map(p => new Photo(p));
    }

    // Atualizar seleção da foto
    updateSelection(selections) {
        const photoIndex = photos.findIndex(p => p.id === this.id);
        if (photoIndex === -1) return false;

        if (selections.selected_by_client !== undefined) {
            photos[photoIndex].selected_by_client = selections.selected_by_client;
        }
        if (selections.selected_for_album !== undefined) {
            photos[photoIndex].selected_for_album = selections.selected_for_album;
        }
        if (selections.selected_for_editing !== undefined) {
            photos[photoIndex].selected_for_editing = selections.selected_for_editing;
        }
        if (selections.client_notes !== undefined) {
            photos[photoIndex].client_notes = selections.client_notes;
        }

        photos[photoIndex].updated_at = new Date();
        
        console.log('✅ Seleção atualizada para foto:', this.filename);
        return true;
    }

    // Gerar filtros para Lightroom
    static generateLightroomFilters(sessionId) {
        const sessionPhotos = this.findBySession(sessionId);
        
        // Função para limpar nome do arquivo para busca no LR
        const cleanFilename = (filename) => {
            return filename
                .replace(/\.(NEF|CR2|ARW|RAF|ORF|DNG|RW2)$/i, '') // Remove extensões RAW
                .replace(/\.(JPG|JPEG|PNG|TIFF)$/i, ''); // Remove extensões processadas
        };
        
        const filters = {
            selected_for_album: sessionPhotos
                .filter(p => p.selected_for_album)
                .map(p => cleanFilename(p.original_filename)),
            selected_for_editing: sessionPhotos
                .filter(p => p.selected_for_editing)  
                .map(p => cleanFilename(p.original_filename)),
            client_selected: sessionPhotos
                .filter(p => p.selected_by_client)
                .map(p => cleanFilename(p.original_filename)),
            all_selected: sessionPhotos
                .filter(p => p.selected_by_client || p.selected_for_album || p.selected_for_editing)
                .map(p => cleanFilename(p.original_filename))
        };

        // Gerar strings prontas para o Lightroom
        const lightroomStrings = {
            album_filter: filters.selected_for_album.length > 0 ? filters.selected_for_album.join(' OR ') : '',
            editing_filter: filters.selected_for_editing.length > 0 ? filters.selected_for_editing.join(' OR ') : '',
            client_filter: filters.client_selected.length > 0 ? filters.client_selected.join(' OR ') : '',
            all_selected_filter: filters.all_selected.length > 0 ? filters.all_selected.join(' OR ') : ''
        };

        return {
            ...filters,
            lightroom_strings: lightroomStrings,
            instructions: {
                step1: 'Abra o Adobe Lightroom com seus arquivos RAW',
                step2: 'Clique na lupa (filtro) acima das miniaturas',
                step3: 'Selecione "Nome do arquivo" no menu',
                step4: 'Cole o filtro desejado no campo de busca',
                step5: 'Pressione Enter - apenas os RAWs selecionados aparecerão'
            }
        };
    }

    // Retornar dados públicos para cliente
    toClientView() {
        return {
            id: this.id,
            filename: this.filename,
            thumbnail_path: this.thumbnail_path,
            dimensions: this.dimensions,
            selected_by_client: this.selected_by_client,
            selected_for_album: this.selected_for_album,
            selected_for_editing: this.selected_for_editing,
            client_notes: this.client_notes
        };
    }

    // Retornar dados completos para fotógrafo
    toPhotographerView() {
        return {
            id: this.id,
            session_id: this.session_id,
            filename: this.filename,
            original_filename: this.original_filename,
            file_path: this.file_path,
            thumbnail_path: this.thumbnail_path,
            file_size: this.file_size,
            dimensions: this.dimensions,
            status: this.status,
            selected_by_client: this.selected_by_client,
            selected_for_album: this.selected_for_album,
            selected_for_editing: this.selected_for_editing,
            client_notes: this.client_notes,
            metadata: this.metadata,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    // Estatísticas da sessão
    static getSessionStats(sessionId) {
        const sessionPhotos = this.findBySession(sessionId);
        
        return {
            total_photos: sessionPhotos.length,
            selected_by_client: sessionPhotos.filter(p => p.selected_by_client).length,
            selected_for_album: sessionPhotos.filter(p => p.selected_for_album).length,
            selected_for_editing: sessionPhotos.filter(p => p.selected_for_editing).length,
            pending_selection: sessionPhotos.filter(p => !p.selected_by_client && !p.selected_for_album && !p.selected_for_editing).length
        };
    }
}

// Modelo de Sessão/Evento
class Session {
    constructor(data) {
        this.id = data.id;
        this.photographer_id = data.photographer_id;
        this.name = data.name;
        this.description = data.description;
        this.client_name = data.client_name;
        this.client_email = data.client_email;
        this.session_date = data.session_date;
        this.access_code = data.access_code; // Para cliente acessar
        this.status = data.status || 'active'; // active, completed, archived
        this.settings = data.settings || {
            allow_album_selection: true,
            allow_editing_selection: true,
            max_album_selections: null,
            max_editing_selections: null
        };
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    // Criar nova sessão
    static create(sessionData) {
        const accessCode = this.generateAccessCode();
        
        const newSession = {
            id: nextSessionId++,
            photographer_id: sessionData.photographer_id,
            name: sessionData.name,
            description: sessionData.description || '',
            client_name: sessionData.client_name,
            client_email: sessionData.client_email,
            session_date: sessionData.session_date,
            access_code: accessCode,
            status: 'active',
            settings: {
                allow_album_selection: true,
                allow_editing_selection: true,
                max_album_selections: sessionData.max_album_selections || null,
                max_editing_selections: sessionData.max_editing_selections || null
            },
            created_at: new Date(),
            updated_at: new Date()
        };

        sessions.push(newSession);
        console.log('✅ Sessão criada:', newSession.name, 'Código:', accessCode);
        
        return new Session(newSession);
    }

    // Gerar código de acesso
    static generateAccessCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Buscar sessão por código de acesso
    static findByAccessCode(accessCode) {
        const session = sessions.find(s => s.access_code === accessCode.toUpperCase());
        return session ? new Session(session) : null;
    }

    // Buscar sessões por fotógrafo
    static findByPhotographer(photographerId) {
        return sessions
            .filter(s => s.photographer_id === parseInt(photographerId))
            .map(s => new Session(s));
    }

    // Buscar sessão por ID
    static findById(id) {
        const session = sessions.find(s => s.id === parseInt(id));
        return session ? new Session(session) : null;
    }

    // Retornar dados públicos
    toPublic() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            client_name: this.client_name,
            session_date: this.session_date,
            settings: this.settings,
            created_at: this.created_at
        };
    }

    // Listar todas as sessões (para debug)
    static getAll() {
        return sessions.map(s => new Session(s));
    }
}

module.exports = { Photo, Session };