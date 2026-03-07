import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Send a Telegram message ───────────────────────────────────────────────────
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Format form data into a readable Telegram message ────────────────────────
function formatMessage(body, source) {
  const time = new Date().toUTCString();
  const fields = Object.entries(body)
    .map(([k, v]) => `  • <b>${k}:</b> ${v}`)
    .join("\n");

  return (
    `🔔 <b>New Form Submission</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${fields}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🌐 <i>Source: ${source || "unknown"}</i>\n` +
    `🕐 <i>${time}</i>`
  );
}

// ── POST /notify  (called by the snippet on your website) ────────────────────
app.post("/notify", async (req, res) => {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ error: "Bot token or chat ID not configured." });
    }

    const body   = req.body;
    const source = req.headers["origin"] || req.headers["referer"] || "";

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: "Empty form data." });
    }

    await sendTelegramMessage(formatMessage(body, source));
    res.json({ success: true });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", message: "Telegram notifier is running 🚀" }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
