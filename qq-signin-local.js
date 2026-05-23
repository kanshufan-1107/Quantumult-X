#!/usr/bin/env node
/**
 * QQ 登录态验证脚本 (Node.js)
 * 运行：node qq_signin_test.js
 * 依赖：Node.js 18+（内置 fetch，无需安装）
 */

// ──────────────────────────────────────────────
// 配置区：替换为你自己的最新 Cookie
// ──────────────────────────────────────────────

const UIN = "197351245";

const COOKIE_RAW = [
  "qq_locale_id=2052",
  "skey=1lQJrPTWXb",
  "uin=o0197351245",
  "a2=EB662249B649BEB2D18B0B338D5B1DA94BD4723FBEBF85BDD9D904FE788FA04C24F7B7A8AC610FE7257FC2F7BB76203188E10D4D24C9BB4CA2E40F507D5D33028DB31FBCEE46837A",
  "dvid1=B6F7C034FDFE4D9195562E5557E55BC1",
  "dvid3=D41D8CD98F00B204E9800998ECF8427E",
  "dvid5=BEA41961-A974-40AC-AC6A-04013C375BA4",
  "p_skey=zcUIIhG7cxWQIwdbVtiVxqKUW7tz7zVbSjJAnBt7-6I_",
  "p_uid=u_FjCXkaKYKTWkQbbIfnlVLQ",
  "p_uin=o0197351245",
].join("; ");

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

function getCookieVal(cookieStr, key) {
  for (const part of cookieStr.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === key) return v ?? "";
  }
  return "";
}

// ⚠️  ti.qq.com 域下必须用 p_skey 计算 g_tk，不能用 skey
function calcGtk(pSkey) {
  let h = 5381;
  for (const c of pSkey) {
    h += (h << 5) + c.charCodeAt(0);
    h = h >>> 0;
  }
  return h & 0x7fffffff;
}

const P_SKEY = getCookieVal(COOKIE_RAW, "p_skey");
const G_TK   = calcGtk(P_SKEY);

// ──────────────────────────────────────────────
// 登录态验证
// ──────────────────────────────────────────────

async function checkLogin() {
  console.log("=".repeat(45));
  console.log("  QQ 登录态验证");
  console.log(`  UIN=${UIN}  g_tk=${G_TK}`);
  console.log("=".repeat(45) + "\n");

  const url = new URL(
    "https://ti.qq.com/proxy/domain/club.vip.qq.com/mono/api/sign-in/getVipSignInInfo"
  );
  url.searchParams.set("g_tk", G_TK);

  let status, data;
  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) " +
          "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 " +
          "QQ/9.2.90.610 V1_IPH_SQ_9.2.90_1_APP_A",
        "Accept":          "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Referer":
          "https://ti.qq.com/signin/public/index.html?_wv=1090528161&_wwv=13",
        "Cookie": COOKIE_RAW,
      },
    });
    status = res.status;
    data   = await res.json().catch(() => null);
  } catch (err) {
    console.error("❌ 网络请求失败：", err.message);
    return;
  }

  console.log(`HTTP ${status}  ${JSON.stringify(data)}\n`);
  console.log("=".repeat(45));

  if (status === 200 && data?.code === 0) {
    const d = data?.data ?? {};
    console.log("  ✅ 登录态有效");
    console.log(`  连续签到：${d.signedDays ?? "?"} 天`);
    console.log(`  今日状态：${d.currentDayStatus === 1 ? "已签到" : "未签到"}`);
  } else {
    console.log("  ❌ 登录态已失效，请重新抓包更新 Cookie");
    if (data) console.log(`  ${JSON.stringify(data).slice(0, 150)}`);
  }

  console.log("=".repeat(45));
}

checkLogin().catch(console.error);