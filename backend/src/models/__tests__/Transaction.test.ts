import mongoose from 'mongoose';
import { Transaction } from '../Transaction';

describe('Transaction Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid transaction', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date('2024-01-15'),
        type: 'expense',
        amount: 150.50,
        category: 'Office Supplies',
        description: 'Bought printer paper',
      });

      const error = transaction.validateSync();
      expect(error).toBeUndefined();
    });

    it('should require userId', () => {
      const transaction = new Transaction({
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.userId).toBeDefined();
    });

    it('should require date', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.date).toBeDefined();
    });

    it('should require type', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        amount: 100,
        category: 'Test',
        description: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.type).toBeDefined();
    });

    it('should only allow income or expense as type', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'invalid' as any,
        amount: 100,
        category: 'Test',
        description: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.type).toBeDefined();
      expect(error?.errors.type.message).toContain('is not a valid enum value');
    });

    it('should require amount', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        category: 'Test',
        description: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.amount).toBeDefined();
    });

    it('should enforce minimum amount of 0.01', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 0,
        category: 'Test',
        description: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.amount).toBeDefined();
      expect(error?.errors.amount.message).toContain('less than minimum');
    });

    it('should require category', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        description: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.category).toBeDefined();
    });

    it('should require description', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
      });

      const error = transaction.validateSync();
      expect(error?.errors.description).toBeDefined();
    });

    it('should allow optional vendor field', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
        vendor: 'Test Vendor',
      });

      const error = transaction.validateSync();
      expect(error).toBeUndefined();
      expect(transaction.vendor).toBe('Test Vendor');
    });

    it('should allow optional tags array', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
        tags: ['urgent', 'office'],
      });

      const error = transaction.validateSync();
      expect(error).toBeUndefined();
      expect(transaction.tags).toEqual(['urgent', 'office']);
    });

    it('should allow optional notes field', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
        notes: 'Some additional notes',
      });

      const error = transaction.validateSync();
      expect(error).toBeUndefined();
      expect(transaction.notes).toBe('Some additional notes');
    });

    it('should trim category', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: '  Office Supplies  ',
        description: 'Test',
      });

      expect(transaction.category).toBe('Office Supplies');
    });

    it('should trim description', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: '  Test description  ',
      });

      expect(transaction.description).toBe('Test description');
    });

    it('should trim vendor', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
        vendor: '  Amazon  ',
      });

      expect(transaction.vendor).toBe('Amazon');
    });

    it('should trim notes', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
        notes: '  Some notes  ',
      });

      expect(transaction.notes).toBe('Some notes');
    });

    it('should trim individual tags', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
        tags: ['  urgent  ', '  office  '],
      });

      expect(transaction.tags).toEqual(['urgent', 'office']);
    });

    it('should have timestamps', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Test',
        description: 'Test',
      });

      expect(transaction.schema.options.timestamps).toBe(true);
    });
  });

  describe('Transaction Types', () => {
    it('should accept income type', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'income',
        amount: 1000,
        category: 'Sales',
        description: 'Product sale',
      });

      const error = transaction.validateSync();
      expect(error).toBeUndefined();
      expect(transaction.type).toBe('income');
    });

    it('should accept expense type', () => {
      const transaction = new Transaction({
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
        type: 'expense',
        amount: 100,
        category: 'Office',
        description: 'Office supplies',
      });

      const error = transaction.validateSync();
      expect(error).toBeUndefined();
      expect(transaction.type).toBe('expense');
    });
  });

  describe('Indexes', () => {
    it('should have index on userId and date', () => {
      const indexes = Transaction.schema.indexes();
      const userIdDateIndex = indexes.find((idx) =>
        JSON.stringify(idx[0]) === JSON.stringify({ userId: 1, date: -1 })
      );
      expect(userIdDateIndex).toBeDefined();
    });

    it('should have index on userId and createdAt', () => {
      const indexes = Transaction.schema.indexes();
      const userIdCreatedAtIndex = indexes.find((idx) =>
        JSON.stringify(idx[0]) === JSON.stringify({ userId: 1, createdAt: -1 })
      );
      expect(userIdCreatedAtIndex).toBeDefined();
    });

    it('should have index on userId and type', () => {
      const indexes = Transaction.schema.indexes();
      const userIdTypeIndex = indexes.find((idx) =>
        JSON.stringify(idx[0]) === JSON.stringify({ userId: 1, type: 1 })
      );
      expect(userIdTypeIndex).toBeDefined();
    });

    it('should have index on userId and category', () => {
      const indexes = Transaction.schema.indexes();
      const userIdCategoryIndex = indexes.find((idx) =>
        JSON.stringify(idx[0]) === JSON.stringify({ userId: 1, category: 1 })
      );
      expect(userIdCategoryIndex).toBeDefined();
    });

    it('should have index on userId field', () => {
      const userIdField = Transaction.schema.path('userId');
      expect((userIdField as any).options.index).toBe(true);
    });
  });
});
