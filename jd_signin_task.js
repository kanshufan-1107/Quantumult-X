/**
 * 京东每日签到（Quantumult X Task 脚本 · 多账号版）
 *
 * Quantumult X 配置（[task_local] 段）：
 *   0 8 * * * jd_signin_task.js, tag=京东每日签到, img-url=https://img14.360buyimg.com/imagetools/jfs/t1/94651/14/2005/4875/5dc49c73E3e88645c/52db8d8b5897b5ac.png, enabled=true
 *
 * Cookie 由 jd-cookie-save.js 拦截后按 pt_pin 自动写入 $prefs（key: jd_cookies）
 */

// ═══════════════════════════════════════════════════════════
// MD5 实现（纯 JS，无外部依赖）
// ═══════════════════════════════════════════════════════════

function md5(str) {
  function safeAdd(x, y) { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a,b,c,d,x,s,t){ return md5cmn((b&c)|((~b)&d),a,b,x,s,t); }
  function md5gg(a,b,c,d,x,s,t){ return md5cmn((b&d)|(c&(~d)),a,b,x,s,t); }
  function md5hh(a,b,c,d,x,s,t){ return md5cmn(b^c^d,a,b,x,s,t); }
  function md5ii(a,b,c,d,x,s,t){ return md5cmn(c^(b|(~d)),a,b,x,s,t); }
  function calc(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for (let i=0;i<x.length;i+=16) {
      const [oa,ob,oc,od]=[a,b,c,d];
      a=md5ff(a,b,c,d,x[i],7,-680876936);    d=md5ff(d,a,b,c,x[i+1],12,-389564586);
      c=md5ff(c,d,a,b,x[i+2],17,606105819);  b=md5ff(b,c,d,a,x[i+3],22,-1044525330);
      a=md5ff(a,b,c,d,x[i+4],7,-176418897);  d=md5ff(d,a,b,c,x[i+5],12,1200080426);
      c=md5ff(c,d,a,b,x[i+6],17,-1473231341);b=md5ff(b,c,d,a,x[i+7],22,-45705983);
      a=md5ff(a,b,c,d,x[i+8],7,1770035416);  d=md5ff(d,a,b,c,x[i+9],12,-1958414417);
      c=md5ff(c,d,a,b,x[i+10],17,-42063);    b=md5ff(b,c,d,a,x[i+11],22,-1990404162);
      a=md5ff(a,b,c,d,x[i+12],7,1804603682); d=md5ff(d,a,b,c,x[i+13],12,-40341101);
      c=md5ff(c,d,a,b,x[i+14],17,-1502002290);b=md5ff(b,c,d,a,x[i+15],22,1236535329);
      a=md5gg(a,b,c,d,x[i+1],5,-165796510);  d=md5gg(d,a,b,c,x[i+6],9,-1069501632);
      c=md5gg(c,d,a,b,x[i+11],14,643717713); b=md5gg(b,c,d,a,x[i],20,-373897302);
      a=md5gg(a,b,c,d,x[i+5],5,-701558691);  d=md5gg(d,a,b,c,x[i+10],9,38016083);
      c=md5gg(c,d,a,b,x[i+15],14,-660478335);b=md5gg(b,c,d,a,x[i+4],20,-405537848);
      a=md5gg(a,b,c,d,x[i+9],5,568446438);   d=md5gg(d,a,b,c,x[i+14],9,-1019803690);
      c=md5gg(c,d,a,b,x[i+3],14,-187363961); b=md5gg(b,c,d,a,x[i+8],20,1163531501);
      a=md5gg(a,b,c,d,x[i+13],5,-1444681467);d=md5gg(d,a,b,c,x[i+2],9,-51403784);
      c=md5gg(c,d,a,b,x[i+7],14,1735328473); b=md5gg(b,c,d,a,x[i+12],20,-1926607734);
      a=md5hh(a,b,c,d,x[i+5],4,-378558);     d=md5hh(d,a,b,c,x[i+8],11,-2022574463);
      c=md5hh(c,d,a,b,x[i+11],16,1839030562);b=md5hh(b,c,d,a,x[i+14],23,-35309556);
      a=md5hh(a,b,c,d,x[i+1],4,-1530992060); d=md5hh(d,a,b,c,x[i+4],11,1272893353);
      c=md5hh(c,d,a,b,x[i+7],16,-155497632); b=md5hh(b,c,d,a,x[i+10],23,-1094730640);
      a=md5hh(a,b,c,d,x[i+13],4,681279174);  d=md5hh(d,a,b,c,x[i],11,-358537222);
      c=md5hh(c,d,a,b,x[i+3],16,-722521979); b=md5hh(b,c,d,a,x[i+6],23,76029189);
      a=md5hh(a,b,c,d,x[i+9],4,-640364487);  d=md5hh(d,a,b,c,x[i+12],11,-421815835);
      c=md5hh(c,d,a,b,x[i+15],16,530742520); b=md5hh(b,c,d,a,x[i+2],23,-995338651);
      a=md5ii(a,b,c,d,x[i],6,-198630844);    d=md5ii(d,a,b,c,x[i+7],10,1126891415);
      c=md5ii(c,d,a,b,x[i+14],15,-1416354905);b=md5ii(b,c,d,a,x[i+5],21,-57434055);
      a=md5ii(a,b,c,d,x[i+12],6,1700485571); d=md5ii(d,a,b,c,x[i+3],10,-1894986606);
      c=md5ii(c,d,a,b,x[i+10],15,-1051523);  b=md5ii(b,c,d,a,x[i+1],21,-2054922799);
      a=md5ii(a,b,c,d,x[i+8],6,1873313359);  d=md5ii(d,a,b,c,x[i+15],10,-30611744);
      c=md5ii(c,d,a,b,x[i+6],15,-1560198380);b=md5ii(b,c,d,a,x[i+13],21,1309151649);
      a=md5ii(a,b,c,d,x[i+4],6,-145523070);  d=md5ii(d,a,b,c,x[i+11],10,-1120210379);
      c=md5ii(c,d,a,b,x[i+2],15,718787259);  b=md5ii(b,c,d,a,x[i+9],21,-343485551);
      a=safeAdd(a,oa); b=safeAdd(b,ob); c=safeAdd(c,oc); d=safeAdd(d,od);
    }
    return [a,b,c,d];
  }
  function str2binl(str) {
    const bin=[]; for(let i=0;i<str.length*8;i+=8) bin[i>>5]|=(str.charCodeAt(i/8)&0xff)<<(i%32); return bin;
  }
  function binl2hex(binarray) {
    const hex='0123456789abcdef'; let str='';
    for(let i=0;i<binarray.length*4;i++) str+=hex.charAt((binarray[i>>2]>>((i%4)*8+4))&0xf)+hex.charAt((binarray[i>>2]>>((i%4)*8))&0xf);
    return str;
  }
  function encodeUtf8(s) {
    return unescape(encodeURIComponent(s));
  }
  const encoded = encodeUtf8(str);
  return binl2hex(calc(str2binl(encoded), encoded.length * 8));
}

