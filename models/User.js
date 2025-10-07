const bcrypt = require('bcryptjs');

// Base de dados temporária em memória
// TODO: Migrar para MongoDB/PostgreSQL depois
let users = [
    // Usuário de teste
    {
        id: 1,
        name: 'Admin Test',
        email: 'admin@alboom.com',
        password: '$2a$10$3i5dVmlQX3q6gDZrZeO2GeozjG.8QZPTcMN075XT.XuDCoKB.HIbS', // senha: admin123
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
    }
];

let nextUserId = 2;

class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.role = data.role || 'user';
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    // Criar novo usuário
    static async create(userData) {
        try {
            // Verificar se email já existe
            const existingUser = users.find(u => u.email === userData.email);
            if (existingUser) {
                throw new Error('Email já está em uso');
            }

            // Hash da senha
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            // Criar usuário
            const newUser = {
                id: nextUserId++,
                name: userData.name,
                email: userData.email.toLowerCase(),
                password: hashedPassword,
                role: userData.role || 'user',
                created_at: new Date(),
                updated_at: new Date()
            };

            users.push(newUser);
            console.log('✅ Usuário criado:', newUser.email);
            
            return new User(newUser);
        } catch (error) {
            console.log('❌ Erro ao criar usuário:', error.message);
            throw error;
        }
    }

    // Buscar usuário por email
    static findByEmail(email) {
        const user = users.find(u => u.email === email.toLowerCase());
        return user ? new User(user) : null;
    }

    // Buscar usuário por ID
    static findById(id) {
        const user = users.find(u => u.id === parseInt(id));
        return user ? new User(user) : null;
    }

    // Verificar senha
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // Retornar dados públicos (sem senha)
    toPublic() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            created_at: this.created_at
        };
    }

    // Listar todos os usuários (para debug)
    static getAll() {
        return users.map(u => new User(u).toPublic());
    }
}

module.exports = User;