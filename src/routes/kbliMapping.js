const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

/**
 * @swagger
 * /api/kbli-mapping:
 *   get:
 *     summary: Get KBLI mappings
 *     description: Retrieve KBLI mapping data with optional filters and pagination
 *     tags: [KBLI]
 *     parameters:
 *       - in: query
 *         name: nama_usaha
 *         schema:
 *           type: string
 *         description: Filter by business name
 *       - in: query
 *         name: kbli_2020
 *         schema:
 *           type: string
 *         description: Filter by KBLI 2020 code
 *       - in: query
 *         name: kbli_2025
 *         schema:
 *           type: string
 *         description: Filter by KBLI 2025 code
 *       - in: query
 *         name: korespondensi
 *         schema:
 *           type: string
 *         description: Filter by correspondence type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *      - in: query
 *        name: updated_after
 *        schema:
 *          type: string
 *          format: date-time
 *        description: Filter records updated after this timestamp (ISO 8601)
 *     responses:
 *       200:
 *         description: List of KBLI mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const { 
      nama_usaha, 
      kbli_2020, 
      kbli_2025, 
      korespondensi, 
      limit = 100, 
      offset = 0,
      updated_after
    } = req.query;

    const where = {};
    if (nama_usaha) where.nama_usaha = { contains: nama_usaha, mode: 'insensitive' };
    if (kbli_2020) where.kbli_2020 = kbli_2020;
    if (kbli_2025) where.kbli_2025 = kbli_2025;
    if (korespondensi) where.korespondensi = korespondensi;
    if (updated_after) where.updated_at = { gt: new Date(updated_after) }

    const data = await prisma.kbli_mapping.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { id: 'asc' },
    });

    const total = await prisma.kbli_mapping.count({ where });

    res.json({
      data,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching KBLI data:', error);
    res.status(500).json({ error: 'Failed to fetch KBLI data' });
  }
});
/**
 * @swagger
 * /api/kbli-mapping/stats:
 *   get:
 *     summary: Get KBLI statistics
 *     description: Get aggregate statistics for KBLI data
 *     tags: [KBLI]
 *     responses:
 *       200:
 *         description: KBLI statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 by_korespondensi:
 *                   type: array
 *                 by_kbli_2020:
 *                   type: array
 */
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.kbli_mapping.count();

    const byKorespondensi = await prisma.kbli_mapping.groupBy({
      by: ['korespondensi'],
      _count: true,
      orderBy: { _count: { korespondensi: 'desc' } },
    });

    const topKbli2020 = await prisma.kbli_mapping.groupBy({
      by: ['kbli_2020'],
      _count: true,
      orderBy: { _count: { kbli_2020: 'desc' } },
      take: 20,
    });

    res.json({
      total,
      by_korespondensi: byKorespondensi,
      top_kbli_2020: topKbli2020,
    });
  } catch (error) {
    console.error('Error fetching KBLI stats:', error);
    res.status(500).json({ error: 'Failed to fetch KBLI statistics' });
  }
});

/**
 * @swagger
 * /api/kbli-mapping/{id}:
 *   get:
 *     summary: Get KBLI mapping by ID
 *     description: Retrieve a specific KBLI mapping record
 *     tags: [KBLI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: KBLI mapping ID
 *     responses:
 *       200:
 *         description: KBLI mapping record found
 *       404:
 *         description: Record not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mapping = await prisma.kbli_mapping.findUnique({
      where: { id: parseInt(id) },
    });

    if (!mapping) {
      return res.status(404).json({ error: 'KBLI mapping not found' });
    }

    res.json(mapping);
  } catch (error) {
    console.error('Error fetching KBLI mapping:', error);
    res.status(500).json({ error: 'Failed to fetch KBLI mapping' });
  }
});

/**
 * @swagger
 * /api/kbli-mapping/search:
 *   post:
 *     summary: Search KBLI mappings
 *     description: Search KBLI mappings with multiple criteria
 *     tags: [KBLI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_usaha:
 *                 type: string
 *               kbli_2020:
 *                 type: string
 *               kbli_2025:
 *                 type: string
 *               korespondensi:
 *                 type: string
 *               limit:
 *                 type: integer
 *                 default: 100
 *               offset:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/search', async (req, res) => {
  try {
    const { 
      nama_usaha, 
      kbli_2020, 
      kbli_2025, 
      korespondensi, 
      limit = 100, 
      offset = 0 
    } = req.body;

    const where = {};
    if (nama_usaha) where.nama_usaha = { contains: nama_usaha, mode: 'insensitive' };
    if (kbli_2020) where.kbli_2020 = kbli_2020;
    if (kbli_2025) where.kbli_2025 = kbli_2025;
    if (korespondensi) where.korespondensi = korespondensi;

    const data = await prisma.kbli_mapping.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { id: 'asc' },
    });

    const total = await prisma.kbli_mapping.count({ where });

    res.json({
      data,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error searching KBLI data:', error);
    res.status(500).json({ error: 'Failed to search KBLI data' });
  }
});

module.exports = router;
