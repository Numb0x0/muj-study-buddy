/**
 * Adds a domain to Firebase Authentication → Settings → Authorized domains on
 * the LIVE project, so Google sign-in works there (e.g. after deploying to
 * Vercel or connecting a custom domain).
 *
 *   npm run auth:domain:live                      (lists the current domains)
 *   npm run auth:domain:live -- muj-study-buddy.vercel.app
 *
 * Uses the service-account key from .env.live.local.
 */
import "./_env";
import { cert } from "firebase-admin/app";

const domain = process.argv[2]?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
  console.error(`✖ "${process.argv[2]}" doesn't look like a domain name.`);
  process.exit(1);
}

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY!;
  const json = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
  const projectId = json.project_id as string;
  const { access_token } = await cert({ projectId, clientEmail: json.client_email, privateKey: json.private_key.replace(/\\n/g, "\n") }).getAccessToken();
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };

  const current = await fetch(url, { headers });
  if (!current.ok) throw new Error(`Reading auth config failed (${current.status}): ${(await current.text()).slice(0, 300)}`);
  const domains: string[] = ((await current.json()) as { authorizedDomains?: string[] }).authorizedDomains ?? [];

  if (!domain) {
    console.log(`Authorized domains for ${projectId}:\n${domains.map((d) => `  • ${d}`).join("\n")}`);
    return;
  }
  if (domains.includes(domain)) {
    console.log(`= ${domain} is already authorized.`);
    return;
  }
  const res = await fetch(`${url}?updateMask=authorizedDomains`, { method: "PATCH", headers, body: JSON.stringify({ authorizedDomains: [...domains, domain] }) });
  if (!res.ok) throw new Error(`Updating auth config failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  console.log(`✔ ${domain} added to authorized domains for ${projectId}.`);
}

main().catch((e) => {
  console.error(`✖ ${(e as Error).message}`);
  process.exit(1);
});
