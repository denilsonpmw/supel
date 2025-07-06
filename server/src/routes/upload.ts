import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.post('/excel', (req, res) => res.json({ message: 'Upload Excel - em desenvolvimento' }));
router.post('/csv', (req, res) => res.json({ message: 'Upload CSV - em desenvolvimento' }));

export default router; 