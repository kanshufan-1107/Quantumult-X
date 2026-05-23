const timestamp = Date.now();
const scriptUrl = `https://raw.githubusercontent.com/kanshufan-1107/Quantumult-X/refs/heads/main/qq-cookie-save.js?t=${timestamp}`;

$task.fetch({ url: scriptUrl }).then(res => {
  eval(res.body);
  $done({});
}, err => {
  $done({});
});