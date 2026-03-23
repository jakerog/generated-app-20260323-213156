import { Hono } from "hono";
import * as cheerio from "cheerio";
import type { Env } from './core-utils';
import { UserEntity, ProductEntity, AlertEntity, SettingsEntity } from "./entities";
import { ok, bad, notFound, isStr, Index } from './core-utils';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15'
];

let _seedsEnsured: Promise<void> | null = null;

async function countIndex(env: Env, indexName: string): Promise<number> {
  let total = 0;
  let cursor: string | null = null;
  const idx = new Index(env, indexName);
  do {
    const page = await idx.page(cursor, 100);
    total += page.items.length;
    cursor = page.next;
  } while (cursor);
  return total;
}

async function syncAdminStats(env: Env, performCleanup = false) {
  const settingsEnt = new SettingsEntity(env, 'global');
  let settings = await settingsEnt.getState();

  // One-time repair of product-alerts index if it hasn't been done yet
  if (!settings?.statsRepaired) {
    console.log("[STATS] Performing one-time index repair...");
    const alertIdx = new Index<string>(env, "alerts");
    let alertCursor: string | null = null;
    do {
      const page = await alertIdx.page(alertCursor, 50);
      for (const alertId of page.items) {
        const alert = await new AlertEntity(env, alertId).getState();
        if (alert?.productId) {
          await new Index(env, `product-alerts:${alert.productId}`).add(alertId);
        }
      }
      alertCursor = page.next;
    } while (alertCursor);

    settings = await settingsEnt.mutate(s => ({ ...(s || SettingsEntity.initialState), statsRepaired: true }));
  }

  if (performCleanup) {
    // Cleanup orphaned products: those with no alerts in product-alerts index
    const productIdx = new Index<string>(env, "products");
    let cursor: string | null = null;
    do {
      const page = await productIdx.page(cursor, 50);
      for (const productId of page.items) {
        const productAlertsIdx = new Index(env, `product-alerts:${productId}`);
        const { items: alertIds } = await productAlertsIdx.page(null, 1);
        if (alertIds.length === 0) {
          await ProductEntity.delete(env, productId);
          await productIdx.remove(productId);
        }
      }
      cursor = page.next;
    } while (cursor);
  }

  const [users, products, alerts] = await Promise.all([
    countIndex(env, "users"),
    countIndex(env, "products"),
    countIndex(env, "alerts")
  ]);

  const updated = await settingsEnt.mutate(s => ({
    ...(s || SettingsEntity.initialState),
    totalUsers: users,
    totalProducts: products,
    totalAlerts: alerts
  }));
  return updated;
}

async function safeEnsureSeed(env: Env) {
  if (_seedsEnsured) return _seedsEnsured;
  _seedsEnsured = (async () => {
    try {
      const settingsEnt = new SettingsEntity(env, 'global');
      const settings = await settingsEnt.getState();
      if ((settings?.totalUsers && settings.totalUsers > 0) || (settings?.totalProducts && settings.totalProducts > 0)) {
        return;
      }

      console.log("[SEEDING] Initializing system entities...");
      await Promise.all([
        UserEntity.ensureSeed(env),
        ProductEntity.ensureSeed(env),
        AlertEntity.ensureSeed(env),
        SettingsEntity.ensureSeed(env),
        ...AlertEntity.seedData.map(a => Promise.all([
          new Index(env, `user-alerts:${a.userId}`).add(a.id),
          new Index(env, `product-alerts:${a.productId}`).add(a.id)
        ]))
      ]);
      await syncAdminStats(env, true);
      console.log("[SEEDING] Success.");
    } catch (e) {
      console.error("[SEEDING] Failed:", e);
      _seedsEnsured = null;
      throw e;
    }
  })();
  return _seedsEnsured;
}

function resolveUserId(id: string): string {
  const inputId = (id || '').toLowerCase().trim();
  if (!inputId) return 'anonymous';
  const seedMatch = UserEntity.seedData.find(u =>
    u.id.toLowerCase() === inputId || u.email.toLowerCase() === inputId
  );
  return seedMatch ? seedMatch.id : inputId;
}

