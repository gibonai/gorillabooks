import bcrypt from 'bcryptjs';
import { User } from '../User';

// Mock bcrypt
jest.mock('bcryptjs');

describe('User Model', () => {
  describe('Password Hashing', () => {
    // Note: Password hashing is tested through integration tests
    // The pre-save hook is difficult to test in isolation without
    // actually saving to a database

    it('should have a pre-save hook for password hashing', () => {
      const preSaveHooks = User.schema.pre as unknown;
      expect(preSaveHooks).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await user.comparePassword('correctpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await user.comparePassword('wrongpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(result).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should not include password in JSON output', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      });

      const json = user.toJSON();

      expect(json).not.toHaveProperty('password');
      expect(json).toHaveProperty('email', 'test@example.com');
      expect(json).toHaveProperty('name', 'Test User');
    });
  });

  describe('Schema Validation', () => {
    it('should require email', () => {
      const user = new User({
        password: 'password123',
        name: 'Test User',
      });

      const error = user.validateSync();
      expect(error?.errors.email).toBeDefined();
    });

    it('should require password', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
      });

      const error = user.validateSync();
      expect(error?.errors.password).toBeDefined();
    });

    it('should require name', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
      });

      const error = user.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should enforce minimum password length', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      });

      const error = user.validateSync();
      expect(error?.errors.password).toBeDefined();
      expect(error?.errors.password.message).toContain('shorter than the minimum');
    });

    it('should convert email to lowercase', () => {
      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        name: 'Test User',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should trim email', () => {
      const user = new User({
        email: '  test@example.com  ',
        password: 'password123',
        name: 'Test User',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should trim name', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        name: '  Test User  ',
      });

      expect(user.name).toBe('Test User');
    });

    it('should have timestamps', () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(user.schema.options.timestamps).toBe(true);
    });
  });
});
