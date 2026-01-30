// Web Push implementation for Cloudflare Workers
// Using Web Crypto API for VAPID signing and payload encryption (RFC 8291)

// D1Database type for Cloudflare Workers
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all(): Promise<{ results: unknown[] }>;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Concatenate Uint8Arrays
function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Convert Uint8Array to ArrayBuffer (fixes TypeScript type issues)
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

// HKDF extract and expand
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const saltBuffer = salt.length ? toBuffer(salt) : new ArrayBuffer(32);
  const key = await crypto.subtle.importKey(
    "raw",
    saltBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const prk = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, toBuffer(ikm))
  );

  const prkKey = await crypto.subtle.importKey(
    "raw",
    toBuffer(prk),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const infoWithCounter = concatUint8Arrays(info, new Uint8Array([1]));
  const okm = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkKey, toBuffer(infoWithCounter))
  );

  return okm.slice(0, length);
}

// Create info for HKDF
function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const header = new TextEncoder().encode("Content-Encoding: ");
  const nul = new Uint8Array([0]);

  return concatUint8Arrays(header, typeBytes, nul, context);
}

// Convert raw 32-byte EC private key to PKCS8 DER format
function rawPrivateKeyToPkcs8(rawKey: Uint8Array): Uint8Array {
  // PKCS8 wrapper for EC P-256 private key
  // SEQUENCE { version, AlgorithmIdentifier { ecPublicKey, P-256 }, OCTET STRING { ECPrivateKey } }
  const pkcs8Header = new Uint8Array([
    0x30, 0x41, // SEQUENCE, 65 bytes
    0x02, 0x01, 0x00, // INTEGER version = 0
    0x30, 0x13, // SEQUENCE AlgorithmIdentifier
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ecPublicKey
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID P-256
    0x04, 0x27, // OCTET STRING, 39 bytes
    0x30, 0x25, // SEQUENCE ECPrivateKey
    0x02, 0x01, 0x01, // INTEGER version = 1
    0x04, 0x20, // OCTET STRING, 32 bytes (private key follows)
  ]);
  return concatUint8Arrays(pkcs8Header, rawKey);
}

// Generate VAPID JWT token
async function generateVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const headerB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key - convert raw 32 bytes to PKCS8
  const privateKeyRaw = base64UrlToUint8Array(privateKeyBase64);
  const privateKeyPkcs8 = rawPrivateKeyToPkcs8(privateKeyRaw);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    toBuffer(privateKeyPkcs8),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signature);
  const signatureB64 = uint8ArrayToBase64Url(signatureBytes);

  return `${unsignedToken}.${signatureB64}`;
}

// Encrypt payload using aes128gcm (RFC 8291)
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);

  // Generate local key pair for ECDH
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  ) as CryptoKeyPair;

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlToUint8Array(p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    toBuffer(subscriberPublicKeyBytes),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret using ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Export local public key
  const localPublicKeyExported = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyExported);

  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Get auth secret
  const authSecret = base64UrlToUint8Array(auth);

  // Build key_info for HKDF: "WebPush: info" || 0x00 || ua_public || as_public
  const keyInfoHeader = new TextEncoder().encode("WebPush: info\0");
  const keyInfo = concatUint8Arrays(keyInfoHeader, subscriberPublicKeyBytes, localPublicKey);

  // Derive IKM using auth secret
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);

  // Context for CEK and nonce
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");

  // Derive CEK (Content Encryption Key) - 16 bytes for AES-128
  const cek = await hkdf(salt, ikm, cekInfo, 16);

  // Derive nonce - 12 bytes
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  // Import CEK for AES-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    toBuffer(cek),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding: 1 byte delimiter (0x02) + payload
  const paddedPayload = concatUint8Arrays(payloadBytes, new Uint8Array([2]));

  // Encrypt with AES-GCM
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toBuffer(nonce) },
    aesKey,
    toBuffer(paddedPayload)
  );
  const encryptedContent = new Uint8Array(encryptedBuffer);

  // Build aes128gcm header: salt (16) || rs (4) || idlen (1) || keyid (65 for P-256 uncompressed)
  const rs = new Uint8Array([0, 0, 16, 0]); // Record size: 4096 in big endian
  const idlen = new Uint8Array([65]); // Key ID length (uncompressed P-256 public key)

  const header = concatUint8Arrays(salt, rs, idlen, localPublicKey);
  const encrypted = concatUint8Arrays(header, encryptedContent);

  return { encrypted, salt, localPublicKey };
}

// Send push notification with encryption
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;

    // Generate VAPID JWT
    const jwt = await generateVapidJwt(audience, vapidSubject, vapidPrivateKey);

    // Encrypt the payload
    const payloadString = JSON.stringify(payload);
    const { encrypted } = await encryptPayload(
      payloadString,
      subscription.p256dh,
      subscription.auth
    );

    // Send push notification
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Content-Length": encrypted.length.toString(),
        Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        TTL: "86400",
        Urgency: "high",
      },
      body: toBuffer(encrypted),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed: ${response.status} - ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending push:", error);
    return false;
  }
}

// Send notification to all subscribers
export async function sendPushToAll(
  db: D1Database,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string,
  excludeUserId?: number
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    const query = excludeUserId
      ? `SELECT * FROM push_subscriptions WHERE user_id != ?`
      : `SELECT * FROM push_subscriptions`;

    const stmt = excludeUserId
      ? db.prepare(query).bind(excludeUserId)
      : db.prepare(query);

    const { results } = (await stmt.all()) as {
      results: Array<{ user_id: number; endpoint: string; p256dh: string; auth: string }>;
    };

    if (!results || results.length === 0) {
      return { sent: 0, failed: 0 };
    }

    for (const sub of results) {
      const success = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );

      if (success) {
        sent++;
      } else {
        failed++;
      }
    }
  } catch (error) {
    console.error("Error sending push to all:", error);
  }

  return { sent, failed };
}

// Helper to create notification payloads
export const createNotification = {
  newVehicle: (vehicle: { year?: number; make?: string; model?: string; user_name?: string }) => ({
    title: "🚗 Nuevo Vehículo",
    body: `${vehicle.user_name || "Alguien"} agregó: ${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.trim(),
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "new-vehicle",
    url: "/",
  }),

  statusChange: (vehicle: { year?: number; make?: string; model?: string; status: string; user_name?: string }) => ({
    title: "🔄 Cambio de Estado",
    body: `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""} → ${vehicle.status}`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "status-change",
    url: "/",
  }),

  vehicleDeleted: (vehicle: { year?: number; make?: string; model?: string; user_name?: string }) => ({
    title: "🗑️ Vehículo Eliminado",
    body: `${vehicle.user_name || "Alguien"} eliminó: ${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.trim(),
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "vehicle-deleted",
    url: "/",
  }),

  newUser: (user: { name: string }) => ({
    title: "👤 Nuevo Usuario",
    body: `${user.name} se registró y espera aprobación`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "new-user",
    url: "/admin",
  }),

  roleChanged: (user: { name: string; role: string }) => ({
    title: "✅ Rol Actualizado",
    body: `Tu rol ha sido cambiado a: ${user.role}`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "role-changed",
    url: "/config",
  }),
};
