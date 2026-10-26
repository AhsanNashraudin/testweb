/* eslint-disable */
// @ts-nocheck
export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════
//  TD FRAM VIP — Movie & Short-Drama Streaming Web App (Cloudflare Worker + PWA)
//  - ครบทั้ง 11 ค่ายหนัง & ซีรีส์สั้น + ทีวีสด Live TV HD
//  - ล็อกคีย์เดียวกับ TD FRAM VIP (อนุญาตเฉพาะคีย์ถาวร Lifetime VIP /999 เท่านั้น!)
//  - ต้นทุนเซิร์ฟเวอร์ 0 บาท (Cloudflare Workers Free Tier + Zero-Storage HLS Proxy)
// ════════════════════════════════════════════════════════════════════════════

const LICENSE_VERIFY_URL = "https://license-manager.psmdee56.workers.dev/api/verify";
const DAT_BASE = "https://digitalallthings.online/drama-api";
const DAT_REF = "https://digitalallthings.online/drama";
const NETSHORT_BASE = "https://netshort.goodbos.online";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const LIVE_TV_CHANNELS = [
  { id: "ch3hd", title: "ช่อง 3 HD (33) — ข่าว & ละครสด", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Channel_3_HD_Thailand_Logo.svg/400px-Channel_3_HD_Thailand_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/3hd/3hd.m3u8" },
  { id: "ch7hd", title: "ช่อง 7 HD (35) — ละคร & กีฬาสด", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/BBTV_Channel_7_HD_Logo.svg/400px-BBTV_Channel_7_HD_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/7hd/7hd.m3u8" },
  { id: "workpoint", title: "Workpoint TV (23) — วาไรตี้เกมโชว์", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Workpoint_TV_logo.svg/400px-Workpoint_TV_logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/workpoint/workpoint.m3u8" },
  { id: "one31", title: "ช่องวัน One31 (31) — ละครดัง & ซีรีส์", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/One_31_logo.svg/400px-One_31_logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/onehd/onehd.m3u8" },
  { id: "mono29", title: "MONO 29 (29) — หนังดีซีรีส์ดัง 24 ชม.", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Mono_29_Logo.png/400px-Mono_29_Logo.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/mono/mono.m3u8" },
  { id: "thairath", title: "ไทยรัฐทีวี Thairath TV (32)", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Thairath_TV_Logo.svg/400px-Thairath_TV_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/thairath/thairath.m3u8" },
  { id: "amarin", title: "อมรินทร์ทีวี Amarin TV (34)", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Amarin_TV_Logo.svg/400px-Amarin_TV_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/amarin/amarin.m3u8" },
  { id: "gmm25", title: "GMM 25 (25) — ซีรีส์วัยรุ่น & บันเทิง", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/GMM_25_Logo.svg/400px-GMM_25_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/gmm/gmm.m3u8" },
  { id: "ch8", title: "ช่อง 8 (27) — มวยสด & ละครเข้มข้น", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Channel_8_Thailand_logo.svg/400px-Channel_8_Thailand_logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/ch8/ch8.m3u8" },
  { id: "pptv36", title: "PPTV HD (36) — ฟุตบอลสด & กีฬา", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/PPTV_HD_36_Logo.svg/400px-PPTV_HD_36_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/pptv/pptv.m3u8" },
  { id: "mcot9", title: "ช่อง 9 MCOT HD (30)", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/MCOT_HD_logo.svg/400px-MCOT_HD_logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/mcot/mcot.m3u8" },
  { id: "thaipbs", title: "Thai PBS (3) — สารคดี & ข่าวคุณภาพ", category: "thai_digital", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Thai_PBS_logo.svg/400px-Thai_PBS_logo.svg.png", m3u8: "https://thaipbs-live.cdn.byteark.com/live/playlist_1080p/index.m3u8" },
  { id: "tnn16", title: "TNN 16 — ข่าวเศรษฐกิจ & โลก 24 ชม.", category: "news_sport", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/TNN16_Logo.png/400px-TNN16_Logo.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/tnn/tnn.m3u8" },
  { id: "nation22", title: "Nation TV (22) — เกาะติดข่าวด่วน", category: "news_sport", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Nation_TV_Logo.svg/400px-Nation_TV_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/nation/nation.m3u8" },
  { id: "true4u", title: "True4U (24) — กีฬาสด & ภาพยนตร์ไทย", category: "news_sport", sound: "สด 24 ชม.", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/True4U_Logo.svg/400px-True4U_Logo.svg.png", m3u8: "https://lb1-live-mv.v2h-cdn.com/hls/ffae/true4u/true4u.m3u8" },
  { id: "redbulltv", title: "Red Bull TV — เอ็กซ์ตรีม & กีฬาโลก", category: "inter_doc", sound: "Live Global", quality: "1080p FHD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Red_Bull_TV_logo.svg/400px-Red_Bull_TV_logo.svg.png", m3u8: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_3360.m3u8" },
  { id: "nasatv", title: "NASA TV Public — สดจากสถานีอวกาศ", category: "inter_doc", sound: "Live Space", quality: "1080p HD", poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/400px-NASA_logo.svg.png", m3u8: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8" }
];

function corsHeaders(extra = {}) {
  return Object.assign({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-License-Key, X-Hwid"
  }, extra);
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })
  });
}

function decodeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim();
}

async function httpGet(url, referer = "", timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
      "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7"
    };
    if (referer) headers["Referer"] = referer;
    const res = await fetch(url, { headers, signal: ctrl.signal, redirect: "follow" });
    const text = await res.text();
    return { status: res.status, headers: res.headers, text };
  } finally {
    clearTimeout(timer);
  }
}

async function httpPostForm(url, bodyStr, referer = "", extraHeaders = {}) {
  const headers = Object.assign({
    "User-Agent": UA,
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
  }, extraHeaders);
  if (referer) headers["Referer"] = referer;
  const res = await fetch(url, { method: "POST", headers, body: bodyStr });
  return await res.text();
}

async function httpPostJson(url, obj, referer = "") {
  const headers = {
    "User-Agent": UA,
    "Content-Type": "application/json; charset=UTF-8"
  };
  if (referer) headers["Referer"] = referer;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(obj) });
  return await res.json();
}

function extractNextDataJson(html) {
  if (!html) return null;
  const idIdx = html.indexOf("__NEXT_DATA__");
  if (idIdx < 0) return null;
  const tagEnd = html.indexOf(">", idIdx);
  if (tagEnd < 0) return null;
  const scriptEnd = html.indexOf("</script>", tagEnd + 1);
  if (scriptEnd < 0) return null;
  try { return JSON.parse(html.slice(tagEnd + 1, scriptEnd).trim()); } catch (_) { return null; }
}

function extractBalancedJson(html, marker) {
  const i = html.indexOf(marker);
  if (i < 0) return null;
  const st = html.indexOf("{", i);
  if (st < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let k = st; k < html.length; k++) {
    const c = html[k];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(st, k + 1)); } catch (_) { return null; }
      }
    }
  }
  return null;
}

// Pure JS MD5 for 1112HDC RC4 key derivation
function md5Hex(str) {
  function cmn(q, a, b, x, s, t) {
    a = (((a + q) | 0) + ((x + t) | 0)) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = (a + x[0]) | 0; x[1] = (b + x[1]) | 0; x[2] = (c + x[2]) | 0; x[3] = (d + x[3]) | 0;
  }
  const bytes = new TextEncoder().encode(str);
  const n = bytes.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  const tail = new Int32Array(16);
  let i = 0;
  for (; i + 64 <= n; i += 64) {
    const blk = new Int32Array(16);
    for (let j = 0; j < 64; j++) blk[j >> 2] |= bytes[i + j] << ((j & 3) << 3);
    md5cycle(state, blk);
  }
  for (let j = 0; i + j < n; j++) tail[j >> 2] |= bytes[i + j] << ((j & 3) << 3);
  const rem = n - i;
  tail[rem >> 2] |= 0x80 << ((rem & 3) << 3);
  if (rem > 55) {
    md5cycle(state, tail);
    tail.fill(0);
  }
  tail[14] = n * 8;
  md5cycle(state, tail);
  const hex = "0123456789abcdef";
  let out = "";
  for (let s = 0; s < 4; s++) {
    for (let b = 0; b < 4; b++) {
      const v = (state[s] >> (b * 8)) & 0xFF;
      out += hex[(v >> 4) & 0xF] + hex[v & 0xF];
    }
  }
  return out;
}

function decrypt1112Meta(base64Input, postId) {
  const keyHex = md5Hex(postId + "_cj_s3cur3_pl@y3r_2026");
  const keyBytes = new TextEncoder().encode(keyHex);
  const binStr = atob(base64Input.trim());
  const raw = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) raw[i] = binStr.charCodeAt(i);

  const s = new Int32Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + keyBytes[i % keyBytes.length]) & 0xFF;
    const t = s[i]; s[i] = s[j]; s[j] = t;
  }
  const out = new Uint8Array(raw.length);
  let i = 0, k = 0;
  for (let x = 0; x < raw.length; x++) {
    i = (i + 1) & 0xFF;
    k = (k + s[i]) & 0xFF;
    const t = s[i]; s[i] = s[k]; s[k] = t;
    out[x] = raw[x] ^ s[(s[i] + s[k]) & 0xFF];
  }
  return JSON.parse(new TextDecoder().decode(out));
}

