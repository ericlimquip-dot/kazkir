// Diagnoses why server-side requests to Supabase fail. Run: node scripts/net-check.mjs
import dns from "node:dns/promises";
import https from "node:https";

const host = "wcgyajmhxbsgidokzxnh.supabase.co";
const url = `https://${host}/auth/v1/health`;

console.log("Node", process.version);
console.log("NODE_OPTIONS set:", Boolean(process.env.NODE_OPTIONS));
console.log("NODE_EXTRA_CA_CERTS set:", Boolean(process.env.NODE_EXTRA_CA_CERTS));
console.log("HTTPS_PROXY set:", Boolean(process.env.HTTPS_PROXY || process.env.https_proxy));

try {
  const addrs = await dns.lookup(host, { all: true });
  console.log("DNS:", addrs.map((a) => `${a.address} (IPv${a.family})`).join(", "));
} catch (e) {
  console.log("DNS FAILED:", e.code, e.message);
}

try {
  const r = await fetch(url);
  console.log("fetch:", r.status);
} catch (e) {
  console.log("fetch FAILED:", e.cause?.code, "|", e.cause?.message ?? e.message);
}

for (const family of [4, 6]) {
  await new Promise((resolve) => {
    const req = https.get(url, { family, timeout: 8000 }, (res) => {
      console.log(`https IPv${family}:`, res.statusCode);
      res.resume();
      resolve();
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => {
      console.log(`https IPv${family} FAILED:`, e.code, "|", e.message);
      resolve();
    });
  });
}
