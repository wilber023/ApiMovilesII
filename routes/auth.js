    const express = require('express');
    const router = express.Router();
    const { register, login, verifyUser } = require('../controllers/authController');
    const { protect } = require('../middleware/auth');
    
    router.post('/register', register);
    router.post('/login', login);

    
    router.get('/verify', protect, verifyUser);

    module.exports = router;