// ════════════════════════════════════════════════════════════════════════════
//  1. ตรวจสอบคีย์ TD FRAM VIP (รองรับทุกคีย์ตามระยะเวลาที่เหลือ + คีย์ถาวร)
// ════════════════════════════════════════════════════════════════════════════
function formatRemainingDurationTh(remMs) {
  if (remMs <= 0) return "หมดอายุแล้ว";
  const totalMin = Math.floor(remMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `เหลือ ${days} วัน ${hours} ชม.`;
  if (hours > 0) return `เหลือ ${hours} ชม. ${mins} นาที`;
  return `เหลือ ${ Math.max(1, mins) } นาที`;
}

async function verifyPermanentLicense(key, hwid, userAgent = "") {
  const cleanKey = String(key || "").trim().toUpperCase();
  const cleanHwid = String(hwid || "").trim().toUpperCase();
  if (!cleanKey || !cleanHwid) {
    return { success: false, reason: "empty", message: "⚠️ กรุณากรอก License Key ของ TD FRAM VIP" };
  }
  try {
    const r = await fetch(LICENSE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": UA },
      body: JSON.stringify({
        license_key: cleanKey,
        hwid: cleanHwid,
        client: {
          ver: "9.2.87-WEB",
          os: "Web App PWA",
          arch: "web",
          host: userAgent ? userAgent.slice(0, 48) : "TD-FRAM-WebApp",
          cpu: "Browser Engine",
          ramGb: 4
        }
      })
    });
    const d = await r.json();
    const apiValid = !!d.valid;
    const reason = d.reason || "";
    const expiresAt = d.expires_at || null;
    const hasExpiry = expiresAt !== null && String(expiresAt).trim() !== "" && String(expiresAt).toLowerCase() !== "null";
    const isLifetime = d.lifetime === true || (!hasExpiry && d.lifetime !== false);

    if (apiValid) {
      if (isLifetime && !hasExpiry) {
        return {
          success: true,
          lifetime: true,
          expiresAt: null,
          expiresAtMs: 0,
          remainingMs: null,
          remainingText: "♾ ตลอดชีพ VIP",
          key: cleanKey,
          hwid: cleanHwid,
          message: "✅ ยืนยันคีย์ถาวร (Lifetime VIP) สำเร็จ! เปิดใช้งานได้ตลอดชีพ"
        };
      }
      const expMs = new Date(expiresAt).getTime();
      const remMs = expMs - Date.now();
      if (isNaN(expMs) || remMs <= 0) {
        return {
          success: false,
          lifetime: false,
          reason: "expired",
          message: "⌛ License Key นี้หมดเวลาใช้งานแล้ว — กรุณาต่ออายุหรือใช้คีย์ใหม่"
        };
      }
      const remText = formatRemainingDurationTh(remMs);
      return {
        success: true,
        lifetime: false,
        expiresAt: expiresAt,
        expiresAtMs: expMs,
        remainingMs: remMs,
        remainingText: "⏳ " + remText,
        key: cleanKey,
        hwid: cleanHwid,
        message: "✅ ยืนยันคีย์สำเร็จ! ใช้งานได้ตามเวลาที่เหลือ (" + remText + ")"
      };
    }

    const msgMap = {
      expired: "⌛ License Key นี้หมดอายุแล้ว — กรุณาต่ออายุคีย์เพื่อรับชมต่อ",
      invalid_hwid: "❌ คีย์นี้ถูกผูกไว้กับอุปกรณ์อื่นแล้ว (HWID ไม่ตรง) — ส่ง HWID ด้านบนให้ผู้ขายเพื่อ Reset HWID",
      revoked: "⛔ License Key นี้ถูกระงับการใช้งาน (Revoked) — กรุณาติดต่อผู้ขาย",
      not_found: "❌ ไม่พบ License Key นี้ในระบบ TD FRAM VIP — กรุณาตรวจสอบการพิมพ์อีกครั้ง"
    };
    return {
      success: false,
      lifetime: false,
      reason: reason || "invalid",
      message: msgMap[reason] || ("❌ " + (d.message || "License Key ไม่ถูกต้อง"))
    };
  } catch (e) {
    return {
      success: false,
      reason: "network_error",
      message: "⚠️ ไม่สามารถติดต่อเซิร์ฟเวอร์ตรวจคีย์ได้: " + e.message
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  2. ดึงรายการหนังทั้ง 11 ค่าย + ทีวีสด (Exact MovieApiEngine Logic)
// ════════════════════════════════════════════════════════════════════════════
async function fetchStudioCatalog(source, category, search, page, thaiOnly) {
  const p = Math.max(1, Number(page) || 1);
  let res = { page: p, totalPages: 1, items: [] };

  try {
    if (source === "livetv") {
      res.items = LIVE_TV_CHANNELS.filter(ch => {
        if (category && ch.category !== category) return false;
        if (search && !ch.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }).map(ch => ({ ...ch, source: "livetv", isSeries: false }));
    } else if (source === "movie911") {
      res = await fetchMovie911List(category, search, p);
    } else if (source === "1112hdc") {
      res = await fetch1112List(category, search, p);
    } else if (source === "rongyok") {
      res = await fetchRongyokList(category, search, p);
    } else if (source === "melolo") {
      res = await fetchDatCatalog("melolo", search, p);
    } else if (source === "netshort") {
      res = await fetchNetshortList(category, search, p);
    } else if (source === "dramabox") {
      res = await fetchDatCatalog("dramabox", search, p);
    } else if (source === "goodshort") {
      res = await fetchGoodshortList(search, p);
    } else if (source === "moboreels") {
      res = await fetchMoboreelsList(p);
    } else if (source === "reelshort") {
      res = await fetchReelshortList(p);
    } else if (source === "kahiri") {
      res = await fetchKahiriList(category, search, p);
    } else if (source === "24hda") {
      res = await fetch24HdaList(search, p);
    }
  } catch (e) {
    res.error = e.message;
  }

  if (thaiOnly && res.items && res.items.length) {
    const filtered = res.items.filter(m => {
      const snd = String(m.sound || "").toLowerCase();
      const ttl = String(m.title || "").toLowerCase();
      return !snd || snd.includes("ไทย") || snd.includes("thai") || ttl.includes("พากย์");
    });
    if (filtered.length) res.items = filtered;
  }
  return res;
}

async function fetchMovie911List(category, search, page) {
  const items = [];
  if (search) {
    const { text } = await httpGet(`https://movie911hd.com/wp-admin/admin-ajax.php?action=movie_search_ajax&q=${encodeURIComponent(search)}`, "https://movie911hd.com/");
    const arr = JSON.parse(text);
    for (const it of (arr || [])) {
      const itemUrl = it.url || "";
      const slug = itemUrl.replace("https://movie911hd.com/", "").replace(/\/$/, "");
      items.push({
        id: slug, slug, url: itemUrl,
        title: decodeHtml(it.title || slug),
        poster: it.thumb || "",
        source: "movie911", sound: "พากย์ไทย", quality: "HD", isSeries: false
      });
    }
    return { page: 1, totalPages: 1, items };
  }
  const url = category
    ? (page > 1 ? `https://movie911hd.com/${category}/page/${page}/` : `https://movie911hd.com/${category}/`)
    : (page > 1 ? `https://movie911hd.com/page/${page}/` : "https://movie911hd.com/");
  const { text: html } = await httpGet(url, "https://movie911hd.com/");
  const seen = new Set();
  const artRe = /<article class="cg-film"[^>]*>([\s\S]*?)<\/article>/gi;
  let m;
  while ((m = artRe.exec(html)) !== null) {
    const block = m[0];
    const hm = /href="(https:\/\/movie911hd\.com\/[^"]+)"/.exec(block);
    if (!hm) continue;
    const itemUrl = hm[1];
    const slug = itemUrl.replace("https://movie911hd.com/", "").replace(/\/$/, "");
    if (seen.has(slug)) continue;
    seen.add(slug);
    const tm = /title="([^"]+)"/.exec(block);
    const im = /(?:data-lazy-src|data-src|src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i.exec(block);
    const qm = /cg-label-(?:hd|cam)">([^<]+)<\/span>/i.exec(block);
    const aum = /cg-film-sub">([^<]+)<\/div>/.exec(block);
    items.push({
      id: slug, slug, url: itemUrl,
      title: decodeHtml(tm ? tm[1] : slug),
      poster: im ? im[1] : "",
      source: "movie911",
      quality: qm ? qm[1].trim() : "HD",
      sound: aum ? decodeHtml(aum[1].trim()) : "พากย์ไทย",
      isSeries: false
    });
  }
  return { page, totalPages: items.length >= 16 ? page + 1 : page, items };
}

async function fetch1112List(cat, search, page) {
  const catMap = { movies: 12, series_cn: 8, series_kr: 3, series_us: 9, series_th: 15, series_new: 22 };
  let url = `https://1112hdc.com/wp-json/wp/v2/posts?per_page=24&page=${page}`;
  if (catMap[cat]) url += `&categories=${catMap[cat]}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const resp = await httpGet(url, "https://1112hdc.com/");
  if (resp.status >= 400) return { page, totalPages: 1, items: [] };
  const totalPages = parseInt(resp.headers.get("x-wp-totalpages") || "1", 10) || 1;
  const posts = JSON.parse(resp.text);
  const items = [];
  for (const p of (posts || [])) {
    const title = decodeHtml(p.title && p.title.rendered);
    let poster = "";
    if (p.yoast_head_json && p.yoast_head_json.og_image && p.yoast_head_json.og_image[0]) {
      poster = p.yoast_head_json.og_image[0].url || "";
    }
    if (!poster && p.content && p.content.rendered) {
      const im = /<img[^>]+src=["']([^"']+)["']/i.exec(p.content.rendered);
      if (im) poster = im[1];
    }
    const isMovie = Array.isArray(p.categories) && p.categories.includes(12);
    items.push({
      id: String(p.id),
      title, poster, source: "1112hdc", quality: "1080p",
      sound: title.includes("ซับไทย") && !title.includes("พากย์ไทย") ? "ซับไทย" : "พากย์ไทย",
      isSeries: !isMovie
    });
  }
  return { page, totalPages, items };
}

async function fetchRongyokList(cat, search, page) {
  let catId = 9;
  if (cat === "thai-dub") catId = 8;
  else if (cat === "thai-sub") catId = 3;
  let url = `https://www.rongyok.tv/wp-json/wp/v2/posts?per_page=24&page=${page}&categories=${catId}&_embed=wp:featuredmedia&_fields=id,slug,title,date,_links,_embedded`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const resp = await httpGet(url, "https://www.rongyok.tv/");
  if (resp.status >= 400) return { page, totalPages: 1, items: [] };
  const totalPages = parseInt(resp.headers.get("x-wp-totalpages") || "1", 10) || 1;
  const arr = JSON.parse(resp.text);
  const items = [];
  const seen = new Set();
  for (const p of (arr || [])) {
    const sm = /series-(\d+)(?:-(thai-dub|thai-sub))?/.exec(p.slug || "");
    if (!sm) continue;
    const seriesId = sm[1];
    if (seen.has(seriesId)) continue;
    seen.add(seriesId);
    let cover = "";
    try {
      const fm = p._embedded["wp:featuredmedia"][0];
      cover = (fm.media_details && fm.media_details.sizes && fm.media_details.sizes.medium && fm.media_details.sizes.medium.source_url) || fm.source_url || "";
    } catch (_) {}
    const title = decodeHtml(p.title && p.title.rendered);
    items.push({
      id: seriesId, title, poster: cover, source: "rongyok",
      sound: (sm[2] === "thai-dub" || title.includes("พากย์ไทย")) ? "พากย์ไทย" : "ซับไทย",
      quality: "MP4", isSeries: true
    });
  }
  return { page, totalPages, items };
}

async function fetchDatCatalog(categoryP, search, page) {
  const ep = search ? "search" : "home";
  const qs = `?endpoint=${ep}&category_p=${categoryP}&lang=th` + (search ? `&q=${encodeURIComponent(search)}` : "");
  const { text } = await httpGet(DAT_BASE + qs, DAT_REF);
  const j = JSON.parse(text);
  const raw = Array.isArray(j.data) ? j.data : (j.data && Array.isArray(j.data.data) ? j.data.data : []);
  const items = [];
  for (const o of (raw || [])) {
    const id = String(o.bookId || o.id || "").trim();
    const title = String(o.title || o.name || o.bookName || "").trim();
    if (!id || !title) continue;
    items.push({
      id, title,
      poster: o.cover || o.poster || o.coverWap || "",
      source: categoryP,
      sound: title.includes("พากย์") ? "พากย์ไทย" : "ซับไทย",
      quality: "720p HD",
      isSeries: true
    });
  }
  return { page, totalPages: 1, items };
}

async function fetchNetshortList(audioCat, search, page) {
  if (search) {
    const { text } = await httpGet(`${NETSHORT_BASE}/api/search?q=${encodeURIComponent(search)}&page=${page}&lang=th`, NETSHORT_BASE + "/");
    const j = JSON.parse(text);
    const raw = (j.data && (j.data.searchCodeSearchResult || j.data.shortPlaySearchResults)) || [];
    return { page: 1, totalPages: 1, items: raw.map(parseNetshortItem).filter(Boolean) };
  }
  const ep = audioCat === "1" ? `/api/list?page=${page}&lang=th&audio=1` : `/api/list?page=${page}&lang=th&audio=2`;
  const { text } = await httpGet(NETSHORT_BASE + ep, NETSHORT_BASE + "/");
  const j = JSON.parse(text);
  const raw = (j.data && (j.data.dataList || j.data.contentInfos)) || [];
  return { page, totalPages: raw.length >= 10 ? page + 1 : page, items: raw.map(parseNetshortItem).filter(Boolean) };
}

function parseNetshortItem(o) {
  if (!o) return null;
  const id = String(o.shortPlayId || o.id || "").trim();
  const title = decodeHtml(o.shortPlayName || o.title || "");
  if (!id || !title) return null;
  return {
    id, title,
    poster: o.shortPlayCover || o.coverUrl || "",
    source: "netshort",
    sound: "พากย์ไทย",
    quality: "MP4",
    isSeries: true
  };
}

async function fetchGoodshortList(keyword, page) {
  try {
    const j = await httpPostJson("https://www.goodshort.com/hwycreels/genres/search", {
      keyword: (!keyword && page === 1) ? "a" : keyword,
      pageNo: page,
      pageSize: 24
    }, "https://www.goodshort.com/");
    const books = (j.data && j.data.books) || {};
    const records = books.records || [];
    const items = records.map(b => ({
      id: String(b.bookId || ""),
      title: b.bookName || "GoodShort",
      poster: b.cover || "",
      source: "goodshort",
      sound: "ซับ/พากย์",
      quality: "HLS",
      isSeries: true
    })).filter(x => x.id);
    if (items.length > 0) {
      return { page, totalPages: Math.max(1, Math.ceil((books.total || 24) / 24)), items };
    }
  } catch (_) {}
  return await fetchDatCatalog("goodshort", keyword, page);
}

async function fetchMoboreelsList(page) {
  const { text: html } = await httpGet("https://www.moboreels.com/dramas", "https://www.moboreels.com/");
  const seen = new Set();
  const all = [];
  const linkRe = /\/drama\/([a-z0-9-]+)/g;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    const title = slug.replace(/-\d+$/, "").split("-").map(w => w ? w[0].toUpperCase() + w.slice(1) : "").join(" ");
    all.push({ id: slug, slug, title, poster: "", source: "moboreels", sound: "Sub/Eng", quality: "MP4", isSeries: true });
  }
  const covRe = /https?:[\\u002F/]+video-cdn3\.cdreader\.com[^"'\s,)]+\.(?:webp|jpg|png)[^"'\s,)]*/g;
  const covers = [];
  while ((m = covRe.exec(html)) !== null) {
    const c = m[0].replace(/\\u002F/g, "/").replace(/\\\\/g, "/");
    if (!covers.includes(c)) covers.push(c);
  }
  all.forEach((it, idx) => { if (covers[idx]) it.poster = covers[idx]; });
  return { page: 1, totalPages: 1, items: all.slice(0, 36) };
}

async function fetchReelshortList(page) {
  const { text: html } = await httpGet("https://reelshort.com", "https://reelshort.com/");
  const nd = extractNextDataJson(html);
  const shelves = nd?.props?.pageProps?.fallback?.["/api/ms/hall/webInfo"]?.bookShelfList || [];
  const seen = new Set();
  const items = [];
  for (const sh of shelves) {
    for (const b of (sh.books || [])) {
      const bid = b.book_id || "";
      if (!bid || seen.has(bid)) continue;
      seen.add(bid);
      const ch = b.chapter_id || "";
      items.push({
        id: ch ? `${bid}:${ch}` : bid,
        title: b.book_title || "ReelShort",
        poster: b.book_pic || b.default_pic || "",
        source: "reelshort",
        sound: "Sub/TH",
        quality: "HD",
        isSeries: true
      });
    }
  }
  return { page: 1, totalPages: 1, items: items.slice(0, 36) };
}

async function fetchKahiriList(catId, search, page) {
  let url = `https://kahirihome.com/wp-json/wp/v2/posts?_embed=1&per_page=24&page=${page}`;
  if (catId && catId !== "0") url += `&categories=${catId}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const resp = await httpGet(url, "https://kahirihome.com/");
  if (resp.status >= 400) return { page, totalPages: 1, items: [] };
  const totalPages = parseInt(resp.headers.get("x-wp-totalpages") || "1", 10) || 1;
  const arr = JSON.parse(resp.text);
  const items = [];
  for (const p of (arr || [])) {
    const m3u8 = (p.meta && p.meta.m3u8) ? String(p.meta.m3u8).trim() : "";
    if (!m3u8) continue;
    const title = decodeHtml(p.title && p.title.rendered);
    let poster = "";
    try { poster = p._embedded["wp:featuredmedia"][0].source_url || ""; } catch (_) {}
    items.push({
      id: String(p.id), title, poster, source: "kahiri",
      sound: (p.meta && p.meta.sound) || (title.includes("ซับไทย") ? "ซับไทย" : "พากย์ไทย"),
      quality: "HLS", m3u8, isSeries: false
    });
  }
  return { page, totalPages, items };
}

async function fetch24HdaList(search, page) {
  const items = [];
  try {
    const url = search
      ? (page > 1 ? `https://www.24-hda.com/search_movie/page/${page}/?keyword=${encodeURIComponent(search)}` : `https://www.24-hda.com/search_movie?keyword=${encodeURIComponent(search)}`)
      : `https://www.24-hda.com/page/${page}/`;
    const { text: html } = await httpGet(url, "https://www.24-hda.com/", {}, 6000);
    const boxRe = /<div class="box"[^>]*>[\s\S]*?<\/a>\s*<\/div>/gi;
    let m;
    while ((m = boxRe.exec(html)) !== null) {
      const block = m[0];
      const um = /href="(https?:\/\/www\.24-hda\.com\/([^/"]+)\/?)"/.exec(block);
      if (!um) continue;
      const slug = um[2];
      const tm = /<div class="p2">([\s\S]*?)<\/div>/.exec(block);
      const im = /(?:data-lazy-src|data-src|src)="([^"]+\.(?:png|jpg|jpeg|webp)[^"]*)"/i.exec(block);
      const infM = /<div class="p1">\s*([\s\S]*?)\s*<\/div>/.exec(block);
      const info = infM ? decodeHtml(infM[1]) : "";
      items.push({
        id: slug, slug, url: um[1],
        title: decodeHtml(tm ? tm[1] : slug),
        poster: im ? im[1] : "",
        source: "24hda",
        sound: info.includes("Sound Track") ? "ซับไทย" : "พากย์ไทย",
        quality: "HD", isSeries: false
      });
    }
  } catch (_) {}
  if (items.length === 0) {
    return await fetchMovie911List(search ? "" : "movie-2025", search, page);
  }
  return { page, totalPages: items.length >= 20 ? page + 1 : page, items };
}

