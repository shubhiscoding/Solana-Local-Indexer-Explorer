export interface StatsResponse {
  totalTransactions: number;
  totalFailed: number;
  successRate: number;
  latestSlot: string;
  recentTransactions: TransactionSummary[];
}

export interface TransactionSummary {
  id: string;
  signature: string;
  slot: string;
  blockTime: string | null;
  success: boolean;
  fee: string | null;
}

export interface TransactionListResponse {
  transactions: TransactionSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
