import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  deleteTransaction,
} from '../controllers/transactionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.delete('/:id', deleteTransaction);

export default router;
