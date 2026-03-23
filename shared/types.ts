export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface UserPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  promoEmails: boolean;
}
export interface User {
  id: string;
  email: string;
  phone: string;
  preferences: UserPreferences;
  password?: string;
  hasTempPassword?: boolean;
  isAdmin?: boolean;
  active?: boolean;
}
export interface PricePoint {
  price: number;
  timestamp: number;
  condition: 'amazon' | 'new' | 'used';
}
export interface Product {
  id: string;
  url: string;
  title: string;
  image: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  metadata?: Record<string, string>;
}
export interface AlertConditions {
  amazon: boolean;
  new: boolean;
  used: boolean;
}
export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  conditions: AlertConditions;
  active: boolean;
  createdAt: number;
}
export interface SystemSettings {
  id: string;
  affiliateTag: string;
  scrapingIntervalMinutes: number;
  lastScrapeTime: number;
  totalScrapes?: number;
  failedScrapes?: number;
  lastScrapeError?: string;
  lastCronStatus: 'success' | 'failure' | 'none' | 'partial_failure' | 'idle';
  totalAlerts: number;
  totalUsers: number;
  totalProducts: number;
  consecutiveBotDetections: number;
  consecutiveHttpErrors: number;
  statsRepaired?: boolean;
}