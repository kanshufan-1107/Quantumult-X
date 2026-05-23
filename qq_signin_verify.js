/**
 * QQ 每日打卡签到验证脚本（Node.js）
 *
 * 用法：node qq_signin_verify.js
 * 依赖：Node.js 18+（使用内置 fetch）；如需旧版本请运行 npm install node-fetch
 *
 * 配置：修改下方 CONFIG 中的 Cookie 字段（从 Quantumult X 抓到新的 skey / p_skey）
 */

// ── 配置区（每次 Cookie 过期后在此更新） ─────────────────────────────────────

const CONFIG = {
  uin: '1569749008',

  // 从 HAR / Quantumult X 抓包中复制完整 Cookie 字符串
  cookie: [
    'qq_locale_id=2052',
    'skey=ZS3Q3SWIdL',
    'uin=o1569749008',
    'a2=8E288C1186FB3A6660782FD9871C9D6EE644A58947C239B949FC44EAF84863661A930C79C7725B682D68D1DC25724953B00EC379EB92BF832670D5460D86D0E8928DB6687DB28680',
    'dvid1=B6F7C034FDFE4D9195562E5557E55BC1',
    'dvid3=D41D8CD98F00B204E9800998ECF8427E',
    'dvid5=BEA41961-A974-40AC-AC6A-04013C375BA4',
    'p_skey=rAPupwdzpD1QZyD9Sae2CyQbR1s1LSc3-6f4bCT3Klc_',
    'p_uid=u_yoclal7zwTpw9DpUgrY62w',
    'p_uin=o1569749008',
  ].join('; '),

  // g_tk / bkn：由 p_skey 计算得出，脚本启动时会自动重新计算
  bkn: '',

  qua: 'V1_IPH_SQ_9.2.90_1_APP_A',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Mobile/15E148 QQ/9.2.90.610 V1_IPH_SQ_9.2.90_1_APP_A ' +
    'Pixel/1206 Core/WKWebView Device/Apple(iPhone X) NetType/WIFI',
};

// ── 工具：计算 g_tk（bkn） ────────────────────────────────────────────────────

function calcGtk(pSkey) {
  let hash = 5381;
  for (let i = 0; i < pSkey.length; i++) {
    hash += (hash << 5) + pSkey.charCodeAt(i);
  }
  return (hash & 0x7fffffff).toString();
}

// ── 公共请求头 ────────────────────────────────────────────────────────────────

function commonHeaders(extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'Origin': 'https://ti.qq.com',
    'Referer': 'https://ti.qq.com/signin/public/index.html?_wv=1090528161&_wwv=13',
    'User-Agent': CONFIG.userAgent,
    'Cookie': CONFIG.cookie,
    ...extraHeaders,
  };
}

// ── Step 1：签到前查询（可选，验证登录态） ────────────────────────────────────

async function getVipSignInInfo() {
  const url = `https://ti.qq.com/proxy/domain/club.vip.qq.com/mono/api/sign-in/getVipSignInInfo?g_tk=${CONFIG.bkn}`;
  const res  = await fetch(url, { headers: commonHeaders() });
  const json = await res.json();

  const d = json.data ?? {};
  return {
    raw: json,
    currentDayStatus: d.currentDayStatus, // 0=未签到 1=已签到
    signedDays: d.signedDays ?? 0,
  };
}

// ── Step 2：执行签到 ──────────────────────────────────────────────────────────

async function doSignIn() {
  const url  = 'https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignIn';
  const body = JSON.stringify({
    uin: CONFIG.uin,
    type: 1,
    qua: CONFIG.qua,
    mpExtend: {
      tianshuAdsReq: JSON.stringify({ app: 'QQ', os: 'iOS', version: '9.2.90', imei: '' }),
    },
  });

  const res  = await fetch(url, { method: 'POST', headers: commonHeaders(), body });
  const json = await res.json();
  return json;
}

// ── Step 3：验证签到结果 ──────────────────────────────────────────────────────

