const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

/**
 * @swagger
 * tags:
 *   name: Kamus KBLI
 *   description: KBLI dictionary endpoints
 */

/**
 * @swagger
 * /api/kamus-kbli:
 *   get:
 *     summary: Get Kamus KBLI
 *     description: Retrieve all KBLI dictionary data
 *     tags: [Kamus KBLI]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: updated_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter records updated after this timestamp (ISO 8601)
 *     responses:
 *       200:
 *         description: List of Kamus KBLI
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, updated_after } = req.query;

    const where = {};
    if (updated_after) where.updated_at = { gt: new Date(updated_after) };

    const data = await prisma.kamus_kbli.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: {
        kode_kbli: 'asc'
      }
    });

    const total = await prisma.kamus_kbli.count({ where });

    res.json({
      data,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching kamus KBLI:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

/**
 * @swagger
 * /api/kamus-kbli/search:
 *   get:
 *     summary: Search Kamus KBLI
 *     description: Search KBLI by kode, judul, or deskripsi
 *     tags: [Kamus KBLI]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Keyword to search
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', async (req, res) => {
  try {
    const { query = '', limit = 20 } = req.query;

    const isNumber = /^\d+$/.test(query);

    const where = query
      ? {
          OR: [
            ...(isNumber
              ? [{ kode_kbli: { startsWith: query } }]
              : []),
            {
              judul: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              deskripsi: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        }
      : {};

    const data = await prisma.kamus_kbli.findMany({
      where,
      take: parseInt(limit),
      orderBy: {
        kode_kbli: 'asc'
      }
    });

    res.json({
      data,
      total: data.length
    });

  } catch (error) {
    console.error('Error searching kamus KBLI:', error);
    res.status(500).json({ error: 'Failed to search data' });
  }
});

module.exports = router;