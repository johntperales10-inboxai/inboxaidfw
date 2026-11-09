// Read-only uptime check for inboxaidfw.com. Runs on GitHub Actions; a failed run
// makes GitHub email the repo owner. Never creates checkouts, purchases or charges.
const SITE = "https://www.inboxaidfw.com";
const failures = [];
const check = (name, pass, info = "") => {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${info}`);
  if (!pass) failures.push(name);
};

async function get(url, init) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const t0 = Date.now();
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
      return { res, ms: Date.now() - t0 };
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

for (const path of ["/", "/thanks", "/signin", "/dashboard", "/premium", "/privacy", "/terms", "/inboxai-setup-guide.pdf"]) {
  try {
    const { res, ms } = await get(SITE + path);
    check(`page ${path}`, res.status === 200 && ms < 10000, `${res.status} in ${ms}ms`);
  } catch (e) {
    check(`page ${path}`, false, e.message);
  }
}

try {
  const html = await (await get(SITE + "/")).res.text();
  check("home shows $50 and $97", html.includes("$50") && html.includes("$97"));
} catch (e) {
  check("home content", false, e.message);
}

// Webhooks should be up and reject unsigned requests (a 404 or 5xx means broken).
for (const hook of ["stripe-webhook", "gumroad-webhook"]) {
  try {
    const { res } = await get(`${SITE}/api/public/${hook}`, {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    check(`${hook} rejects unsigned`, res.status >= 400 && res.status < 500 && res.status !== 404, `${res.status}`);
  } catch (e) {
    check(hook, false, e.message);
  }
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nAll checks passed.");
