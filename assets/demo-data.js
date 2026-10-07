/* 首頁示範區的資料。播放邏輯在 demo.js，這裡只放內容；每個情境的中英文共用同一份數據。
   數據為虛構示意，但情境之間彼此一致（例如創作者 A 的 D14 數字與「資料原則」段的報告單相同）。
   CPE 一律 = 現金成本 ÷ D14 互動數；判讀門檻 ×1.2 以上為 H、×0.8 以下為 L。 */
window.WS_DEMO = {
  flagHigh: 1.2,
  flagLow: 0.8,
  order: ['lifecycle', 'compare', 'watch', 'scout', 'topic'],
  email: 'hello.wavescope@gmail.com',
  ui: {
    zh: {
      controls: { play: '播放', replay: '重播', pause: '暫停', resume: '繼續', skip: '跳到結果' }, tabs: '示範情境',
      cta: { live: '想看這段的實機展示？寫信給我們', planned: '想在推出時收到通知？寫信給我們' },
      subject: { live: function (t) { return '想看實機展示：' + t; }, planned: function (t) { return '推出時通知我：' + t; } }
    },
    en: {
      controls: { play: 'Play', replay: 'Replay', pause: 'Pause', resume: 'Resume', skip: 'Skip to result' }, tabs: 'Demo scenarios',
      cta: { live: 'Want to see this live? Email us', planned: 'Want to hear when this ships? Email us' },
      subject: { live: function (t) { return 'Live demo request: ' + t; }, planned: function (t) { return 'Notify me at launch: ' + t; } }
    }
  }
};

/* 情境：合作貼文生命週期。
   series.post / series.base：發布後第 0～14 天的累積互動（合作貼文／同帳號基準中位數）。
   nodes：評估節點。events：某一天要額外發生的事（記錄一筆特別的快照、跳出截圖補值）。 */
