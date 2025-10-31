import { Response } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  deleteTransaction,
} from '../transactionController';
import { Transaction } from '../../models/Transaction';
import { AuthRequest } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../models/Transaction');

describe('Transaction Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRequest = {
      body: {},
      params: {},
      userId: 'user123',
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const mockTransactionData = {
        date: '2024-01-15',
        type: 'expense',
        amount: 150.50,
        category: 'Office Supplies',
        description: 'Bought printer paper',
        vendor: 'Office Depot',
      };

      const savedTransaction = {
        ...mockTransactionData,
        _id: 'trans123',
        userId: 'user123',
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = mockTransactionData;
      (Transaction as any).mockImplementation(() => savedTransaction);

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(savedTransaction);
    });

    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      mockRequest.body = {
        date: '2024-01-15',
        type: 'expense',
        amount: 150.50,
        category: 'Office Supplies',
        description: 'Test',
      };

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = {
        date: '2024-01-15',
        type: 'expense',
        // Missing amount, category, description
      };

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Date, type, amount, category, and description are required',
      });
    });

    it('should return 400 if type is invalid', async () => {
      mockRequest.body = {
        date: '2024-01-15',
        type: 'invalid',
        amount: 150.50,
        category: 'Office Supplies',
        description: 'Test',
      };

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Type must be either "income" or "expense"',
      });
    });

    it('should return 400 if amount is not a positive number', async () => {
      mockRequest.body = {
        date: '2024-01-15',
        type: 'expense',
        amount: -50,
        category: 'Office Supplies',
        description: 'Test',
      };

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Amount must be a positive number',
      });
    });

    it('should return 400 if amount is zero', async () => {
      mockRequest.body = {
        date: '2024-01-15',
        type: 'expense',
        amount: 0,
        category: 'Office Supplies',
        description: 'Test',
      };

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      // Note: amount 0 is falsy, so caught by required fields check first
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Date, type, amount, category, and description are required',
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        date: '2024-01-15',
        type: 'expense',
        amount: 150.50,
        category: 'Office Supplies',
        description: 'Test',
      };

      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';

      (Transaction as any).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError),
      }));

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Validation failed' });
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = {
        date: '2024-01-15',
        type: 'expense',
        amount: 150.50,
        category: 'Office Supplies',
        description: 'Test',
      };

      (Transaction as any).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      await createTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to create transaction' });
    });
  });

  describe('getTransactions', () => {
    it('should return all user transactions', async () => {
      const mockTransactions = [
        { _id: 'trans1', type: 'income', amount: 1000, date: new Date() },
        { _id: 'trans2', type: 'expense', amount: 50, date: new Date() },
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTransactions),
      };

      (Transaction.find as jest.Mock).mockReturnValue(mockChain);

      await getTransactions(mockRequest as AuthRequest, mockResponse as Response);

      expect(Transaction.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockChain.sort).toHaveBeenCalledWith({ date: -1, createdAt: -1 });
      expect(mockJson).toHaveBeenCalledWith(mockTransactions);
    });

    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;

      await getTransactions(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 500 on database error', async () => {
      (Transaction.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await getTransactions(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to fetch transactions' });
    });
  });

  describe('getTransaction', () => {
    it('should return a single transaction', async () => {
      const mockTransaction = {
        _id: 'trans123',
        userId: 'user123',
        type: 'expense',
        amount: 150.50,
      };

      mockRequest.params = { id: 'trans123' };
      (Transaction.findOne as jest.Mock).mockResolvedValue(mockTransaction);

      await getTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(Transaction.findOne).toHaveBeenCalledWith({
        _id: 'trans123',
        userId: 'user123',
      });
      expect(mockJson).toHaveBeenCalledWith(mockTransaction);
    });

    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      mockRequest.params = { id: 'trans123' };

      await getTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 404 if transaction not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      (Transaction.findOne as jest.Mock).mockResolvedValue(null);

      await getTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Transaction not found' });
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: 'trans123' };
      (Transaction.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to fetch transaction' });
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
      const mockTransaction = {
        _id: 'trans123',
        userId: 'user123',
      };

      mockRequest.params = { id: 'trans123' };
      (Transaction.findOneAndDelete as jest.Mock).mockResolvedValue(mockTransaction);

      await deleteTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(Transaction.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'trans123',
        userId: 'user123',
      });
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Transaction deleted successfully',
      });
    });

    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;
      mockRequest.params = { id: 'trans123' };

      await deleteTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 404 if transaction not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      (Transaction.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Transaction not found' });
    });

    it('should return 500 on database error', async () => {
      mockRequest.params = { id: 'trans123' };
      (Transaction.findOneAndDelete as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await deleteTransaction(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to delete transaction' });
    });
  });
});
