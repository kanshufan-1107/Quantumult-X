/**
 * 京东每日签到验证脚本（Node.js）
 *
 * 用法：node jd_signin_verify.js
 * 依赖：Node.js 18+（使用内置 fetch），无需安装额外依赖
 *
 * 配置：修改下方 CONFIG 中的 Cookie 和 TK 字段（从 Quantumult X 抓包中复制）
 */

// ── 配置区（Cookie 过期后在此更新） ──────────────────────────────────────────

const CONFIG = {
  // 从 $prefs jd_cookies 存储中提取的最新 Cookie（2026-05-24 第二次抓包）
  cookie: 'pt_key=app_openAAJqEtrfADBRilJ5jpAxHq18BPel4UEpcJ-XCMpcvRDU9omKQzG1Ycx2mshWDNe3P3uTvCb2cAM; pt_pin=jd_cPNfYEzYEyYp; sdtoken=AAbEsBpEIOVjqTAKCQtvQu17cSY988NPb_bo5lV1vUDHCckUEqs-m4Ze7ajZPFdu7iG9lLOjCZjS9HNW4bOna73kWWyow19JsY3Gwut1jYw1Jl4ELajlvCS9NH-Tpq4mDzUdf7OVfA; 3AB9D23F7A4B3C9B=UVD2R6TC7UF5QEYOM6QDJKRIJXD5S7J4Z35S5HE7N2NJFLMVAFLWQ2KOEBM7MQZBQ7CVXFCWXTURIDSTFGBJIADGIE; 3AB9D23F7A4B3CSS=jdd03UVD2R6TC7UF5QEYOM6QDJKRIJXD5S7J4Z35S5HE7N2NJFLMVAFLWQ2KOEBM7MQZBQ7CVXFCWXTURIDSTFGBJIADGIEAAAAM6LGTRVXQAAAAADKG2GFDLEW3B24X; shshshfpa=5fc58585-7449-b2c9-307c-5050cd9c84f7-1779617602; shshshfpb=BApXWcuqvWvtAMyuVhg5cfYK1OSd2WjUtBjsgcS1o9xJ1PdZfQoXmvBzSqTHDFp9KY5b3xKvnsaxjIusx66tct44sYlGzq8jjezo; shshshfpx=5fc58585-7449-b2c9-307c-5050cd9c84f7-1779617602; __jda=122270672.17796205836171006260984.1779620583.1779620583.1779620583.1; __jdb=122270672.2.17796205836171006260984|1.1779620583; __jdc=122270672; __jdv=122270672%7Cdsp-yule1%7Ct_262767352_dspyule1%7Ccpc%7C1666022193_0_d7b23d9c91a5102cc06c2e6a0e8efa37%7C1779116272000; mba_muid=17796205836171006260984.49.1779620608779; mba_sid=49.15; __jd_ref_cls=Babel_H5FirstClick; unpl=JF8EAH9nNSttDU0HBhlXE0AYSw1QXlwLGUUCaDUGAFoISgAMT1VLEBZ7XlVdWhRKEx9vbhRXXlNPUg4fASsiE0xeUllbCk8UMzolRBwZBR9UaxsFHBURSF5UVl84exQDX2cEZG1Ze1M1KzIfFhFOWVxuXDhKJ0E7OwJWVF1NVUgrAysR%7CJF8EAMVnNSttWEpUDRoEGBUUS1tUW1kJTREDaWEMVVtYQl0BEgQaIhNKXlNCXAxXFgR-ZARfWVhAVwErMhgTEk1eVVZeAEwnA2pnDFZeaE06AB8GExIUSVs6XVwJJWpbKDNHFUFaSlNrG2wbFxBCX1cwbQtLJwJfZwNSW1FLXAAfBBsSFktYUVtZCEgSC2hXBGRUWXtUBBgCGxcXTlVWXloNTyczblcEZFxoADoEVgIdFBZCXVxbWQ5LFwVvYgBRWVhIUQ0cMhoiEA',

  // h5st tk token
  tk: 'tk03wec6c1df918ncnyKsZprQtt0z8IkJ5FicvOFwME9Qa4MofKPvThHhwhVyQMUNkTyqkE7wlmZLwf1xhjE1biwOSXs',

  // 真实 appHash（从京东 App h5st 第3段提取）
  appHash: '1ff7a',

  // x-api-eid-token
  eid: 'jdd03UVD2R6TC7UF5QEYOM6QDJKRIJXD5S7J4Z35S5HE7N2NJFLMVAFLWQ2KOEBM7MQZBQ7CVXFCWXTURIDSTFGBJIADGIEAAAAM6LGTRVXQAAAAADKG2GFDLEW3B24X',

  userAgent: 'jdapp;iPhone;15.7.50;;;M/5.0;appBuild/170469;jdSupportDarkMode/0;lang/zh_CN;ctype/0;site/CN;ccy/CNY;elder/2;ef/1;ep/%7B%22ciphertype%22%3A5%2C%22cipher%22%3A%7B%22ud%22%3A%22EWG1CtZsDWOyENU2ZWCnEJO0EWC2DQYzD2PtCtVrYJu4CQS1C2YzYq%3D%3D%22%2C%22sv%22%3A%22CtYkDK%3D%3D%22%2C%22iad%22%3A%22%22%7D%2C%22ts%22%3A1779620608%2C%22hdid%22%3A%22JM9F1ywUPwflvMIpYPok0tt5k9kW4ArJEU3lfLhxBqw%3D%22%2C%22version%22%3A%221.0.3%22%2C%22appname%22%3A%22com.360buy.jdmobile%22%2C%22ridx%22%3A-1%7D;Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;',
};

