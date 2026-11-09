// Test-only helpers: a throwaway RSA key generated at runtime (no key is ever committed) and a fake Google.
import { generateKeyPairSync } from "node:crypto";

export const TEST_EMAIL = "stats-reader@test-project.iam.gserviceaccount.com";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
export const TEST_PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
export const TEST_PUBLIC = publicKey;
export const testServiceAccountJson = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ type: "service_account", project_id: "test-project", client_email: TEST_EMAIL, private_key: TEST_PEM, ...over });

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export type Call = { url: string; init?: RequestInit; body?: unknown };

/** Fake fetch: answers the token endpoint, then delegates API calls to `api`. Records every call. */
export function fakeGoogle(api: (url: string, body: unknown) => Response, token: Response | (() => Response) = json(200, { access_token: "ya29.test-token", expires_in: 3600 })) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    const raw = typeof init?.body === "string" ? init.body : undefined;
    if (url === "https://oauth2.googleapis.com/token") {
      calls.push({ url, init, body: raw });
      return typeof token === "function" ? token() : token.clone();
    }
    const body = raw ? JSON.parse(raw) : undefined;
    calls.push({ url, init, body });
    return api(url, body);
  };
  return { calls, fetchImpl };
}
