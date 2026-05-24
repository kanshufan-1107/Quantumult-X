/**
 * 京东签到 - 自动保存 Cookie（支持多账号）
 *
 * Quantumult X 配置（[rewrite_local] 段）：
 *   ^https://api\.m\.jd\.com/api\?functionId=bff_rights_center_index url script-request-body jd-cookie-save.js
 *
 * 说明：
 *   每次打开京东签到页面，该请求必定触发且携带完整 Cookie 和 h5st tk token
 *   Cookie 按 pt_pin 存入 $prefs，key: jd_cookies
 *
 * 存储格式：
 *   {
 *     "jd_7737ee0307dbc": {
 *       "cookie": "pt_key=xxx; pt_pin=xxx; ...",
 *       "tk": "tk03w59331a2918n...",
 *       "eid": "jdd03UVD2R6TC...",
 *       "ua": "jdapp;iPhone;..."
 *     }
 *   }
 */

// ── 读取请求 Cookie 和 Body ────────────────────────────────────────────────────

const reqHeaders = $request.headers || {};
const cookie     = reqHeaders['Cookie'] || reqHeaders['cookie'] || '';
const bodyRaw    = $request.body || '';

// pt_pin 作为账号唯一标识
const pinMatch = cookie.match(/pt_pin=([^;]+)/);
const pin      = pinMatch ? decodeURIComponent(pinMatch[1]).trim() : null;

if (!pin || !cookie.includes('pt_key=')) {
  $done({});
} else {

  // ── 提取关键 Cookie 字段 ──────────────────────────────────────────────────
  function getCookieVal(name) {
    const m = cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? m[1].trim() : '';
  }

  const essentialKeys = [
    'pt_key', 'pt_pin', 'sdtoken',
    '3AB9D23F7A4B3C9B', '3AB9D23F7A4B3CSS',
    'shshshfpa', 'shshshfpb', 'shshshfpv', 'shshshfpx',
    '__jda', '__jdb', '__jdc', '__jdv',
    'mba_muid', 'mba_sid',
    '__jd_ref_cls', 'unpl',
  ];

  const cookieParts = essentialKeys
    .map(k => { const v = getCookieVal(k); return v ? `${k}=${v}` : null; })
    .filter(Boolean);
  const savedCookie = cookieParts.join('; ');

  // ── 从 Body 提取 h5st tk token ────────────────────────────────────────────
  let tk = '';
  try {
    // h5st 格式: 时间戳;随机;appHash;tk03w...;md5;版本;ts;加密数据
    const h5stMatch = bodyRaw.match(/h5st=([^&]+)/);
    if (h5stMatch) {
      const h5st  = decodeURIComponent(h5stMatch[1]);
      const parts = h5st.split(';');
      if (parts.length >= 4 && parts[3].startsWith('tk')) {
        tk = parts[3];
      }
    }
  } catch (_) {}

  // ── 从 Body 提取 eid token ────────────────────────────────────────────────
  let eid = '';
  try {
    const eidMatch = bodyRaw.match(/x-api-eid-token=([^&]+)/);
    if (eidMatch) eid = decodeURIComponent(eidMatch[1]);
  } catch (_) {}

  // ── UA ────────────────────────────────────────────────────────────────────
  const ua = reqHeaders['User-Agent'] || reqHeaders['user-agent'] || '';

  // ── 写入 $prefs ───────────────────────────────────────────────────────────
  let accounts = {};
  try {
    const raw = $prefs.valueForKey('jd_cookies');
    if (raw) accounts = JSON.parse(raw);
  } catch (_) {}

  const isNew    = !accounts[pin];
  const prevTk   = (accounts[pin] || {}).tk || '';
  const finalTk  = tk || prevTk; // tk 优先用最新的

  accounts[pin] = {
    cookie: savedCookie,
    tk    : finalTk,
    eid   : eid || (accounts[pin] || {}).eid || '',
    ua    : ua  || (accounts[pin] || {}).ua  || '',
  };

  $prefs.setValueForKey(JSON.stringify(accounts), 'jd_cookies');

  const total = Object.keys(accounts).length;
  $notify(
    '京东签到',
    isNew ? `🆕 新增账号 ${pin}` : `🔄 账号 ${pin} Cookie 已更新`,
    `共 ${total} 个账号已保存${finalTk ? '，tk token ✅' : '，⚠️ tk token 未获取'}`
  );

  $done({});
}
