/**
 * QQ 打卡 - 自动保存 Cookie（支持多账号）
 *
 * 问题根因：signin/public/index.html 会被浏览器缓存（304），
 * 导致请求不触发，改为拦截每次必定发出的 API 请求。
 *
 * Quantumult X 配置（[rewrite_local] 段）：
 *   ^https://ti\.qq\.com/proxy/domain/club\.vip\.qq\.com/mono/api/sign-in/getVipSignInInfo url script-request-header qq-cookie-save.js
 *
 * 说明：
 *   getVipSignInInfo 是打卡页加载时必定请求的第一个 API，
 *   且每次都携带完整 Cookie（含 p_skey），不会被缓存跳过。
 *
 * 存储格式（$prefs key: qq_cookies）：
 *   {
 *     "1569749008": "qq_locale_id=2052; skey=...; uin=o1569749008; ...",
 *     "197351245":  "qq_locale_id=2052; skey=...; uin=o0197351245; ..."
 *   }
 */

const cookie = ($request.headers['Cookie'] || $request.headers['cookie'] || '').trim();

if (!cookie || !cookie.includes('p_skey=')) {
  $done({});
} else {
  // uin=o0197351245（9位QQ）或 uin=o1569749008（10位QQ）
  // o 后面可能有补位的 0，用 parseInt 去掉前导零还原真实 QQ 号
  const uinMatch = cookie.match(/\buin=o(\d+)/);
  const uin = uinMatch ? String(parseInt(uinMatch[1], 10)) : null;

  if (!uin) {
    $notify('QQ 打卡', '⚠️ Cookie 保存失败', '无法识别 UIN');
    $done({});
  } else {
    let accounts = {};
    try {
      const raw = $prefs.valueForKey('qq_cookies');
      if (raw) accounts = JSON.parse(raw);
    } catch (e) {
      accounts = {};
    }

    const isNew = !accounts[uin];
    accounts[uin] = cookie;
    $prefs.setValueForKey(JSON.stringify(accounts), 'qq_cookies');

    const total = Object.keys(accounts).length;
    $notify(
      'QQ 打卡',
      isNew ? `🆕 新增账号 ${uin}` : `🔄 账号 ${uin} Cookie 已更新`,
      `当前共 ${total} 个账号已保存`
    );
    $done({});
  }
}
