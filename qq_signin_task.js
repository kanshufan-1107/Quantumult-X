/**
 * QQ 每日打卡签到（Quantumult X Task 脚本 · 多账号版）
 *
 * Quantumult X 配置（[task_local] 段）：
 *   0 8 * * * qq_signin_task.js, tag=QQ每日打卡, img-url=https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ee/c8/4f/eec84f53-6c1f-5b1b-6e24-bc25a8a77fe3/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/512x512bb.jpg, enabled=true
 *
 * Cookie 由 qq-cookie-save.js 拦截后按 UIN 自动写入 $prefs（key: qq_cookies）
 * 支持任意数量账号，逐个顺序执行签到
 */

const QUA        = 'V1_IPH_SQ_9.2.90_1_APP_A';
const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.2.90.610 V1_IPH_SQ_9.2.90_1_APP_A Pixel/1206 Core/WKWebView Device/Apple(iPhone X) NetType/WIFI';

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function calcGtk(cookie) {
  const pSkey = (cookie.match(/p_skey=([^;]+)/) || [])[1] || '';
  let hash = 5381;
  for (let i = 0; i < pSkey.length; i++) {
    hash += (hash << 5) + pSkey.charCodeAt(i);
  }
  return (hash & 0x7fffffff).toString();
}

function getUin(cookie) {
  return (cookie.match(/\buin=o?(\d+)/) || [])[1] || '未知';
}

function makeOpts(method, url, cookie, body) {
  const opts = {
    method,
    url,
    headers: {
      'Content-Type'   : 'application/json',
      'Accept'         : 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      'Origin'         : 'https://ti.qq.com',
      'Referer'        : 'https://ti.qq.com/signin/public/index.html?_wv=1090528161&_wwv=13',
      'User-Agent'     : USER_AGENT,
      'Cookie'         : cookie,
    },
  };
  if (body) opts.body = body;
  return opts;
}

function fetchJSON(opts) {
  return new Promise((resolve, reject) => {
    $task.fetch(opts).then(
      resp => {
        try { resolve(JSON.parse(resp.body)); }
        catch (e) { reject(new Error('JSON 解析失败：' + resp.body.slice(0, 80))); }
      },
      err => reject(new Error(err.error || JSON.stringify(err)))
    );
  });
}

// ── 单账号签到逻辑 ────────────────────────────────────────────────────────────

function queryStatus(cookie, bkn) {
  return fetchJSON(makeOpts('GET',
    `https://ti.qq.com/proxy/domain/club.vip.qq.com/mono/api/sign-in/getVipSignInInfo?g_tk=${bkn}`,
    cookie
  ));
}

function doSignIn(cookie, uin, bkn) {
  return fetchJSON(makeOpts('POST',
    'https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignIn',
    cookie,
    JSON.stringify({
      uin,
      type: 1,
      qua: QUA,
      mpExtend: {
        tianshuAdsReq: JSON.stringify({ app: 'QQ', os: 'iOS', version: '9.2.90', imei: '' }),
      },
    })
  ));
}

function verifyResult(json) {
  const ret     = json.ret;
  const msg     = json.msg || '';
  const data    = json.data || {};
  const retCode = data.retCode;

  if (ret !== 0) {
    return { ok: false, subtitle: `请求错误 ret=${ret}`, body: msg };
  }
  if (retCode === 0) {
    const outlook = data.signInOutLook || {};
    return {
      ok      : true,
      subtitle: `累计签到 ${data.totalDays || '?'} 天`,
      body    : (outlook.title || '日签卡') + (outlook.buttonDoc ? '\n' + outlook.buttonDoc : ''),
    };
  }
  const retCodeMap = {
    300002: '今日已签到',
    300003: '签到请求异常',
    400001: '登录态失效，请重新抓包',
  };
  return {
    ok      : retCode === 300002,
    subtitle: retCodeMap[retCode] || `业务错误 retCode=${retCode}`,
    body    : '',
  };
}

// 对单个账号执行完整签到流程，返回结果描述字符串
async function signInOne(cookie) {
  const uin = getUin(cookie);
  const bkn = calcGtk(cookie);

  try {
    // 先查当天状态
    const info   = await queryStatus(cookie, bkn);
    const status = (info.data || {}).currentDayStatus;
    const days   = (info.data || {}).signedDays || 0;

    if (status === 1) {
      return { uin, ok: true, subtitle: `今日已签到，累计 ${days} 天`, body: '' };
    }
  } catch (_) {
    // 查询失败不中断，继续尝试签到
  }

  const resp   = await doSignIn(cookie, uin, bkn);
  const result = verifyResult(resp);
  return { uin, ...result };
}

// ── 主流程：遍历所有账号 ──────────────────────────────────────────────────────

(async () => {
  // 读取多账号存储
  let accounts = {};
  try {
    const raw = $prefs.valueForKey('qq_cookies');
    if (raw) accounts = JSON.parse(raw);
  } catch (_) {}

  const uins = Object.keys(accounts);

  if (uins.length === 0) {
    $notify('⚠️ QQ 每日打卡', '未找到任何账号', '请先打开 QQ 打卡页面触发抓包');
    $done({});
    return;
  }

  // 逐账号顺序执行（避免并发触发风控）
  const results = [];
  for (const uin of uins) {
    try {
      const r = await signInOne(accounts[uin]);
      results.push(r);
    } catch (e) {
      results.push({ uin, ok: false, subtitle: '请求失败', body: e.message });
    }
  }

  // 汇总通知
  const total   = results.length;
  const success = results.filter(r => r.ok).length;
  const lines   = results.map(r =>
    `${r.ok ? '✅' : '❌'} ${r.uin}：${r.subtitle}`
  ).join('\n');

  $notify(
    `QQ 每日打卡（${success}/${total} 成功）`,
    `共 ${total} 个账号`,
    lines
  );

  $done({});
})();
