const { google } = require("googleapis");

// Create Google Drive client (read-only)
async function getDrive() {
  let auth;
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // Preferred for Vercel: set full JSON key in env var
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const creds = typeof raw === "string" ? JSON.parse(raw) : raw;
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        // Vercel stores newlines escaped; fix them
        private_key: (creds.private_key || "").replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  } else {
    // Local fallback: use a key file alongside the function
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || "service-account.json";
    auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  }

  const client = await auth.getClient();
  const drive = google.drive({ version: "v3", auth: client });
  drive._authClient = client;
  return drive;
}

module.exports = { getDrive };
