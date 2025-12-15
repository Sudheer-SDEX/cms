const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

const SECRET_KEY = 'leadline-secret-key-2025'; // In production, use environment variable
const TOKEN_EXPIRY = '24h';

// Enable CORS
server.use(cors());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(middlewares);

// Helper function to create JWT token
function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName
        },
        SECRET_KEY,
        { expiresIn: TOKEN_EXPIRY }
    );
}

// Helper function to verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return null;
    }
}

// Login endpoint
server.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Read users from db.json
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8'));
    const user = db.users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create token
    const token = createToken(user);

    // Return user info (without password) and token
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
        user: userWithoutPassword,
        token: token
    });
});

// Logout endpoint (client-side will handle token removal)
server.post('/api/auth/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
});

// Get current user profile
server.get('/api/users/me', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Read users from db.json
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8'));
    const user = db.users.find(u => u.id === decoded.id);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
});

// Get all users (for admin dashboard)
server.get('/api/users', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Read users from db.json
    const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf-8'));
    const users = db.users.map(({ password, ...user }) => user);

    res.status(200).json(users);
});

// Middleware to verify token for protected routes
server.use('/api/customers', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = decoded; // Attach user info to request
        next();
    } else {
        next();
    }
});

server.use('/api/callLogs', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    } else {
        next();
    }
});

// Custom routes for filtering
server.get('/api/callLogs/user/:userId', (req, res) => {
    const db = router.db; // Get lowdb instance
    const calls = db.get('callLogs').filter({ userId: req.params.userId }).value();
    res.json(calls);
});

server.get('/api/callLogs/customer/:customerId', (req, res) => {
    const db = router.db;
    const calls = db.get('callLogs').filter({ customerId: req.params.customerId }).value();
    res.json(calls);
});

// Rewrite routes to add /api prefix
server.use(jsonServer.rewriter({
    '/api/customers': '/customers',
    '/api/customers/:id': '/customers/:id',
    '/api/callLogs': '/callLogs',
    '/api/callLogs/:id': '/callLogs/:id'
}));

// Use default router
server.use(router);

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Mock API Server is running on http://localhost:${PORT}`);
    console.log(`📚 API Endpoints:`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
    console.log(`   POST   http://localhost:${PORT}/api/auth/logout`);
    console.log(`   GET    http://localhost:${PORT}/api/users/me`);
    console.log(`   GET    http://localhost:${PORT}/api/customers`);
    console.log(`   POST   http://localhost:${PORT}/api/customers`);
    console.log(`   GET    http://localhost:${PORT}/api/callLogs`);
    console.log(`   POST   http://localhost:${PORT}/api/callLogs`);
    console.log(``);
    console.log(`📝 Test Credentials:`);
    console.log(`   Admin: admin@leadline.com / admin123`);
    console.log(`   User:  user@leadline.com / user123`);
});
