/**
 * QQ 打卡 - 自动保存 Cookie（支持多账号）
 *
 * Quantumult X 配置（[rewrite_local] 段）：
 *   ^https://ti\.qq\.com/signin/public/index\.html url script-request-header qq-cookie-save.js
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
  // 提取 UIN 作为账号 key
  const uinMatch = cookie.match(/\buin=o?(\d+)/);
  const uin = uinMatch ? uinMatch[1] : null;

  if (!uin) {
    $notify('QQ 打卡', '⚠️ Cookie 保存失败', '无法识别 UIN');
    $done({});
  } else {
    // 读取已有的多账号数据
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
