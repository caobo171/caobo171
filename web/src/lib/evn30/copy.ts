export type Lang = "en" | "vi";

export const LANGS: Lang[] = ["vi", "en"];

export interface Copy {
  langName: string;
  themeAuto: string;
  themeLight: string;
  themeDark: string;

  home: string;
  resume: string;

  title: string;
  subtitle: string;

  startingFrom: string;
  endingAt: string;
  toLatest: string;
  monthLabel: string;
  yearLabel: string;
  initialCapital: string;
  initialCapitalHelp: string;
  projectedBadge: string;
  projectionNote: (from: string, fitted: string, etf: string, gold: string, bank: string) => string;
  windowLength: (months: number) => string;
  iSaveLabel: string;
  modePercent: string;
  modeFixed: string;
  salaryStart: string;
  salaryToday: string;
  cappedFrom: (year: number) => string;
  savePct: string;
  savePctValue: (pct: number) => string;
  raiseEachYear: string;
  ceiling: string;
  monthlyCap: string;
  monthlyCapHelp: string;
  fixedAmount: string;
  perMonth: string;

  contribFlat: (amount: string) => string;
  contribRising: (first: string, last: string, year: number | null) => string;
  apply: string;
  applied: string;

  paidIn: string;
  inTodaysMoney: (amount: string) => string;
  paidInHelp: string;
  windowLabel: string;
  inflationLabel: string;
  inflationHelp: (annual: string) => string;
  pricedLabel: string;

  gold: string;
  etf: string;
  bank: string;
  onWhatYouPaidIn: string;
  realLine: (value: string, profit: string) => string;
  incomeLine: (amount: string, rate: string) => string;
  incomeHelp: string;
  monthlySpend: string;
  monthlySpendHelp: string;
  covers: string;
  coversNot: string;
  coverageEnough: (pct: string) => string;
  coverageShort: (pct: string, short: string, need: string) => string;
  aYear: string;
  winner: string;

  milestonesHeading: string;
  milestonesIntro: string;
  milestonesHelp: string;
  milestonesNone: string;
  addMilestone: string;
  removeMilestone: string;
  mName: string;
  mNamePlaceholder: string;
  mYear: string;
  mUpfront: string;
  mAnnual: string;
  mYears: string;
  mYearsForever: string;
  mOutsideRun: string;
  milestonesOutside: (names: string, until: string) => string;
  presetHouse: string;
  presetCar: string;
  presetChild: string;
  milestoneTotalLabel: string;
  milestoneTotalHelp: string;
  spentOnMilestones: string;
  broke: string;
  brokeLine: (month: string, amount: string) => string;
  thMilestoneCost: string;

  today: string;
  paidInShort: string;

  tabSummary: string;
  tabMonths: string;
  tabMethod: string;
  tabSources: string;

  thChannel: string;
  thNetWorth: string;
  thHolding: string;
  thBoughtIn: string;
  thIdleCash: string;
  thDeepestFall: string;
  thAfterInflation: string;
  afterInflationHelp: string;
  beforeInflationHelp: string;
  ofMonths: (bought: number, total: number) => string;
  fundUnits: (n: string) => string;
  bankHolding: string;
  brokerage: (amount: string) => string;
  salaryModelled: (start: string, end: string) => string;

  thMonth: string;
  thPutIn: string;
  thPaidInSoFar: string;
  thEtfPrice: string;
  thGoldPrice: string;

  sourcesIntro: (date: string) => string;
  thSeries: string;
  thSource: string;
  thCovers: string;
  thTrust: string;
  rows: Array<{ what: string; where: string; span: string; trust: string }>;
  depositHeading: string;
  depositIntro: string;
  thYear: string;
  thRate: string;
  chargesHeading: string;
  charges: string[];
  notHeading: string;
  notBody: string;
}

