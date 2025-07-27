    const express = require('express');
        const router = express.Router();
        const { register, login, verifyUser, getAllUsers } = require('../controllers/authController');
        const { protect } = require('../middleware/auth');
        
        router.post('/register', register);
        router.post('/login', login);

        
        router.get('/verify', protect, verifyUser);
        router.get('/users', protect, getAllUsers);

        module.exports = router;
