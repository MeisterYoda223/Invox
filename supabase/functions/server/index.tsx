import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
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

// Health check endpoint
app.get("/make-server-e5b0fe50/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all data with optional prefix filter
app.get("/make-server-e5b0fe50/data", async (c) => {
  try {
    const prefix = c.req.query("prefix");
    let data;
    
    if (prefix) {
      data = await kv.getByPrefix(prefix);
    } else {
      // Get all major data types
      const [quotes, invoices, customers, services, settings] = await Promise.all([
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
    }
    
    return c.json({ data, error: null });
  } catch (error) {
    console.error("Error fetching data from KV store:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Get single item by key
app.get("/make-server-e5b0fe50/data/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const data = await kv.get(key);
    
    if (data === null) {
      return c.json({ data: null, error: "Not found" }, 404);
    }
    
    return c.json({ data, error: null });
  } catch (error) {
    console.error(`Error fetching data for key ${c.req.param("key")}:`, error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Set/Update item
app.post("/make-server-e5b0fe50/data/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();
    const { value } = body;
    
    if (value === undefined) {
      return c.json({ data: null, error: "Value is required" }, 400);
    }
    
    await kv.set(key, value);
    return c.json({ data: { key, value }, error: null });
  } catch (error) {
    console.error(`Error setting data for key ${c.req.param("key")}:`, error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Delete item
app.delete("/make-server-e5b0fe50/data/:key", async (c) => {
  try {
    const key = c.req.param("key");
    await kv.del(key);
    return c.json({ data: { deleted: true, key }, error: null });
  } catch (error) {
    console.error(`Error deleting data for key ${c.req.param("key")}:`, error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Batch operations
app.post("/make-server-e5b0fe50/data/batch/set", async (c) => {
  try {
    const body = await c.req.json();
    const { items } = body; // Array of { key, value } objects
    
    if (!Array.isArray(items)) {
      return c.json({ data: null, error: "Items must be an array" }, 400);
    }
    
    const keys = items.map(item => item.key);
    const values = items.map(item => item.value);
    
    await kv.mset(keys, values);
    return c.json({ data: { count: items.length }, error: null });
  } catch (error) {
    console.error("Error in batch set operation:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

app.post("/make-server-e5b0fe50/data/batch/delete", async (c) => {
  try {
    const body = await c.req.json();
    const { keys } = body; // Array of keys to delete
    
    if (!Array.isArray(keys)) {
      return c.json({ data: null, error: "Keys must be an array" }, 400);
    }
    
    await kv.mdel(keys);
    return c.json({ data: { count: keys.length }, error: null });
  } catch (error) {
    console.error("Error in batch delete operation:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);