WS_DEMO.lifecycle = {
  series: {
    post: [0, 1543, 2594, 3309, 3796, 4128, 4353, 4507, 4611, 4682, 4731, 4764, 4786, 4802, 4812],
    base: [0, 1022, 1770, 2317, 2717, 3010, 3224, 3381, 3495, 3579, 3641, 3686, 3718, 3742, 3760]
  },
  nodes: [1, 3, 7, 14],
  costs: { cash: 30000, full: 34500 },
  events: { 4: 'boost', 6: 'shareMissing', 7: 'screenshot' },

  zh: {
    tab: '合作貼文的 14 天',
    steps: [
      { title: '登錄', desc: '貼上 IG 網址，系統讀取貼文並掛到活動與創作者底下。' },
      { title: '擷取與比較', desc: '每天保存一次快照，並在第 1、3、7、14 天和同一位創作者平常的貼文比較；每則合作都用同樣的節點。' },
      { title: '補值', desc: '官方 API 拿不到的分享數，先標示「未取得」；收到創作者後台截圖後，AI 預填、人工核對才存入。' },
      { title: '結案', desc: '活動結束，產出結案報表與 CSV。' }
    ],
    day: function (d) { return '發布後第 ' + d + ' 天'; },
    before: '尚未發布',
    note: '畫面為示意，數據為虛構。',
    url: 'https://www.instagram.com/reel/DEMO0414/',
    reg: {
      title: '合作貼文', parsing: '讀取貼文中…',
      rows: [['活動', '春季保養新品'], ['創作者', '創作者 A'], ['形式', 'Reels・約定交付 1 則'], ['成本', 'NT$30,000 現金＋NT$4,500 樣品']],
      delivered: '交付達成 1／1'
    },
    log: {
      title: '快照紀錄',
      snap: function (d, v) { return 'D' + d + '　累積互動 ' + v; },
      boost: 'D4　偵測到付費加熱：加熱觀看另列，不併入自然觀看',
      shareMissing: 'D6　分享數：官方 API 不提供，標示「未取得」',
      shareSaved: 'D7　分享數 312 已存入（來源：創作者截圖・人工核對）'
    },
    shot: {
      title: '截圖補值', file: '創作者後台截圖.png',
      prefill: 'AI 預填', check: '人工核對', saved: '已存入，另標來源',
      fields: [['分享數', '312'], ['觸及帳號', '28,406']]
    },
    chart: { label: '累積互動', post: '合作貼文', base: '同帳號基準' },
    table: { title: '評估節點', node: '節點', post: '互動數', base: '基準', ratio: '相對表現', flag: '判讀', wait: '等待中', high: '高於平常', low: '低於平常', normal: '平常範圍' },
    close: {
      title: '結案摘要・D14',
      items: function (cpe, ratio) { return [['CPE（每次互動成本）', 'NT$' + cpe], ['相對表現', '×' + ratio + '（高於平常）'], ['交付', '1／1'], ['分享數', '312（創作者截圖）']]; },
      basis: { label: '成本口徑', cash: '只算現金', full: '含禮券與樣品', cost: '成本' },
      report: '結案報表', csv: '匯出 CSV'
    }
  },

  en: {
    tab: 'A post\'s 14 days',
    steps: [
      { title: 'Register', desc: 'Paste the IG link. WaveScope reads the post and files it under its campaign and creator.' },
      { title: 'Capture & compare', desc: 'A snapshot is saved every day and compared with the same creator\'s regular posts on days 1, 3, 7 and 14, the same checkpoints for every collaboration.' },
      { title: 'Fill gaps', desc: 'Shares aren\'t available from the official API, so they\'re marked "Not available" until the creator sends a screenshot. AI pre-fills it, a person checks it, then it\'s saved.' },
      { title: 'Wrap up', desc: 'The campaign ends with a wrap-up report and a CSV export.' }
    ],
    day: function (d) { return 'Day ' + d + ' after posting'; },
    before: 'Not posted yet',
    note: 'Illustration with fictional data.',
    url: 'https://www.instagram.com/reel/DEMO0414/',
    reg: {
      title: 'Collaboration post', parsing: 'Reading post…',
      rows: [['Campaign', 'Spring skincare launch'], ['Creator', 'Creator A'], ['Format', 'Reels · 1 agreed post'], ['Cost', 'NT$30,000 cash + NT$4,500 samples']],
      delivered: 'Delivered 1 / 1'
    },
    log: {
      title: 'Snapshots',
      snap: function (d, v) { return 'D' + d + '  cumulative engagement ' + v; },
      boost: 'D4  Paid boost detected: boosted views kept apart from organic views',
      shareMissing: 'D6  Shares: not provided by the official API, marked "Not available"',
      shareSaved: 'D7  Shares 312 saved (source: creator screenshot, human-checked)'
    },
    shot: {
      title: 'Fill from screenshot', file: 'creator-insights.png',
      prefill: 'AI pre-fill', check: 'Human check', saved: 'Saved, source labeled',
      fields: [['Shares', '312'], ['Accounts reached', '28,406']]
    },
    chart: { label: 'Cumulative engagement', post: 'Collaboration', base: 'Creator baseline' },
    table: { title: 'Checkpoints', node: 'Day', post: 'Engagement', base: 'Baseline', ratio: 'Relative', flag: 'Reading', wait: 'Waiting', high: 'Above usual', low: 'Below usual', normal: 'Usual range' },
    close: {
      title: 'Wrap-up · D14',
      items: function (cpe, ratio) { return [['CPE (cost per engagement)', 'NT$' + cpe], ['Relative performance', '×' + ratio + ' (above usual)'], ['Delivered', '1 / 1'], ['Shares', '312 (creator screenshot)']]; },
      basis: { label: 'Cost basis', cash: 'Cash only', full: 'Incl. vouchers and samples', cost: 'Cost' },
      report: 'Wrap-up report', csv: 'Export CSV'
    }
  }
};

