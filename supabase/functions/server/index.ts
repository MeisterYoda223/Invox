import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import * as kv from "./kv_store.tsx";

const app = new Hono();

/**
 * 🔍 Custom Logger Middleware
 * - Request-ID pro Request
 * - Loggt Body, Params, Query
 * - Misst Dauer
 */
app.use("*", async (c, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  const method = c.req.method;
  const url = c.req.url;

  let body: any = null;
  try {
    if (method !== "GET") {
      body = await c.req.clone().json();
    }
  } catch {
    body = "No JSON body";
  }

  console.log(`\n📥 REQUEST [${requestId}]`);
  console.log({
    method,
    url,
    query: c.req.query(),
    params: c.req.param(),
    body,
  });

  await next();

  const duration = Date.now() - start;

  console.log(`📤 RESPONSE [${requestId}]`);
  console.log({
    status: c.res.status,
    duration: `${duration}ms`,
  });
});

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check
app.get("/make-server-e5b0fe50/health", (c) => {
  console.log("❤️ Health check called");
  return c.json({ status: "ok" });
});

// Get all data / by prefix
app.get("/make-server-e5b0fe50/data", async (c) => {
  try {
    const prefix = c.req.query("prefix");
    console.log("🔍 Fetching data", { prefix });

    let data;

    if (prefix) {
      data = await kv.getByPrefix(prefix);
      console.log("📦 KV getByPrefix result", {
        prefix,
        count: data?.length,
      });
    } else {
      const [quotes, invoices, customers, services, settings] =
        await Promise.all([
          kv.getByPrefix("quote:"),
          kv.getByPrefix("invoice:"),
          kv.getByPrefix("customer:"),
          kv.getByPrefix("service:"),
          kv.getByPrefix("settings:"),
        ]);

      data = {
        quotes: quotes || [],
        invoices: invoices || [],
        customers: customers || [],
        services: services || [],
        settings: settings || [],
      };

      console.log("📦 KV full fetch", {
        quotes: quotes?.length,
        invoices: invoices?.length,
        customers: customers?.length,
        services: services?.length,
        settings: settings?.length,
      });
    }

    return c.json({ data, error: null });
  } catch (error) {
    console.error("❌ Error fetching data from KV store:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Get single item
app.get("/make-server-e5b0fe50/data/:key", async (c) => {
  try {
    const key = c.req.param("key");
    console.log("🔍 Fetch single key", { key });

    const data = await kv.get(key);

    if (data === null) {
      console.warn("⚠️ Not found", { key });
      return c.json({ data: null, error: "Not found" }, 404);
    }

    console.log("📦 KV get result", { key });

    return c.json({ data, error: null });
  } catch (error) {
    console.error("❌ Error fetching key:", {
      key: c.req.param("key"),
      error,
    });
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Set / Update
app.post("/make-server-e5b0fe50/data/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();
    const { value } = body;

    console.log("✍️ SET request", { key, value });

    if (value === undefined) {
      return c.json({ data: null, error: "Value is required" }, 400);
    }

    await kv.set(key, value);

    console.log("✅ KV set complete", { key });

    return c.json({ data: { key, value }, error: null });
  } catch (error) {
    console.error("❌ Error setting data:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Delete
app.delete("/make-server-e5b0fe50/data/:key", async (c) => {
  try {
    const key = c.req.param("key");

    console.log("🗑 DELETE request", { key });

    await kv.del(key);

    console.log("✅ KV delete complete", { key });

    return c.json({ data: { deleted: true, key }, error: null });
  } catch (error) {
    console.error("❌ Error deleting data:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Batch set
app.post("/make-server-e5b0fe50/data/batch/set", async (c) => {
  try {
    const body = await c.req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return c.json({ data: null, error: "Items must be an array" }, 400);
    }

    console.log("📦 Batch SET", {
      count: items.length,
      keys: items.map((i) => i.key),
    });

    const keys = items.map((item) => item.key);
    const values = items.map((item) => item.value);

    await kv.mset(keys, values);

    console.log("✅ Batch SET complete");

    return c.json({ data: { count: items.length }, error: null });
  } catch (error) {
    console.error("❌ Error in batch set:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Batch delete
app.post("/make-server-e5b0fe50/data/batch/delete", async (c) => {
  try {
    const body = await c.req.json();
    const { keys } = body;

    if (!Array.isArray(keys)) {
      return c.json({ data: null, error: "Keys must be an array" }, 400);
    }

    console.log("🧹 Batch DELETE", {
      count: keys.length,
      keys,
    });

    await kv.mdel(keys);

    console.log("✅ Batch DELETE complete");

    return c.json({ data: { count: keys.length }, error: null });
  } catch (error) {
    console.error("❌ Error in batch delete:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);