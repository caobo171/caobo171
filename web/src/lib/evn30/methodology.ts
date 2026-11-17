import type { Lang } from "./copy";

/**
 * How the page computes what it shows. Kept apart from `copy.ts` because it is
 * prose rather than interface labels, and because it has one job the labels do
 * not: every number stated here must match a constant the engine actually uses.
 * A test pins the ones that matter.
 */
export interface MethodSection {
  /** Stable across languages — the parity test keys on it. */
  id: string;
  heading: string;
  body: string[];
}

const EN: MethodSection[] = [
  {
    id: "what",
    heading: "What it simulates",
    body: [
      "One purchase a month, every month, from the start of the window to its end, into three places at once: the E1VFVN30 fund (which tracks the VN30 index), SJC gold, and a 12-month bank deposit. The same money goes into all three, so the comparison is between the channels and nothing else.",
      "Each month uses one price: the one quoted on the first trading day of that month. There is no attempt to pick a good day or a bad one.",
      "Everything before the last month of real data already happened. Everything after it is assumed, and the page marks where that begins.",
    ],
  },
  {
    id: "salary",
    heading: "Salary and what you save",
    body: [
      "The salary you type is the salary in the first month of the window. It rises by the annual raise once every twelve months and then stops rising the moment it meets the ceiling — the page says which year that happens, because a raise slider that changes nothing otherwise looks broken.",
      "Saving is either a share of that salary or a fixed amount, and the monthly cap applies to the saving, not to the salary. Those are two different ceilings and the labels say which is which.",
      "Capital you already have is put to work in the first month of the window, into all three channels, under the same lot and spread rules as every other purchase. It is not left sitting as cash.",
    ],
  },
  {
    id: "buying",
    heading: "How each channel buys",
    body: [
      "The fund trades in lots of 100 units. A month that cannot afford a whole lot buys nothing and the money waits as cash until it can — which is why the summary has an idle-cash column and why the fund is not bought in every month of a thin plan. Each purchase pays 0.15% brokerage.",
      "Gold is bought at the shop's selling price and valued at its buying price, so the spread is a real cost from the moment you buy. It is bought in whole chỉ (a tenth of a lượng).",
      "The deposit compounds monthly at the twelfth root of that year's annual rate, so a rate quoted at 6.5% pays 6.5% over the year rather than 6.70%. The bank accepts any amount, so it is the only channel that never leaves money idle.",
    ],
  },
  {
    id: "milestones",
    heading: "Life milestones",
    body: [
      "A milestone takes a lump at the start of its year and then a yearly amount, spread evenly over the twelve months, for as many years as you set — zero years means it runs to the end of the plan. Both figures are typed in today's money and inflated to the year the cost actually falls, so a house priced at today's prices costs more dong in 2035 than it would now.",
      "The money comes out of that month's saving first. When the saving is not enough, the plan sells to cover the rest: whole lots of the fund, paying the same 0.15% on the way out, or whole chỉ of gold at the shop's buying price, which means paying the spread again. The bank is simply drawn down.",
      "When a pot cannot cover what is asked of it, it is emptied rather than taken negative, and the channel is marked as having run dry, with the month it happened and the amount it could not pay. A card in that state leads with the failure instead of quoting a rate of return beside a balance of zero.",
      "A house is counted as spent, not as an asset. This page measures what a pot pays you every month, and a home you live in pays you nothing — so the figures describe what the purchase cost your retirement, not what you are worth.",
    ],
  },
  {
    id: "inflation",
    heading: "Inflation and “today's money”",
    body: [
      "Every figure labelled after inflation is stated in the purchasing power of today — the date the price data was last refreshed — never in the purchasing power of the year the run ends. For a backtest the two are the same. For a run ending in 2046 they are very far apart, and the second reading would flatter the result by a third or more.",
      "The consumer price index comes from the General Statistics Office, by year. Past the last published year the page carries inflation forward at 3.3% a year, which is close to Vietnam's long-run average. That is an assumption, and it is the one doing most of the work in any long projection.",
      "Money paid in is restated the same way: each month's contribution is deflated from the year it was paid, not from the start of the window.",
    ],
  },
  {
    id: "future",
    heading: "Prices past the data",
    body: [
      "When the window runs past the last real price, each channel is continued at its own fitted growth rate: a least-squares fit of the logarithm of the price against time. That is the rate that best explains every month on record, rather than the rate implied by drawing a line between the first and last.",
      "The fit always uses the whole history, never the window you selected. Fitting the window would let two good years be extrapolated into a decade — an earlier version did exactly that, and a run starting in 2024 claimed the fund would compound at 22.9% a year.",
      "Gold's buy-sell spread past the data is held at the last real ratio. The deposit continues at the last published rate. None of this is a forecast: a decade that behaved one way does not promise the next one will.",
    ],
  },
  {
    id: "results",
    heading: "What the result figures mean",
    body: [
      "The annual return is money-weighted (XIRR), solved by bisection over the actual dated cash flows on a 365.25-day year. It is not total profit divided by total paid in: money put in last year has not had ten years to compound, and an average that ignores when each dong arrived would overstate a plan that saved more recently.",
      "Profit is measured against what actually reached the pot, not against gross saving. Money a milestone diverted was never invested, so counting it as a loss would be wrong.",
      "Deepest fall is the worst drop of the pot from its own peak, not of the asset's price — steady contributions cushion it, which is why the bank reads zero. Money withdrawn for a milestone is added back before the measurement, otherwise paying for a house would register as the worst market crash in the window. That correction is approximate: the withdrawn money would in truth have gone on rising and falling, so the figure comes out a couple of points shallower than the full counterfactual.",
      "The monthly income is 4% of the final pot divided by twelve, in today's money. Four percent is a common planning convention for making savings last, not a promise, and it ignores tax, a bad year, and what you actually spend.",
    ],
  },
  {
    id: "not",
    heading: "What it does not model",
    body: [
      "Tax. Personal income tax on selling fund units is not deducted. Deposit interest for individuals is not taxed in Vietnam, so nothing is missing there.",
      "Dividends are not added separately, because E1VFVN30 accumulates rather than distributing — its price series already carries them.",
      "Within-month timing, slippage and the fund's own bid-ask spread. One price per month, taken on the first trading day, is all the data supports.",
      "A mortgage as a debt. A milestone models the money leaving your hands — the deposit and the yearly cost — not an outstanding balance, an early repayment, or the house's own value.",
      "Your life going wrong: losing the job, a year without a raise, an emergency that empties the pot. The plan saves exactly what you told it to, every month, without fail.",
    ],
  },
  {
    id: "honest",
    heading: "What this page is for",
    body: [
      "It is a record of prices, arranged so you can see what a habit would have produced. It is not advice, and gold winning the last ten years in Vietnam is not a reason to believe it wins the next ten.",
      "Every price, index and rate has a source, a date and an honest note about how far to trust it in the Sources tab. Where a number is assumed rather than observed, the page says so on the figure itself.",
    ],
  },
];