/* 情境：公平比較。四位創作者在不同日子發文（日曆上 3/1 起第幾天），先照日曆看「今天」的累積互動，
   再全部對齊到發布後第 N 天，最後在 D7 比較。數字與「資料原則」報告單、「你會拿到什麼」的 D7 表一致：
   A 即生命週期情境的創作者 A；B、C 的 D14 互動為 1,204、2,310；D 讚數被隱藏，沒有互動曲線。
   today：日曆上的「今天」；base7：各自同帳號基準在 D7 的值。 */
WS_DEMO.compare = {
  start: [3, 1],
  today: 18,
  node: 7,
  creators: [
    { key: 'A', posted: 1, base7: 3381, series: [0, 1543, 2594, 3309, 3796, 4128, 4353, 4507, 4611, 4682, 4731, 4764, 4786, 4802, 4812, 4817, 4821, 4824] },
    { key: 'B', posted: 4, base7: 1820, series: [0, 427, 703, 881, 996, 1071, 1119, 1150, 1170, 1183, 1191, 1197, 1200, 1203, 1204] },
    { key: 'C', posted: 8, base7: 2120, series: [0, 787, 1306, 1650, 1876, 2026, 2125, 2190, 2233, 2262, 2280] },
    { key: 'D', posted: 11, base7: null, series: null }
  ],

  zh: {
    tab: '公平比較四位創作者',
    steps: [
      { title: '照日曆看', desc: '四位創作者在不同日子發文。直接比「今天」的累積互動，早發的人天生多累積好幾天。' },
      { title: '對齊發布日', desc: '把每則貼文都對齊到「發布後第幾天」，起跑點才一樣。' },
      { title: '同節點比較', desc: '全部在 D7 比較，再各自和同一位創作者平常的貼文比；拿不到數字的寫明原因，不補 0。' }
    ],
    stamp: { calendar: '今天：3/19', aligned: '以發布日對齊' },
    note: '畫面為示意，數據為虛構；創作者 A～D 與「資料原則」段的報告單相同。',
    name: function (k) { return '創作者 ' + k; },
    date: function (m, d) { return m + '/' + d; },
    chart: { label: '累積互動', calendar: '日曆日期', aligned: '發布後天數' },
    table: {
      title: { calendar: '今天看到的累積互動', aligned: 'D7 比較' },
      creator: '創作者', posted: '發布日', age: '已發布', value: '互動數', base: '基準', ratio: '相對表現', flag: '判讀',
      days: function (n) { return n + ' 天'; },
      hidden: '未取得', hiddenReason: '讚數被隱藏，不判讀',
      unfair: '最早發的 A 比最晚發的 D 多累積了 10 天，這樣比不公平。'
    },
    high: '高於平常', low: '低於平常', normal: '平常範圍'
  },

  en: {
    tab: 'Comparing four creators fairly',
    steps: [
      { title: 'By calendar', desc: 'Four creators posted on different days. Comparing today\'s totals gives early posters several extra days.' },
      { title: 'Align', desc: 'Every post is aligned to "days since posting", so they all start from the same line.' },
      { title: 'Compare', desc: 'All compared at D7, each against the same creator\'s regular posts. Missing numbers come with a reason, never a 0.' }
    ],
    stamp: { calendar: 'Today: Mar 19', aligned: 'Aligned by post date' },
    note: 'Illustration with fictional data. Creators A to D match the report in Data principles.',
    name: function (k) { return 'Creator ' + k; },
    date: function (m, d) { return ['', 'Jan', 'Feb', 'Mar'][m] + ' ' + d; },
    chart: { label: 'Cumulative engagement', calendar: 'Calendar date', aligned: 'Days since posting' },
    table: {
      title: { calendar: 'Totals as of today', aligned: 'D7 comparison' },
      creator: 'Creator', posted: 'Posted', age: 'Age', value: 'Engagement', base: 'Baseline', ratio: 'Relative', flag: 'Reading',
      days: function (n) { return n + ' days'; },
      hidden: 'Not available', hiddenReason: 'Likes hidden, not read',
      unfair: 'A posted first and has 10 more days than D, the latest, so this isn\'t a fair comparison.'
    },
    high: 'Above usual', low: 'Below usual', normal: 'Usual range'
  }
};

