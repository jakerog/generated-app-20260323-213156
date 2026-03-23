import { IndexedEntity } from "./core-utils";
import type { User, Product, PriceAlert, PricePoint, SystemSettings } from "@shared/types";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = {
    id: "",
    email: "",
    phone: "",
    preferences: { emailAlerts: true, smsAlerts: false, promoEmails: false },
    isAdmin: false,
    active: true
  };
  static seedData: User[] = [
    {
      id: "admin",
      email: "contact@morozgroup.pro",
      phone: "",
      preferences: { emailAlerts: true, smsAlerts: true, promoEmails: true },
      isAdmin: true,
      active: true
    },
    {
      id: "jake.rog",
      email: "jake.rog@gmail.com",
      phone: "+15550199",
      preferences: { emailAlerts: true, smsAlerts: true, promoEmails: false },
      isAdmin: false,
      active: true
    }
  ];
}
export class ProductEntity extends IndexedEntity<Product> {
  static readonly entityName = "product";
  static readonly indexName = "products";
  static readonly initialState: Product = {
    id: "",
    url: "",
    title: "",
    image: "",
    currentPrice: 0,
    priceHistory: []
  };
  static seedData: Product[] = [
    {
      id: "p4",
      url: "https://www.amazon.com/Logitech-MX-Master-3S-Graphite/dp/B09HM94VDS",
      title: "Logitech MX Master 3S Wireless Performance Mouse",
      image: "https://m.media-amazon.com/images/I/61ni399W7ML._AC_SL1500_.jpg",
      currentPrice: 99.00,
      priceHistory: [
        { price: 109.99, timestamp: Date.now() - 86400000 * 10, condition: 'amazon' },
        { price: 99.00, timestamp: Date.now(), condition: 'amazon' }
      ]
    },
    {
      id: "p5",
      url: "https://www.amazon.com/Kindle-Paperwhite-16-GB/dp/B09TMN58KL",
      title: "Kindle Paperwhite (16 GB) – Now with a 6.8\" display",
      image: "https://m.media-amazon.com/images/I/51QCk82iGcL._AC_SL1000_.jpg",
      currentPrice: 149.99,
      priceHistory: [
        { price: 149.99, timestamp: Date.now() - 86400000 * 5, condition: 'amazon' },
        { price: 149.99, timestamp: Date.now(), condition: 'amazon' }
      ]
    },
    {
      id: "p6",
      url: "https://www.amazon.com/SAMSUNG-Portable-Photographers-MU-PC2T0T-AM/dp/B0874XN4D8",
      title: "Samsung T7 Shield 2TB, Portable SSD",
      image: "https://m.media-amazon.com/images/I/61f7N9I-8sL._AC_SL1500_.jpg",
      currentPrice: 169.99,
      priceHistory: [
        { price: 189.99, timestamp: Date.now() - 86400000 * 20, condition: 'amazon' },
        { price: 169.99, timestamp: Date.now(), condition: 'amazon' }
      ]
    }
  ];
  async recordPrice(price: number, condition: 'amazon' | 'new' | 'used') {
    try {
      const pt: PricePoint = { price, timestamp: Date.now(), condition };
      await this.mutate(s => {
        const history = Array.isArray(s.priceHistory) ? s.priceHistory : [];
        return {
          ...s,
          currentPrice: price,
          priceHistory: [...history, pt].slice(-100)
        };
      });
    } catch (err) {
      console.error(`[ProductEntity:recordPrice] Failed for ${this.id}:`, err);
    }
  }
}
export class AlertEntity extends IndexedEntity<PriceAlert> {
  static readonly entityName = "alert";
  static readonly indexName = "alerts";
  static readonly initialState: PriceAlert = {
    id: "",
    userId: "",
    productId: "",
    targetPrice: 0,
    conditions: { amazon: true, new: true, used: false },
    active: true,
    createdAt: 0
  };
  static seedData: PriceAlert[] = [
    {
      id: "a_jake_1",
      userId: "jake.rog",
      productId: "p4",
      targetPrice: 89.99,
      conditions: { amazon: true, new: true, used: false },
      active: true,
      createdAt: Date.now()
    },
    {
      id: "a_jake_2",
      userId: "jake.rog",
      productId: "p5",
      targetPrice: 129.99,
      conditions: { amazon: true, new: true, used: false },
      active: true,
      createdAt: Date.now()
    },
    {
      id: "a_jake_3",
      userId: "jake.rog",
      productId: "p6",
      targetPrice: 150.00,
      conditions: { amazon: true, new: true, used: false },
      active: true,
      createdAt: Date.now()
    }
  ];
}
export class SettingsEntity extends IndexedEntity<SystemSettings> {
  static readonly entityName = "settings";
  static readonly indexName = "system-settings";
  static readonly initialState: SystemSettings = {
    id: "global",
    affiliateTag: "pricewatch-20",
    scrapingIntervalMinutes: 15,
    lastScrapeTime: 0,
    totalScrapes: 0,
    failedScrapes: 0,
    lastScrapeError: "",
    lastCronStatus: "idle",
    totalAlerts: 0,
    totalUsers: 0,
    totalProducts: 0,
    consecutiveBotDetections: 0,
    consecutiveHttpErrors: 0
  };
  static seedData: SystemSettings[] = [
    {
      id: "global",
      affiliateTag: "pricewatch-20",
      scrapingIntervalMinutes: 15,
      lastScrapeTime: 0,
      totalScrapes: 0,
      failedScrapes: 0,
      lastScrapeError: "",
      lastCronStatus: "idle",
      totalAlerts: 0,
      totalUsers: 0,
      totalProducts: 0,
      consecutiveBotDetections: 0,
      consecutiveHttpErrors: 0
    }
  ];
}