// ════════════════════════════════════════════════════════════════════════════
//  3. ดึงรายละเอียดตอน & แกะสตรีม (Detail & Episode Stream Resolver)
// ════════════════════════════════════════════════════════════════════════════
async function fetchMovieDetail(source, id, url, title, poster, m3u8) {
  if (source === "livetv") {
    const ch = LIVE_TV_CHANNELS.find(c => c.id === id) || LIVE_TV_CHANNELS[0];
    return {
      id: ch.id, title: ch.title, poster: ch.poster, source: "livetv",
      episodes: [{ id: "live", name: "🔴 รับชมสัญญาณสด", index: 0, streamUrl: ch.m3u8, referer: "", needFetch: false }]
    };
  }
  if (source === "kahiri") {
    return {
      id, title, poster, source,
      episodes: [{ id: "1", name: "🎬 เล่นหนังเต็มเรื่อง", index: 0, streamUrl: m3u8 || "", referer: "https://kahirihome.com/", needFetch: false }]
    };
  }
  if (source === "movie911" || source === "24hda") {
    return {
      id, title, poster, source,
      episodes: [{ id: "1", name: "🎬 เล่นหนังเต็มเรื่อง", index: 0, streamUrl: "", embedUrl: url || id, needFetch: true }]
    };
  }
  if (source === "1112hdc") {
    const txt = await httpPostForm("https://1112hdc.com/wp-admin/admin-ajax.php", `action=single_get_videos&post_id=${encodeURIComponent(id)}`, "https://1112hdc.com/", { "X-Requested-With": "XMLHttpRequest" });
    const ajaxJson = JSON.parse(txt);
    const dec = decrypt1112Meta(ajaxJson.data, id);
    const episodes = [];
    const pickSrv = (b) => {
      if (!b) return "";
      for (const k of ["server_1", "server_2", "server_3", "server_4", "backup"]) {
        if (b[k] && b[k].url) return b[k].url.trim();
      }
      for (const v of Object.values(b)) {
        if (v && v.url) return v.url.trim();
      }
      return "";
    };
    if (String(dec.type).toLowerCase() === "series") {
      const vids = (dec.series && dec.series.videos) || {};
      const thList = (vids.th && vids.th.list) || {};
      const subList = (vids.sub && vids.sub.list) || {};
      const keys = Array.from(new Set([...Object.keys(thList), ...Object.keys(subList)])).sort((a, b) => (parseInt(a.replace(/\D/g, ""), 10) || 0) - (parseInt(b.replace(/\D/g, ""), 10) || 0));
      let idx = 0;
      for (const k of keys) {
        const epNum = parseInt(k.replace(/\D/g, ""), 10) || (idx + 1);
        const thU = pickSrv(thList[k]);
        const subU = pickSrv(subList[k]);
        if (thU) episodes.push({ id: `${k}_th`, name: `ตอนที่ ${epNum} (🇹🇭 พากย์ไทย)`, index: idx++, embedUrl: thU, needFetch: true });
        if (subU) episodes.push({ id: `${k}_sub`, name: `ตอนที่ ${epNum} (📝 ซับไทย)`, index: idx++, embedUrl: subU, needFetch: true });
      }
    } else {
      const vids = (dec.movies && dec.movies.videos) || {};
      const thU = pickSrv(vids.th) || pickSrv(vids);
      const subU = pickSrv(vids.sub);
      if (thU) episodes.push({ id: "full_th", name: "🎬 พากย์ไทย (1080p)", index: 0, embedUrl: thU, needFetch: true });
      if (subU) episodes.push({ id: "full_sub", name: "🎬 ซับไทย (1080p)", index: episodes.length, embedUrl: subU, needFetch: true });
    }
    return { id, title, poster, source, episodes };
  }
  if (source === "rongyok") {
    const sid = String(id).replace(/\D/g, "");
    let eps = [];
    let resolvedTitle = title;
    try {
      const { text: html } = await httpGet(`https://www.rongyok.com/watch/?series_id=${sid}`, "https://www.rongyok.tv/");
      const sd = extractBalancedJson(html, "const seriesData") || extractBalancedJson(html, "seriesData =") || {};
      if (sd.title) resolvedTitle = sd.title;
      eps = (sd.episodes || []).map((e, i) => Number(e.episode_number || (i + 1))).sort((a, b) => a - b);
    } catch (_) {}
    if (!eps.length) {
      eps = Array.from({ length: 55 }, (_, i) => i + 1);
    }
    return {
      id: sid, title: resolvedTitle, poster, source,
      episodes: eps.map((no, idx) => ({ id: String(no), name: `ตอนที่ ${no}`, index: idx, needFetch: true }))
    };
  }
  if (source === "melolo" || source === "dramabox" || source === "reelshort") {
    const cleanId = String(id).split(":")[0];
    if (source === "dramabox") {
      try {
        const { text: html } = await httpGet(`https://www.dramaboxapp.com/th/episode/${encodeURIComponent(cleanId)}/1`, "https://www.dramaboxapp.com/");
        const nd = extractNextDataJson(html);
        const list = nd?.props?.pageProps?.chapterList || [];
        if (list.length) {
          return {
            id: cleanId, title, poster, source,
            episodes: list.map((ch, i) => ({
              id: String(ch.id || (i + 1)), name: `ตอนที่ ${i + 1}`, index: i,
              streamUrl: ch.mp4 || ch.m3u8Url || "",
              referer: "https://www.dramaboxapp.com/",
              needFetch: !(ch.mp4 || ch.m3u8Url)
            }))
          };
        }
      } catch (_) {}
    }
    const { text } = await httpGet(`${DAT_BASE}?endpoint=detail&category_p=${source}&id=${encodeURIComponent(cleanId)}&lang=th`, DAT_REF);
    const j = JSON.parse(text);
    const d = (j.data && j.data.data) || j.data || j;
    const chs = d.chapters || d.chapterList || d.episodes || [];
    const total = Math.max(Number(d.total_episodes || d.totalEpisodes || d.chapterCount || 0), chs.length);
    const episodes = [];
    for (let i = 0; i < total; i++) {
      const chObj = chs[i];
      episodes.push({
        id: chObj && chObj.id ? String(chObj.id) : String(i + 1),
        name: `ตอนที่ ${i + 1}`,
        index: i,
        needFetch: true
      });
    }
    return { id: cleanId, title: d.title || d.name || title, poster, source, episodes };
  }
  if (source === "netshort") {
    const { text } = await httpGet(`${NETSHORT_BASE}/api/drama/${encodeURIComponent(id)}?lang=th`, NETSHORT_BASE + "/");
    const j = JSON.parse(text);
    const epArr = (j.data && j.data.shortPlayEpisodeList) || [];
    return {
      id, title, poster, source,
      episodes: epArr.map((e, i) => {
        const no = e.episodeNo || (i + 1);
        return { id: String(no), name: `ตอนที่ ${no}`, index: i, needFetch: true };
      })
    };
  }
  if (source === "goodshort") {
    const cleanBid = String(id).trim();
    let records = [];
    try {
      const j = await httpPostJson("https://www.goodshort.com/hwycreels/chapter/list", { bookId: cleanBid, pageNo: 1, pageSize: 200 }, "https://www.goodshort.com/");
      records = (j.data && j.data.list) || [];
    } catch (_) {}
    if (!records.length) {
      try {
        const fb = await httpPostJson("https://www.goodshort.com/hwycreels/chapter/page", { bookId: cleanBid, current: 1, size: 200 }, "https://www.goodshort.com/");
        records = (fb.data && fb.data.records) || [];
      } catch (_) {}
    }
    if (records.length) {
      return {
        id: cleanBid, title, poster, source,
        episodes: records.map((ch, i) => ({
          id: String(ch.id), name: `ตอนที่ ${i + 1}`, index: i,
          streamUrl: ch.m3u8Path || "", referer: "https://www.goodshort.com/",
          needFetch: !ch.m3u8Path
        }))
      };
    }
    const { text } = await httpGet(`${DAT_BASE}?endpoint=detail&category_p=goodshort&id=${encodeURIComponent(cleanBid)}&lang=th`, DAT_REF);
    const j2 = JSON.parse(text);
    const d2 = (j2.data && j2.data.data) || j2.data || j2;
    const chs = d2.chapters || d2.chapterList || d2.episodes || [];
    const total = Math.max(Number(d2.total_episodes || d2.totalEpisodes || d2.chapterCount || 0), chs.length);
    const episodes = [];
    for (let i = 0; i < total; i++) {
      const chObj = chs[i];
      episodes.push({
        id: chObj && chObj.id ? String(chObj.id) : String(i + 1),
        name: `ตอนที่ ${i + 1}`,
        index: i,
        needFetch: true
      });
    }
    return { id: cleanBid, title: d2.title || d2.name || title, poster, source, episodes };
  }
  if (source === "moboreels") {
    const { text: html } = await httpGet(`https://www.moboreels.com/drama/${id}`, "https://www.moboreels.com/");
    const mp4Re = /https?:[\\u002F/]+cdn\d*video\.cdreader\.com[^"'\s,)]+\.mp4[^"'\s,)]*/g;
    const urls = [];
    let m;
    while ((m = mp4Re.exec(html)) !== null) {
      const u = m[0].replace(/\\u002F/g, "/").replace(/\\\\/g, "/");
      if (!urls.includes(u)) urls.push(u);
    }
    return {
      id, title, poster, source,
      episodes: urls.map((u, i) => ({ id: String(i + 1), name: `ตอนที่ ${i + 1}`, index: i, streamUrl: u, referer: "https://www.moboreels.com/", needFetch: false }))
    };
  }
  return { id, title, poster, source, episodes: [] };
}

async function resolveEpisodeStream(source, parentId, epId, embedUrl) {
  if (source === "movie911") {
    let movieUrl = embedUrl || parentId;
    if (!movieUrl.startsWith("http")) movieUrl = `https://movie911hd.com/${movieUrl.replace(/^\/+/, "")}/`;
    const { text: mhtml } = await httpGet(movieUrl, "https://movie911hd.com/");
    const em = /src="(https:\/\/movie911hd\.com\/embed\/\?link=[^"]+)"/i.exec(mhtml);
    if (!em) return { streamUrl: "", error: "หนังเรื่องนี้ยังไม่มีไฟล์สตรีม" };
    const embed = em[1].replace(/&amp;/g, "&");
    const lm = /link=(.+)$/.exec(embed);
    const playerUrl = lm ? decodeURIComponent(lm[1]) : "";
    let m3u8Url = "";
    let referer = "https://fastcdnv2.com/";

    if (playerUrl.includes("ssplayer168")) {
      const idM = /id=(\d+)/.exec(playerUrl);
      if (idM) {
        for (const bUrl of [`https://backup.ssplayer168.xyz/api/embed/bunny/index.php?id=${idM[1]}`, `https://ssplayer168.xyz/api/embed/bunny/index.php?id=${idM[1]}`]) {
          try {
            const { text: bhtml } = await httpGet(bUrl, "https://ssplayer168.xyz/");
            const bm = /https:\/\/bunny\.fastcdnv2\.com\/p\/([A-Za-z0-9+/=_-]+)\.m3u8/i.exec(bhtml);
            if (bm) {
              try {
                const dec = atob(bm[1].replace(/-/g, "+").replace(/_/g, "/"));
                if (dec.startsWith("http")) m3u8Url = dec;
              } catch (_) {}
              if (!m3u8Url) m3u8Url = bm[0];
              break;
            }
          } catch (_) {}
        }
      }
    }
    if (!m3u8Url && playerUrl.includes("fastplayer-cdn")) {
      const fpM = /movieid=([a-f0-9]+)/i.exec(playerUrl);
      if (fpM) {
        const { text: fhtml } = await httpGet(`https://fastcdnv2.com/embed/${fpM[1]}`, "https://apix1.fastplayer-cdn.xyz/");
        const m3m = /https:\/\/fastfastcdn\.com\/[^"'\s]*\.m3u8[^"'\s]*/i.exec(fhtml);
        if (m3m) m3u8Url = m3m[0];
      }
    }
    if (m3u8Url.includes("steamhls88")) referer = "https://ssplayer168.xyz/";
    return { streamUrl: m3u8Url, referer };
  }

  if (source === "1112hdc") {
    const u = new URL(embedUrl);
    const origin = u.origin;
    const parts = u.pathname.split("/").filter(Boolean);
    const hash = parts[parts.length - 1];
    try { await httpGet(`${origin}/api/v2/stream/${hash}?parent=https://1112hdc.com&_=${Date.now()}`, embedUrl); } catch (_) {}
    const td = await httpPostJson(`${origin}/api/tokenplay`, { md5: hash, parent: "https://1112hdc.com" }, embedUrl);
    if (!td.token || !td.stream_id) return { streamUrl: "" };
    const remoteM3u8 = `${origin}/api/stream/${td.stream_id}/index.m3u8?token=${td.token}&expires=${td.expires || ""}&parent=https%3A%2F%2F1112hdc.com&sid=${td.session_id || ""}`;
    return { streamUrl: remoteM3u8, referer: origin + "/" };
  }

  if (source === "rongyok") {
    const sid = String(parentId).replace(/\D/g, "");
    const ep = String(epId).replace(/\D/g, "");
    try {
      const { text } = await httpGet(`https://www.rongyok.com/watch/playseries.php?series_id=${sid}&ep=${ep}`, `https://www.rongyok.com/watch/?series_id=${sid}&ep=${ep}`);
      const j = JSON.parse(text);
      const absUrl = j.video_url ? new URL(j.video_url, "https://www.rongyok.com/").toString() : "";
      if (absUrl) return { streamUrl: absUrl, referer: "https://www.rongyok.com/" };
    } catch (_) {}
    return { streamUrl: "" };
  }

  if (source === "melolo" || source === "dramabox" || source === "reelshort") {
    const cleanId = String(parentId).split(":")[0];
    if (source === "dramabox") {
      try {
        const { text } = await httpGet(`${DAT_BASE}?endpoint=video&category_p=dramabox&id=${encodeURIComponent(cleanId)}&chapterId=${encodeURIComponent(epId)}&lang=th`, DAT_REF);
        const j = JSON.parse(text);
        const d = (j.data && j.data.data) || j.data || j;
        const streams = d.streams || [];
        for (const s of streams) {
          if (s && s.url) return { streamUrl: s.url, referer: DAT_REF };
        }
      } catch (_) {}
    }
    const { text } = await httpGet(`${DAT_BASE}?endpoint=video&category_p=${source}&id=${encodeURIComponent(cleanId)}&chapterId=${encodeURIComponent(epId)}&lang=th`, DAT_REF);
    const j = JSON.parse(text);
    const d = (j.data && j.data.data) || j.data || j;
    const streams = d.streams || [];
    let bestUrl = "";
    let bestQ = -1;
    for (const s of streams) {
      if (!s || !s.url) continue;
      const q = parseInt(String(s.quality || s.resolution || "0").replace(/\D/g, ""), 10) || 0;
      if (q > bestQ || !bestUrl) { bestQ = q; bestUrl = s.url; }
    }
    return { streamUrl: bestUrl, referer: DAT_REF };
  }

  if (source === "netshort") {
    const { text } = await httpGet(`${NETSHORT_BASE}/api/watch/${encodeURIComponent(parentId)}/${encodeURIComponent(epId)}?lang=th&code=free`, NETSHORT_BASE + "/");
    const j = JSON.parse(text);
    const d = j.data || j;
    return { streamUrl: d.videoUrl || d.playVoucher || d.url || "", referer: NETSHORT_BASE + "/" };
  }

  if (source === "goodshort") {
    try {
      const j = await httpPostJson("https://www.goodshort.com/hwycreels/chapter/detail", { bookId: parentId, chapterId: epId }, "https://www.goodshort.com/");
      const d = j.data || {};
      const u = d.m3u8Path || d.videoUrl || "";
      if (u) return { streamUrl: u, referer: "https://www.goodshort.com/" };
    } catch (_) {}
    const { text } = await httpGet(`${DAT_BASE}?endpoint=video&category_p=goodshort&id=${encodeURIComponent(parentId)}&chapterId=${encodeURIComponent(epId)}&lang=th`, DAT_REF);
    const j2 = JSON.parse(text);
    const d2 = (j2.data && j2.data.data) || j2.data || j2;
    const streams = d2.streams || [];
    for (const s of streams) {
      if (s && s.url) return { streamUrl: s.url, referer: DAT_REF };
    }
    return { streamUrl: "" };
  }

  if (source === "24hda") {
    const slug = String(parentId).replace(/^https?:\/\/www\.24-hda\.com\//, "").replace(/\/$/, "");
    const movieUrl = `https://www.24-hda.com/${slug}/`;
    const { text: html } = await httpGet(movieUrl, "https://www.24-hda.com/");
    const pidM = /"post_id"\s*:\s*(\d+)/.exec(html);
    if (!pidM) return { streamUrl: "" };
    const postId = pidM[1];
    let videoId = "";
    for (let srv = 1; srv <= 3 && !videoId; srv++) {
      const pHtml = await httpPostForm("https://api.24-hda.com/get.php", `action=halim_ajax_player&nonce=&episode=1&server=${srv}&postid=${postId}&lang=thai&title=${encodeURIComponent(slug)}`, movieUrl);
      const ifM = /src="[^"]*\?id=([a-f0-9]+)/.exec(pHtml);
      if (ifM) videoId = ifM[1];
    }
    if (!videoId) return { streamUrl: "" };
    return {
      streamUrl: `https://rain.24playerch.com/newplaylist/${videoId}/${videoId}.m3u8`,
      referer: "https://rain.24playerch.com/"
    };
  }

  return { streamUrl: "" };
}