const EN: Copy = {
  langName: "English",
  themeAuto: "Follow my system",
  themeLight: "Light",
  themeDark: "Dark",
  home: "Home",
  resume: "Resume",

  title: "What if I'd just kept buying?",
  subtitle:
    "A share of every paycheque, every month, into three places Vietnamese savers actually use. Real prices, real inflation, real fees — and the cash that could not buy a whole lot stays cash.",

  startingFrom: "Starting from",
  endingAt: "Running until",
  toLatest: "today's prices",
  monthLabel: "Month",
  yearLabel: "Year",
  initialCapital: "Capital I already have",
  initialCapitalHelp:
    "Assumed to be invested in full on the start month, into each of the three channels, under exactly the same rules as every other month — so part of it waits as cash if it cannot buy a whole lot of the ETF or a whole chỉ of gold. It is counted as capital paid in, and earns from the first month onwards.",
  projectedBadge: "Assumed from here on",
  projectionNote: (from, fitted, etf, gold, bank) =>
    `From ${from} onwards there are no prices yet, so the page assumes each channel carries on at the rate it managed across the whole record, ${fitted} — ETF ${etf}, gold ${gold}, bank ${bank} a year, fitted by least squares through every month. The rate is deliberately taken from the full history rather than the window you picked, so a short run of good years cannot be extrapolated for a decade. It is still an assumption, not a forecast: a decade that returned this much is no promise the next one will. The dashed part of the chart is where it begins.`,
  windowLength: (m) => (m === 1 ? "1 month" : `${m} months`),
  iSaveLabel: "I save",
  modePercent: "a share of salary",
  modeFixed: "a fixed amount",
  salaryStart: "Salary when I started",
  salaryToday: "which is today",
  cappedFrom: (y) => `held at the ceiling from ${y}`,
  savePct: "I save",
  savePctValue: (p) => `${p}% of it`,
  raiseEachYear: "Raise each year",
  ceiling: "…but my salary never passes",
  monthlyCap: "But I never save more than",
  monthlyCapHelp:
    "A ceiling on the amount put aside each month, not on the salary. If a quarter of your pay would come to more than this, the rest simply is not invested.",
  fixedAmount: "Every month I put aside",
  perMonth: "/mo",

  contribFlat: (a) => `That puts ${a} a month into the plan, every month.`,
  contribRising: (first, last, year) =>
    `That puts ${first}/month into the plan at the start, rising to ${last}${
      year ? ` once the ceiling bites in ${year}` : ""
    }.`,
  apply: "Apply",
  applied: "Applied",

  paidIn: "Capital paid in",
  inTodaysMoney: (a) => `≈ ${a} in today's money`,
  paidInHelp:
    "One sum, stated two ways: what you actually hand over, and what that adds up to in today's purchasing power. Which of the two is larger depends on when you paid. Money paid in the past restates upwards — 4.7M ₫ in 2016 bought what takes more than 6M ₫ now — while money paid in 2034 restates downwards, because those đồng will buy less. Neither direction is a gain or a loss. What the money turned into is in the three cards below.",
  windowLabel: "Window",
  inflationLabel: "Inflation over it",
  inflationHelp: (annual) =>
    `Compounded across the whole window, which works out at ${annual} a year — close to Vietnam's long-run average, so the total looks alarming only because it covers so many years. Real CPI up to the last year the World Bank has published, carried forward at 3.3% a year after that.`,
  pricedLabel: "Priced",

  gold: "SJC gold",
  etf: "VN30 ETF",
  bank: "Bank savings",
  onWhatYouPaidIn: "on what you paid in",
  realLine: (value, profit) => `${value} in today's money (${profit})`,
  incomeLine: (amount, rate) => `${amount} a month if you drew ${rate} a year`,
  incomeHelp:
    "A rule of thumb, not a promise. Drawing 4% of the pot a year is a common planning assumption for making savings last, and the figure here is in today's money. It takes no account of tax, of what you actually spend, or of the pot falling in a bad year. This page is a record of prices, not financial advice.",
  monthlySpend: "I'd need to live on",
  monthlySpendHelp:
    "Per month, in today's money — what you would want to spend, not necessarily what you spend now. Each result is then measured against it at a 4% withdrawal. Set it to zero to hide the verdict.",
  covers: "Enough",
  coversNot: "Not enough",
  coverageEnough: (pct) => `covers ${pct} of that`,
  coverageShort: (pct, short, need) =>
    `covers ${pct} — short ${short} a month; the pot would need to reach ${need}`,
  aYear: "a year",
  winner: "Best",

  milestonesHeading: "Life milestones",
  milestonesIntro:
    "A house, a car, a child. Each one takes money out of the plan in the year you set — and keeps taking it.",
  milestonesHelp:
    "Both amounts are in today's money; each is inflated to the year the cost actually falls. The money comes out of your saving first, and once that is not enough the plan sells ETF units or gold to cover it — gold sold back to a shop crosses the spread, as it would in life. A house is counted as spent, not as an asset: this page measures what a pot pays you each month, and a home you live in pays you nothing. So the figures below tell you what the purchase cost your retirement, not what you are worth.",
  milestonesNone: "No milestones yet. Add one to see what the plan can take.",
  addMilestone: "Add a milestone",
  removeMilestone: "Remove",
  mName: "What it is",
  mNamePlaceholder: "A house",
  mYear: "From",
  mUpfront: "Up front",
  mAnnual: "Every year",
  mYears: "For",
  mYearsForever: "to the end",
  mOutsideRun: "outside the run",
  milestonesOutside: (names, until) =>
    `${names} falls after this run ends (${until}), so nothing has been charged for it. Set “Running until” to that year or later to see what it does.`,
  presetHouse: "House",
  presetCar: "Car",
  presetChild: "Child",
  milestoneTotalLabel: "Milestones cost",
  milestoneTotalHelp:
    "Everything the milestones took over the run, in the dong of each year, with the restatement in today's money underneath.",
  spentOnMilestones: "went on milestones",
  broke: "Ran dry",
  brokeLine: (month, amount) => `nothing left from ${month} — ${amount} unpaid`,
  thMilestoneCost: "Milestones",

  today: "Today",
  paidInShort: "Paid in",

  tabSummary: "Summary",
  tabMonths: "Month by month",
  tabMethod: "How it is worked out",
  tabSources: "Where the numbers come from",

  thChannel: "Channel",
  thNetWorth: "Net worth at the end",
  thHolding: "Holding",
  thBoughtIn: "Bought in",
  thIdleCash: "Idle cash",
  thDeepestFall: "Deepest fall in the pot",
  thAfterInflation: "Profit after inflation, in today's money",
  afterInflationHelp:
    "The same profit, expressed in what money is worth today. A run that ends in the future is discounted back to now, so +227M means 227 million of today's purchasing power — not 227 million of 2035 money, which would buy considerably less.",
  beforeInflationHelp:
    "Money as it stands at the end of the run, with no adjustment for prices having risen. The column on the right restates it in today's money.",
  ofMonths: (b, t) => `${b} / ${t} months`,
  fundUnits: (n) => `${n} units`,
  bankHolding: "compounds monthly",
  brokerage: (a) => `Brokerage paid buying the ETF: ${a}.`,
  salaryModelled: (s, e) => `Salary modelled from ${s} a month at the start to ${e} today.`,

  thMonth: "Month",
  thPutIn: "Put in",
  thPaidInSoFar: "Paid in so far",
  thEtfPrice: "ETF price",
  thGoldPrice: "Gold / lượng",

  sourcesIntro: (d) =>
    `Every figure on this page comes from the four series below, frozen into a snapshot taken on ${d}. Nothing is fetched while you use the page, and nothing is assumed about the future.`,
  thSeries: "Series",
  thSource: "Source",
  thCovers: "Covers",
  thTrust: "How much to trust it",
  rows: [
    {
      what: "VN30 ETF (E1VFVN30) daily close",
      where: "DNSE Entrade chart API",
      span: "2014-10 → today",
      trust:
        "Real traded prices. The fund reinvests what its holdings pay rather than distributing cash, so this price already behaves as a total-return series — no dividends are missing from it.",
    },
    {
      what: "SJC gold daily buy / sell",
      where: "github.com/andy-nguyen-21/gold-market-data-vietnam",
      span: "2016-01 → today",
      trust:
        "A community-maintained scrape, not an official SJC feed. It is why this page starts in 2016.",
    },
    {
      what: "Vietnam CPI, annual",
      where: "World Bank FP.CPI.TOTL",
      span: "2013 → last published year",
      trust: "Official. The current year is carried forward at 3.3% until it is published.",
    },
    {
      what: "VND savings deposit, 12-month term",
      where: "Hand-built table of representative bank rates",
      span: "2016 → today",
      trust:
        "The weakest number on this page. No free historical series of Vietnamese deposit rates is published, so these are representative rates across the large banks, not an official index. They are listed in full below so you can judge them.",
    },
  ],
  depositHeading: "Savings rates this page uses",
  depositIntro:
    "The annual interest on a personal VND savings deposit taken on a 12-month term at a large Vietnamese bank — what a saver who rolled the deposit over every year could plausibly have got. Not an official index. Since this is the number you should trust least, here it is in full rather than hidden behind a summary.",
  thYear: "Year",
  thRate: "Annual rate, 12-month VND deposit",
  chargesHeading: "What the model charges you",
  charges: [
    "The ETF trades in lots of 100 units. A month that cannot afford a lot buys nothing and the cash waits. Brokerage of 0.15% is charged on every purchase, and on every sale a milestone forces.",
    "Gold is bought at the shop's selling price and valued at its buying price, so the spread is a real cost. It is bought in whole chỉ, and one chỉ now costs more than many months' saving.",
    "The bank compounds monthly at the twelfth root of that year's rate, so a deposit quoted at 6.5% pays 6.5% over the year rather than 6.7%. It takes any amount, so it is the only channel that never leaves money idle.",
  ],
  notHeading: "What it does not do",
  notBody:
    "It does not predict anything. Every price here already happened, and the fact that gold won the last ten years in Vietnam is not a reason to expect it to win the next ten. This is a record, not advice.",
};