async function scrapeAmazonProduct(url: string) {
  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const response = await fetch(url, {
    headers: {
      'User-Agent': randomUA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`Amazon HTTP ${response.status}`);
  const html = await response.text();

  if (html.includes('sp-captcha') || html.includes('api-services-support@amazon.com')) {
    throw new Error('Bot Detection Triggered');
  }

  const $ = cheerio.load(html);
  const title = $('#productTitle').text().trim() || $('#title').text().trim();
  let img = '';
  const dynamicImage = $('#landingImage').attr('data-a-dynamic-image');
  if (dynamicImage) {
    try { img = Object.keys(JSON.parse(dynamicImage))[0]; } catch (e) { /* ignore parse error */ }
  }
  if (!img) img = $('#landingImage').attr('src') || '';

  let priceText = $('.a-price .a-offscreen').first().text();
  if (!priceText) priceText = $('#corePrice_feature_div .a-offscreen').first().text();
  if (!priceText) priceText = $('#priceblock_ourprice').text() || $('#priceblock_dealprice').text() || $('#price_inside_buybox').text() || '';
  if (!priceText) priceText = $('.a-color-price').first().text();

  // Handle formats like $1,234.56 or 1.234,56 € or 1 234,56
  let cleanPrice = priceText.replace(/[^\d,. ]/g, '').trim();
  if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
    if (cleanPrice.lastIndexOf('.') > cleanPrice.lastIndexOf(',')) {
      cleanPrice = cleanPrice.replace(/,/g, ''); // 1,234.56 -> 1234.56
    } else {
      cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
    }
  } else if (cleanPrice.includes(',')) {
    // Check if comma is decimal or thousand separator (common heuristics)
    const parts = cleanPrice.split(',');
    if (parts[parts.length - 1].length === 2) cleanPrice = cleanPrice.replace(',', '.');
    else cleanPrice = cleanPrice.replace(',', '');
  }

  const price = parseFloat(cleanPrice.replace(/\s/g, ''));
  if (!title || isNaN(price)) throw new Error('Failed to parse product details');

  return { title, image: img, price };
}

const subApp = new Hono<{ Bindings: Env }>();

subApp.onError((err, c) => {
  console.error(`[SUBAPP_ERROR] ${err.message}`);
  return bad(c, err.message || "Internal Sub-App Error");
});

subApp.post('/api/scrape', async (c) => {
  const { url } = await c.req.json();
  if (!isStr(url)) return bad(c, 'URL required');
  const asinMatch = url.match(/(?:\/dp\/|gp\/product\/|ASIN\/)([A-Z0-9]{10})/i);
  const productId = asinMatch ? asinMatch[1].toUpperCase() : null;
  if (!productId) return bad(c, 'Invalid Amazon URL');

  const data = await scrapeAmazonProduct(url);
  const productEnt = new ProductEntity(c.env, productId);
  const product = await productEnt.mutate(s => ({
    ...(s || ProductEntity.initialState),
    id: productId,
    url,
    title: data.title,
    image: data.image,
  }));
  await productEnt.recordPrice(data.price, 'amazon');
  await new Index(c.env, "products").add(productId);
  await syncAdminStats(c.env, false);
  return ok(c, product);
});

subApp.get('/api/products', async (c) => {
  const products = await ProductEntity.list(c.env, null, 50);
  return ok(c, products);
});

subApp.get('/api/products/:id', async (c) => {
  const product = await new ProductEntity(c.env, c.req.param('id')).getState();
  return product ? ok(c, product) : notFound(c);
});

subApp.get('/api/alerts', async (c) => {
  const rawUserId = c.req.query('userId');
  if (!rawUserId) return ok(c, []);
  await safeEnsureSeed(c.env);

  const canonicalId = resolveUserId(decodeURIComponent(rawUserId));
  const userIdx = new Index<string>(c.env, `user-alerts:${canonicalId}`);
  const { items: ids } = await userIdx.page(null, 50);

  const alerts = await Promise.all(ids.map(async (id) => {
    const alert = await new AlertEntity(c.env, id).getState();
    if (!alert?.id) return null;
    const product = await new ProductEntity(c.env, alert.productId).getState().catch(() => null);
    return { ...alert, product };
  }));

  return ok(c, alerts.filter(Boolean));
});

subApp.get('/api/alerts/:id', async (c) => {
  const alert = await new AlertEntity(c.env, c.req.param('id')).getState();
  if (!alert?.id) return notFound(c);
  const product = await new ProductEntity(c.env, alert.productId).getState().catch(() => null);
  return ok(c, { ...alert, product });
});

subApp.post('/api/alerts', async (c) => {
  const body = await c.req.json();
  const alertId = crypto.randomUUID();
  const userId = resolveUserId(body.userId);

  const alert = await AlertEntity.create(c.env, {
    ...AlertEntity.initialState,
    ...body,
    id: alertId,
    userId,
    createdAt: Date.now()
  });

  await new Index<string>(c.env, `user-alerts:${userId}`).add(alertId);
  await new Index<string>(c.env, `product-alerts:${body.productId}`).add(alertId);
  await new Index<string>(c.env, "alerts").add(alertId);
  await syncAdminStats(c.env, false);
  return ok(c, alert);
});

subApp.delete('/api/alerts/:id', async (c) => {
  const id = c.req.param('id');
  const alert = await new AlertEntity(c.env, id).getState();
  const success = await AlertEntity.delete(c.env, id);
  if (success && alert) {
    if (alert.userId) await new Index<string>(c.env, `user-alerts:${alert.userId}`).remove(id);
    if (alert.productId) await new Index<string>(c.env, `product-alerts:${alert.productId}`).remove(id);
    await syncAdminStats(c.env, true);
  }
  return ok(c, { success });
});

subApp.get('/api/users', async (c) => {
  const users = await UserEntity.list(c.env, null, 50);
  return ok(c, users);
});

subApp.get('/api/users/:id', async (c) => {
  await safeEnsureSeed(c.env);
  const id = resolveUserId(decodeURIComponent(c.req.param('id')));
  const userEnt = new UserEntity(c.env, id);
  const state = await userEnt.getState();

  if (state?.id) return ok(c, state);
  if (id.includes('@')) {
    const newUser = await UserEntity.create(c.env, { ...UserEntity.initialState, id, email: id });
    await syncAdminStats(c.env, false);
    return ok(c, newUser);
  }
  return notFound(c);
});

subApp.patch('/api/users/:id', async (c) => {
  const id = resolveUserId(decodeURIComponent(c.req.param('id')));
  const body = await c.req.json();
  const updated = await new UserEntity(c.env, id).mutate(s => ({ ...s, ...body }));
  return ok(c, updated);
});

subApp.get('/api/admin/settings', async (c) => {
  await safeEnsureSeed(c.env);
  const settings = await syncAdminStats(c.env, true);
  return ok(c, settings || SettingsEntity.initialState);
});

subApp.post('/api/admin/settings', async (c) => {
  const body = await c.req.json();
  const settings = await new SettingsEntity(c.env, 'global').mutate(s => ({ ...s, ...body }));
  return ok(c, settings);
});

subApp.get('/api/cron/check', async (c) => {
  const force = c.req.query('force') === 'true';
  const settingsEnt = new SettingsEntity(c.env, 'global');
  const currentSettings = await settingsEnt.getState() || SettingsEntity.initialState;

  const intervalMs = (currentSettings.scrapingIntervalMinutes || 15) * 60 * 1000;
  const lastRun = currentSettings.lastScrapeTime || 0;
  if (!force && Date.now() - lastRun < intervalMs) {
    return ok(c, { skipped: true, reason: 'cooldown', nextRun: lastRun + intervalMs });
  }

  const products = await ProductEntity.list(c.env, null, 100);
  const shuffled = products.items.sort(() => 0.5 - Math.random()).slice(0, 5);
  let updated = 0;
  let failed = 0;
  let lastError = '';
  let botDetected = false;

  for (const p of shuffled) {
    try {
      console.log(`[CRON] Scraping ${p.id} (${p.url})`);
      const data = await scrapeAmazonProduct(p.url);
      await new ProductEntity(c.env, p.id).recordPrice(data.price, 'amazon');
      updated++;
      console.log(`[CRON] Success ${p.id}: ${data.price}`);
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    } catch (e) {
      failed++;
      lastError = e instanceof Error ? e.message : String(e);
      if (lastError.includes('Bot Detection')) botDetected = true;
      console.error(`[CRON] Failed ${p.id}: ${lastError}`);
    }
  }

  const status = failed === 0 ? 'success' : (updated > 0 ? 'partial_failure' : 'failure');

  await settingsEnt.mutate(s => {
    const current = s || SettingsEntity.initialState;
    return {
      ...current,
      lastScrapeTime: Date.now(),
      lastCronStatus: status,
      totalScrapes: (current.totalScrapes || 0) + shuffled.length,
      failedScrapes: (current.failedScrapes || 0) + failed,
      lastScrapeError: lastError || current.lastScrapeError,
      consecutiveBotDetections: botDetected ? (current.consecutiveBotDetections || 0) + 1 : 0,
      consecutiveHttpErrors: (failed > 0 && !botDetected) ? (current.consecutiveHttpErrors || 0) + 1 : 0
    };
  });

  return ok(c, { updated, total: shuffled.length, failed, lastError });
});

export function userRoutes(app: Hono<{ Bindings: Env }>) {
  console.log("[USER_ROUTES] Initializing sub-app proxy...");
  const originalFetch = app.fetch;
  app.fetch = async (request: Request, env?: Env | any, executionContext?: any) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/') &&
        url.pathname !== '/api/health' &&
        url.pathname !== '/api/client-errors') {
      return subApp.fetch(request, env, executionContext);
    }
    return originalFetch(request, env, executionContext);
  };
}
//