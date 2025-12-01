// =============================================================================
// --- Import Required Modules ---
// =============================================================================
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { spawn } = require('child_process');

// =============================================================================
// --- Initial Setup & Configuration ---
// =============================================================================
const app = express();
const port = 3000;
const saltRounds = 10;

// --- MySQL Database Configuration ---
const dbOptions = {
    host: 'localhost',
    user: 'root',
    password: 'Riya@123', // Your provided password
    database: 'disease_predictor'
};

let db;

// =============================================================================
// --- Middleware ---
// =============================================================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/static', express.static(path.join(__dirname, '../static')));

const sessionStore = new MySQLStore(dbOptions);
app.use(session({
    key: 'session_cookie_name',
    secret: 'a-very-strong-secret-key-for-sessions',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
};

// =============================================================================
// --- HTML Page Routes ---
// =============================================================================
const servePage = (pageName) => (req, res) => {
    res.sendFile(path.join(__dirname, `../templates/${pageName}.html`));
};

app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/predictor');
    } else {
        servePage('login')(req, res);
    }
});

app.get('/register', servePage('register'));
app.get('/predictor', isAuthenticated, servePage('predictor'));
app.get('/history', isAuthenticated, servePage('history'));
// --- NEW: Route for the account page ---
app.get('/account', isAuthenticated, servePage('account'));


// =============================================================================
// --- API & Authentication Routes ---
// =============================================================================
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters long.');
        }
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(409).send('User with this email already exists.');
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        console.log(`New user registered: ${name} (${email})`);
        res.redirect('/');
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send('Server error during registration.');
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid email or password.');
        }
        req.session.userId = user.id;
        req.session.name = user.name;
        console.log(`User logged in: ${user.name} (${user.email})`);
        res.redirect('/predictor');
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send('Server error during login.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/');
    });
});

// --- NEW: API endpoint to get current user's details ---
app.get('/api/user', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [req.session.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ error: 'Failed to fetch user details.' });
    }
});

// --- NEW: API endpoint to change password ---
app.post('/api/change-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).send('Invalid data provided. New password must be at least 8 characters.');
    }

    try {
        // 1. Get the user's current hashed password from the DB
        const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).send('User not found.');
        }
        const user = rows[0];

        // 2. Verify the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(403).send('Incorrect current password.');
        }

        // 3. Hash the new password and update it in the DB
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, userId]);

        res.status(200).send('Password updated successfully!');

    } catch (error) {
        console.error("Password change error:", error);
        res.status(500).send('Server error while changing password.');
    }
});


app.post('/api/predict', isAuthenticated, (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({ error: 'Symptoms must be provided as a non-empty array.' });
    }

    const symptomString = symptoms.join(',');
    const pythonScriptPath = path.join(__dirname, '../ml_model/disease_predictor.py');
    const pythonProcess = spawn('python', [pythonScriptPath, symptomString]);

    let predictionResult = '';
    let errorResult = '';

    pythonProcess.stdout.on('data', (data) => { predictionResult += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorResult += data.toString(); });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}: ${errorResult}`);
            return res.status(500).json({ error: 'Prediction script failed.', details: errorResult });
        }
        const predictedDisease = predictionResult.trim();
        try {
            await db.execute('INSERT INTO predictions (user_id, symptoms, prediction) VALUES (?, ?, ?)', [req.session.userId, JSON.stringify(symptoms), predictedDisease]);
            res.json({ prediction: predictedDisease });
        } catch (dbError) {
            console.error("Error saving prediction to database:", dbError);
            res.status(500).json({ error: 'Failed to save prediction history.' });
        }
    });
});

app.get('/api/history', isAuthenticated, async (req, res) => {
    try {
        const [history] = await db.execute('SELECT symptoms, prediction, timestamp FROM predictions WHERE user_id = ? ORDER BY timestamp DESC', [req.session.userId]);
        const formattedHistory = history.map(item => ({ ...item, symptoms: JSON.parse(item.symptoms) }));
        res.json(formattedHistory);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: 'Failed to fetch prediction history.' });
    }
});

// =============================================================================
// --- Server Startup ---
// =============================================================================
const startServer = async () => {
    try {
        db = await mysql.createPool(dbOptions);
        console.log(`Successfully connected to MySQL database: ${dbOptions.database}`);
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to MySQL or start server:', error);
        process.exit(1);
    }
};

startServer();
