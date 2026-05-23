// 拦截打卡页请求，自动保存 Cookie

const headers = $request.headers;
const cookie = headers["Cookie"] || headers["cookie"];

if (cookie && cookie.includes("p_skey=")) {
  $prefs.setValueForKey(cookie, "qq_cookie");

  // 提取 uin 显示
  const uinMatch = cookie.match(/uin=o?(\d+)/);
  const uin = uinMatch ? uinMatch[1] : "未知";
  $notify("QQ 打卡", "🍪 Cookie 已自动保存", `账号：${uin}`);
}

$done({});