// ═══════════════════════════════════════════════════════════
// h5st 生成（v5.3）
// ═══════════════════════════════════════════════════════════

function genH5st(functionId, bodyObj, tk, appId) {
  // 时间字符串 YYYYMMDDHHmmssSSS
  function dateStr() {
    const d = new Date();
    const pad = (n, l) => String(n).padStart(l, '0');
    return pad(d.getFullYear(),4) + pad(d.getMonth()+1,2) + pad(d.getDate(),2)
         + pad(d.getHours(),2)   + pad(d.getMinutes(),2) + pad(d.getSeconds(),2)
         + pad(d.getMilliseconds(),3);
  }

  // 16位随机字符串
  function randomStr() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  const ts      = String(Date.now());
  const ds      = dateStr();
  const rand    = randomStr();
  const appHash = md5(appId).substring(0, 5);
  const bodyStr = JSON.stringify(bodyObj);

  // 签名原文: dateStr\nrandom\nappHash\ntk\n5.3\nts\nfunctionId\nbodyStr
  const signSrc = [ds, rand, appHash, tk, '5.3', ts, functionId, bodyStr].join('\n');
  const sig     = md5(signSrc);

  // 第8段：对 body 做简单 base62 编码混淆（兼容服务端宽松校验）
  function encodeBody(s) {
    const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let r = '';
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      r += map[c & 0x3f];
      if (i % 4 === 3) r += map[(c >> 4) & 0x3f];
    }
    return r.substring(0, 80); // 截取固定长度
  }

  return [ds, rand, appHash, tk, sig, '5.3', ts, encodeBody(bodyStr)].join(';');
}

// ═══════════════════════════════════════════════════════════
// 请求工具
// ═══════════════════════════════════════════════════════════

const SIGN_URL    = 'https://api.m.jd.com/api?functionId=bff_rights_center_index_sign&scene=signBlindDaily';
const QUERY_URL   = 'https://api.m.jd.com/api?functionId=bff_rights_center_index&scene=index';
const APPID       = 'plus_business';
const FUNC_SIGN   = 'bff_rights_center_index_sign';
const FUNC_QUERY  = 'bff_rights_center_index';

function encodeBody(obj) {
  return encodeURIComponent(JSON.stringify(obj));
}

function buildOpts(url, cookie, ua, bodyParams) {
  const parts = Object.entries(bodyParams).map(([k,v]) => `${k}=${encodeURIComponent(v)}`);
  return {
    method : 'POST',
    url,
    headers: {
      'Content-Type'  : 'application/x-www-form-urlencoded',
      'Accept'        : 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      'Origin'        : 'https://pro.m.jd.com',
      'Referer'       : 'https://pro.m.jd.com/',
      'User-Agent'    : ua,
      'Cookie'        : cookie,
    },
    body: parts.join('&'),
  };
}

