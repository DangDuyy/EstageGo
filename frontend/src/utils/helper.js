import * as XLSX from "xlsx-js-style";

// Tạo marker cho căn hộ trên map
export function createPropertyMarker(property) {
  const coords = property?.address?.location?.coordinates;
  if (!coords || coords.length !== 2) return null;
  
  const [lng, lat] = coords; // GeoJSON: [lng, lat]
  return {
    id: property._id,
    lat: lat,
    lng: lng,
    title: property.title,
    price: property.price?.value,
    currency: property.price?.currency,
    type: property.type,
    status: property.status,
    purpose: property.purpose,
    image: property.media?.[0]?.url,
    slug: property.slug
  };
}

// Tạo nhiều markers từ danh sách properties
export function createPropertyMarkers(properties = []) {
  return properties
    .map(createPropertyMarker)
    .filter(marker => marker !== null);
}

export function formatPrice(price) {
  if (price == null) return null;
  if (typeof price === "number") return `$${price.toLocaleString()}`;
  if (typeof price === "string") return price;
  if (typeof price === "object") {
    const { value, currency, period } = price;
    const symbolMap = { USD: "$", VND: "₫", EUR: "€" };
    const symbol = symbolMap[currency] ?? (currency ? `${currency} ` : "");
    const num = Number(value ?? 0);
    return `${symbol}${num.toLocaleString()}${period ? `/${period}` : ""}`;
  }
  return String(price);
}

/**
 * Export amortization schedule to Excel using SheetJS (XLSX).
 *
 * @param {Object} opts
 *  - principal: number (số tiền vay, VND)
 *  - annualRate: number (lãi suất %/năm, vd 7.5)
 *  - years: number (số năm vay)
 *  - loanType: 'decreasing' | 'fixed'
 *  - fileName: optional string
 *  - startDate: optional Date object to show payment date (or null)
 */