// ── MD5 实现（纯 JS，无外部依赖） ─────────────────────────────────────────────

function md5(str) {
  function safeAdd(x, y) { const lsw=(x&0xffff)+(y&0xffff); return(((x>>16)+(y>>16)+(lsw>>16))<<16)|(lsw&0xffff); }
  function bitRot(n,c){ return(n<<c)|(n>>>(32-c)); }
  function cmn(q,a,b,x,s,t){ return safeAdd(bitRot(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b); }
  function ff(a,b,c,d,x,s,t){ return cmn((b&c)|((~b)&d),a,b,x,s,t); }
  function gg(a,b,c,d,x,s,t){ return cmn((b&d)|(c&(~d)),a,b,x,s,t); }
  function hh(a,b,c,d,x,s,t){ return cmn(b^c^d,a,b,x,s,t); }
  function ii(a,b,c,d,x,s,t){ return cmn(c^(b|(~d)),a,b,x,s,t); }
  function calc(x,len){
    x[len>>5]|=0x80<<(len%32); x[(((len+64)>>>9)<<4)+14]=len;
    let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for(let i=0;i<x.length;i+=16){
      const[oa,ob,oc,od]=[a,b,c,d];
      a=ff(a,b,c,d,x[i],7,-680876936);    d=ff(d,a,b,c,x[i+1],12,-389564586);
      c=ff(c,d,a,b,x[i+2],17,606105819);  b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4],7,-176418897);  d=ff(d,a,b,c,x[i+5],12,1200080426);
      c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8],7,1770035416);  d=ff(d,a,b,c,x[i+9],12,-1958414417);
      c=ff(c,d,a,b,x[i+10],17,-42063);    b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682); d=ff(d,a,b,c,x[i+13],12,-40341101);
      c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1],5,-165796510);  d=gg(d,a,b,c,x[i+6],9,-1069501632);
      c=gg(c,d,a,b,x[i+11],14,643717713); b=gg(b,c,d,a,x[i],20,-373897302);
      a=gg(a,b,c,d,x[i+5],5,-701558691);  d=gg(d,a,b,c,x[i+10],9,38016083);
      c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9],5,568446438);   d=gg(d,a,b,c,x[i+14],9,-1019803690);
      c=gg(c,d,a,b,x[i+3],14,-187363961); b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);
      c=gg(c,d,a,b,x[i+7],14,1735328473); b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5],4,-378558);     d=hh(d,a,b,c,x[i+8],11,-2022574463);
      c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1],4,-1530992060); d=hh(d,a,b,c,x[i+4],11,1272893353);
      c=hh(c,d,a,b,x[i+7],16,-155497632); b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174);  d=hh(d,a,b,c,x[i],11,-358537222);
      c=hh(c,d,a,b,x[i+3],16,-722521979); b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9],4,-640364487);  d=hh(d,a,b,c,x[i+12],11,-421815835);
      c=hh(c,d,a,b,x[i+15],16,530742520); b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i],6,-198630844);    d=ii(d,a,b,c,x[i+7],10,1126891415);
      c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571); d=ii(d,a,b,c,x[i+3],10,-1894986606);
      c=ii(c,d,a,b,x[i+10],15,-1051523);  b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8],6,1873313359);  d=ii(d,a,b,c,x[i+15],10,-30611744);
      c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4],6,-145523070);  d=ii(d,a,b,c,x[i+11],10,-1120210379);
      c=ii(c,d,a,b,x[i+2],15,718787259);  b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od);
    }
    return[a,b,c,d];
  }
  function s2b(s){ const b=[]; for(let i=0;i<s.length*8;i+=8) b[i>>5]|=(s.charCodeAt(i/8)&0xff)<<(i%32); return b; }
  function b2h(a){ const h='0123456789abcdef'; let s=''; for(let i=0;i<a.length*4;i++) s+=h[(a[i>>2]>>((i%4)*8+4))&0xf]+h[(a[i>>2]>>((i%4)*8))&0xf]; return s; }
  const enc = unescape(encodeURIComponent(str));
  return b2h(calc(s2b(enc), enc.length * 8));
}

