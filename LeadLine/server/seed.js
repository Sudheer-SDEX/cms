const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Customer = require('./models/Customer');
const CallLog = require('./models/CallLog');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        // Read db.json
        const dbPath = path.join(__dirname, 'db.json');
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        // Clear existing data
        await User.deleteMany();
        await Customer.deleteMany();
        await CallLog.deleteMany();

        console.log('Data cleared...');

        // Import Users
        if (data.users && data.users.length > 0) {
            await User.insertMany(data.users);
            console.log('Users imported...');
        }

        // Import Customers
        if (data.customers && data.customers.length > 0) {
            // Ensure contact persons have defaults if missing
            const customers = data.customers.map(c => ({
                ...c,
                contactPerson1: c.contactPerson1 || {},
                contactPerson2: c.contactPerson2 || {},
                contactPerson3: c.contactPerson3 || {},
                auditLog: c.auditLog || []
            }));
            await Customer.insertMany(customers);
            console.log('Customers imported...');
        }

        // Import CallLogs
        if (data.callLogs && data.callLogs.length > 0) {
            await CallLog.insertMany(data.callLogs);
            console.log('CallLogs imported...');
        }

        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error with data import: ${error.message}`);
        process.exit(1);
    }
};

importData();