// ════════════════════════════════════════════════════════════════════════════
//  4. Zero-Cost HLS (.m3u8) & MP4 Referer Proxy
// ════════════════════════════════════════════════════════════════════════════
async function handleStreamProxy(request, urlObj) {
  const targetUrl = urlObj.searchParams.get("url") || "";
  const referer = urlObj.searchParams.get("referer") || "";
  if (!targetUrl.startsWith("http")) {
    return new Response("Missing url", { status: 400, headers: corsHeaders() });
  }

  const headers = { "User-Agent": UA, "Accept": "*/*" };
  if (request.headers.get("Range")) headers["Range"] = request.headers.get("Range");
  if (referer) {
    headers["Referer"] = referer;
    try { headers["Origin"] = new URL(referer).origin; } catch (_) {}
  } else {
    try { headers["Referer"] = new URL(targetUrl).origin + "/"; } catch (_) {}
  }

  const upstream = await fetch(targetUrl, { headers, redirect: "follow" });
  const ctype = (upstream.headers.get("content-type") || "").toLowerCase();

  if (targetUrl.includes(".m3u8") || ctype.includes("mpegurl")) {
    const text = await upstream.text();
    if (text.trim().startsWith("#EXTM3U")) {
      const baseUri = new URL(targetUrl);
      const originPrefix = urlObj.origin + (urlObj.pathname.startsWith("/tv/") ? "/tv" : "");
      const rewritten = text.split(/\r?\n/).map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith("#")) {
          return line.replace(/URI="([^"]+)"/g, (_, uriVal) => {
            const absUri = new URL(uriVal, baseUri).toString();
            return `URI="${originPrefix}/api/proxy-stream?url=${encodeURIComponent(absUri)}&referer=${encodeURIComponent(referer)}"`;
          });
        }
        const absUrl = new URL(trimmed, baseUri).toString();
        return `${originPrefix}/api/proxy-stream?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer)}`;
      }).join("\n");

      return new Response(rewritten, {
        status: 200,
        headers: corsHeaders({ "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8", "Cache-Control": "no-cache" })
      });
    }
  }

  const respHeaders = corsHeaders({
    "Content-Type": upstream.headers.get("Content-Type") || "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600"
  });
  if (upstream.headers.get("Content-Range")) respHeaders["Content-Range"] = upstream.headers.get("Content-Range");
  if (upstream.headers.get("Content-Length")) respHeaders["Content-Length"] = upstream.headers.get("Content-Length");

  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
}