/* 情境：創作者觀察（規劃中，與選人支援一起在完整版本推出）。
   對象與「選人」情境同一位創作者 E；觀察 30 天後的追蹤者數與「選人」情境的帳號資料一致。
   followers：觀察第 0～30 天的追蹤者數；第 18 天單日多出約 900 人。
   posts：觀察期間發的貼文（第幾天、形式）。alertDay：追蹤者異常的那一天；倍數由播放器以平常單日增量的中位數算出。 */
WS_DEMO.watch = {
  planned: true,
  followers: [46700, 46728, 46746, 46759, 46783, 46809, 46823, 46838, 46865, 46888, 46900, 46919, 46947, 46966, 46978, 47001,
    47028, 47043, 47957, 47983, 48007, 48020, 48038, 48066, 48086, 48098, 48120, 48148, 48164, 48177, 48200],
  posts: [[2, 'reels'], [5, 'carousel'], [9, 'reels'], [12, 'reels'], [16, 'carousel'], [20, 'reels'], [24, 'carousel'], [28, 'reels']],
  alertDay: 18,

  zh: {
    tab: '還沒合作，先觀察',
    tag: '規劃中',
    steps: [
      { title: '加入觀察', desc: '不必先合作：把創作者帳號加進觀察清單。先講清楚哪些數字拿得到、哪些拿不到。' },
      { title: '每日追蹤', desc: '每天記錄追蹤者數，新貼文一發布就開始保存它的互動。' },
      { title: '異常提醒', desc: '追蹤者單日暴增、互動卻沒有跟上，標出來給人判斷，不自動下結論。' },
      { title: '觀察摘要', desc: '30 天後整理成摘要，可以直接帶進選人估算。' }
    ],
    day: function (d) { return '觀察第 ' + d + ' 天'; },
    before: '尚未加入觀察',
    note: '創作者觀察與選人支援一起在完整版本推出，此為規劃中的畫面；數據為虛構。',
    handle: '@creator_e',
    scope: {
      title: '觀察帳號',
      rows: [['追蹤者數', '每日記錄', 'ok'], ['貼文的讚與留言', '每則記錄', 'ok'], ['觀看、觸及', '未取得：官方 API 不提供他人帳號的數字', 'na']]
    },
    chart: { label: '追蹤者數', posts: '發文' },
    log: {
      title: '觀察紀錄',
      post: function (d, i, f) { return 'D' + d + '　新貼文 ' + i + '（' + f + '），開始記錄互動'; },
      alert: function (d, n) { return 'D' + d + '　追蹤者單日 +' + n + '，同期貼文互動沒有同步增加'; }
    },
    formats: { reels: 'Reels', carousel: '輪播' },
    alert: { title: '待判斷', body: function (d, n, x) { return '第 ' + d + ' 天追蹤者單日增加 ' + n + ' 人，約是平常單日的 ' + x + ' 倍；同一週貼文的互動仍在平常範圍。'; }, hint: '可能是被大帳號轉發，也可能是買粉。系統只標出訊號，判斷留給你。' },
    summary: {
      title: '觀察摘要・30 天',
      items: function (o) { return [['追蹤者', o.from + ' → ' + o.to], ['發文', o.posts + ' 則（Reels ' + o.reels + '、輪播 ' + o.carousel + '）'], ['異常', '1 次，待判斷'], ['觀看、觸及', '未取得']]; },
      next: '帶進選人估算'
    }
  },

  en: {
    tab: 'Watch before you hire',
    tag: 'Planned',
    steps: [
      { title: 'Add', desc: 'No collaboration needed: add the creator to a watchlist. First, be clear about which numbers are available and which aren\'t.' },
      { title: 'Track', desc: 'Followers are recorded daily, and each new post\'s engagement is saved from the moment it goes up.' },
      { title: 'Flag', desc: 'A one-day follower spike without matching engagement is flagged for a person to judge, not concluded automatically.' },
      { title: 'Summary', desc: 'After 30 days it becomes a summary you can take straight into creator selection.' }
    ],
    day: function (d) { return 'Day ' + d + ' of watching'; },
    before: 'Not watched yet',
    note: 'Creator watching ships with creator selection in the full version. This is a planned screen with fictional data.',
    handle: '@creator_e',
    scope: {
      title: 'Watched account',
      rows: [['Followers', 'Recorded daily', 'ok'], ['Likes and comments per post', 'Recorded per post', 'ok'], ['Views, reach', 'Not available: the official API doesn\'t provide them for other accounts', 'na']]
    },
    chart: { label: 'Followers', posts: 'Posts' },
    log: {
      title: 'Watch log',
      post: function (d, i, f) { return 'D' + d + '  New post ' + i + ' (' + f + '), engagement tracking started'; },
      alert: function (d, n) { return 'D' + d + '  Followers +' + n + ' in one day; engagement on recent posts didn\'t rise with it'; }
    },
    formats: { reels: 'Reels', carousel: 'carousel' },
    alert: { title: 'Needs a look', body: function (d, n, x) { return 'On day ' + d + ' followers rose by ' + n + ' in one day, about ' + x + ' times a usual day. Engagement that week stayed in the usual range.'; }, hint: 'It could be a repost by a large account, or bought followers. WaveScope only flags the signal; the call is yours.' },
    summary: {
      title: 'Watch summary · 30 days',
      items: function (o) { return [['Followers', o.from + ' → ' + o.to], ['Posts', o.posts + ' (Reels ' + o.reels + ', carousel ' + o.carousel + ')'], ['Flags', '1, needs a look'], ['Views, reach', 'Not available']]; },
      next: 'Take into creator selection'
    }
  }
};