const VI: MethodSection[] = [
  {
    id: "what",
    heading: "Trang này mô phỏng cái gì",
    body: [
      "Mỗi tháng mua một lần, đều đặn từ đầu kỳ tới cuối kỳ, vào cả ba nơi cùng lúc: quỹ E1VFVN30 (bám theo chỉ số VN30), vàng miếng SJC, và tiền gửi tiết kiệm kỳ hạn 12 tháng. Cùng một số tiền đổ vào cả ba, nên thứ được so sánh chỉ là bản thân ba kênh đó.",
      "Mỗi tháng dùng đúng một mức giá: giá của ngày giao dịch đầu tiên trong tháng. Không có chuyện chọn ngày đẹp hay ngày xấu.",
      "Mọi thứ trước tháng cuối cùng có dữ liệu thật đều đã xảy ra rồi. Mọi thứ sau đó là giả định, và trang có đánh dấu chỗ bắt đầu giả định.",
    ],
  },
  {
    id: "salary",
    heading: "Lương và tiền để dành",
    body: [
      "Mức lương bạn nhập là lương của tháng đầu tiên trong kỳ. Cứ mười hai tháng nó tăng một lần theo mức tăng bạn chọn, và dừng tăng ngay khi chạm trần — trang có ghi rõ chạm trần từ năm nào, vì nếu không thì kéo thanh tăng lương mà số không nhúc nhích sẽ trông như hỏng.",
      "Tiền để dành tính theo phần trăm lương hoặc theo một số cố định, và mức trần hằng tháng là trần của tiền để dành chứ không phải trần lương. Đây là hai cái trần khác nhau, nhãn của từng ô nói rõ cái nào là cái nào.",
      "Vốn bạn đã có được đưa vào làm việc ngay tháng đầu tiên của kỳ, vào cả ba kênh, theo đúng luật lô và chênh lệch giá như mọi lần mua khác. Nó không nằm không.",
    ],
  },
  {
    id: "buying",
    heading: "Từng kênh mua vào thế nào",
    body: [
      "Quỹ giao dịch theo lô 100 chứng chỉ. Tháng nào chưa đủ tiền mua trọn một lô thì không mua gì, tiền chờ sang tháng sau — vì vậy bảng tổng quan mới có cột tiền mặt còn dư, và vì vậy một kế hoạch mỏng sẽ không mua được quỹ trong mọi tháng. Mỗi lần mua chịu phí môi giới 0,15%.",
      "Vàng mua theo giá bán của tiệm và được định giá theo giá mua, nên chênh lệch mua–bán là chi phí thật ngay từ lúc mua. Vàng mua theo chỉ nguyên (một phần mười lượng).",
      "Tiết kiệm nhập lãi hằng tháng theo căn bậc mười hai của lãi suất năm đó, nên mức niêm yết 6,5% trả đúng 6,5% một năm chứ không thành 6,70%. Ngân hàng nhận mọi số tiền, nên đây là kênh duy nhất không bao giờ để tiền nằm không.",
    ],
  },
  {
    id: "milestones",
    heading: "Dấu mốc cuộc đời",
    body: [
      "Một dấu mốc lấy một khoản ngay đầu năm của nó, rồi lấy tiếp một khoản hằng năm chia đều cho mười hai tháng, kéo dài bao nhiêu năm là tuỳ bạn đặt — để 0 nghĩa là kéo tới hết kỳ. Cả hai số đều nhập theo giá hôm nay rồi được quy ra giá của năm mà khoản đó thực sự phải trả, nên một căn nhà định giá theo hôm nay sẽ tốn nhiều đồng hơn nếu mua vào năm 2035.",
      "Tiền được trừ vào phần để dành của tháng đó trước. Khi phần để dành không đủ, kế hoạch bán ra để bù: bán nguyên lô chứng chỉ quỹ, chịu đúng 0,15% phí lúc bán, hoặc bán chỉ vàng nguyên theo giá mua của tiệm, tức là chịu chênh lệch mua–bán thêm một lần nữa. Riêng tiết kiệm thì rút thẳng.",
      "Khi một danh mục không gánh nổi khoản được yêu cầu, nó bị rút về 0 chứ không âm, và kênh đó bị đánh dấu là đã cạn tiền, kèm theo tháng xảy ra và số còn thiếu. Thẻ ở trạng thái này dẫn bằng chuyện kế hoạch vỡ, chứ không quăng ra một con số lợi suất ngay cạnh số dư bằng không.",
      "Căn nhà được tính là tiêu mất, không tính là tài sản. Trang này đo xem mỗi tháng danh mục trả cho bạn bao nhiêu, mà căn nhà bạn đang ở thì không trả đồng nào — nên các con số ở đây cho biết lần mua đó lấy mất bao nhiêu của tuổi hưu, chứ không phải bạn đang có bao nhiêu.",
    ],
  },
  {
    id: "inflation",
    heading: "Lạm phát và “giá hôm nay”",
    body: [
      "Mọi con số ghi là sau lạm phát đều quy về sức mua của hôm nay — ngày dữ liệu giá được cập nhật lần cuối — chứ không bao giờ quy về sức mua của năm kết thúc kỳ chạy. Với một kỳ chạy trong quá khứ thì hai cái đó là một. Với một kỳ chạy tới 2046 thì chúng cách nhau rất xa, và cách đọc thứ hai sẽ thổi phồng kết quả lên cả một phần ba.",
      "Chỉ số giá tiêu dùng lấy từ Tổng cục Thống kê, theo từng năm. Qua khỏi năm cuối cùng được công bố, trang tiếp tục cộng lạm phát 3,3% mỗi năm, xấp xỉ mức trung bình dài hạn của Việt Nam. Đó là một giả định, và trong mọi kỳ chạy dài thì nó chính là thứ quyết định nhiều nhất.",
      "Tiền đã bỏ ra cũng được quy đổi theo đúng cách đó: khoản của từng tháng được quy về từ chính năm nó được bỏ ra, không phải từ đầu kỳ.",
    ],
  },
  {
    id: "future",
    heading: "Giá ở phần chưa có dữ liệu",
    body: [
      "Khi kỳ chạy vượt quá mức giá thật cuối cùng, mỗi kênh được kéo dài theo tốc độ tăng khớp từ chính nó: hồi quy bình phương nhỏ nhất của logarit giá theo thời gian. Đó là tốc độ giải thích được tốt nhất tất cả các tháng trong lịch sử, chứ không phải tốc độ suy ra từ việc nối điểm đầu với điểm cuối.",
      "Phép khớp luôn chạy trên toàn bộ lịch sử, không bao giờ chạy trên khoảng bạn chọn. Khớp theo khoảng bạn chọn sẽ khiến vài năm tăng mạnh bị kéo dài thành cả thập kỷ — một phiên bản trước đã mắc đúng lỗi này, và một kỳ chạy bắt đầu từ 2024 đã tuyên bố quỹ sẽ tăng 22,9% mỗi năm.",
      "Chênh lệch mua–bán của vàng ở phần chưa có dữ liệu được giữ nguyên theo tỉ lệ thật cuối cùng. Tiết kiệm tiếp tục theo lãi suất công bố gần nhất. Không có gì trong số này là dự báo: một thập kỷ đã diễn ra như thế không hứa hẹn thập kỷ sau cũng vậy.",
    ],
  },
  {
    id: "results",
    heading: "Các con số kết quả nghĩa là gì",
    body: [
      "Lợi suất năm tính theo dòng tiền (XIRR), giải bằng phương pháp chia đôi trên đúng các dòng tiền có ngày tháng, quy ước một năm 365,25 ngày. Nó không phải là tổng lãi chia cho tổng vốn: tiền bỏ vào năm ngoái chưa có mười năm để sinh lời, và một mức trung bình bỏ qua chuyện từng đồng đến vào lúc nào sẽ thổi phồng một kế hoạch dồn tiền về cuối.",
      "Lãi được đo trên số tiền thật sự vào được danh mục, không đo trên tổng tiền để dành. Tiền mà một dấu mốc lấy đi thì chưa từng được đầu tư, nên ghi nó thành lỗ là sai.",
      "Mức sụt sâu nhất là mức giảm mạnh nhất của danh mục so với đỉnh của chính nó, không phải của giá tài sản — tiền nạp đều đặn làm dịu con số này, nên cột của tiết kiệm luôn bằng 0. Tiền rút ra để trả cho dấu mốc được cộng lại trước khi đo, nếu không thì trả tiền mua nhà sẽ bị ghi thành cú sập mạnh nhất của cả kỳ. Phép hiệu chỉnh này là gần đúng: số tiền đã rút lẽ ra vẫn lên xuống theo thị trường, nên con số thu được nông hơn thực tế vài điểm phần trăm.",
      "Thu nhập hằng tháng bằng 4% danh mục cuối kỳ chia cho mười hai, tính theo giá hôm nay. Bốn phần trăm là quy ước thường dùng khi ước lượng khoản tiết kiệm trụ được bao lâu, không phải cam kết, và nó bỏ qua thuế, bỏ qua những năm thị trường xấu, bỏ qua việc bạn thực sự tiêu bao nhiêu.",
    ],
  },
  {
    id: "not",
    heading: "Trang này không mô phỏng gì",
    body: [
      "Thuế. Thuế thu nhập cá nhân khi bán chứng chỉ quỹ không được trừ. Lãi tiền gửi của cá nhân ở Việt Nam không chịu thuế, nên ở kênh đó không thiếu gì.",
      "Cổ tức không được cộng riêng, vì E1VFVN30 tích luỹ chứ không chia — chuỗi giá của nó đã bao gồm phần đó rồi.",
      "Thời điểm mua trong tháng, trượt giá, và chênh lệch giá mua–bán của chính chứng chỉ quỹ. Một mức giá cho mỗi tháng, lấy ở ngày giao dịch đầu tiên, là tất cả những gì dữ liệu cho phép.",
      "Khoản vay mua nhà như một món nợ. Một dấu mốc mô phỏng số tiền rời khỏi tay bạn — khoản trả ngay và khoản hằng năm — chứ không mô phỏng dư nợ gốc, trả trước hạn, hay giá trị của chính căn nhà.",
      "Chuyện đời bạn trục trặc: mất việc, một năm không được tăng lương, một biến cố vét sạch danh mục. Kế hoạch ở đây để dành đúng bằng mức bạn khai, tháng nào cũng vậy, không sai một lần nào.",
    ],
  },
  {
    id: "honest",
    heading: "Trang này để làm gì",
    body: [
      "Nó là một bản ghi chép giá, sắp xếp lại để bạn thấy một thói quen sẽ dẫn tới đâu. Nó không phải lời khuyên, và việc vàng thắng mười năm vừa rồi ở Việt Nam không phải lý do để tin vàng sẽ thắng mười năm tới.",
      "Mọi mức giá, chỉ số và lãi suất đều có nguồn, có ngày, và có ghi chú thật thà về mức độ đáng tin ở tab Số liệu lấy từ đâu. Chỗ nào là con số giả định chứ không phải quan sát được, trang nói rõ ngay tại con số đó.",
    ],
  },
];

export const METHODOLOGY: Record<Lang, MethodSection[]> = { en: EN, vi: VI };
