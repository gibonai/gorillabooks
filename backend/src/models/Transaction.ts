import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'income' | 'expense';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  vendor?: string;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