/* 情境：選人支援（規劃中，屬完整版本）。
   posts：創作者 E 近期 8 則貼文的 D14 互動，null 代表讚數被隱藏、不計入基準。
   基準 = 可用貼文的中位數；可用貼文少於 minPosts 則不估算 CPE。
   candidates 的第一位就是 E（基準由 posts 算出）；其他人直接給基準或可用貼文數。
   reference 是已結案的實際 CPE，與預估分開列，不放進同一張排名。 */
WS_DEMO.scout = {
  planned: true,
  posts: [2410, 3980, 2620, null, 2050, 3560, 2700, 2480],
  minPosts: 5,
  quote: 18000,
  candidates: [
    { key: 'E' },
    { key: 'F', quote: 25000, base: 2940 },
    { key: 'G', quote: 12000, usable: 3 }
  ],
  reference: { key: 'A', cpe: '6.23' },

  zh: {
    tab: '挑下一位創作者',
    tag: '規劃中',
    steps: [
      { title: '觀察帳號', desc: '還沒合作也能先觀察：把創作者帳號加進觀察清單，系統開始保存他平常貼文的數據。' },
      { title: '算基準', desc: '以近期貼文的 D14 互動中位數當基準；讚數被隱藏的貼文拿不到互動數，不計入。' },
      { title: '估 CPE', desc: '輸入報價，用基準算出預估 CPE。可用貼文太少的不估算；預估和已結案的實際值分開列。' },
      { title: '挑加熱內容', desc: '每則貼文和基準比較，明顯高於平常的列為值得加熱的候選。' }
    ],
    stamp: '已觀察 30 天',
    before: '尚未加入觀察',
    note: '選人支援在完整版本推出，此為規劃中的畫面；數據為虛構。',
    handle: '@creator_e',
    account: { title: '觀察帳號', rows: [['創作者', '創作者 E'], ['追蹤者', '48,200'], ['合作紀錄', '尚無']], watching: '觀察中' },
    posts: {
      title: '近期貼文（D14）', post: '貼文', value: '互動數', ratio: '相對表現', flag: '判讀',
      name: function (i) { return '貼文 ' + i; },
      hidden: '未取得', hiddenReason: '讚數被隱藏，不計入',
      base: function (n, v) { return '基準：' + n + ' 則可用貼文的中位數 ' + v; }
    },
    cpe: {
      title: '報價與預估 CPE', quote: '創作者 E 報價', tryIt: '改報價試試看', invalid: '請輸入金額', creator: '創作者', price: '報價', base: '基準', est: '預估 CPE',
      name: function (k) { return '創作者 ' + k; },
      skip: function (n) { return '不估算：可用貼文 ' + n + ' 則'; },
      reference: function (k, v) { return '參考：創作者 ' + k + ' 已結案的實際 CPE 為 NT$' + v + '。實際值與預估口徑不同，不放進同一張表。'; }
    },
    boost: { title: '值得加熱的候選', none: '比較完成後列出', item: function (name, r) { return name + '　×' + r + '，高於平常'; } },
    high: '高於平常', low: '低於平常', normal: '平常範圍'
  },

  en: {
    tab: 'Choosing the next creator',
    tag: 'Planned',
    steps: [
      { title: 'Watch', desc: 'Watch a creator before you work with them: add the account to a watchlist and WaveScope starts saving data on their regular posts.' },
      { title: 'Baseline', desc: 'The baseline is the median D14 engagement of recent posts. Posts with hidden likes have no engagement count and are left out.' },
      { title: 'Estimate CPE', desc: 'Enter a quote to get an estimated CPE from the baseline. Creators with too few usable posts aren\'t estimated, and estimates are kept apart from actual results.' },
      { title: 'Pick boosts', desc: 'Each post is compared with the baseline; ones clearly above usual become boost candidates.' }
    ],
    stamp: 'Watched for 30 days',
    before: 'Not watched yet',
    note: 'Creator selection ships with the full version. This is a planned screen with fictional data.',
    handle: '@creator_e',
    account: { title: 'Watched account', rows: [['Creator', 'Creator E'], ['Followers', '48,200'], ['Past collaborations', 'None']], watching: 'Watching' },
    posts: {
      title: 'Recent posts (D14)', post: 'Post', value: 'Engagement', ratio: 'Relative', flag: 'Reading',
      name: function (i) { return 'Post ' + i; },
      hidden: 'Not available', hiddenReason: 'Likes hidden, left out',
      base: function (n, v) { return 'Baseline: median of ' + n + ' usable posts, ' + v; }
    },
    cpe: {
      title: 'Quote and estimated CPE', quote: 'Creator E\'s quote', tryIt: 'Try another quote', invalid: 'Enter an amount', creator: 'Creator', price: 'Quote', base: 'Baseline', est: 'Est. CPE',
      name: function (k) { return 'Creator ' + k; },
      skip: function (n) { return 'Not estimated: ' + n + ' usable posts'; },
      reference: function (k, v) { return 'For reference: Creator ' + k + '\'s actual CPE after wrap-up was NT$' + v + '. Actual and estimated figures are measured differently, so they aren\'t in the same table.'; }
    },
    boost: { title: 'Boost candidates', none: 'Listed after the comparison', item: function (name, r) { return name + '  ×' + r + ', above usual'; } },
    high: 'Above usual', low: 'Below usual', normal: 'Usual range'
  }
};

