// Web Push implementation for Cloudflare Workers
// Using Web Crypto API for VAPID signing

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
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Generate VAPID JWT token
async function generateVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string,
  publicKeyBase64: string
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes.buffer.slice(privateKeyBytes.byteOffset, privateKeyBytes.byteOffset + privateKeyBytes.byteLength),
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

  // Convert signature from DER to raw format (64 bytes)
  const signatureBytes = new Uint8Array(signature);
  const signatureB64 = uint8ArrayToBase64Url(signatureBytes);

  return `${unsignedToken}.${signatureB64}`;
}

// Generate encryption keys for push payload
async function generateEncryptionKeys(
  p256dh: string,
  auth: string
): Promise<{
  localPublicKey: Uint8Array;
  salt: Uint8Array;
  sharedSecret: CryptoKey;
}> {
  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlToUint8Array(p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes.buffer.slice(subscriberPublicKeyBytes.byteOffset, subscriberPublicKeyBytes.byteOffset + subscriberPublicKeyBytes.byteLength),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPublicKeyExported = await crypto.subtle.exportKey(
    "raw",
    localKeyPair.publicKey
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const sharedSecretKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HKDF" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return {
    localPublicKey: new Uint8Array(localPublicKeyExported),
    salt,
    sharedSecret: sharedSecretKey,
  };
}

// Simple push notification (without encryption for now, using VAPID only)
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
    const jwt = await generateVapidJwt(
      audience,
      vapidSubject,
      vapidPrivateKey,
      vapidPublicKey
    );

    // Prepare payload
    const payloadString = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(payloadString);

    // Send push notification
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        TTL: "86400",
        Urgency: "high",
      },
      body: payloadBytes,
    });

    if (!response.ok) {
      console.error(`Push failed: ${response.status} ${await response.text()}`);
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
    // Get all subscriptions
    const query = excludeUserId
      ? `SELECT * FROM push_subscriptions WHERE user_id != ?`
      : `SELECT * FROM push_subscriptions`;

    const stmt = excludeUserId
      ? db.prepare(query).bind(excludeUserId)
      : db.prepare(query);

    const { results } = await stmt.all() as {
      results: Array<{ user_id: number; endpoint: string; p256dh: string; auth: string }>
    };

    if (!results || results.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Send to each subscriber
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
        // Optionally remove invalid subscriptions
        // await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(sub.endpoint).run();
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
