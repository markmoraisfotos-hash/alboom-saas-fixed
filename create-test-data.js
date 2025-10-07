// PhotoFlow SaaS - Script para criar dados de teste
const { Photo, Session } = require('./models/Photo');
const { Order, Package, Payment } = require('./models/Order');
const User = require('./models/User');

async function createTestData() {
    console.log('📸 Criando dados de teste para PhotoFlow SaaS...\n');

    try {
        // 1. Criar fotógrafo de teste
        console.log('👨‍💼 Criando fotógrafo de teste...');
        const photographer = await User.create({
            name: 'João Fotógrafo',
            email: 'joao@photoflow.com',
            password: 'fotografo123',
            role: 'user'
        });
        console.log('✅ Fotógrafo criado:', photographer.email);

        // 2. Criar sessão de teste  
        console.log('\n📁 Criando sessão de teste...');
        const session = Session.create({
            photographer_id: photographer.id,
            name: 'Casamento Ana & Carlos - Ensaio',
            description: 'Ensaio pré-casamento no Parque Ibirapuera',
            client_name: 'Ana Silva',
            client_email: 'ana@email.com',
            session_date: new Date('2024-12-15T14:30:00Z'),
            max_album_selections: 25,
            max_editing_selections: 8
        });
        console.log('✅ Sessão criada:', session.name);
        console.log('🔑 Código de acesso:', session.access_code);
        console.log('🔗 URL para cliente:', `/gallery/${session.access_code}`);

        // 3. Adicionar fotos de teste
        console.log('\n📸 Adicionando fotos de teste...');
        const testPhotos = [
            {
                filename: 'ANA_CARLOS_001.jpg',
                original_filename: 'DSC_0001.NEF',
                file_size: 2048576,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '85mm f/1.4', 
                    iso: 200,
                    aperture: 'f/1.8',
                    shutter: '1/200s'
                }
            },
            {
                filename: 'ANA_CARLOS_002.jpg',
                original_filename: 'DSC_0002.NEF',
                file_size: 2156544,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '85mm f/1.4', 
                    iso: 250,
                    aperture: 'f/2.0',
                    shutter: '1/160s'
                }
            },
            {
                filename: 'ANA_CARLOS_003.jpg',
                original_filename: 'DSC_0003.NEF',
                file_size: 1987654,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '24-70mm f/2.8', 
                    iso: 400,
                    aperture: 'f/2.8',
                    shutter: '1/125s'
                }
            },
            {
                filename: 'ANA_CARLOS_004.jpg',
                original_filename: 'DSC_0004.NEF',
                file_size: 2234123,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '24-70mm f/2.8', 
                    iso: 320,
                    aperture: 'f/3.2',
                    shutter: '1/100s'
                }
            },
            {
                filename: 'ANA_CARLOS_005.jpg',
                original_filename: 'DSC_0005.NEF',
                file_size: 2098765,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '70-200mm f/2.8', 
                    iso: 500,
                    aperture: 'f/2.8',
                    shutter: '1/200s'
                }
            },
            {
                filename: 'ANA_CARLOS_006.jpg',
                original_filename: 'DSC_0006.NEF',
                file_size: 2345678,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '70-200mm f/2.8', 
                    iso: 400,
                    aperture: 'f/3.5',
                    shutter: '1/160s'
                }
            },
            {
                filename: 'ANA_CARLOS_007.jpg',
                original_filename: 'DSC_0007.NEF',
                file_size: 1876543,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '50mm f/1.4', 
                    iso: 200,
                    aperture: 'f/1.6',
                    shutter: '1/250s'
                }
            },
            {
                filename: 'ANA_CARLOS_008.jpg',
                original_filename: 'DSC_0008.NEF',
                file_size: 2123456,
                dimensions: { width: 1920, height: 1280 },
                metadata: { 
                    camera: 'Nikon D850', 
                    lens: '50mm f/1.4', 
                    iso: 160,
                    aperture: 'f/1.8',
                    shutter: '1/320s'
                }
            }
        ];

        testPhotos.forEach((photoData, index) => {
            const photo = Photo.create({
                session_id: session.id,
                photographer_id: photographer.id,
                filename: photoData.filename,
                original_filename: photoData.original_filename,
                file_path: `/uploads/${session.id}/${photoData.filename}`,
                thumbnail_path: `/thumbnails/${session.id}/${photoData.filename}`,
                file_size: photoData.file_size,
                dimensions: photoData.dimensions,
                metadata: photoData.metadata
            });
            console.log(`  ✅ Foto ${index + 1}:`, photo.filename);
        });

        // 4. Simular algumas seleções do cliente
        console.log('\n👥 Simulando seleções do cliente...');
        const photos = Photo.findBySession(session.id);
        
        // Selecionar algumas fotos para álbum
        photos[0].updateSelection({ selected_for_album: true, client_notes: 'Foto perfeita para capa do álbum!' });
        photos[2].updateSelection({ selected_for_album: true, client_notes: 'Adoramos esta pose' });
        photos[4].updateSelection({ selected_for_album: true });
        
        // Selecionar algumas para edição
        photos[1].updateSelection({ selected_for_editing: true, client_notes: 'Gostaria de clarear o fundo um pouco' });
        photos[3].updateSelection({ selected_for_editing: true, client_notes: 'Pode remover aquela pessoa no fundo?' });
        
        // Seleções gerais
        photos[5].updateSelection({ selected_by_client: true, client_notes: 'Gostamos muito!' });
        photos[6].updateSelection({ selected_by_client: true });

        console.log('✅ Seleções simuladas com sucesso');

        // 6. Criar pacotes de venda
        console.log('\n📦 Criando pacotes de venda...');
        
        const digitalPackage = Package.create({
            photographer_id: photographer.id,
            name: 'Pacote Digital Premium',
            description: 'Todas as fotos editadas em alta resolução',
            type: 'digital',
            price: 299.90,
            options: {
                photo_count: 'all_selected',
                resolution: 'alta',
                formats: ['JPG', 'PNG']
            }
        });
        
        const printPackage = Package.create({
            photographer_id: photographer.id,
            name: 'Álbum Clássico',
            description: 'Álbum físico 25x25cm com 15 páginas',
            type: 'print',
            price: 399.90,
            options: {
                size: '25x25cm',
                pages: 15,
                cover: 'capa dura'
            }
        });
        
        const extraPackage = Package.create({
            photographer_id: photographer.id,
            name: 'Fotos Extras',
            description: 'Fotos adicionais editadas',
            type: 'extra_photo',
            price: 35.00,
            options: {
                per_photo: true,
                editing_included: true
            }
        });
        
        console.log('✅ Pacotes criados:', digitalPackage.name, printPackage.name, extraPackage.name);
        
        // 7. Criar pedido de exemplo
        console.log('\n🛒 Criando pedido de exemplo...');
        
        const order = Order.create({
            session_id: session.id,
            client_name: session.client_name,
            client_email: session.client_email,
            photographer_id: photographer.id,
            order_type: 'selection',
            items: [
                {
                    package_id: digitalPackage.id,
                    package_name: digitalPackage.name,
                    quantity: 1,
                    unit_price: digitalPackage.price,
                    total: digitalPackage.price,
                    options: { selected_photos: [1, 3, 5] }
                },
                {
                    package_id: extraPackage.id,
                    package_name: extraPackage.name,
                    quantity: 2,
                    unit_price: extraPackage.price,
                    total: extraPackage.price * 2,
                    options: { photo_ids: [2, 4] }
                }
            ],
            subtotal: digitalPackage.price + (extraPackage.price * 2),
            tax: (digitalPackage.price + (extraPackage.price * 2)) * 0.1,
            total: (digitalPackage.price + (extraPackage.price * 2)) * 1.1,
            delivery_method: 'both',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 dias
        });
        
        console.log('✅ Pedido criado:', order.id, 'Total:', order.total.toFixed(2));
        
        // 8. Simular pagamento
        console.log('\n💳 Simulando pagamento...');
        
        const payment = order.processPayment({
            method: 'credit_card',
            gateway: 'stripe',
            transaction_id: 'txn_' + Date.now()
        });
        
        console.log('✅ Pagamento processado:', payment.amount.toFixed(2));

        // 5. Mostrar resumo
        console.log('\n📊 RESUMO DOS DADOS CRIADOS:');
        console.log('================================');
        console.log('👨‍💼 Fotógrafo:', photographer.name, `(${photographer.email})`);
        console.log('📁 Sessão:', session.name);
        console.log('🔑 Código de acesso:', session.access_code);
        console.log('📸 Total de fotos:', testPhotos.length);
        
        const stats = Photo.getSessionStats(session.id);
        console.log('📊 Estatísticas da Galeria:');
        console.log(`   • Selecionadas para álbum: ${stats.selected_for_album}`);
        console.log(`   • Selecionadas para edição: ${stats.selected_for_editing}`);
        console.log(`   • Selecionadas pelo cliente: ${stats.selected_by_client}`);
        console.log(`   • Pendentes: ${stats.pending_selection}`);
        
        console.log('\n💰 Estatísticas Comerciais:');
        console.log(`   • Pacotes criados: 3`);
        console.log(`   • Pedidos: 1`);
        console.log(`   • Receita: R$ ${order.total.toFixed(2)}`);
        console.log(`   • Status pagamento: ${order.payment_status}`);

        console.log('\n🔗 URLs para teste:');
        console.log('   === GALERIA ===');
        console.log(`   • Dashboard: /api/gallery/dashboard`);
        console.log(`   • Galeria cliente: /api/gallery/session/${session.access_code}`);
        console.log(`   • Resumo seleção: /api/client/${session.access_code}/summary`);
        console.log(`   • Finalizar seleção: POST /api/client/${session.access_code}/finalize`);
        console.log('   === COMÉRCIO ===');
        console.log(`   • Dashboard comercial: /api/commerce/dashboard`);
        console.log(`   • Pacotes disponíveis: /api/commerce/session/${session.access_code}/packages`);
        console.log(`   • Pedidos: /api/commerce/orders`);
        console.log('   === MARCA D\'AGUA ===');
        console.log(`   • Configurações: /api/watermark/settings`);
        console.log(`   • Prévia: /api/watermark/preview`);
        console.log(`   • Login fotógrafo: joao@photoflow.com / fotografo123`);
        
        console.log('\n📋 FLUXO COMPLETO DA PLATAFORMA:');
        console.log('1. Fotógrafo configura marca d\'agua e cria pacotes');
        console.log('2. Fotógrafo faz upload das fotos JPEG com marca d\'agua');
        console.log('3. Cliente acessa galeria e seleciona fotos favoritas');
        console.log('4. Cliente compra pacotes e processa pagamento');
        console.log('5. Cliente finaliza → gera filtro Lightroom automático');
        console.log('6. Fotógrafo usa filtro no LR → edita apenas RAWs selecionados');
        console.log('7. Fotógrafo entrega fotos finais em alta resolução!');
        console.log('8. 💰 Controle total de vendas, prazos e entregas');

        console.log('\n✅ Dados de teste criados com sucesso!');
        
        return {
            photographer,
            session,
            stats,
            packages: [digitalPackage, printPackage, extraPackage],
            order,
            payment
        };

    } catch (error) {
        console.error('❌ Erro ao criar dados de teste:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createTestData()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { createTestData };