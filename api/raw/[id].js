// api/raw/[id].js
// Returns the RAW plain-text content of an uploaded file, straight from
// Firestore — no HTML, no JS shell. This is what Roblox's HttpGet() (and
// curl, wget, etc.) should hit, since they can't execute the client-side
// Firebase SDK that raw.html relies on.
//
// Reads via the Firestore REST API (no firebase-admin / service account
// needed) because firestore.rules already allows public read on /files/{id}.

const PROJECT_ID = "zeoxxyz";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Convert a Firestore REST "fields" object into a plain JS object.
function parseFirestoreFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if ("stringValue" in value) out[key] = value.stringValue;
    else if ("integerValue" in value) out[key] = parseInt(value.integerValue, 10);
    else if ("doubleValue" in value) out[key] = value.doubleValue;
    else if ("booleanValue" in value) out[key] = value.booleanValue;
    else if ("timestampValue" in value) out[key] = value.timestampValue;
    else if ("nullValue" in value) out[key] = null;
    else out[key] = value; // fallback: leave raw
  }
  return out;
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    res.status(400).send("Missing file id.");
    return;
  }

  try {
    const resp = await fetch(`${FIRESTORE_BASE}/files/${id}`);

    if (resp.status === 404) {
      res.status(404).send("File not found. It may have been deleted or the link is invalid.");
      return;
    }

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("Firestore REST error:", resp.status, errBody);
      res.status(502).send("Failed to fetch file from storage.");
      return;
    }

    const doc = await resp.json();
    const data = parseFirestoreFields(doc.fields);

    // Optional expiry check (expiresAt is stored as a JS Date -> timestampValue)
    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      res.status(410).send("This file has expired.");
      return;
    }

    const content = data.content || "";

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    // Allow Roblox / any external caller to fetch this cross-origin.
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Don't cache — files can be deleted at any time.
    res.setHeader("Cache-Control", "no-store");

    res.status(200).send(content);
  } catch (err) {
    console.error("Error in /api/raw/[id]:", err);
    res.status(500).send("Internal server error.");
  }
}
