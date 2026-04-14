const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/test/ping:
 *   get:
 *     summary: Ping test endpoint
 *     description: Simple health check endpoint that returns pong
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Successfully pinged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: pong
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/test/echo:
 *   post:
 *     summary: Echo test endpoint
 *     description: Echoes back the request body
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Hello World
 *     responses:
 *       200:
 *         description: Successfully echoed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 echoed:
 *                   type: object
 */
router.post('/echo', (req, res) => {
  res.json({ echoed: req.body });
});

module.exports = router;
