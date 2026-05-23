// 计算 bkn/g_tk
function getBkn(skey) {
  let hash = 5381;
  for (let i = 0; i < skey.length; i++) {
    hash += (hash << 5) + skey.charCodeAt(i);
  }
  return hash & 0x7fffffff;
}

// 读取存储的 Cookie
const cookie = $prefs.valueForKey("qq_cookie");

if (!cookie) {
  $notify("QQ 打卡", "❌ 未找到 Cookie", "请先打开一次 QQ 打卡页面");
  $done();
}

const skeyMatch = cookie.match(/skey=([^;]+)/);
const skey = skeyMatch ? skeyMatch[1] : "";
const bkn = getBkn(skey);

function doSignIn() {
  $task.fetch({
    url: `https://ti.qq.com/hybrid-h5/api/json/daily_attendance/SignIn?bkn=${bkn}`,
    method: "POST",
    headers: {
      "Cookie": cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": "https://ti.qq.com/signin/public/index.html",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23E246",
    },
    body: ""
  }).then(res => {
    const data = JSON.parse(res.body);
    if (data.ret === 0 && data.data?.retCode === 0) {
      const title = data.data.signInOutLook?.title || "";
      $notify("QQ 打卡", "✅ 打卡成功", `今日卡面：${title}`);
    } else if (data.data?.retCode === 100001) {
      $prefs.removeValueForKey("qq_cookie");
      $notify("QQ 打卡", "🔑 Cookie 已过期", "请打开一次 QQ 更多打卡页面，自动更新");
    } else {
      $notify("QQ 打卡", "⚠️ 打卡失败", `retCode: ${data.data?.retCode}`);
    }
  }, err => {
    $notify("QQ 打卡", "❌ 请求失败", err);
  });
}

doSignIn();