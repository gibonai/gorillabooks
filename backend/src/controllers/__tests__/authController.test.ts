import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { signup, login, getMe } from '../authController';
import { User } from '../../models/User';
import { config } from '../../config/env';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('jsonwebtoken');
jest.mock('../../config/env', () => ({
  config: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '24h',
  },
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRequest = {
      body: {},
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as any).mockImplementation(() => mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await signup(mockRequest as Request, mockResponse as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        token: 'mock-token',
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should return 400 if email is missing', async () => {
      mockRequest.body = {
        password: 'password123',
        name: 'Test User',
      };

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Email, password, and name are required',
      });
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Email, password, and name are required',
      });
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Email, password, and name are required',
      });
    });

    it('should return 400 if password is too short', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      };

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Password must be at least 8 characters long',
      });
    });

    it('should return 409 if user already exists', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (User.findOne as jest.Mock).mockResolvedValue({ email: 'existing@example.com' });

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'User already exists with this email',
      });
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to create account',
      });
    });
  });

  describe('login', () => {
    it('should login user and return token', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await login(mockRequest as Request, mockResponse as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      expect(mockJson).toHaveBeenCalledWith({
        token: 'mock-token',
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should return 400 if email is missing', async () => {
      mockRequest.body = {
        password: 'password123',
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Email and password are required',
      });
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Email and password are required',
      });
    });

    it('should return 401 if user not found', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid email or password',
      });
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid email or password',
      });
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to login',
      });
    });
  });

  describe('getMe', () => {
    it('should return user information', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      (mockRequest as any).userId = 'user123';
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await getMe(mockRequest as Request, mockResponse as Response);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockJson).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return 404 if user not found', async () => {
      (mockRequest as any).userId = 'nonexistent';
      (User.findById as jest.Mock).mockResolvedValue(null);

      await getMe(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'User not found',
      });
    });

    it('should return 500 on database error', async () => {
      (mockRequest as any).userId = 'user123';
      (User.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getMe(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to get user info',
      });
    });
  });
});
