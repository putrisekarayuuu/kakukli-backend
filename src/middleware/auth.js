const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../config/prisma'); 

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
     // Cek token di DB
    const user = await prisma.user.findFirst({
      where: { 
        token: token,
        is_active: true  // sekalian cek akun aktif
      }
    });

    if (!user || !user.token) {
      return res.status(401).json({ error: 'Session ended. Please login again.' });
    }

    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
