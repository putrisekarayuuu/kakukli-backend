const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/cleanup', async (req, res) => {
  try {
    await prisma.$executeRaw`
      DELETE FROM kamus_kbli 
      WHERE is_deleted = true 
      AND deleted_at < NOW() - INTERVAL '7 days'
    `;
    await prisma.$executeRaw`
      DELETE FROM kbli_mapping 
      WHERE is_deleted = true 
      AND deleted_at < NOW() - INTERVAL '7 days'
    `;
    res.json({ message: 'Cleanup selesai' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;