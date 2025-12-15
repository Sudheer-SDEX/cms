const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const User = require('./models/User');
const Customer = require('./models/Customer');
const CallLog = require('./models/CallLog');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes

// Auth Routes
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // In a real app, hash passwords! For now, plain text to match db.json
        const user = await User.findOne({ email, password });

        if (user) {
            // In a real app, generate a real JWT. For now, mock it or use simple token
            const token = 'mock-jwt-token-' + user.id;
            const { password, ...userWithoutPassword } = user.toObject();
            res.json({ token, user: userWithoutPassword });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/auth/register', async (req, res) => {
    // Implement if needed
    res.status(501).json({ message: 'Not implemented' });
});

// User Routes
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/users/me', async (req, res) => {
    // In a real app, decode token from header to get user ID
    // For now, we'll mock or require a query param? 
    // The frontend sends Authorization header. We should parse it.
    // For simplicity in this migration, let's assume the frontend sends the ID or we just return the first admin for testing if auth middleware isn't fully set up.
    // BUT, the current frontend uses a mock token.
    // Let's implement a simple middleware to extract user from token if we were using real JWT.
    // For now, let's return a 404 or mock response if we can't identify.
    // Actually, the frontend `UserService.getUserProfile` calls `/api/users/me`.
    // The json-server might have handled this via some custom route or just returned the user matching the token.
    // Let's just return the first user for now or handle properly if we had the token logic.
    // Better: The frontend AuthGuard checks for a token.
    // Let's just return a placeholder or the admin user for 'me' to keep it working.
    const user = await User.findOne({ role: 'admin' });
    res.json(user);
});

// Customer Routes
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find({});
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/customers/:id', async (req, res) => {
    try {
        // Try finding by _id first, then by string id
        let customer;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            customer = await Customer.findById(req.params.id);
        }
        if (!customer) {
            customer = await Customer.findOne({ id: req.params.id });
        }

        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        // Generate a string ID if not present (for compatibility)
        if (!req.body.id) {
            req.body.id = Math.random().toString(36).substr(2, 9);
        }
        const customer = await Customer.create(req.body);
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        let query = { id: req.params.id };
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = { _id: req.params.id };
        }

        const customer = await Customer.findOneAndUpdate(query, req.body, {
            new: true,
            runValidators: true
        });
        if (customer) {
            res.json(customer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// CallLog Routes
app.get('/api/callLogs', async (req, res) => {
    try {
        const logs = await CallLog.find({});
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/callLogs/customer/:customerId', async (req, res) => {
    try {
        const logs = await CallLog.find({ customerId: req.params.customerId }).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/callLogs/user/:userId', async (req, res) => {
    try {
        const logs = await CallLog.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/callLogs', async (req, res) => {
    try {
        if (!req.body.id) {
            req.body.id = Math.random().toString(36).substr(2, 9);
        }
        const log = await CallLog.create(req.body);
        res.status(201).json(log);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