function fetchJSON(opts) {
  return new Promise((resolve, reject) => {
    $task.fetch(opts).then(
      resp => {
        try { resolve(JSON.parse(resp.body)); }
        catch (e) { reject(new Error('JSON 解析失败: ' + resp.body.slice(0, 100))); }
      },
      err => reject(new Error(err.error || JSON.stringify(err)))
    );
  });
}

// ═══════════════════════════════════════════════════════════
// 签到前查询
// ═══════════════════════════════════════════════════════════

function querySignStatus(cookie, ua, tk) {
  const body = {
    baseVersion  : '2.0.0',
    modelVersion : '2.0.0',
    queryTypes   : 'SIGN_DAILY',
    scene        : 'index',
    areaCode     : '0',
  };
  const h5st = tk ? genH5st(FUNC_QUERY, body, tk, APPID) : '';
  const params = {
    appid      : APPID,
    functionId : FUNC_QUERY,
    body       : JSON.stringify(body),
    loginType  : '2',
    scval      : 'test01',
    xAPIClientLanguage: 'zh_CN',
  };
  if (h5st) params.h5st = h5st;
  return fetchJSON(buildOpts(QUERY_URL, cookie, ua, params));
}

// ═══════════════════════════════════════════════════════════
// 执行签到
// ═══════════════════════════════════════════════════════════

function doSignIn(cookie, ua, tk, eid) {
  const body = {
    baseVersion : '2.0.0',
    scene       : 'signBlindDaily',
    area        : '0',
  };
  const h5st = tk ? genH5st(FUNC_SIGN, body, tk, APPID) : '';
  const params = {
    appid      : APPID,
    functionId : FUNC_SIGN,
    body       : JSON.stringify(body),
    loginType  : '2',
    scval      : 'test01',
    xAPIClientLanguage: 'zh_CN',
  };
  if (h5st) params.h5st = h5st;
  if (eid)  params['x-api-eid-token'] = eid;
  return fetchJSON(buildOpts(SIGN_URL, cookie, ua, params));
}

// ═══════════════════════════════════════════════════════════
// 验证签到响应
// ═══════════════════════════════════════════════════════════

function verifyResult(json) {
  const code = String(json.code || '');
  const msg  = json.msg || json.message || '';
  const rs   = json.rs  || {};

  // 1711000 = 成功
  if (code === '1711000') {
    const reward = rs.rewardDesc || rs.signDesc || rs.pointsDesc || '';
    return { ok: true, subtitle: '签到成功', body: reward || '每日签到完成 ✅' };
  }
  // 已签到
  if (code === '1712000' || msg.includes('已签') || msg.includes('repeated')) {
    return { ok: true, subtitle: '今日已签到', body: '' };
  }
  // 未登录
  if (code === '3' || msg.includes('登录') || msg.includes('login')) {
    return { ok: false, subtitle: 'Cookie 已过期', body: '请重新打开签到页面刷新' };
  }
  return { ok: false, subtitle: `签到失败 code=${code}`, body: msg };
}

// ═══════════════════════════════════════════════════════════
// 单账号签到流程
// ═══════════════════════════════════════════════════════════

async function signInOne(pin, account) {
  const { cookie, tk, eid, ua } = account;
  const defaultUA = 'jdapp;iPhone;15.7.50;;;M/5.0;appBuild/170469;jdSupportDarkMode/0;lang/zh_CN;ctype/0;site/CN;ccy/CNY';

  try {
    // 先查询状态
    const queryResp = await querySignStatus(cookie, ua || defaultUA, tk);
    const daily = ((queryResp.rs || {}).DAILY) || {};
    if (daily.signStatus === 1 || daily.todaySigned) {
      return { pin, ok: true, subtitle: '今日已签到', body: '' };
    }
  } catch (_) {
    // 查询失败不中断
  }

  // 执行签到
  const signResp = await doSignIn(cookie, ua || defaultUA, tk, eid);
  const result   = verifyResult(signResp);
  return { pin, ...result };
}

// ═══════════════════════════════════════════════════════════
// 主流程
// ═══════════════════════════════════════════════════════════

(async () => {
  let accounts = {};
  try {
    const raw = $prefs.valueForKey('jd_cookies');
    if (raw) accounts = JSON.parse(raw);
  } catch (_) {}

  const pins = Object.keys(accounts);
  if (pins.length === 0) {
    $notify('⚠️ 京东签到', '未找到任何账号', '请先打开京东签到页面触发抓包');
    $done({});
    return;
  }

  const results = [];
  for (const pin of pins) {
    try {
      const r = await signInOne(pin, accounts[pin]);
      results.push(r);
    } catch (e) {
      results.push({ pin, ok: false, subtitle: '请求失败', body: e.message });
    }
  }

  const total   = results.length;
  const success = results.filter(r => r.ok).length;
  const lines   = results.map(r =>
    `${r.ok ? '✅' : '❌'} ${r.pin}：${r.subtitle}`
  ).join('\n');

  $notify(
    `京东签到（${success}/${total} 成功）`,
    `共 ${total} 个账号`,
    lines
  );

  $done({});
})();
