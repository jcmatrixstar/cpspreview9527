/* 公頻在線人數：分鐘級來源資料（唯一來源）
   小時與日的統計一律由此推導，畫面兩處共用此檔：
   - 紀錄管理 › 聊天紀錄 › 公頻在線人數（每分鐘）：直接列出分鐘值
   - 報表管理 › 聊天相關報表 › 公頻每日數據／公頻活躍趨勢：由分鐘捲成小時、再捲成日

   每一分鐘有兩個值：
   - v    當下在線人數（畫面會顯示）
   - join 該分鐘新進場人數（背後假設，畫面不顯示；僅供「不重複人數」往上推導）
     不重複人數 = 該小時第一分鐘在線人數 + 其後各分鐘新進場人數之和
*/
(function () {
  var HOUR_W = [22, 14, 9, 6, 5, 5, 7, 12, 20, 28, 34, 40, 44, 42, 40, 44, 52, 60, 72, 86, 100, 96, 74, 44];
  var DOW = '日一二三四五六';

  function seed(a, b, c) {
    var x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function mseed(d, h, m, k) {
    var x = Math.sin(d * 57.31 + h * 911.7 + m * 13.17 + k * 29.3) * 24634.6345;
    return x - Math.floor(x);
  }
  function dateOf(d) {
    var x = new Date(2026, 7, 7);
    x.setDate(x.getDate() - d);
    return x;
  }
  function p2(n) { return String(n).padStart(2, '0'); }

  var cacheM = {};
  function minutes(d) {
    if (cacheM[d]) return cacheM[d];
    var date = dateOf(d);
    var dow = date.getDay();
    var weekend = (dow === 0 || dow === 6) ? 1.28 : 1;
    var out = [];
    for (var h = 0; h < 24; h++) {
      var nA = 0.85 + seed(d, h, 1) * 0.3;
      var nB = 0.85 + seed(d, (h + 1) % 24, 1) * 0.3;
      for (var m = 0; m < 60; m++) {
        var t = m / 60;
        var w = HOUR_W[h] + (HOUR_W[(h + 1) % 24] - HOUR_W[h]) * t;
        var n = nA + (nB - nA) * t;
        var jitter = 1 + (mseed(d, h, m, 1) - 0.5) * 0.07;
        var v = Math.max(0, Math.round(w * 4.2 * weekend * n * jitter));
        var join = Math.round(v * (0.010 + mseed(d, h, m, 2) * 0.018));
        out.push({ d: d, h: h, m: m, v: v, join: join });
      }
    }
    cacheM[d] = out;
    return out;
  }

  function dayMeta(d) {
    var date = dateOf(d);
    var dow = date.getDay();
    return {
      date: date,
      dow: dow,
      label: (date.getMonth() + 1) + '/' + p2(date.getDate()) + ' ' + DOW[dow],
      full: '2026/' + p2(date.getMonth() + 1) + '/' + p2(date.getDate()) + '（' + DOW[dow] + '）',
      ymd: '2026/' + p2(date.getMonth() + 1) + '/' + p2(date.getDate())
    };
  }

  function hours(opts) {
    var days = (opts && opts.days) || 14;
    var todayHours = Math.max(0, Math.min(24, (opts && opts.todayHours != null) ? opts.todayHours : 14));
    var out = [];
    for (var d = 0; d < days; d++) {
      var meta = dayMeta(d);
      var mins = minutes(d);
      var cells = [];
      for (var h = 0; h < 24; h++) {
        if (d === 0 && h >= todayHours) {
          cells.push({ h: h, peak: null, avg: null, uniq: null, pending: true });
          continue;
        }
        var seg = mins.slice(h * 60, (h + 1) * 60);
        var peak = 0, sum = 0, uniq = seg[0].v;
        for (var i = 0; i < seg.length; i++) {
          if (seg[i].v > peak) peak = seg[i].v;
          sum += seg[i].v;
          if (i > 0) uniq += seg[i].join;
        }
        cells.push({ h: h, peak: peak, avg: Math.round(sum / seg.length), uniq: uniq, pending: false });
      }
      out.push({
        date: meta.date,
        incomplete: d === 0 && todayHours < 24,
        label: meta.label,
        full: meta.full,
        cells: cells
      });
    }
    return out;
  }

  window.CHAT_ONLINE_MINUTES = { minutes: minutes, hours: hours, dayMeta: dayMeta };
})();
