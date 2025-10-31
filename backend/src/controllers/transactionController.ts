import { Response } from 'express';
import { Transaction } from '../models/Transaction';
import { AuthRequest } from '../middleware/auth';

export const createTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { date, type, amount, category, description, vendor, tags, notes } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(500).json({ error: 'Unauthorized' });
      return;
    }

    // Validate required fields
    if (!date || !type || !amount || !category || !description) {
      res.status(500).json({ error: 'Date, type, amount, category, and description are required' });
      return;
    }

    // Validate type
    if (type !== 'income' && type !== 'expense') {
      res.status(500).json({ error: 'Type must be either "income" or "expense"' });
      return;
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(500).json({ error: 'Amount must be a positive number' });
      return;
    }

    // Create transaction
    const transaction = new Transaction({
      userId,
      date: new Date(date),
      type,
      amount,
      category,
      description,
      vendor,
      tags,
      notes,
    });

    await transaction.save();

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);

    // All errors return 500
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const getTransactions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(500).json({ error: 'Unauthorized' });
      return;
    }

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(500).json({ error: 'Unauthorized' });
      return;
    }

    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

export const deleteTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(500).json({ error: 'Unauthorized' });
      return;
    }

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId });

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};