function verifySignIn(json) {
  const ret     = json.ret;
  const msg     = json.msg ?? '';
  const data    = json.data ?? {};
  const retCode = data.retCode;

  if (ret !== 0) {
    return { success: false, reason: `请求层错误 ret=${ret}，msg=${msg}` };
  }

  if (retCode === 0) {
    const totalDays = data.totalDays ?? '?';
    const outlook   = data.signInOutLook ?? {};
    const cardTitle = outlook.title    ?? '日签卡';
    const cardDesc  = outlook.desc     ?? '';
    const btnDoc    = outlook.buttonDoc ?? '';
    return {
      success: true,
      totalDays,
      cardTitle,
      cardDesc,
      btnDoc,
    };
  }

  const retCodeMap = {
    300001: '尚未签到（初始状态）',
    300002: '今日已签到，请勿重复操作',
    300003: '签到请求异常',
    400001: '登录态失效，请更新 Cookie',
  };
  return {
    success: false,
    reason: retCodeMap[retCode] ?? `业务错误 retCode=${retCode}`,
  };
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

async function main() {
  const sep = '─'.repeat(50);
  console.log(sep);
  console.log(' QQ 每日打卡签到验证');
  console.log(sep);

  // 计算并覆盖 bkn（以防止使用过期值）
  const rawPSkey = CONFIG.cookie.match(/p_skey=([^;]+)/)?.[1] ?? '';
  if (rawPSkey) {
    const computed = calcGtk(rawPSkey);
    if (computed !== CONFIG.bkn) {
      console.log(`[信息] 检测到 g_tk 与 p_skey 不一致，已自动修正：${computed}`);
      CONFIG.bkn = computed;
    }
  }

  // Step 1：签到前状态
  console.log('\n[1/3] 查询签到前状态...');
  let before;
  try {
    before = await getVipSignInInfo();
    console.log(`  currentDayStatus : ${before.currentDayStatus === 0 ? '未签到' : '已签到'}`);
    console.log(`  累计签到天数      : ${before.signedDays} 天`);

    if (before.currentDayStatus === 1) {
      console.log('\n⚠️  今日已签到，无需重复操作。');
      console.log(sep);
      return;
    }
  } catch (e) {
    console.warn(`  查询失败（${e.message}），继续尝试签到...`);
  }

  // Step 2：执行签到
  console.log('\n[2/3] 发送签到请求...');
  let signInResp;
  try {
    signInResp = await doSignIn();
    console.log(`  HTTP 响应：ret=${signInResp.ret}, retCode=${signInResp.data?.retCode}`);
  } catch (e) {
    console.error(`  ❌ 网络请求失败：${e.message}`);
    process.exit(1);
  }

  // Step 3：验证结果
  console.log('\n[3/3] 验证签到结果...');
  const result = verifySignIn(signInResp);

  if (result.success) {
    console.log(`  ✅ 签到成功！`);
    console.log(`  累计签到天数 : ${result.totalDays} 天`);
    console.log(`  获得卡片     : ${result.cardTitle}${result.cardDesc ? '—' + result.cardDesc : ''}`);
    if (result.btnDoc) console.log(`  奖励提示     : ${result.btnDoc}`);
  } else {
    console.log(`  ❌ 签到失败：${result.reason}`);
  }

  // 可选：签到后二次验证
  if (result.success) {
    console.log('\n[+] 签到后二次验证...');
    try {
      const after = await getVipSignInInfo();
      const confirmed = after.currentDayStatus === 1;
      console.log(`  服务端状态确认 : ${confirmed ? '✅ 已签到' : '⚠️ 状态异常'}`);
      console.log(`  最新累计天数   : ${after.signedDays} 天`);
    } catch (e) {
      console.warn(`  二次验证失败（${e.message}）`);
    }
  }

  console.log('\n' + sep);
}

main().catch(err => {
  console.error('脚本异常：', err);
  process.exit(1);
});