const VI: Copy = {
  langName: "Tiếng Việt",
  themeAuto: "Theo máy",
  themeLight: "Sáng",
  themeDark: "Tối",
  home: "Trang chủ",
  resume: "Hồ sơ",

  title: "Nếu cứ đều đặn mua thì sao?",
  subtitle:
    "Một phần lương mỗi tháng, đổ vào ba kênh người Việt thực sự dùng. Giá thật, lạm phát thật, phí thật — và tiền chưa đủ mua trọn một lô thì vẫn nằm đó là tiền mặt.",

  startingFrom: "Bắt đầu từ",
  endingAt: "Chạy đến",
  toLatest: "giá hôm nay",
  monthLabel: "Tháng",
  yearLabel: "Năm",
  initialCapital: "Vốn hiện có",
  initialCapitalHelp:
    "Giả định toàn bộ số này được đầu tư ngay tại tháng bắt đầu, vào cả ba kênh, theo đúng luật như mọi tháng khác — nên một phần có thể nằm chờ dưới dạng tiền mặt nếu chưa đủ mua trọn một lô ETF hay một chỉ vàng. Nó được tính vào vốn đã bỏ ra, và sinh lời ngay từ tháng đầu tiên.",
  projectedBadge: "Từ đây trở đi là giả định",
  projectionNote: (from, fitted, etf, gold, bank) =>
    `Từ ${from} trở đi chưa có giá thật, nên trang giả định mỗi kênh tiếp tục tăng đúng bằng tốc độ nó đạt được trên toàn bộ dữ liệu, ${fitted} — ETF ${etf}, vàng ${gold}, tiết kiệm ${bank} mỗi năm, khớp bằng hồi quy bình phương nhỏ nhất qua tất cả các tháng. Tốc độ này cố tình lấy từ toàn bộ lịch sử chứ không lấy từ khoảng bạn chọn, để một vài năm tăng mạnh không bị kéo dài thành cả thập kỷ. Dù vậy đây vẫn là giả định, không phải dự báo: một thập kỷ đã tăng như thế không hứa hẹn thập kỷ sau cũng vậy. Phần nét đứt trên biểu đồ là chỗ nó bắt đầu.`,
  windowLength: (m) => `${m} tháng`,
  iSaveLabel: "Tôi để dành",
  modePercent: "theo % lương",
  modeFixed: "số tiền cố định",
  salaryStart: "Lương lúc bắt đầu",
  salaryToday: "tức là hiện nay",
  cappedFrom: (y) => `chạm trần từ ${y}`,
  savePct: "Tôi để dành",
  savePctValue: (p) => `${p}% lương`,
  raiseEachYear: "Tăng lương mỗi năm",
  ceiling: "…nhưng lương không vượt quá",
  monthlyCap: "Nhưng mỗi tháng để dành tối đa",
  monthlyCapHelp:
    "Đây là trần cho số tiền để dành mỗi tháng, không phải trần lương. Nếu 25% lương vượt quá mức này thì phần dư không được đầu tư.",
  fixedAmount: "Mỗi tháng để dành",
  perMonth: "/tháng",

  contribFlat: (a) => `Tức là để dành ${a} mỗi tháng, đều đặn.`,
  contribRising: (first, last, year) =>
    `Tức là để dành ${first}/tháng lúc đầu, tăng dần lên ${last}${
      year ? `, chạm trần vào năm ${year}` : ""
    }.`,
  apply: "Áp dụng",
  applied: "Đã áp dụng",

  paidIn: "Vốn đã bỏ ra",
  inTodaysMoney: (a) => `≈ ${a} theo sức mua hôm nay`,
  paidInHelp:
    "Vẫn là một khoản tiền, chỉ nói theo hai cách: số bạn thực sự bỏ ra, và số đó quy về sức mua của hôm nay. Vế nào lớn hơn là tuỳ bạn bỏ tiền ra vào lúc nào. Tiền của quá khứ quy về hôm nay thì to ra — 4,7 triệu ₫ năm 2016 mua được bằng hơn 6 triệu ₫ bây giờ; tiền của tương lai thì nhỏ đi, vì đồng tiền năm 2034 mua được ít hơn. Cả hai chiều đều không phải lãi cũng không phải lỗ. Số tiền đó thành bao nhiêu thì xem ba ô bên dưới.",
  windowLabel: "Khoảng thời gian",
  inflationLabel: "Lạm phát trong kỳ",
  inflationHelp: (annual) =>
    `Đây là mức luỹ kế cho cả khoảng thời gian, tính ra khoảng ${annual} mỗi năm — xấp xỉ mức trung bình dài hạn của Việt Nam, nên con số tổng chỉ trông đáng sợ vì nó gộp nhiều năm. Dùng CPI thật đến năm gần nhất World Bank công bố, sau đó tạm tính tiếp 3,3% mỗi năm.`,
  pricedLabel: "Giá ngày",

  gold: "Vàng SJC",
  etf: "Quỹ ETF VN30",
  bank: "Gửi tiết kiệm",
  onWhatYouPaidIn: "so với vốn bỏ ra",
  realLine: (value, profit) => `${value} theo sức mua hôm nay (${profit})`,
  incomeLine: (amount, rate) => `${amount}/tháng nếu mỗi năm rút ${rate}`,
  incomeHelp:
    "Đây là quy ước tham khảo, không phải cam kết. Rút 4% danh mục mỗi năm là giả định thường dùng khi ước lượng khoản tiết kiệm trụ được bao lâu, và con số ở đây đã quy về sức mua hôm nay. Nó chưa tính thuế, chưa tính bạn thực sự tiêu bao nhiêu, cũng chưa tính những năm danh mục sụt giảm. Trang này là bản ghi giá, không phải lời khuyên đầu tư.",
  monthlySpend: "Mỗi tháng cần tiêu",
  monthlySpendHelp:
    "Tính theo tháng và theo sức mua hôm nay — mức bạn muốn tiêu, không nhất thiết là mức đang tiêu. Mỗi kênh sẽ được đối chiếu với con số này theo mức rút 4% mỗi năm. Để 0 nếu không muốn hiện phần kết luận.",
  covers: "Đủ",
  coversNot: "Chưa đủ",
  coverageEnough: (pct) => `đáp ứng ${pct} mức chi đó`,
  coverageShort: (pct, short, need) =>
    `mới đáp ứng ${pct} — thiếu ${short}/tháng; danh mục cần đạt ${need}`,
  aYear: "mỗi năm",
  winner: "Cao nhất",

  milestonesHeading: "Dấu mốc cuộc đời",
  milestonesIntro:
    "Mua nhà, mua xe, sinh con. Mỗi mốc rút tiền ra khỏi kế hoạch từ năm bạn đặt — và rút đều từ đó.",
  milestonesHelp:
    "Cả hai số đều nhập theo giá hôm nay; máy tự quy ra giá của năm mà khoản đó thực sự phải trả. Tiền được trừ vào phần tiết kiệm hằng tháng trước, khi không đủ thì kế hoạch bán bớt chứng chỉ quỹ hoặc vàng ra trả — bán vàng lại cho tiệm thì chịu chênh lệch mua bán, đúng như ngoài đời. Căn nhà ở đây tính là tiêu mất chứ không tính là tài sản: trang này đo xem mỗi tháng danh mục trả cho bạn bao nhiêu, mà căn nhà bạn đang ở thì không trả đồng nào. Nên các con số dưới đây cho biết lần mua đó lấy mất bao nhiêu của tuổi hưu, không phải bạn đang có bao nhiêu.",
  milestonesNone: "Chưa có mốc nào. Thêm một cái để xem kế hoạch chịu được tới đâu.",
  addMilestone: "Thêm mốc",
  removeMilestone: "Xoá",
  mName: "Tên mốc",
  mNamePlaceholder: "Mua nhà",
  mYear: "Từ năm",
  mUpfront: "Trả ngay",
  mAnnual: "Mỗi năm",
  mYears: "Trong",
  mYearsForever: "đến hết",
  mOutsideRun: "ngoài kỳ tính",
  milestonesOutside: (names, until) =>
    `${names} nằm sau khi kỳ tính kết thúc (${until}), nên chưa có khoản nào bị trừ. Đổi “Chạy đến” sang năm đó hoặc muộn hơn để thấy nó ảnh hưởng thế nào.`,
  presetHouse: "Nhà",
  presetCar: "Xe",
  presetChild: "Con",
  milestoneTotalLabel: "Các mốc ngốn",
  milestoneTotalHelp:
    "Tổng số tiền các mốc lấy đi trong cả kỳ, tính theo giá từng năm, kèm dòng quy về sức mua hôm nay ở dưới.",
  spentOnMilestones: "đã chi cho các mốc",
  broke: "Cạn tiền",
  brokeLine: (month, amount) => `hết sạch từ ${month} — còn thiếu ${amount}`,
  thMilestoneCost: "Mốc",

  today: "Hôm nay",
  paidInShort: "Vốn bỏ ra",

  tabSummary: "Tổng quan",
  tabMonths: "Từng tháng",
  tabMethod: "Cách tính",
  tabSources: "Số liệu lấy từ đâu",

  thChannel: "Kênh",
  thNetWorth: "Giá trị danh mục cuối kỳ",
  thHolding: "Đang nắm giữ",
  thBoughtIn: "Số tháng mua được",
  thIdleCash: "Tiền mặt còn dư",
  thDeepestFall: "Mức sụt sâu nhất của danh mục",
  thAfterInflation: "Lãi sau lạm phát, quy về sức mua hôm nay",
  afterInflationHelp:
    "Vẫn là khoản lãi đó, nhưng quy về sức mua của đồng tiền hôm nay. Nếu bạn chạy đến tương lai, con số đã được chiết khấu ngược về hiện tại — +227 triệu nghĩa là 227 triệu theo sức mua hôm nay, chứ không phải 227 triệu của năm 2035, vốn mua được ít hơn nhiều.",
  beforeInflationHelp:
    "Số tiền danh nghĩa tại thời điểm kết thúc, chưa điều chỉnh việc giá cả đã tăng. Cột bên phải quy nó về sức mua hôm nay.",
  ofMonths: (b, t) => `${b} / ${t} tháng`,
  fundUnits: (n) => `${n} chứng chỉ quỹ`,
  bankHolding: "lãi nhập gốc hằng tháng",
  brokerage: (a) => `Phí môi giới đã trả khi mua ETF: ${a}.`,
  salaryModelled: (s, e) => `Lương mô phỏng từ ${s}/tháng lúc đầu lên ${e} hiện nay.`,

  thMonth: "Tháng",
  thPutIn: "Bỏ vào",
  thPaidInSoFar: "Vốn luỹ kế",
  thEtfPrice: "Giá ETF",
  thGoldPrice: "Giá vàng / lượng",

  sourcesIntro: (d) =>
    `Mọi con số trên trang này đến từ bốn nguồn dưới đây, được chốt lại thành một bản dữ liệu lấy ngày ${d}. Trang không gọi mạng lúc bạn dùng, và không giả định gì về tương lai.`,
  thSeries: "Dữ liệu",
  thSource: "Nguồn",
  thCovers: "Khoảng thời gian",
  thTrust: "Đáng tin tới đâu",
  rows: [
    {
      what: "Giá đóng cửa ETF VN30 (E1VFVN30)",
      where: "API biểu đồ DNSE Entrade",
      span: "10/2014 → nay",
      trust:
        "Giá khớp lệnh thật. Quỹ tái đầu tư cổ tức nhận được từ danh mục thay vì chia tiền mặt, nên giá này đã phản ánh tổng lợi suất — không thiếu phần cổ tức.",
    },
    {
      what: "Giá mua / bán vàng SJC hằng ngày",
      where: "github.com/andy-nguyen-21/gold-market-data-vietnam",
      span: "01/2016 → nay",
      trust:
        "Dữ liệu do cộng đồng thu thập, không phải nguồn chính thức của SJC. Đây là lý do trang bắt đầu từ năm 2016.",
    },
    {
      what: "CPI Việt Nam, theo năm",
      where: "World Bank FP.CPI.TOTL",
      span: "2013 → năm công bố gần nhất",
      trust: "Số liệu chính thức. Năm hiện tại tạm suy ra theo mức 3,3% cho tới khi được công bố.",
    },
    {
      what: "Tiền gửi tiết kiệm VND, kỳ hạn 12 tháng",
      where: "Bảng tự lập từ lãi suất tham khảo của các ngân hàng",
      span: "2016 → nay",
      trust:
        "Đây là con số yếu nhất trên trang. Không có nguồn miễn phí nào công bố chuỗi lãi suất tiết kiệm Việt Nam theo lịch sử, nên đây là mức tham khảo chung của nhóm ngân hàng lớn chứ không phải một chỉ số chính thức. Toàn bộ bảng được liệt kê bên dưới để bạn tự đánh giá.",
    },
  ],
  depositHeading: "Lãi suất tiết kiệm trang này dùng",
  depositIntro:
    "Lãi suất một năm của sổ tiết kiệm VND cá nhân, kỳ hạn 12 tháng, tại các ngân hàng lớn — mức mà một người gửi rồi tái tục đều đặn mỗi năm có thể nhận được. Không phải chỉ số chính thức. Vì đây là con số bạn nên tin ít nhất, nó được in ra đầy đủ thay vì giấu sau một câu tóm tắt.",
  thYear: "Năm",
  thRate: "Lãi suất năm, gửi VND kỳ hạn 12 tháng",
  chargesHeading: "Mô hình tính những chi phí nào",
  charges: [
    "ETF giao dịch theo lô 100 chứng chỉ. Tháng nào chưa đủ tiền mua trọn một lô thì không mua gì, tiền chờ sang tháng sau. Phí môi giới 0,15% tính cho mỗi lần mua, và cho cả mỗi lần bán mà dấu mốc buộc phải bán.",
    "Vàng mua theo giá bán của tiệm và định giá theo giá mua, nên chênh lệch mua–bán là chi phí thật. Vàng mua theo chỉ nguyên, và một chỉ bây giờ đắt hơn số tiền để dành của nhiều tháng cộng lại.",
    "Tiết kiệm nhập lãi hằng tháng theo căn bậc mười hai của lãi suất năm đó, nên mức niêm yết 6,5% trả đúng 6,5% một năm chứ không thành 6,7%. Ngân hàng nhận mọi số tiền, nên đây là kênh duy nhất không bao giờ để tiền nằm không.",
  ],
  notHeading: "Trang này không làm gì",
  notBody:
    "Nó không dự đoán. Mọi mức giá ở đây đều đã xảy ra rồi, và việc vàng thắng trong mười năm qua ở Việt Nam không phải lý do để tin vàng sẽ thắng mười năm tới. Đây là một bản ghi chép, không phải lời khuyên đầu tư.",
};

export const COPY: Record<Lang, Copy> = { en: EN, vi: VI };