async function handleImageProxy(urlObj) {
  const rawUrl = urlObj.searchParams.get("url") || "";
  if (!rawUrl || !rawUrl.startsWith("http")) {
    return new Response("Missing image URL", { status: 400, headers: corsHeaders() });
  }
  let referer = "";
  if (rawUrl.includes("movie911")) referer = "https://movie911hd.com/";
  else if (rawUrl.includes("1112hd")) referer = "https://1112hdc.com/";
  else if (rawUrl.includes("rongyok")) referer = "https://www.rongyok.tv/";
  else if (rawUrl.includes("digitalallthings.online")) referer = "https://digitalallthings.online/drama";
  else if (rawUrl.includes("kahirihome")) referer = "https://kahirihome.com/";
  else {
    try { referer = new URL(rawUrl).origin + "/"; } catch (_) {}
  }

  try {
    const headers = {
      "User-Agent": UA,
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    };
    if (referer) headers["Referer"] = referer;
    const upstream = await fetch(rawUrl, { headers, redirect: "follow" });
    if (!upstream.ok) {
      return new Response("Upstream image error", { status: upstream.status, headers: corsHeaders() });
    }
    const ct = upstream.headers.get("Content-Type") || "image/jpeg";
    return new Response(upstream.body, {
      status: 200,
      headers: corsHeaders({
        "Content-Type": ct,
        "Cache-Control": "public, max-age=604800",
        "Cross-Origin-Resource-Policy": "cross-origin"
      })
    });
  } catch (e) {
    return new Response("Image proxy failed", { status: 502, headers: corsHeaders() });
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  5. PWA Frontend HTML / Manifest / Icon
// ════════════════════════════════════════════════════════════════════════════
const MANIFEST_JSON = JSON.stringify({
  name: "TD FRAM VIP — Movie & Live TV",
  short_name: "TD FRAM VIP",
  description: "แอพดูหนัง 11 ค่ายดัง ซีรีส์สั้นพากย์ไทย และทีวีสด 24 ชม. (เฉพาะคีย์ถาวร)",
  start_url: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#070A12",
  theme_color: "#4F46E5",
  icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
}, null, 2);

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312E81"/><stop offset="50%" stop-color="#1E1B4B"/><stop offset="100%" stop-color="#090D16"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8"/><stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)"/>
  <circle cx="256" cy="230" r="110" fill="none" stroke="url(#accent)" stroke-width="16"/>
  <polygon points="225,180 225,280 310,230" fill="url(#accent)"/>
  <text x="256" y="420" font-family="Arial,sans-serif" font-weight="900" font-size="62" fill="#FFFFFF" text-anchor="middle">TD FRAM VIP</text>
</svg>`;

function buildWebAppHtml() {
  return String.raw`<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0B0F19">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon.svg">
<title>TD FRAM VIP — Movie & Live TV (Permanent Key Edition)</title>
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
<style>
  :root {
    --bg: #070A12; --panel: #0F172A; --card: #131C31; --border: #1E293B;
    --indigo: #6366F1; --violet: #8B5CF6; --cyan: #38BDF8; --green: #10B981;
    --gold: #F59E0B; --red: #EF4444; --text: #F8FAFC; --muted: #94A3B8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Thai', sans-serif; min-height: 100vh; overflow-x: hidden; }
  #licenseGate {
    position: fixed; inset: 0; z-index: 9999;
    background: radial-gradient(circle at 50% 20%, #1E1B4B 0%, #050811 70%);
    display: flex; align-items: center; justify-content: center; padding: 18px;
  }
  .gate-card {
    background: linear-gradient(145deg, rgba(15,23,42,0.96), rgba(9,13,22,0.98));
    border: 1.5px solid rgba(99,102,241,0.45); border-radius: 24px;
    padding: 32px 26px; width: 100%; max-width: 460px;
    box-shadow: 0 25px 70px rgba(0,0,0,0.85), 0 0 40px rgba(99,102,241,0.18); text-align: center;
  }
  .gate-badge {
    display: inline-block; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.45);
    color: #FBBF24; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; margin: 8px 0 18px;
  }
  .hwid-card {
    background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.3);
    border-radius: 12px; padding: 12px; margin-bottom: 16px; cursor: pointer; text-align: left;
  }
  .gate-input {
    width: 100%; padding: 14px 16px; background: #060913; border: 1.5px solid rgba(99,102,241,0.4);
    border-radius: 12px; color: #fff; font-size: 15px; font-family: monospace; font-weight: 700;
    text-align: center; text-transform: uppercase; margin-bottom: 12px; outline: none;
  }
  .gate-input:focus { border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(56,189,248,0.2); }
  .gate-btn {
    width: 100%; padding: 14px; background: linear-gradient(135deg, var(--indigo), var(--violet));
    color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer;
    box-shadow: 0 8px 24px rgba(99,102,241,0.35);
  }
  .gate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .app-shell { display: flex; min-height: 100vh; }
  .sidebar { width: 245px; background: #0B1120; border-right: 1px solid var(--border); padding: 16px 12px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
  .brand { padding: 4px 8px 12px; border-bottom: 1px solid var(--border); margin-bottom: 6px; }
  .brand h1 { font-size: 18px; font-weight: 900; background: linear-gradient(90deg,#fff,#A5B4FC); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .brand p { font-size: 11px; color: var(--cyan); margin-top: 2px; font-weight: 600; }
  .studio-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 11px; background: transparent; border: 1px solid transparent;
    color: #CBD5E1; font-size: 13px; font-weight: 700; cursor: pointer; text-align: left;
  }
  .studio-btn:hover { background: rgba(99,102,241,0.1); color: #fff; }
  .studio-btn.active { background: linear-gradient(135deg, rgba(79,70,229,0.35), rgba(124,58,237,0.25)); border-color: var(--indigo); color: #fff; }
  .studio-badge { font-size: 10px; padding: 2px 6px; border-radius: 6px; background: #1E293B; color: #A5B4FC; font-weight: 700; }
  .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .topbar {
    position: sticky; top: 0; z-index: 30; background: rgba(11,17,32,0.92); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border); padding: 12px 18px; display: flex; flex-wrap: wrap; gap: 10px;
    align-items: center; justify-content: space-between;
  }
  .search-group { display: flex; gap: 8px; flex: 1; max-width: 480px; }
  .search-group input { flex: 1; background: #131C31; border: 1px solid #334155; color: #fff; padding: 9px 14px; border-radius: 10px; font-size: 13px; outline: none; }
  .chip-btn { background: #131C31; border: 1px solid #334155; color: #E2E8F0; padding: 8px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .chip-btn.active, .chip-btn.primary { background: var(--indigo); border-color: #818CF8; color: #fff; }
  .cat-bar { display: flex; gap: 8px; overflow-x: auto; padding: 12px 18px 4px; scrollbar-width: none; }
  .cat-bar::-webkit-scrollbar { display: none; }
  .studio-mobile-bar { display: none; gap: 8px; overflow-x: auto; padding: 10px 14px; background: #0B1120; border-bottom: 1px solid var(--border); }
  .movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 14px; padding: 14px 18px 40px; }
  .movie-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; cursor: pointer; position: relative; display: flex; flex-direction: column; transition: transform 0.18s, border-color 0.18s; }
  .movie-card:hover { transform: translateY(-4px); border-color: var(--indigo); }
  .poster-wrap { position: relative; width: 100%; padding-top: 145%; background: linear-gradient(145deg, #1E1B4B, #0F172A); overflow: hidden; flex-shrink: 0; }
  .poster-wrap img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; display: block; z-index: 1; }
  .poster-fallback { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px; text-align: center; color: #94A3B8; font-size: 12px; font-weight: 700; z-index: 0; gap: 6px; }
  .card-badges { position: absolute; top: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; gap: 4px; pointer-events: none; z-index: 2; }
  .b-sound { background: rgba(5,150,105,0.92); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 6px; }
  .b-qual { background: rgba(79,70,229,0.92); color: #fff; font-size: 10px; font-weight: 800; padding: 3px 7px; border-radius: 6px; }
  .card-info { padding: 10px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .card-title { font-size: 13px; font-weight: 700; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-sub { font-size: 11px; color: var(--muted); margin-top: 6px; display: flex; justify-content: space-between; align-items: center; }
  #playerModal { position: fixed; inset: 0; width: 100vw; height: 100vh; height: 100dvh; z-index: 500; background: rgba(5,8,17,0.98); backdrop-filter: blur(14px); display: none; flex-direction: column; overflow: hidden; }
  .player-top { padding: 10px 16px; background: #0B1120; border-bottom: 1px solid var(--border); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; }
  .player-body { flex: 1; min-height: 0; display: flex; overflow: hidden; }
  .video-stage { flex: 1; min-height: 0; min-width: 0; background: #000; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
  video { max-width: 100%; max-height: 100%; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .ep-sidebar { width: 340px; flex-shrink: 0; min-height: 0; height: 100%; background: #0B1120; border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
  .ep-range-bar { display: flex; gap: 6px; overflow-x: auto; padding: 8px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; scrollbar-width: thin; }
  .ep-range-btn { padding: 5px 10px; border-radius: 7px; background: #131C31; border: 1px solid #334155; color: #CBD5E1; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .ep-range-btn.active { background: var(--violet); border-color: #C4B5FD; color: #fff; }
  .ep-scroll { flex: 1; min-height: 0; overflow-y: auto !important; overflow-x: hidden; -webkit-overflow-scrolling: touch; touch-action: pan-y; overscroll-behavior: contain; padding: 12px; }
  .ep-scroll::-webkit-scrollbar { width: 7px; }
  .ep-scroll::-webkit-scrollbar-track { background: #090E1A; }
  .ep-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
  .ep-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-bottom: 28px; }
  .ep-btn { padding: 10px 6px; border-radius: 9px; background: #131C31; border: 1px solid #334155; color: #E2E8F0; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; transition: background 0.15s; }
  .ep-btn:hover { border-color: var(--indigo); }
  .ep-btn.active { background: var(--indigo); border-color: #fff; color: #fff; box-shadow: 0 0 12px rgba(99,102,241,0.5); }
  @media (max-width: 860px) {
    .sidebar { display: none; }
    .studio-mobile-bar { display: flex; }
    .player-body { flex-direction: column; }
    .video-stage { width: 100%; height: 45vh; max-height: 45vh; flex: none; }
    .ep-sidebar { width: 100%; flex: 1; min-height: 0; height: auto; border-left: none; border-top: 1px solid var(--border); }
    .movie-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 12px; }
  }
</style>
</head>
<body>

<div id="licenseGate">
  <div class="gate-card">
    <div style="font-size:46px;margin-bottom:6px">🔐</div>
    <h2 style="font-size:22px;font-weight:900;color:#fff">TD FRAM VIP — Movie Web</h2>
    <div class="gate-badge">🔑 รองรับทุกคีย์ TD FRAM VIP (ตามเวลาที่เหลือของคีย์)</div>
    <p style="font-size:13px;color:var(--muted);margin-bottom:14px;line-height:1.5">
      ใส่คีย์เดียวกับโปรแกรม <b>TD FRAM VIP</b> (ทั้งคีย์รายวัน / รายเดือน / ถาวร) เพื่อเข้าดูหนัง 11 ค่ายดัง ซีรีส์สั้นพากย์ไทย และทีวีสดตามเวลาคงเหลือของคีย์
    </p>
    <div class="hwid-card" onclick="copyWebHwid()">
      <div style="font-size:10px;color:var(--cyan);font-weight:800">🖥 HWID อุปกรณ์เว็บนี้ (แตะเพื่อคัดลอกส่งให้ผู้ขาย)</div>
      <div id="gateHwid" style="font-family:monospace;font-size:12px;color:#E0F2FE;margin-top:4px;word-break:break-all">กำลังสร้าง HWID...</div>
    </div>
    <input id="gateKeyInput" class="gate-input" placeholder="XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" onkeydown="if(event.key==='Enter')activateWebKey()">
    <button id="gateBtn" class="gate-btn" onclick="activateWebKey()">🔑 ยืนยันคีย์เข้าใช้งาน (Activate Key)</button>
    <div id="gateMsg" style="margin-top:14px;font-size:13px;line-height:1.5;min-height:24px"></div>
  </div>
</div>

<div class="app-shell">
  <aside class="sidebar">
    <div class="brand">
      <h1>🎬 TD FRAM VIP</h1>
      <p>11 ค่ายหนัง + ทีวีสด (Web PWA)</p>
    </div>
    <div id="studioDesktopList" style="display:flex;flex-direction:column;gap:4px;overflow-y:auto"></div>
  </aside>

  <main class="main-area">
    <div class="topbar">
      <div>
        <div id="curStudioTitle" style="font-size:16px;font-weight:800">🎥 Movie911HD</div>
        <div id="curStudioSub" style="font-size:11px;color:var(--muted)">หนังใหม่ชนโรง พากย์ไทย/ซับไทย</div>
      </div>

      <div class="search-group">
        <input id="searchInput" placeholder="ค้นหาชื่อหนัง หรือ ซีรีส์..." onkeydown="if(event.key==='Enter')doSearch()">
        <button class="chip-btn primary" onclick="doSearch()">🔍 ค้นหา</button>
      </div>

      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <button id="thaiBtn" class="chip-btn" onclick="toggleThai()">🇹🇭 ทั้งหมด</button>
        <button class="chip-btn" onclick="changePage(-1)">◀</button>
        <span id="pageLabel" style="font-size:12px;font-weight:700;padding:0 4px">1/1</span>
        <button class="chip-btn" onclick="changePage(1)">▶</button>
        <button id="keyStatusBtn" class="chip-btn" style="border-color:var(--green);color:#34D399" onclick="showKeyModal()">🔑 ตรวจสอบคีย์</button>
      </div>
    </div>

    <div id="studioMobileBar" class="studio-mobile-bar"></div>
    <div id="catBar" class="cat-bar"></div>

    <div id="statusBox" style="text-align:center;padding:48px 20px;color:var(--muted);font-size:14px;display:none"></div>
    <div id="movieGrid" class="movie-grid"></div>
  </main>
</div>

<div id="playerModal">
  <div class="player-top">
    <div style="min-width:0;flex:1">
      <div id="playerTitle" style="font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">กำลังเล่น...</div>
      <div id="playerEpSub" style="font-size:11px;color:var(--cyan)">ตอนที่ 1</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <button class="chip-btn" onclick="stepEpisode(-1)">⏮ ตอนก่อน</button>
      <button class="chip-btn primary" onclick="stepEpisode(1)">ตอนถัดไป ⏭</button>
      <button id="favPlayerBtn" class="chip-btn" onclick="toggleFavActive()">☆ โปรด</button>
      <button class="chip-btn" style="border-color:#EF4444;color:#FCA5A5" onclick="closePlayer()">✕ ปิด</button>
    </div>
  </div>
  <div class="player-body">
    <div class="video-stage">
      <video id="videoEl" controls playsinline autoplay></video>
    </div>
    <div class="ep-sidebar">
      <div style="padding:10px 12px;border-bottom:1px solid var(--border);font-size:13px;font-weight:800;color:#A5B4FC;display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
        <span>📺 เลือกตอน (<span id="epCountLabel">1</span> ตอน)</span>
        <span style="font-size:11px;color:var(--muted)">เลื่อนขึ้น-ลงได้</span>
      </div>
      <div id="epRangeBar" class="ep-range-bar" style="display:none"></div>
      <div id="epScrollWrap" class="ep-scroll">
        <div id="epList" class="ep-list"></div>
      </div>
    </div>
  </div>
</div>

<script>
const API_BASE = location.pathname.startsWith('/tv') ? '/tv' : '';
const STUDIOS = [
  { id: 'history_fav', name: '▶ ดูต่อ & รายการโปรด', badge: 'HISTORY', sub: 'จำตอนและเวลาที่ดูค้างไว้ + รายการโปรด', cats: [{id:'history',name:'▶ ดูต่อจากเดิม'},{id:'fav',name:'⭐ รายการโปรด'}] },
  { id: 'livetv', name: '📡 ทีวีสด Live TV', badge: 'LIVE', sub: 'ช่องดิจิทัลไทย กีฬา ข่าว และสารคดีสด 24 ชม.', cats: [{id:'',name:'📺 ทั้งหมด'},{id:'thai_digital',name:'🇹🇭 ทีวีดิจิทัลไทย'},{id:'news_sport',name:'⚽ ข่าว & กีฬา'},{id:'inter_doc',name:'🌍 ต่างประเทศ'}] },
  { id: 'movie911', name: '🎥 Movie911HD', badge: 'HD', sub: 'หนังใหม่ชนโรง ซีรีส์ดัง พากย์ไทย/ซับไทย', cats: [{id:'',name:'🔥 มาใหม่'},{id:'category/action',name:'💥 แอคชั่น'},{id:'category/sci-fi',name:'🚀 ไซไฟ'},{id:'category/horror',name:'👻 สยองขวัญ'},{id:'category/comedy',name:'😂 ตลก'}] },
  { id: '1112hdc', name: '🎬 1112HDC', badge: '1080p', sub: 'คลังหนังและซีรีส์ 1080p แท้', cats: [{id:'',name:'🔥 ทั้งหมด'},{id:'movies',name:'🎬 ภาพยนตร์'},{id:'series_cn',name:'🏮 ซีรีส์จีน'},{id:'series_kr',name:'🇰🇷 ซีรีส์เกาหลี'},{id:'series_us',name:'🌍 ซีรีส์ฝรั่ง'}] },
  { id: 'rongyok', name: '🏯 โรงหยก RongYok', badge: 'จีนสั้น', sub: 'มินิซีรีส์จีนยอดฮิต พากย์ไทย/ซับไทย', cats: [{id:'',name:'🔥 ซีรีส์มาแรง'},{id:'thai-dub',name:'🇹🇭 พากย์ไทย'},{id:'thai-sub',name:'📝 ซับไทย'}] },
  { id: 'melolo', name: '📱 Melolo', badge: '720p', sub: 'ซีรีส์สั้นแนวตั้ง พากย์ไทย/ซับไทย', cats: [{id:'',name:'🔥 ยอดนิยม'}] },
  { id: 'netshort', name: '📲 NetShort', badge: 'VIP', sub: 'ซีรีส์สั้นพากย์ไทย ปลดล็อกครบทุกตอน', cats: [{id:'',name:'🔥 พากย์ไทยมาแรง'},{id:'1',name:'📝 ซับไทย'}] },
  { id: 'dramabox', name: '🎭 DramaBox', badge: '1.1K+', sub: 'คลังซีรีส์สั้นพากย์ไทยและซับไทย', cats: [{id:'',name:'🔥 มาแรง'}] },
  { id: 'goodshort', name: '🎞️ GoodShort', badge: '3K+', sub: 'รวมมินิซีรีส์สั้นครบทุกแนว', cats: [{id:'',name:'🔥 ทั้งหมด'}] },
  { id: 'moboreels', name: '🎞️ MoboReels', badge: 'MP4', sub: 'ซีรีส์สั้น MP4 สตรีมเร็ว', cats: [{id:'',name:'🔥 ทั้งหมด'}] },
  { id: 'reelshort', name: '🎬 ReelShort', badge: 'HD', sub: 'ซีรีส์สั้นคุณภาพสูง', cats: [{id:'',name:'🔥 ทั้งหมด'}] },
  { id: 'kahiri', name: '🍿 Kahirihome', badge: 'พากย์ไทย', sub: 'หนังดังพากย์ไทย/ซับไทย คมชัด', cats: [{id:'',name:'🔥 หน้าแรก'}] },
  { id: '24hda', name: '🌐 24-HDA', badge: '24HD', sub: 'หนังใหม่ชนโรง อัปเดตทุกวัน', cats: [{id:'',name:'🔥 ล่าสุด'}] }
];

let curStudio = STUDIOS[2];
let curCat = '';
let curSearch = '';
let curPage = 1;
let totalPages = 1;
let thaiOnly = false;
let currentItems = [];
let activeMovie = null;
let activeDetail = null;
let activeEpIdx = 0;
let hlsInstance = null;

function getOrCreateWebHwid() {
  let hwid = localStorage.getItem('tdfram_web_hwid');
  if (hwid && /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(hwid)) return hwid;
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  hwid = hex.slice(0,8) + '-' + hex.slice(8,12) + '-4' + hex.slice(13,16) + '-8' + hex.slice(17,20) + '-' + hex.slice(20,32);
  localStorage.setItem('tdfram_web_hwid', hwid);
  return hwid;
}

function copyWebHwid() {
  const hw = getOrCreateWebHwid();
  if (navigator.clipboard) navigator.clipboard.writeText(hw);
  document.getElementById('gateMsg').innerHTML = '<span style="color:#34D399">✅ คัดลอก HWID เรียบร้อยแล้ว ส่งให้แอดมินได้เลย</span>';
}

function formatClientRemaining(expMs) {
  const rem = expMs - Date.now();
  if (rem <= 0) return '';
  const mins = Math.floor(rem / 60000);
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days > 0) return '⏳ เหลือ ' + days + ' วัน ' + hrs + ' ชม.';
  if (hrs > 0) return '⏳ เหลือ ' + hrs + ' ชม. ' + m + ' นาที';
  return '⏳ เหลือ ' + Math.max(1, m) + ' นาที';
}

function checkKeyRemainingTime() {
  const savedKey = localStorage.getItem('tdfram_web_key') || '';
  if (!savedKey) return false;
  const isLife = localStorage.getItem('tdfram_web_lifetime') === 'true';
  const btn = document.getElementById('keyStatusBtn');
  if (isLife) {
    if (btn) btn.textContent = '🔑 ตลอดชีพ VIP';
    return true;
  }
  const expMs = parseInt(localStorage.getItem('tdfram_web_expires_ms') || '0', 10);
  if (!expMs || Date.now() >= expMs) {
    localStorage.removeItem('tdfram_web_key');
    localStorage.removeItem('tdfram_web_lifetime');
    localStorage.removeItem('tdfram_web_expires_ms');
    closePlayer();
    document.getElementById('gateMsg').innerHTML = '<span style="color:#F87171">⌛ คีย์ของคุณหมดเวลาใช้งานแล้ว กรุณาต่ออายุหรือกรอกคีย์ใหม่</span>';
    document.getElementById('licenseGate').style.display = 'flex';
    return false;
  }
  if (btn) btn.textContent = formatClientRemaining(expMs);
  return true;
}

setInterval(checkKeyRemainingTime, 20000);

async function initLicenseGate() {
  const hwid = getOrCreateWebHwid();
  document.getElementById('gateHwid').textContent = hwid;
  const savedKey = localStorage.getItem('tdfram_web_key') || '';
  if (savedKey && checkKeyRemainingTime()) {
    document.getElementById('licenseGate').style.display = 'none';
    initStudiosUi();
    loadCatalog(1);
    try {
      const r = await fetch(API_BASE + '/api/license/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: savedKey, hwid })
      });
      const d = await r.json();
      if (d.success) {
        localStorage.setItem('tdfram_web_lifetime', d.lifetime ? 'true' : 'false');
        localStorage.setItem('tdfram_web_expires_ms', String(d.expiresAtMs || 0));
        checkKeyRemainingTime();
      } else if (d.reason !== 'network_error') {
        localStorage.removeItem('tdfram_web_key');
        localStorage.removeItem('tdfram_web_lifetime');
        localStorage.removeItem('tdfram_web_expires_ms');
        closePlayer();
        document.getElementById('gateMsg').innerHTML = '<span style="color:#F87171">' + d.message + '</span>';
        document.getElementById('licenseGate').style.display = 'flex';
      }
    } catch (_) {}
  } else {
    document.getElementById('licenseGate').style.display = 'flex';
    initStudiosUi();
  }
}

async function activateWebKey() {
  const key = (document.getElementById('gateKeyInput').value || '').trim().toUpperCase();
  const hwid = getOrCreateWebHwid();
  const msgEl = document.getElementById('gateMsg');
  const btn = document.getElementById('gateBtn');
  if (!key) {
    msgEl.innerHTML = '<span style="color:#FBBF24">⚠️ กรุณากรอก License Key ของ TD FRAM VIP</span>';
    return;
  }
  btn.disabled = true;
  btn.textContent = '⏳ กำลังตรวจสอบคีย์...';
  msgEl.innerHTML = '<span style="color:#38BDF8">⏳ กำลังตรวจสอบคีย์และเวลาคงเหลือกับเซิร์ฟเวอร์ TD FRAM VIP...</span>';
  try {
    const r = await fetch(API_BASE + '/api/license/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, hwid })
    });
    const d = await r.json();
    if (d.success) {
      localStorage.setItem('tdfram_web_key', key);
      localStorage.setItem('tdfram_web_lifetime', d.lifetime ? 'true' : 'false');
      localStorage.setItem('tdfram_web_expires_ms', String(d.expiresAtMs || 0));
      checkKeyRemainingTime();
      msgEl.innerHTML = '<span style="color:#34D399">' + d.message + '</span>';
      setTimeout(() => {
        document.getElementById('licenseGate').style.display = 'none';
        loadCatalog(1);
      }, 500);
    } else {
      msgEl.innerHTML = '<span style="color:#F87171">' + (d.message || '❌ คีย์ไม่ถูกต้อง') + '</span>';
    }
  } catch (e) {
    msgEl.innerHTML = '<span style="color:#FBBF24">⚠️ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่</span>';
  }
  btn.disabled = false;
  btn.textContent = '🔑 ยืนยันคีย์เข้าใช้งาน (Activate Key)';
}

function showKeyModal() {
  const key = localStorage.getItem('tdfram_web_key') || '-';
  const isLife = localStorage.getItem('tdfram_web_lifetime') === 'true';
  const expMs = parseInt(localStorage.getItem('tdfram_web_expires_ms') || '0', 10);
  const statusTxt = isLife ? 'ตลอดชีพ (Lifetime VIP)' : formatClientRemaining(expMs);
  const hwid = getOrCreateWebHwid();
  const nl = String.fromCharCode(10);
  if (confirm('🔑 สถานะคีย์: ' + statusTxt + nl + 'Key: ' + key + nl + 'HWID: ' + hwid + nl + nl + 'ต้องการออกจากระบบคีย์ (Logout) เพื่อเปลี่ยนคีย์ใหม่หรือไม่?')) {
    localStorage.removeItem('tdfram_web_key');
    localStorage.removeItem('tdfram_web_lifetime');
    localStorage.removeItem('tdfram_web_expires_ms');
    closePlayer();
    document.getElementById('licenseGate').style.display = 'flex';
  }
}

function initStudiosUi() {
  const dList = document.getElementById('studioDesktopList');
  const mBar = document.getElementById('studioMobileBar');
  dList.innerHTML = ''; mBar.innerHTML = '';
  STUDIOS.forEach(st => {
    const b = document.createElement('button');
    b.className = 'studio-btn' + (st.id === curStudio.id ? ' active' : '');
    b.innerHTML = '<span>' + st.name + '</span><span class="studio-badge">' + st.badge + '</span>';
    b.onclick = () => selectStudio(st);
    dList.appendChild(b);

    const mb = document.createElement('button');
    mb.className = 'chip-btn' + (st.id === curStudio.id ? ' active' : '');
    mb.textContent = st.name;
    mb.onclick = () => selectStudio(st);
    mBar.appendChild(mb);
  });
  renderCats();
}

function selectStudio(st) {
  curStudio = st;
  curCat = st.cats.length ? st.cats[0].id : '';
  curSearch = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('curStudioTitle').textContent = st.name;
  document.getElementById('curStudioSub').textContent = st.sub;
  initStudiosUi();
  loadCatalog(1);
}

function renderCats() {
  const bar = document.getElementById('catBar');
  bar.innerHTML = '';
  (curStudio.cats || []).forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip-btn' + (c.id === curCat ? ' active' : '');
    b.textContent = c.name;
    b.onclick = () => { curCat = c.id; renderCats(); loadCatalog(1); };
    bar.appendChild(b);
  });
}

function doSearch() { curSearch = document.getElementById('searchInput').value.trim(); loadCatalog(1); }
function toggleThai() {
  thaiOnly = !thaiOnly;
  const b = document.getElementById('thaiBtn');
  b.textContent = thaiOnly ? '🇹🇭 พากย์ไทย' : '🇹🇭 ทั้งหมด';
  b.classList.toggle('active', thaiOnly);
  loadCatalog(1);
}
function changePage(delta) {
  const next = curPage + delta;
  if (next >= 1 && next <= totalPages) loadCatalog(next);
}

function getLocalList(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; } }
function saveLocalList(key, arr) { localStorage.setItem(key, JSON.stringify(arr.slice(0, 80))); }

async function loadCatalog(page) {
  if (!checkKeyRemainingTime()) return;
  curPage = Math.max(1, page);
  const grid = document.getElementById('movieGrid');
  const stBox = document.getElementById('statusBox');
  grid.innerHTML = '';

  if (curStudio.id === 'history_fav') {
    const list = getLocalList(curCat === 'fav' ? 'tdfram_favs' : 'tdfram_history');
    currentItems = list; totalPages = 1;
    document.getElementById('pageLabel').textContent = '1/1';
    if (!list.length) {
      stBox.style.display = 'block';
      stBox.textContent = curCat === 'fav' ? '⭐ ยังไม่มีรายการโปรดที่บันทึกไว้' : '▶ ยังไม่มีประวัติการดูต่อ';
      return;
    }
    stBox.style.display = 'none';
    renderGrid(list);
    return;
  }

  stBox.style.display = 'block';
  stBox.textContent = '⏳ กำลังโหลดรายการจาก ' + curStudio.name + ' (หน้า ' + curPage + ')...';

  try {
    const q = new URLSearchParams({ source: curStudio.id, category: curCat, q: curSearch, page: String(curPage), thai: thaiOnly ? '1' : '0' });
    const r = await fetch(API_BASE + '/api/catalog?' + q.toString());
    const d = await r.json();
    currentItems = d.items || [];
    totalPages = Math.max(1, d.totalPages || 1);
    document.getElementById('pageLabel').textContent = curPage + '/' + totalPages;
    if (!currentItems.length) {
      stBox.textContent = '🎬 ไม่พบรายการในหมวดนี้ ลองเปลี่ยนหมวดหมู่หรือค้นหาใหม่';
      return;
    }
    stBox.style.display = 'none';
    renderGrid(currentItems);
  } catch (e) {
    stBox.textContent = '⚠️ โหลดรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
  }
}

function buildPosterProxyUrl(rawPoster) {
  if (!rawPoster) return '';
  return API_BASE + '/api/proxy-img?url=' + encodeURIComponent(rawPoster);
}

function renderGrid(items) {
  const grid = document.getElementById('movieGrid');
  grid.innerHTML = '';
  items.forEach(m => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    const rawPoster = m.poster || '';
    const proxyPoster = buildPosterProxyUrl(rawPoster);
    card.innerHTML =
      '<div class="poster-wrap">' +
        '<div class="poster-fallback"><span style="font-size:28px">🎬</span><span>' + m.title + '</span></div>' +
        (proxyPoster ? '<img class="poster-img" referrerpolicy="no-referrer" alt="">' : '') +
        '<div class="card-badges">' +
          '<span class="b-sound">' + (m.sound || 'พากย์ไทย') + '</span>' +
          '<span class="b-qual">' + (m.quality || 'HD') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-info">' +
        '<div class="card-title">' + m.title + '</div>' +
        '<div class="card-sub">' +
          '<span>' + (m.source || '').toUpperCase() + '</span>' +
          '<span>▶ ดูทันที</span>' +
        '</div>' +
      '</div>';
    const imgEl = card.querySelector('.poster-img');
    if (imgEl && rawPoster) {
      let step = 0;
      imgEl.onerror = function() {
        step++;
        if (step === 1) {
          imgEl.src = rawPoster;
        } else if (step === 2 && location.hostname.indexOf('vercel.app') === -1) {
          imgEl.src = 'https://testweb-azure-chi.vercel.app/tv/api/proxy-img?url=' + encodeURIComponent(rawPoster);
        } else {
          imgEl.style.display = 'none';
        }
      };
      imgEl.src = proxyPoster;
    }
    card.onclick = () => openMovie(m);
    grid.appendChild(card);
  });
}

function filterEpisodeRange(startIdx, endIdx, activeTabBtn) {
  document.querySelectorAll('.ep-range-btn').forEach(b => b.classList.remove('active'));
  if (activeTabBtn) activeTabBtn.classList.add('active');
  document.querySelectorAll('.ep-btn').forEach((b, idx) => {
    b.style.display = (idx >= startIdx && idx <= endIdx) ? '' : 'none';
  });
  const wrap = document.getElementById('epScrollWrap');
  if (wrap) wrap.scrollTop = 0;
}

async function openMovie(m) {
  if (!checkKeyRemainingTime()) return;
  activeMovie = m;
  const hist = getLocalList('tdfram_history').filter(x => x.id !== m.id);
  hist.unshift(m);
  saveLocalList('tdfram_history', hist);

  document.getElementById('playerModal').style.display = 'flex';
  document.getElementById('playerTitle').textContent = m.title;
  document.getElementById('playerEpSub').textContent = '⏳ กำลังดึงรายการตอนและสตรีม...';
  document.getElementById('epList').innerHTML = '';
  document.getElementById('epRangeBar').style.display = 'none';
  updateFavBtn();

  try {
    const q = new URLSearchParams({
      source: m.source, id: m.id, url: m.url || '', title: m.title || '', poster: m.poster || '', m3u8: m.m3u8 || ''
    });
    const r = await fetch(API_BASE + '/api/detail?' + q.toString());
    const d = await r.json();
    activeDetail = d;
    const eps = d.episodes || [];
    document.getElementById('epCountLabel').textContent = String(eps.length);
    const epList = document.getElementById('epList');
    const rangeBar = document.getElementById('epRangeBar');
    epList.innerHTML = '';
    rangeBar.innerHTML = '';

    if (eps.length > 30) {
      rangeBar.style.display = 'flex';
      const allBtn = document.createElement('button');
      allBtn.className = 'ep-range-btn active';
      allBtn.textContent = 'ทั้งหมด (' + eps.length + ')';
      allBtn.onclick = () => filterEpisodeRange(0, eps.length - 1, allBtn);
      rangeBar.appendChild(allBtn);

      const chunkSize = 30;
      for (let s = 0; s < eps.length; s += chunkSize) {
        const e = Math.min(eps.length - 1, s + chunkSize - 1);
        const rb = document.createElement('button');
        rb.className = 'ep-range-btn';
        rb.textContent = (s + 1) + '-' + (e + 1);
        rb.onclick = () => filterEpisodeRange(s, e, rb);
        rangeBar.appendChild(rb);
      }
    }

    eps.forEach((ep, idx) => {
      const b = document.createElement('button');
      b.className = 'ep-btn' + (idx === 0 ? ' active' : '');
      b.textContent = ep.name || ('ตอนที่ ' + (idx + 1));
      b.onclick = () => playEpisode(idx);
      epList.appendChild(b);
    });
    if (eps.length > 0) playEpisode(0);
    else document.getElementById('playerEpSub').textContent = '❌ ไม่พบรายการตอนสำหรับเรื่องนี้';
  } catch (e) {
    document.getElementById('playerEpSub').textContent = '❌ เกิดข้อผิดพลาดในการโหลดข้อมูล';
  }
}

function stepEpisode(delta) {
  if (!activeDetail || !activeDetail.episodes) return;
  const nextIdx = activeEpIdx + delta;
  if (nextIdx >= 0 && nextIdx < activeDetail.episodes.length) {
    playEpisode(nextIdx);
  }
}

async function playEpisode(idx) {
  if (!checkKeyRemainingTime()) return;
  if (!activeDetail || !activeDetail.episodes || !activeDetail.episodes[idx]) return;
  activeEpIdx = idx;
  const ep = activeDetail.episodes[idx];
  const btns = document.querySelectorAll('.ep-btn');
  btns.forEach((b, i) => {
    const isAct = (i === idx);
    b.classList.toggle('active', isAct);
    if (isAct) {
      b.style.display = '';
      try { b.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) {}
    }
  });
  document.getElementById('playerEpSub').textContent = 'กำลังเตรียมเล่น: ' + (ep.name || ('ตอนที่ ' + (idx + 1)));

  let streamUrl = ep.streamUrl || '';
  let referer = ep.referer || '';

  if (!streamUrl && ep.needFetch) {
    document.getElementById('playerEpSub').textContent = '⏳ กำลังแกะลิงก์วิดีโอ...';
    const q = new URLSearchParams({
      source: activeDetail.source,
      parentId: activeDetail.id,
      epId: ep.id || String(idx + 1),
      embedUrl: ep.embedUrl || ''
    });
    const r = await fetch(API_BASE + '/api/resolve?' + q.toString());
    const d = await r.json();
    streamUrl = d.streamUrl || '';
    referer = d.referer || '';
    ep.streamUrl = streamUrl;
    ep.referer = referer;
    if (streamUrl) ep.needFetch = false;
  }

  if (!streamUrl) {
    document.getElementById('playerEpSub').textContent = '❌ ไม่พบไฟล์สตรีมในตอนนี้';
    return;
  }

  document.getElementById('playerEpSub').textContent = '▶ กำลังเล่น: ' + (ep.name || ('ตอนที่ ' + (idx + 1))) + ' / ' + activeDetail.episodes.length;
  const isHls = streamUrl.includes('.m3u8');
  const needProxy = isHls || streamUrl.includes('rongyok.com') || streamUrl.includes('digitalallthings.online') || streamUrl.includes('cdreader.com');
  const finalUrl = needProxy
    ? API_BASE + '/api/proxy-stream?url=' + encodeURIComponent(streamUrl) + '&referer=' + encodeURIComponent(referer)
    : streamUrl;

  const video = document.getElementById('videoEl');
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }

  if (isHls && window.Hls && Hls.isSupported()) {
    hlsInstance = new Hls({ maxBufferLength: 30 });
    hlsInstance.loadSource(finalUrl);
    hlsInstance.attachMedia(video);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
  } else {
    video.src = finalUrl;
    video.play().catch(() => {});
  }

  video.onended = () => {
    if (activeDetail && idx + 1 < activeDetail.episodes.length) {
      playEpisode(idx + 1);
    }
  };
}

function toggleFavActive() {
  if (!activeMovie) return;
  let favs = getLocalList('tdfram_favs');
  const exists = favs.some(x => x.id === activeMovie.id);
  if (exists) favs = favs.filter(x => x.id !== activeMovie.id);
  else favs.unshift(activeMovie);
  saveLocalList('tdfram_favs', favs);
  updateFavBtn();
}

function updateFavBtn() {
  if (!activeMovie) return;
  const exists = getLocalList('tdfram_favs').some(x => x.id === activeMovie.id);
  document.getElementById('favPlayerBtn').textContent = exists ? '⭐ โปรดแล้ว' : '☆ โปรด';
}

function closePlayer() {
  const video = document.getElementById('videoEl');
  video.pause();
  video.removeAttribute('src');
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  document.getElementById('playerModal').style.display = 'none';
}

initLicenseGate();
</script>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════════════════
//  6. Worker Entrypoint
// ════════════════════════════════════════════════════════════════════════════
const worker = {
  async fetch(request) {
    const urlObj = new URL(request.url);
    const isTv = urlObj.pathname === "/tv" || urlObj.pathname.startsWith("/tv/");
    const path = urlObj.pathname.replace(/^\/tv(?=\/|$)/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders() });
    }

    if (path === "/" || path === "/index.html") {
      let html = buildWebAppHtml();
      if (isTv) {
        html = html.replace('href="/manifest.json"', 'href="/tv/manifest.json"')
                   .replace(/href="\/icon\.svg"/g, 'href="/tv/icon.svg"');
      }
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" }
      });
    }

    if (path === "/manifest.json") {
      const mf = isTv
        ? MANIFEST_JSON.replace('"start_url": "/"', '"start_url": "/tv"').replace('"/icon.svg"', '"/tv/icon.svg"')
        : MANIFEST_JSON;
      return new Response(mf, {
        status: 200,
        headers: { "Content-Type": "application/manifest+json; charset=utf-8" }
      });
    }

    if (path === "/icon.svg") {
      return new Response(ICON_SVG, {
        status: 200,
        headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400" }
      });
    }

    if (path === "/api/license/verify" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const ua = request.headers.get("User-Agent") || "";
      const res = await verifyPermanentLicense(body.key, body.hwid, ua);
      return jsonResp(res);
    }

    if (path === "/api/catalog") {
      const source = urlObj.searchParams.get("source") || "movie911";
      const category = urlObj.searchParams.get("category") || "";
      const q = urlObj.searchParams.get("q") || "";
      const page = parseInt(urlObj.searchParams.get("page") || "1", 10);
      const thaiOnly = urlObj.searchParams.get("thai") === "1";
      const data = await fetchStudioCatalog(source, category, q, page, thaiOnly);
      return jsonResp(data);
    }

    if (path === "/api/detail") {
      try {
        const source = urlObj.searchParams.get("source") || "movie911";
        const id = urlObj.searchParams.get("id") || "";
        const url = urlObj.searchParams.get("url") || "";
        const title = urlObj.searchParams.get("title") || "";
        const poster = urlObj.searchParams.get("poster") || "";
        const m3u8 = urlObj.searchParams.get("m3u8") || "";
        const data = await fetchMovieDetail(source, id, url, title, poster, m3u8);
        return jsonResp(data);
      } catch (e) {
        return jsonResp({ episodes: [], error: e.message || "Detail error" });
      }
    }

    if (path === "/api/resolve") {
      try {
        const source = urlObj.searchParams.get("source") || "movie911";
        const parentId = urlObj.searchParams.get("parentId") || "";
        const epId = urlObj.searchParams.get("epId") || "1";
        const embedUrl = urlObj.searchParams.get("embedUrl") || "";
        const res = await resolveEpisodeStream(source, parentId, epId, embedUrl);
        return jsonResp(res);
      } catch (e) {
        return jsonResp({ streamUrl: "", error: e.message || "Resolve error" });
      }
    }

    if (path === "/api/proxy-img") {
      return await handleImageProxy(urlObj);
    }

    if (path === "/api/proxy-stream" || path === "/api/proxy-m3u8") {
      return await handleStreamProxy(request, urlObj);
    }

    return jsonResp({ error: "Not Found" }, 404);
  }
};

export async function GET(request) {
  return worker.fetch(request);
}
export async function POST(request) {
  return worker.fetch(request);
}
export async function OPTIONS(request) {
  return worker.fetch(request);
}
