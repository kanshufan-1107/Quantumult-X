/**
 * QQ 每日打卡签到（Quantumult X Task 脚本）
 *
 * Quantumult X 配置（[task_local] 段）：
 *   # 每天早上 8 点自动签到
 *   0 8 * * * qq_signin_task.js, tag=QQ每日打卡, img-url=https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ee/c8/4f/eec84f53-6c1f-5b1b-6e24-bc25a8a77fe3/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/512x512bb.jpg, enabled=true
 *
 * 配置说明：
 *   - Cookie 由 qq-cookie-save.js 拦截后自动写入 $prefs（key: qq_cookie）
 *   - 无需手动填写 Cookie，打开 QQ 打卡页面触发一次抓包即可
 */

// ── 读取 Cookie（由 qq-cookie-save.js 自动保存） ──────────────────────────────

const COOKIE = $prefs.valueForKey('qq_cookie');

if (!COOKIE) {
  $notify('⚠️ QQ 每日打卡', 'Cookie 未找到', '请先打开 QQ 打卡页面触发一次抓包保存');
  $done({});
}

const QUA        = 'V1_IPH_SQ_9.2.90_1_APP_A';
const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.2.90.610 V1_IPH_SQ_9.2.90_1_APP_A Pixel/1206 Core/WKWebView Device/Apple(iPhone X) NetType/WIFI';

// ── 工具：计算 g_tk（bkn） ────────────────────────────────────────────────────

function calcGtk(cookie) {
  const pSkey = (cookie.match(/p_skey=([^;]+)/) || [])[1] || '';
  let hash = 5381;
  for (let i = 0; i < pSkey.length; i++) {
    hash += (hash << 5) + pSkey.charCodeAt(i);
  }
  return (hash & 0x7fffffff).toString();
}

function getUin(cookie) {
  const raw = (cookie.match(/\buin=o?(\d+)/) || [])[1] || '';
  return raw;
}

// ── 公共请求选项生成器 ────────────────────────────────────────────────────────

function makeOpts(method, url, body) {
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
      'Cookie'         : COOKIE,
    },
  };
  if (body) opts.body = body;
  return opts;
}

// ── 步骤封装 ──────────────────────────────────────────────────────────────────

function fetchTask(opts) {
  return new Promise((resolve, reject) => {
    $task.fetch(opts).then(
      resp => {
        try { resolve(JSON.parse(resp.body)); }
        catch (e) { reject(new Error('JSON 解析失败：' + resp.body.slice(0, 100))); }
      },
      err => reject(new Error(err.error || JSON.stringify(err)))
    );
  });
}

// Step 1：查询签到前状态
function querySignInStatus(bkn) {
  const url = `https://ti.qq.com/proxy/domain/club.vip.qq.com/mono/api/sign-in/getVipSignInInfo?g_tk=${bkn}`;
  return fetchTask(makeOpts('GET', url));
}

// Step 2：执行签到
function doSignIn(uin, bkn) {
  const url  = 'https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignIn';
  const body = JSON.stringify({
    uin,
    type: 1,
    qua: QUA,
    mpExtend: {
      tianshuAdsReq: JSON.stringify({ app: 'QQ', os: 'iOS', version: '9.2.90', imei: '' }),
    },
  });
  return fetchTask(makeOpts('POST', url, body));
}

// Step 3：验证响应
function verifyResult(json) {
  const ret     = json.ret;
  const msg     = json.msg || '';
  const data    = json.data || {};
  const retCode = data.retCode;

  if (ret !== 0) {
    return { ok: false, title: '❌ 签到失败', body: `请求错误 ret=${ret}，${msg}` };
  }

  if (retCode === 0) {
    const totalDays = data.totalDays || '?';
    const outlook   = data.signInOutLook || {};
    const cardTitle = outlook.title    || '日签卡';
    const btnDoc    = outlook.buttonDoc || '';
    return {
      ok: true,
      title: '✅ QQ 每日打卡成功',
      subtitle: `累计签到 ${totalDays} 天`,
      body: cardTitle + (btnDoc ? '\n' + btnDoc : ''),
    };
  }

  const retCodeMap = {
    300001: '尚未签到（初始状态）',
    300002: '今日已签到，请勿重复操作',
    300003: '签到请求异常',
    400001: '登录态失效，请更新 Cookie',
  };
  return {
    ok: false,
    title: retCode === 300002 ? '☑️ 今日已签到' : '❌ 签到失败',
    body: retCodeMap[retCode] || `业务错误 retCode=${retCode}`,
  };
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

const bkn = calcGtk(COOKIE);
const uin = getUin(COOKIE);

// 先查询当天状态，已签到则直接通知退出，否则执行签到
querySignInStatus(bkn)
  .then(info => {
    const status = (info.data || {}).currentDayStatus;
    const days   = (info.data || {}).signedDays || 0;

    if (status === 1) {
      // 今天已经签到过
      $notify('☑️ QQ 每日打卡', `今日已签到，累计 ${days} 天`, '无需重复操作');
      $done({});
      return;
    }

    // 未签到，执行签到
    return doSignIn(uin, bkn).then(resp => {
      const result = verifyResult(resp);
      $notify(result.title, result.subtitle || '', result.body || '');
      $done({});
    });
  })
  .catch(err => {
    // 查询失败时仍尝试签到（网络抖动等情况）
    doSignIn(uin, bkn)
      .then(resp => {
        const result = verifyResult(resp);
        $notify(result.title, result.subtitle || '', result.body || '');
      })
      .catch(e2 => {
        $notify('⚠️ QQ 每日打卡', '请求失败', e2.message);
      })
      .finally(() => $done({}));
  });