/* 情境：議題聲量監測（規劃中，屬完整版本）。
   以 hashtag 定義議題，記錄每天的新貼文數；日曆從 2/22 起 28 天，活動期間 3/1～3/14，
   3/9（創作者 C 發文當天）單日暴增。比較活動前後時，另外算一個扣掉異常日的數字。 */
WS_DEMO.topic = {
  planned: true,
  start: [2, 22],
  daily: [40, 37, 41, 45, 35, 36, 43, 55, 59, 63, 54, 62, 57, 54, 55, 142, 60, 55, 57, 55, 62, 47, 41, 50, 42, 44, 51, 51],
  campaign: [7, 20],
  collabs: [8, 11, 15, 18],
  alertDay: 15,

  zh: {
    tab: '議題聲量',
    tag: '規劃中',
    steps: [
      { title: '定義議題', desc: '用幾個 hashtag 定義一個議題。先講清楚官方 API 的限制，再開始記錄。' },
      { title: '每日聲量', desc: '每天記錄議題下的新貼文數，並標出活動期間與合作貼文的發布日。' },
      { title: '異常與對照', desc: '單日暴增標出來給人看；活動期間和活動前比，也另算扣掉異常日的數字。' }
    ],
    stamp: { before: '尚未開始監測', running: function (date) { return '監測中：' + date; } },
    note: '議題聲量監測在完整版本推出，此為規劃中的畫面；數據為虛構。',
    date: function (m, d) { return m + '/' + d; },
    tags: ['#春季保養', '#換季保養', '#敏感肌保養'],
    scope: {
      title: '議題：春季保養',
      limits: [
        ['可以拿到', '每個 hashtag 的熱門貼文與近 24 小時的新貼文'],
        ['拿不到', '24 小時以前的貼文：聲量從開始監測那天起累積，不能回溯'],
        ['額度', '每 7 天最多查 30 個不同的 hashtag']
      ]
    },
    chart: { label: '每日新貼文數', campaign: '活動期間', collab: '合作貼文發布' },
    log: {
      title: '監測紀錄',
      alert: function (date, n, x) { return date + '　單日 ' + n + ' 則，約是前 7 天平均的 ' + x + ' 倍'; },
      same: function (date) { return date + '　同一天創作者 C 發布合作貼文；是否相關，要看貼文內容判斷'; }
    },
    summary: {
      title: '活動前後對照',
      items: function (o) { return [['活動前 7 天', '平均每日 ' + o.pre + ' 則'], ['活動期間', '平均每日 ' + o.camp + ' 則（' + o.up + '）'], ['扣掉 ' + o.alert + ' 異常日', '平均每日 ' + o.campX + ' 則（' + o.upX + '）']]; },
      caveat: '聲量變化和活動同時發生，不代表是活動造成的；季節、新聞或其他品牌都可能有影響。'
    }
  },

  en: {
    tab: 'Topic volume',
    tag: 'Planned',
    steps: [
      { title: 'Define', desc: 'Define a topic with a few hashtags, and be clear about the official API\'s limits before tracking starts.' },
      { title: 'Daily volume', desc: 'New posts under the topic are counted every day, with the campaign period and collaboration post dates marked.' },
      { title: 'Spikes & context', desc: 'One-day spikes are flagged for a person to look at. Campaign vs. before is also shown without the spike day.' }
    ],
    stamp: { before: 'Not tracking yet', running: function (date) { return 'Tracking: ' + date; } },
    note: 'Topic volume tracking ships with the full version. This is a planned screen with fictional data.',
    date: function (m, d) { return ['', 'Jan', 'Feb', 'Mar'][m] + ' ' + d; },
    tags: ['#springskincare', '#seasonalskincare', '#sensitiveskin'],
    scope: {
      title: 'Topic: spring skincare',
      limits: [
        ['Available', 'Top posts and posts from the last 24 hours for each hashtag'],
        ['Not available', 'Posts older than 24 hours: volume builds up from the day tracking starts and can\'t be backfilled'],
        ['Quota', 'Up to 30 different hashtags every 7 days']
      ]
    },
    chart: { label: 'New posts per day', campaign: 'Campaign', collab: 'Collaboration post' },
    log: {
      title: 'Tracking log',
      alert: function (date, n, x) { return date + '  ' + n + ' posts in one day, about ' + x + ' times the previous 7-day average'; },
      same: function (date) { return date + '  Creator C posted a collaboration that day; whether they\'re related needs a look at the posts'; }
    },
    summary: {
      title: 'Campaign vs. before',
      items: function (o) { return [['7 days before', o.pre + ' posts / day'], ['Campaign', o.camp + ' posts / day (' + o.up + ')'], ['Without ' + o.alert + ' spike', o.campX + ' posts / day (' + o.upX + ')']]; },
      caveat: 'Volume moving during a campaign doesn\'t mean the campaign caused it; season, news or other brands can all play a part.'
    }
  }
};