export function exportAmortizationExcel({
  principal,
  annualRate,
  years,
  loanType = "decreasing", // "decreasing" hoặc "fixed"
  fileName = `Chi tiết khoản vay - ${(new Date).toLocaleDateString().replace(/[/:.]/g, "")}.xlsx`,
}) {
  // normalize inputs
  principal = Number(principal) || 0;
  annualRate = Number(annualRate) || 0;
  years = Number(years) || 0;
  if (principal <= 0 || years <= 0) return;

  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  const fmt = new Intl.NumberFormat("vi-VN");

  // styles (mô phỏng đúng style trong mẫu)
  const styleTitle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "FF0000" } }
  };

  const styleLabelBoldItalic = {
    font: { bold: true, italic: true },
    alignment: { horizontal: "left", vertical: "center" }
  };

  const styleRightText = {
    alignment: { horizontal: "right", vertical: "center" }
  };

  const styleHeaderCenter = {
    font: { bold: true },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { color: { rgb: "000000" } },
      bottom: { color: { rgb: "000000" } }
    }
  };

  const styleSummaryBoldRight = {
    font: { bold: true },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { color: { rgb: "000000" } },
      bottom: { color: { rgb: "000000" } }
    }
  };

  const styleStripeWhite = {
    alignment: { horizontal: "right", vertical: "center" },
    fill: { fgColor: { rgb: "FFFFFF" } }
  };

  // sample used a weird hex "cfcfcfcf" - use a light gray "CFCFCF"
  const styleStripeGray = {
    alignment: { horizontal: "right", vertical: "center" },
    fill: { fgColor: { rgb: "CFCFCF" } }
  };

  // build AOÀ (array of arrays). We'll keep 5 columns: 0..4
  const aoa = [];

  // Title (merged later across 0..4)
  aoa.push([
    { v: `CHI TIẾT KHOẢN VAY - ${new Date().toLocaleDateString("vi-VN")}`, s: styleTitle }
  ]);

  // empty merged row
  aoa.push([{ t: "z", v: "" }]);

  // Info rows: "Số tiền vay", "Thời hạn vay", "Lãi suất", "Hình thức"
  aoa.push([
    { v: "Số tiền vay", s: styleLabelBoldItalic },
    "",
    { v: fmt.format(principal), s: styleRightText }
  ]);

  aoa.push([
    { v: "Thời hạn vay", s: styleLabelBoldItalic },
    "",
    { v: `${years} năm`, s: styleRightText }
  ]);

  aoa.push([
    { v: "Lãi suất", s: styleLabelBoldItalic },
    "",
    { v: `${annualRate} %/năm`, s: styleRightText }
  ]);

  aoa.push([
    { v: "Hình thức", s: styleLabelBoldItalic },
    "",
    { v: loanType === "fixed" ? "Dư nợ cố định" : "Dư nợ giảm dần", s: styleRightText }
  ]);

  // another empty row
  aoa.push([{ t: "z", v: "" }]);

  // Table header (5 columns)
  aoa.push([
    { v: "Kỳ hạn", s: styleHeaderCenter },
    { v: "Lãi phải trả", s: styleHeaderCenter },
    { v: "Gốc phải trả", s: styleHeaderCenter },
    { v: "Số tiền phải trả", s: styleHeaderCenter },
    { v: "Số tiền còn lại", s: styleHeaderCenter }
  ]);

  // initial row with period 0 and remaining balance
  let remaining = principal;
  aoa.push([
    { t: "n", v: 0, s: { alignment: { horizontal: "center", vertical: "center" } } },
    { t: "s", v: "", s: { } },
    { t: "s", v: "", s: { } },
    { t: "s", v: "", s: { } },
    { v: fmt.format(remaining), s: styleStripeWhite }
  ]);

  // compute schedule
  let totalInterest = 0;
  const principalPerMonth = principal / months;
  // for fixed annuity monthly
  let fixedMonthly = 0;
  if (loanType === "fixed") {
    if (monthlyRate === 0) fixedMonthly = principal / months;
    else fixedMonthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  for (let r = 0; r < months; r++) {
    // interest calculation in original: if g == "0" then use u*(d/100) else f*(d/100)
    // Here loanType === "decreasing" behaves like g == "1" (interest on remaining),
    // and loanType === "fixed" behaves like fixedMonthly interest = remaining*monthlyRate
    const interest = loanType === "decreasing" ? remaining * monthlyRate : remaining * monthlyRate;
    let principalPay = loanType === "decreasing" ? principalPerMonth : fixedMonthly - interest;
    // last payment fix
    if (r === months - 1) principalPay = remaining;
    const total = interest + principalPay;
    totalInterest += interest;
    remaining = Math.max(0, remaining - principalPay);

    // alternating background like original: even -> gray (h), odd -> white (e)
    const styleBackground = (r % 2 === 0) ? styleStripeGray : styleStripeWhite;

    aoa.push([
      { t: "n", v: r + 1, s: { ...styleBackground, alignment: { horizontal: "center", vertical: "center" } } },
      { v: fmt.format(Math.round(interest)), s: styleBackground },
      { v: fmt.format(Math.round(principalPay)), s: styleBackground },
      { v: fmt.format(Math.round(total)), s: styleBackground },
      { v: fmt.format(Math.round(remaining)), s: styleBackground }
    ]);
  }

  // totals row (mimic original)
  aoa.push([
    { v: "Tổng", s: styleSummaryBoldRight },
    { v: fmt.format(Math.round(totalInterest)), s: styleSummaryBoldRight },
    { v: fmt.format(Math.round(principal)), s: styleSummaryBoldRight },
    { v: fmt.format(Math.round(totalInterest + principal)), s: styleSummaryBoldRight },
    { t: "s", v: "", s: styleSummaryBoldRight }
  ]);

  // create workbook/worksheet and apply cols/rows/merges like mẫu
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // cols: first width 8, others width 16 (giống mẫu)
  ws["!cols"] = [
    { width: 8 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 }
  ];

  // rows: set first row height like mẫu
  ws["!rows"] = [{ hpt: 24 }];

  // merges exactly như mẫu bạn gửi (r,c index bắt đầu 0)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 3, c: 3 }, e: { r: 3, c: 4 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 4, c: 3 }, e: { r: 4, c: 4 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 5, c: 3 }, e: { r: 5, c: 4 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Chi tiết khoản vay");
  XLSX.writeFile(wb, fileName);
}
