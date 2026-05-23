// ── 读取上次保存的 Cookie ──────────────────────
const cookie = $prefs.valueForKey("qq_cookie");

if (!cookie) {
  $notify("QQ 登录验证", "⚠️ 未找到 Cookie", "请先打开 QQ 打卡页触发拦截脚本");
  $done({});
  return;
}

// ── 工具函数 ──────────────────────────────────

function getCookieVal(str, key) {
  const m = str.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
  return m ? m[1] : "";
}

// ⚠️  ti.qq.com 域下必须用 p_skey 计算 g_tk
function calcGtk(pSkey) {
  let h = 5381;
  for (const c of pSkey) {
    h += (h << 5) + c.charCodeAt(0);
    h = h >>> 0;
  }
  return h & 0x7fffffff;
}

const uin   = getCookieVal(cookie, "uin").replace(/^o/, "");
const pSkey = getCookieVal(cookie, "p_skey");
const gTk   = calcGtk(pSkey);

console.log(`[QQ验证] UIN=${uin}  g_tk=${gTk}`);

// ── 发起请求 ──────────────────────────────────

$task.fetch({
  url: `https://ti.qq.com/proxy/domain/club.vip.qq.com/mono/api/sign-in/getVipSignInInfo?g_tk=${gTk}`,
  method: "GET",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) " +
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 " +
      "QQ/9.2.90.610 V1_IPH_SQ_9.2.90_1_APP_A",
    "Accept":          "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    "Referer":
      "https://ti.qq.com/signin/public/index.html?_wv=1090528161&_wwv=13",
    "Cookie": cookie,
  },
}).then((res) => {
  let data;
  try { data = JSON.parse(res.body); } catch { data = null; }

  console.log(`[QQ验证] HTTP ${res.statusCode}  ${res.body.slice(0, 200)}`);

  if (res.statusCode === 200 && data?.code === 0) {
    const d = data?.data ?? {};
    const status  = d.currentDayStatus === 1 ? "已签到 ✅" : "未签到";
    const days    = d.signedDays ?? 0;
    $notify(
      "QQ 登录验证",
      `✅ 登录态有效  账号：${uin}`,
      `今日：${status}　连续签到：${days} 天`
    );
  } else if (res.statusCode === 403) {
    $notify("QQ 登录验证", "❌ Cookie 已过期", "请重新打开 QQ 打卡页刷新 Cookie");
  } else {
    $notify(
      "QQ 登录验证",
      `❌ 异常 HTTP ${res.statusCode}`,
      res.body.slice(0, 100)
    );
  }

  $done({});
}).catch((err) => {
  console.log(`[QQ验证] 请求失败：${err}`);
  $notify("QQ 登录验证", "❌ 网络请求失败", String(err));
  $done({});
});