// ── h5st v5.3 生成器 ──────────────────────────────────────────────────────────

function genH5st(functionId, bodyObj, tk, appId = 'plus_business') {
  const now   = new Date();
  const pad   = (n, l) => String(n).padStart(l, '0');
  const ds    = pad(now.getFullYear(),4) + pad(now.getMonth()+1,2) + pad(now.getDate(),2)
              + pad(now.getHours(),2)    + pad(now.getMinutes(),2) + pad(now.getSeconds(),2)
              + pad(now.getMilliseconds(),3);
  const ts    = String(Date.now());
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const rand  = Array.from({length:16}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const aHash = md5(appId).substring(0, 5);
  const bStr  = JSON.stringify(bodyObj);

  const signSrc = [ds, rand, aHash, tk, '5.3', ts, functionId, bStr].join('\n');
  const sig     = md5(signSrc);

  // 第8段：简单混淆编码
  const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let enc = '';
  for (let i = 0; i < Math.min(bStr.length, 60); i++) {
    enc += map[bStr.charCodeAt(i) & 0x3f];
    if (i % 4 === 3) enc += map[(bStr.charCodeAt(i) >> 4) & 0x3f];
  }

  return [ds, rand, aHash, tk, sig, '5.3', ts, enc].join(';');
}

// ── 工具：从 Cookie 提取 pt_pin ───────────────────────────────────────────────

function getPtPin(cookie) {
  const m = cookie.match(/pt_pin=([^;]+)/);
  return m ? decodeURIComponent(m[1]).trim() : '未知账号';
}

// ── 公共请求头 ────────────────────────────────────────────────────────────────

function commonHeaders() {
  return {
    'Content-Type'    : 'application/x-www-form-urlencoded',
    'Accept'          : 'application/json, text/plain, */*',
    'Accept-Language' : 'zh-CN,zh-Hans;q=0.9',
    'Origin'          : 'https://pro.m.jd.com',
    'Referer'         : 'https://pro.m.jd.com/',
    'User-Agent'      : CONFIG.userAgent,
    'Cookie'          : CONFIG.cookie,
  };
}

function buildBody(functionId, bodyObj, { withH5st = true } = {}) {
  // 优先用真实 appHash；若未填则回退到 md5('plus_business') 计算值
  const hashArg = (CONFIG.appHash && CONFIG.appHash.length === 5) ? CONFIG.appHash : 'plus_business';
  const h5st  = (withH5st && CONFIG.tk) ? genH5st(functionId, bodyObj, CONFIG.tk, hashArg) : '';
  const parts = {
    appid             : 'plus_business',
    functionId,
    body              : JSON.stringify(bodyObj),
    loginType         : '2',
    scval             : 'test01',
    xAPIClientLanguage: 'zh_CN',
  };
  if (h5st)        parts.h5st              = h5st;
  if (CONFIG.eid)  parts['x-api-eid-token'] = CONFIG.eid;
  return Object.entries(parts)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// ── Step 1：查询签到状态（不带 h5st） ────────────────────────────────────────

async function querySignStatus() {
  const bodyObj = {
    baseVersion : '2.0.0',
    modelVersion: '2.0.0',
    queryTypes  : 'SIGN_DAILY',
    scene       : 'index',
    areaCode    : '0',
  };
  const res  = await fetch(
    'https://api.m.jd.com/api?functionId=bff_rights_center_index&scene=index',
    { method: 'POST', headers: commonHeaders(), body: buildBody('bff_rights_center_index', bodyObj, { withH5st: false }) }
  );
  return res.json();
}

// ── Step 2：执行签到（不带 h5st） ────────────────────────────────────────────

async function doSignIn() {
  const bodyObj = { baseVersion: '2.0.0', scene: 'signBlindDaily', area: '0' };
  const res = await fetch(
    'https://api.m.jd.com/api?functionId=bff_rights_center_index_sign&scene=signBlindDaily',
    { method: 'POST', headers: commonHeaders(), body: buildBody('bff_rights_center_index_sign', bodyObj, { withH5st: false }) }
  );
  return res.json();
}

// ── Step 3：验证签到结果 ──────────────────────────────────────────────────────

function verifyResult(json) {
  const code = String(json.code || '');
  const msg  = json.msg  || json.message || '';
  const rs   = json.rs   || {};

  if (code === '1711000') {
    const reward = rs.rewardDesc || rs.signDesc || rs.pointsDesc || '';
    return { success: true, reward };
  }
  // 1711002 = 今天已完成签到
  if (code === '1711002' || code === '1712000' || msg.includes('已签') || msg.includes('已完成签到') || msg.includes('repeated')) {
    return { success: true, alreadySigned: true };
  }
  if (code === 'F10002' || code === '3' || msg.includes('登录') || msg.includes('login')) {
    return { success: false, reason: 'Cookie 已过期，请重新抓包更新' };
  }
  // 限流（今日已多次请求，非脚本错误）
  if (code === '1714001') {
    return { success: false, reason: '服务端临时限流（今日请求过于频繁），Cookie 本身有效，明日首次运行可恢复正常' };
  }
  return { success: false, reason: `code=${code}，${msg}` };
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

async function main() {
  const sep  = '─'.repeat(50);
  const pin  = getPtPin(CONFIG.cookie);

  console.log(sep);
  console.log(` 京东每日签到验证  账号：${pin}`);
  console.log(sep);

  // Step 1：查询签到前状态
  console.log('\n[1/3] 查询签到前状态...');
  try {
    const qResp = await querySignStatus();
    const daily = (qResp.rs || {}).DAILY || {};
    const code  = String(qResp.code || '');
    if (code === '1711000') {
      const signStatus = daily.signStatus ?? daily.todaySigned ?? null;
      console.log(`  今日签到状态 : ${signStatus === 1 ? '✅ 已签到' : signStatus === 0 ? '未签到' : '未知'}`);
      if (signStatus === 1) {
        console.log('\n⚠️  今日已签到，无需重复操作。');
        console.log(sep);
        return;
      }
    } else {
      console.log(`  查询返回 code=${code}，${qResp.msg || ''}，继续尝试签到...`);
    }
  } catch (e) {
    console.warn(`  查询失败（${e.message}），继续尝试签到...`);
  }

  // Step 2：执行签到
  console.log('\n[2/3] 发送签到请求...');
  let signResp;
  try {
    signResp = await doSignIn();
    console.log(`  响应 code : ${signResp.code}`);
    console.log(`  响应 msg  : ${signResp.msg || ''}`);
  } catch (e) {
    console.error(`  ❌ 网络请求失败：${e.message}`);
    process.exit(1);
  }

  // Step 3：验证结果
  console.log('\n[3/3] 验证签到结果...');
  const result = verifyResult(signResp);

  if (result.success) {
    if (result.alreadySigned) {
      console.log('  ☑️  今日已签到（服务端确认）');
    } else {
      console.log('  ✅ 签到成功！');
      if (result.reward) console.log(`  奖励 : ${result.reward}`);
    }
  } else {
    console.log(`  ❌ 签到失败：${result.reason}`);
  }

  // 签到后二次验证
  if (result.success && !result.alreadySigned) {
    console.log('\n[+] 签到后二次验证...');
    try {
      const qAfter = await querySignStatus();
      const daily  = (qAfter.rs || {}).DAILY || {};
      const confirmed = (daily.signStatus ?? daily.todaySigned) === 1;
      console.log(`  服务端状态确认 : ${confirmed ? '✅ 已签到' : '⚠️ 状态未更新'}`);
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
