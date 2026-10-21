import ExcelJS from "exceljs";
import type { AppData } from "../context/AppDataContext";

interface ExportOptions {
  currency?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
}

export async function exportFinancialStatementExcel(data: AppData, options: ExportOptions = {}) {
  const currency = options.currency || "INR";
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  const currencyNumFmt = `"${currencySymbol}"#,##0.00;("${currencySymbol}"#,##0.00);"-";@`;
  const currencyIntFmt = `"${currencySymbol}"#,##0;("${currencySymbol}"#,##0);"-";@`;
  const percentFmt = "0.0%";
  const userName = options.userName || "Anand";
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startDate = options.startDate;
  const endDate = options.endDate;
  const hasDateRange = Boolean(startDate && endDate);

  // Filter transactions within the selected date range (inclusive)
  const filteredTransactions = hasDateRange
    ? data.transactions.filter((t) => {
        const d = t.date ? t.date.slice(0, 10) : "";
        return d >= startDate! && d <= endDate!;
      })
    : data.transactions;

  const incomeTx = filteredTransactions
    .filter((t) => t.type === "income")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const expenseTx = filteredTransactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const allTx = [...filteredTransactions].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const periodStartDateStr = startDate || (filteredTransactions.length > 0
    ? filteredTransactions.reduce((min, t) => (!min || (t.date && t.date < min) ? t.date.slice(0, 10) : min), "")
    : `${todayStr.slice(0, 7)}-01`);

  const periodEndDateStr = endDate || todayStr;

  // ==========================================
  // CASH FLOW & OPENING / CLOSING BALANCE CALCULATIONS
  // ==========================================
  const totalIncomeVal = incomeTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenseVal = expenseTx.reduce((s, t) => s + t.amount, 0);
  const netCashFlowVal = totalIncomeVal - totalExpenseVal;
  const savingsRateVal = totalIncomeVal > 0 ? netCashFlowVal / totalIncomeVal : 0;

  // Calculate prior transactions before the selected start date
  const priorIncome = data.transactions
    .filter((t) => t.type === "income" && t.date && t.date.slice(0, 10) < periodStartDateStr)
    .reduce((s, t) => s + t.amount, 0);

  const priorExpense = data.transactions
    .filter((t) => t.type === "expense" && t.date && t.date.slice(0, 10) < periodStartDateStr)
    .reduce((s, t) => s + t.amount, 0);

  const priorNetCash = priorIncome - priorExpense;

  // Check recorded Bank & Cash assets from Net Worth
  const bankCashAssets = data.assets.filter((a) => {
    const t = (a.type || "").toLowerCase();
    const n = (a.name || "").toLowerCase();
    return t === "bank" || t === "cash" || n.includes("bank") || n.includes("cash") || n.includes("savings") || n.includes("checking");
  });
  const currentBankCashVal = bankCashAssets.reduce((s, a) => s + a.value, 0);

  let openingBalanceVal = 0;
  if (currentBankCashVal > 0) {
    openingBalanceVal = Math.max(0, currentBankCashVal - netCashFlowVal);
  } else if (priorNetCash !== 0) {
    openingBalanceVal = Math.max(0, priorNetCash);
  } else {
    openingBalanceVal = 0;
  }

  const closingBalanceVal = openingBalanceVal + netCashFlowVal;

  // Investments
  const totalInvestedVal = data.investments.reduce((s, i) => s + i.invested, 0);
  const totalPortfolioCurrentVal = data.investments.reduce((s, i) => s + i.current, 0);
  const totalPortfolioGainVal = totalPortfolioCurrentVal - totalInvestedVal;

  // Debt & EMIs
  const totalMonthlyEmiVal = data.emis.reduce((s, e) => s + e.monthlyEmi, 0);
  const totalRemainingDebtVal = data.emis.reduce((s, e) => {
    const remMonths = Math.max(0, e.totalTenureMonths - e.paidMonths);
    return s + (e.monthlyEmi * remMonths);
  }, 0);

  // Tangible assets (excluding bank/cash to avoid double counting with liquid balance)
  const tangibleAssets = data.assets.filter((a) => {
    const t = (a.type || "").toLowerCase();
    const n = (a.name || "").toLowerCase();
    return !(t === "bank" || t === "cash" || n.includes("bank") || n.includes("cash") || n.includes("savings") || n.includes("checking"));
  });
  const tangibleAssetsVal = tangibleAssets.reduce((s, a) => s + a.value, 0);

  const effectiveLiquidCashVal = currentBankCashVal > 0 ? currentBankCashVal : Math.max(0, closingBalanceVal);
  const totalAssetsVal = tangibleAssetsVal + effectiveLiquidCashVal + totalPortfolioCurrentVal;
  const totalLiabilitiesVal = data.liabilities.reduce((s, l) => s + l.amount, 0) + totalRemainingDebtVal;
  const netWorthVal = totalAssetsVal - totalLiabilitiesVal;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AK Finance Intelligence";
  workbook.lastModifiedBy = userName;
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================================
  // DESIGN THEME: Executive Corporate Navy & Slate
  // ==========================================
  const THEME = {
    navyDark: { argb: "FF0F2042" },      // Midnight Oxford Navy (Main Banner & Table Headers)
    navySecondary: { argb: "FF1E3A8A" }, // Rich Corporate Cobalt
    navyAccent: { argb: "FF2563EB" },    // Electric Blue
    iceBlue: { argb: "FFF0F4F8" },       // Section & Card Background
    cardBorder: { argb: "FFCBD5E1" },    // Slate border
    zebra: { argb: "FFF8FAFC" },         // Subtle alternate row
    white: { argb: "FFFFFFFF" },
    textDark: { argb: "FF0F172A" },      // Slate 900
    textMuted: { argb: "FF64748B" },     // Slate 500
    textGreen: { argb: "FF15803D" },     // Emerald 700
    bgGreen: { argb: "FFDCFCE7" },       // Emerald 100
    textAmber: { argb: "FFB45309" },     // Amber 700
    bgAmber: { argb: "FFFEF3C7" },       // Amber 100
    textRed: { argb: "FFB91C1C" },       // Rose 700
    bgRed: { argb: "FFFEE2E2" },         // Rose 100
    thinBorderColor: { argb: "FFE2E8F0" },
    totalBorderColor: { argb: "FF0F2042" },
  };

  const fontTitle: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 15,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const fontHeader: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const fontSection: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 10,
    bold: true,
    color: THEME.navyDark,
  };

  const fontCardLabel: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 9,
    bold: true,
    color: THEME.textMuted,
  };

  const fontCardValue: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 14,
    bold: true,
    color: THEME.navyDark,
  };

  const fontRegular: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 10,
    color: THEME.textDark,
  };

  const fontTotal: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 10,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  const fontMutedItalic: Partial<ExcelJS.Font> = {
    name: "Segoe UI",
    size: 9,
    italic: true,
    color: THEME.textMuted,
  };

  const fillTitle: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: THEME.navyDark,
  };

  const fillHeader: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: THEME.navyDark,
  };

  const fillSection: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: THEME.iceBlue,
  };

  const fillZebra: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: THEME.zebra,
  };

  const fillTotal: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: THEME.navySecondary,
  };

  const fillWhite: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: THEME.white,
  };

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: THEME.thinBorderColor },
    left: { style: "thin", color: THEME.thinBorderColor },
    bottom: { style: "thin", color: THEME.thinBorderColor },
    right: { style: "thin", color: THEME.thinBorderColor },
  };

  const borderTotal: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: THEME.totalBorderColor },
    bottom: { style: "double", color: THEME.totalBorderColor },
    left: { style: "thin", color: THEME.totalBorderColor },
    right: { style: "thin", color: THEME.totalBorderColor },
  };

  const alignCenter: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" };
  const alignLeft: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle" };
  const alignRight: Partial<ExcelJS.Alignment> = { horizontal: "right", vertical: "middle" };

  // Helper to apply borders across a range of cells (ensuring clean borders on merged cells)
  const applyRangeStyle = (
    ws: ExcelJS.Worksheet,
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
    border: Partial<ExcelJS.Borders> = borderThin,
    fill?: ExcelJS.Fill
  ) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ws.getRow(r).getCell(c);
        if (border) cell.border = border;
        if (fill) cell.fill = fill;
      }
    }
  };

  // ==========================================
  // SHEET 1: EXECUTIVE STATEMENT & KPI DASHBOARD
  // ==========================================
  const wsOv = workbook.addWorksheet("Executive Overview", {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  wsOv.mergeCells("A1:F1");
  const tCell = wsOv.getCell("A1");
  tCell.value = "AK FINANCE — EXECUTIVE FINANCIAL STATEMENT & KPI DASHBOARD";
  tCell.font = fontTitle;
  tCell.fill = fillTitle;
  tCell.alignment = alignCenter;
  applyRangeStyle(wsOv, 1, 1, 6, 1, borderThin, fillTitle);
  wsOv.getRow(1).height = 40;

  // Metadata Block
  wsOv.getCell("A2").value = "Generated For:";
  wsOv.getCell("B2").value = userName;
  wsOv.getCell("D2").value = hasDateRange ? "Statement Period:" : "Statement Date:";
  wsOv.getCell("E2").value = hasDateRange ? `${startDate} to ${endDate}` : nowStr;

  wsOv.getCell("A3").value = "Reporting Currency:";
  wsOv.getCell("B3").value = `${currency} (${currencySymbol})`;
  wsOv.getCell("D3").value = "Exported On:";
  wsOv.getCell("E3").value = nowStr;

  wsOv.getCell("A4").value = "Records Filtered:";
  wsOv.getCell("B4").value = hasDateRange
    ? `${filteredTransactions.length} transactions (${startDate} to ${endDate})`
    : `${filteredTransactions.length} transactions (All-Time)`;
  wsOv.getCell("D4").value = "Platform:";
  wsOv.getCell("E4").value = "AK Finance Intelligence";

  ["A2", "D2", "A3", "D3", "A4", "D4"].forEach((pos) => {
    wsOv.getCell(pos).font = { name: "Segoe UI", size: 9, bold: true, color: THEME.textMuted };
    wsOv.getCell(pos).alignment = alignLeft;
  });
  ["B2", "E2", "B3", "E3", "B4", "E4"].forEach((pos) => {
    wsOv.getCell(pos).font = { name: "Segoe UI", size: 9, bold: true, color: THEME.textDark };
    wsOv.getCell(pos).alignment = alignLeft;
  });
  wsOv.getRow(2).height = 18;
  wsOv.getRow(3).height = 18;
  wsOv.getRow(4).height = 18;
  wsOv.getRow(5).height = 12; // Visual spacer

  // KPI Summary Cards Helper
  const renderCard = (
    rStart: number,
    cStart: number,
    rEnd: number,
    cEnd: number,
    label: string,
    val: number | string | ExcelJS.CellFormulaValue,
    isCurrency = true,
    isPercent = false
  ) => {
    const colStartLetter = String.fromCharCode(64 + cStart);
    const colEndLetter = String.fromCharCode(64 + cEnd);

    // Label cell
    wsOv.mergeCells(`${colStartLetter}${rStart}:${colEndLetter}${rStart}`);
    const lCell = wsOv.getCell(`${colStartLetter}${rStart}`);
    lCell.value = label.toUpperCase();
    lCell.font = fontCardLabel;
    lCell.fill = fillSection;
    lCell.alignment = alignCenter;

    // Value cell
    wsOv.mergeCells(`${colStartLetter}${rStart + 1}:${colEndLetter}${rEnd}`);
    const vCell = wsOv.getCell(`${colStartLetter}${rStart + 1}`);
    vCell.value = val;
    vCell.font = fontCardValue;
    vCell.fill = fillWhite;
    vCell.alignment = alignCenter;
    if (isCurrency) vCell.numFmt = currencyIntFmt;
    if (isPercent) vCell.numFmt = percentFmt;

    applyRangeStyle(wsOv, cStart, rStart, cEnd, rEnd, borderThin);
  };

  // Row 6..8: 3 Cards for Monthly Cash Reconciliation
  renderCard(6, 1, 8, 2, "Opening Monthly Balance", openingBalanceVal);
  renderCard(6, 3, 8, 4, "Total Period Income (+)", { formula: "'Transactions'!F4", result: totalIncomeVal });
  renderCard(6, 5, 8, 6, "Closing Monthly Balance", { formula: "'Transactions'!F7", result: closingBalanceVal });

  wsOv.getRow(6).height = 18;
  wsOv.getRow(7).height = 20;
  wsOv.getRow(8).height = 20;
  wsOv.getRow(9).height = 10; // Visual spacer

  // Row 10..12: 3 Cards for Operating Cash Flow & Wealth
  renderCard(10, 1, 12, 2, "Total Period Expenses (-)", { formula: "'Transactions'!F5", result: totalExpenseVal });
  renderCard(10, 3, 12, 4, "Net Operating Cash Flow", { formula: "'Transactions'!F6", result: netCashFlowVal });
  renderCard(10, 5, 12, 6, "Consolidated Net Worth", { formula: "'Net Worth Statement'!D" + (tangibleAssets.length + data.liabilities.length + 13), result: netWorthVal });

  wsOv.getRow(10).height = 18;
  wsOv.getRow(11).height = 20;
  wsOv.getRow(12).height = 20;
  wsOv.getRow(13).height = 12; // Visual spacer

  // Section Header: Executive Financial Breakdown & Cash Flow
  wsOv.mergeCells("A14:F14");
  const s14 = wsOv.getCell("A14");
  s14.value = "EXECUTIVE CASH FLOW & FINANCIAL RECONCILIATION";
  s14.font = fontSection;
  s14.fill = fillSection;
  s14.alignment = alignLeft;
  applyRangeStyle(wsOv, 1, 14, 6, 14, borderThin, fillSection);
  wsOv.getRow(14).height = 24;

  const summaryMetrics = [
    { label: "1. Opening Monthly Cash & Bank Balance (B/F)", val: openingBalanceVal, fmt: currencyNumFmt, note: `Liquid cash & bank as of ${periodStartDateStr}` },
    { label: "2. Total Cash Inflows (Period Income)", val: totalIncomeVal, fmt: currencyNumFmt, note: `${incomeTx.length} income credit transactions` },
    { label: "3. Total Cash Outflows (Period Expenses)", val: totalExpenseVal, fmt: currencyNumFmt, note: `${expenseTx.length} expense debit transactions` },
    { label: "4. Net Operating Cash Flow / Monthly Surplus", val: netCashFlowVal, fmt: currencyNumFmt, note: "Operating cash retained from period activities" },
    { label: "5. Closing Monthly Cash & Bank Balance (C/F)", val: closingBalanceVal, fmt: currencyNumFmt, note: `Projected liquid cash as of ${periodEndDateStr}` },
    { label: "6. Personal Savings Rate %", val: savingsRateVal, fmt: percentFmt, note: "Target benchmark: 20% - 40%" },
    { label: "7. Investment Portfolio Market Value", val: totalPortfolioCurrentVal, fmt: currencyNumFmt, note: `${data.investments.length} investment assets held` },
    { label: "8. Portfolio Cumulative Unrealized Gain / Loss", val: totalPortfolioGainVal, fmt: currencyNumFmt, note: totalInvestedVal > 0 ? `ROI: ${((totalPortfolioGainVal / totalInvestedVal) * 100).toFixed(1)}%` : "0.0%" },
    { label: "9. Recurring Monthly Loan Commitments (EMIs)", val: totalMonthlyEmiVal, fmt: currencyNumFmt, note: `${data.emis.length} active structured debt obligations` },
    { label: "10. Total Outstanding Contractual Debt (EMIs)", val: totalRemainingDebtVal, fmt: currencyNumFmt, note: "Projected remaining contractual debt" },
    { label: "11. Total Assets & Wealth Holdings", val: totalAssetsVal, fmt: currencyNumFmt, note: "Liquid cash, portfolio & tangible assets" },
    { label: "12. Consolidated Net Worth (Assets – Liabilities)", val: netWorthVal, fmt: currencyNumFmt, note: "True total financial equity" },
  ];

  let curRow = 15;
  summaryMetrics.forEach((m, idx) => {
    wsOv.mergeCells(`A${curRow}:C${curRow}`);
    const cellL = wsOv.getCell(`A${curRow}`);
    cellL.value = m.label;
    cellL.font = fontRegular;
    cellL.alignment = alignLeft;

    wsOv.mergeCells(`D${curRow}:D${curRow}`);
    const cellV = wsOv.getCell(`D${curRow}`);
    cellV.value = m.val;
    cellV.numFmt = m.fmt;
    cellV.font = { name: "Segoe UI", size: 10, bold: true, color: THEME.navyDark };
    cellV.alignment = alignRight;

    wsOv.mergeCells(`E${curRow}:F${curRow}`);
    const cellN = wsOv.getCell(`E${curRow}`);
    cellN.value = m.note;
    cellN.font = fontMutedItalic;
    cellN.alignment = alignLeft;

    const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
    applyRangeStyle(wsOv, 1, curRow, 6, curRow, borderThin, rowFill);
    wsOv.getRow(curRow).height = 22;
    curRow++;
  });

  // Section Header: Top Expense Categories
  curRow++;
  wsOv.mergeCells(`A${curRow}:F${curRow}`);
  const sExp = wsOv.getCell(`A${curRow}`);
  sExp.value = "PERIOD EXPENSE CATEGORY DISTRIBUTION";
  sExp.font = fontSection;
  sExp.fill = fillSection;
  sExp.alignment = alignLeft;
  applyRangeStyle(wsOv, 1, curRow, 6, curRow, borderThin, fillSection);
  wsOv.getRow(curRow).height = 24;
  curRow++;

  // Category summary table header
  wsOv.mergeCells(`A${curRow}:C${curRow}`);
  wsOv.getCell(`A${curRow}`).value = "Expense Category";
  wsOv.getCell(`D${curRow}`).value = "Amount (₹)";
  wsOv.mergeCells(`E${curRow}:F${curRow}`);
  wsOv.getCell(`E${curRow}`).value = "% of Total Expenses";

  [`A${curRow}`, `D${curRow}`, `E${curRow}`].forEach((pos) => {
    wsOv.getCell(pos).font = fontHeader;
    wsOv.getCell(pos).fill = fillHeader;
    wsOv.getCell(pos).alignment = pos.startsWith("D") ? alignRight : alignLeft;
  });
  applyRangeStyle(wsOv, 1, curRow, 6, curRow, borderThin, fillHeader);
  wsOv.getRow(curRow).height = 24;
  curRow++;

  // Aggregate expenses by category
  const catExpenseMap: Record<string, number> = {};
  expenseTx.forEach((t) => {
    const cat = t.category || "Uncategorized";
    catExpenseMap[cat] = (catExpenseMap[cat] || 0) + t.amount;
  });
  const sortedCategories = Object.entries(catExpenseMap).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length === 0) {
    wsOv.mergeCells(`A${curRow}:F${curRow}`);
    const noExp = wsOv.getCell(`A${curRow}`);
    noExp.value = "No expense transactions recorded in this period.";
    noExp.font = fontMutedItalic;
    noExp.alignment = alignCenter;
    applyRangeStyle(wsOv, 1, curRow, 6, curRow, borderThin, fillWhite);
    wsOv.getRow(curRow).height = 22;
    curRow++;
  } else {
    sortedCategories.forEach(([cat, amt], cIdx) => {
      wsOv.mergeCells(`A${curRow}:C${curRow}`);
      wsOv.getCell(`A${curRow}`).value = cat;
      wsOv.getCell(`A${curRow}`).font = fontRegular;
      wsOv.getCell(`A${curRow}`).alignment = alignLeft;

      const cellAmt = wsOv.getCell(`D${curRow}`);
      cellAmt.value = amt;
      cellAmt.numFmt = currencyNumFmt;
      cellAmt.font = fontRegular;
      cellAmt.alignment = alignRight;

      wsOv.mergeCells(`E${curRow}:F${curRow}`);
      const cellPct = wsOv.getCell(`E${curRow}`);
      cellPct.value = totalExpenseVal > 0 ? amt / totalExpenseVal : 0;
      cellPct.numFmt = percentFmt;
      cellPct.font = fontRegular;
      cellPct.alignment = alignRight;

      const rowFill = cIdx % 2 === 0 ? fillZebra : fillWhite;
      applyRangeStyle(wsOv, 1, curRow, 6, curRow, borderThin, rowFill);
      wsOv.getRow(curRow).height = 22;
      curRow++;
    });
  }

  // Column widths for Overview
  wsOv.getColumn("A").width = 24;
  wsOv.getColumn("B").width = 24;
  wsOv.getColumn("C").width = 18;
  wsOv.getColumn("D").width = 22;
  wsOv.getColumn("E").width = 18;
  wsOv.getColumn("F").width = 24;

  // ==========================================
  // SHEET 2: ALL TRANSACTIONS (CASH FLOW LEDGER WITH OPENING BALANCE)
  // ==========================================
  const wsTx = workbook.addWorksheet("Transactions", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  const txHeaders = ["Date", "Description / Payee", "Category", "Type", "Account", "Amount (₹)"];
  wsTx.getRow(1).values = txHeaders;
  wsTx.getRow(1).font = fontHeader;
  wsTx.getRow(1).fill = fillHeader;
  wsTx.getRow(1).height = 26;
  wsTx.getRow(1).alignment = alignLeft;
  wsTx.getRow(1).getCell(1).alignment = alignCenter;
  wsTx.getRow(1).getCell(4).alignment = alignCenter;
  wsTx.getRow(1).getCell(6).alignment = alignRight;
  applyRangeStyle(wsTx, 1, 1, 6, 1, borderThin, fillHeader);

  // Row 2: OPENING MONTHLY BALANCE ROW
  const rOpenRow = wsTx.getRow(2);
  rOpenRow.values = [
    periodStartDateStr,
    "OPENING MONTHLY CASH & BANK BALANCE (B/F)",
    "Opening Balance",
    "Balance",
    "All Bank & Cash Accounts",
    openingBalanceVal,
  ];
  rOpenRow.getCell(1).alignment = alignCenter;
  rOpenRow.getCell(1).numFmt = "YYYY-MM-DD";
  rOpenRow.getCell(2).alignment = alignLeft;
  rOpenRow.getCell(3).alignment = alignLeft;
  rOpenRow.getCell(4).alignment = alignCenter;
  rOpenRow.getCell(5).alignment = alignLeft;
  rOpenRow.getCell(6).alignment = alignRight;
  rOpenRow.getCell(6).numFmt = currencyNumFmt;

  for (let c = 1; c <= 6; c++) {
    const cell = rOpenRow.getCell(c);
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: THEME.navyDark };
    cell.fill = fillSection;
    cell.border = borderThin;
  }
  rOpenRow.height = 24;

  let txRow = 3;
  if (allTx.length === 0) {
    const rEmpty = wsTx.getRow(txRow);
    rEmpty.values = ["—", "No transactions recorded in this period", "—", "—", "—", 0];
    rEmpty.getCell(1).alignment = alignCenter;
    rEmpty.getCell(2).alignment = alignLeft;
    rEmpty.getCell(2).font = fontMutedItalic;
    rEmpty.getCell(6).alignment = alignRight;
    rEmpty.getCell(6).numFmt = currencyNumFmt;
    applyRangeStyle(wsTx, 1, txRow, 6, txRow, borderThin, fillWhite);
    rEmpty.height = 22;
    txRow++;
  } else {
    allTx.forEach((t, idx) => {
      const r = wsTx.getRow(txRow);
      r.values = [
        t.date ? t.date.slice(0, 10) : "",
        t.description || t.title || "—",
        t.category || "General",
        t.type === "income" ? "Income" : "Expense",
        t.account || "Main Account",
        t.amount,
      ];

      r.getCell(1).alignment = alignCenter;
      r.getCell(1).numFmt = "YYYY-MM-DD";
      r.getCell(2).alignment = alignLeft;
      r.getCell(3).alignment = alignLeft;
      r.getCell(4).alignment = alignCenter;
      r.getCell(5).alignment = alignLeft;
      r.getCell(6).alignment = alignRight;
      r.getCell(6).numFmt = currencyNumFmt;

      // Type validation
      r.getCell(4).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Income,Expense"'],
      };

      const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
      for (let c = 1; c <= 6; c++) {
        const cell = r.getCell(c);
        cell.font = fontRegular;
        cell.fill = rowFill;
        cell.border = borderThin;
      }
      r.height = 22;
      txRow++;
    });
  }

  // Total summary rows on Transactions sheet
  const txEndDataRow = txRow - 1;

  // 1. Opening Balance Summary
  const rTotOpen = wsTx.getRow(txRow);
  rTotOpen.values = [
    "OPENING MONTHLY BALANCE (B/F)",
    "",
    "",
    "",
    "",
    { formula: "F2", result: openingBalanceVal },
  ];
  rTotOpen.font = { name: "Segoe UI", size: 10, bold: true, color: THEME.navyDark };
  rTotOpen.fill = fillSection;
  rTotOpen.getCell(6).numFmt = currencyNumFmt;
  rTotOpen.getCell(6).alignment = alignRight;
  rTotOpen.height = 24;
  applyRangeStyle(wsTx, 1, txRow, 6, txRow, borderThin, fillSection);
  wsTx.mergeCells(`A${txRow}:E${txRow}`);
  wsTx.getCell(`A${txRow}`).alignment = alignLeft;
  const rTotOpenIdx = txRow;
  txRow++;

  // 2. Total Inflows
  const incTotalRow = wsTx.getRow(txRow);
  incTotalRow.values = [
    "TOTAL PERIOD INFLOWS (INCOME)",
    "",
    "",
    "",
    "",
    allTx.length > 0
      ? { formula: `SUMIF(D3:D${txEndDataRow},"Income",F3:F${txEndDataRow})`, result: totalIncomeVal }
      : 0,
  ];
  incTotalRow.font = fontTotal;
  incTotalRow.fill = fillTotal;
  incTotalRow.getCell(6).numFmt = currencyNumFmt;
  incTotalRow.getCell(6).alignment = alignRight;
  incTotalRow.height = 24;
  applyRangeStyle(wsTx, 1, txRow, 6, txRow, borderTotal, fillTotal);
  wsTx.mergeCells(`A${txRow}:E${txRow}`);
  wsTx.getCell(`A${txRow}`).alignment = alignLeft;
  const rTotIncIdx = txRow;
  txRow++;

  // 3. Total Outflows
  const expTotalRow = wsTx.getRow(txRow);
  expTotalRow.values = [
    "TOTAL PERIOD OUTFLOWS (EXPENSES)",
    "",
    "",
    "",
    "",
    allTx.length > 0
      ? { formula: `SUMIF(D3:D${txEndDataRow},"Expense",F3:F${txEndDataRow})`, result: totalExpenseVal }
      : 0,
  ];
  expTotalRow.font = fontTotal;
  expTotalRow.fill = fillTotal;
  expTotalRow.getCell(6).numFmt = currencyNumFmt;
  expTotalRow.getCell(6).alignment = alignRight;
  expTotalRow.height = 24;
  applyRangeStyle(wsTx, 1, txRow, 6, txRow, borderTotal, fillTotal);
  wsTx.mergeCells(`A${txRow}:E${txRow}`);
  wsTx.getCell(`A${txRow}`).alignment = alignLeft;
  const rTotExpIdx = txRow;
  txRow++;

  // 4. Net Operating Cash Flow
  const netCashFlowRow = wsTx.getRow(txRow);
  netCashFlowRow.values = [
    "NET OPERATING CASH FLOW (INFLOWS – OUTFLOWS)",
    "",
    "",
    "",
    "",
    { formula: `F${rTotIncIdx}-F${rTotExpIdx}`, result: netCashFlowVal },
  ];
  netCashFlowRow.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  netCashFlowRow.fill = fillTitle;
  netCashFlowRow.getCell(6).numFmt = currencyNumFmt;
  netCashFlowRow.getCell(6).alignment = alignRight;
  netCashFlowRow.height = 24;
  applyRangeStyle(wsTx, 1, txRow, 6, txRow, borderTotal, fillTitle);
  wsTx.mergeCells(`A${txRow}:E${txRow}`);
  wsTx.getCell(`A${txRow}`).alignment = alignLeft;
  const rTotNetIdx = txRow;
  txRow++;

  // 5. Closing Monthly Balance
  const closingBalanceRow = wsTx.getRow(txRow);
  closingBalanceRow.values = [
    "CLOSING MONTHLY CASH & BANK BALANCE (C/F)",
    "",
    "",
    "",
    "",
    { formula: `F${rTotOpenIdx}+F${rTotNetIdx}`, result: closingBalanceVal },
  ];
  closingBalanceRow.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  closingBalanceRow.fill = fillTitle;
  closingBalanceRow.getCell(6).numFmt = currencyNumFmt;
  closingBalanceRow.getCell(6).alignment = alignRight;
  closingBalanceRow.height = 28;
  applyRangeStyle(wsTx, 1, txRow, 6, txRow, borderTotal, fillTitle);
  wsTx.mergeCells(`A${txRow}:E${txRow}`);
  wsTx.getCell(`A${txRow}`).alignment = alignLeft;

  wsTx.getColumn("A").width = 14;
  wsTx.getColumn("B").width = 36;
  wsTx.getColumn("C").width = 22;
  wsTx.getColumn("D").width = 14;
  wsTx.getColumn("E").width = 22;
  wsTx.getColumn("F").width = 22;

  // ==========================================
  // SHEET 3: INCOME
  // ==========================================
  const wsInc = workbook.addWorksheet("Income", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  wsInc.getRow(1).values = ["Date", "Description / Source", "Category", "Deposit Account", "Amount (₹)"];
  wsInc.getRow(1).font = fontHeader;
  wsInc.getRow(1).fill = fillHeader;
  wsInc.getRow(1).height = 26;
  wsInc.getRow(1).alignment = alignLeft;
  wsInc.getRow(1).getCell(1).alignment = alignCenter;
  wsInc.getRow(1).getCell(5).alignment = alignRight;
  applyRangeStyle(wsInc, 1, 1, 5, 1, borderThin, fillHeader);

  let incRow = 2;
  if (incomeTx.length === 0) {
    const r = wsInc.getRow(incRow);
    r.values = ["—", "No income transactions recorded in this period", "—", "—", 0];
    r.getCell(1).alignment = alignCenter;
    r.getCell(2).alignment = alignLeft;
    r.getCell(2).font = fontMutedItalic;
    r.getCell(5).alignment = alignRight;
    r.getCell(5).numFmt = currencyNumFmt;
    applyRangeStyle(wsInc, 1, incRow, 5, incRow, borderThin, fillWhite);
    r.height = 22;
    incRow++;
  } else {
    incomeTx.forEach((t, idx) => {
      const r = wsInc.getRow(incRow);
      r.values = [
        t.date ? t.date.slice(0, 10) : "",
        t.description || t.title || "Income",
        t.category || "Salary",
        t.account || "Checking",
        t.amount,
      ];
      r.getCell(1).alignment = alignCenter;
      r.getCell(1).numFmt = "YYYY-MM-DD";
      r.getCell(2).alignment = alignLeft;
      r.getCell(3).alignment = alignLeft;
      r.getCell(4).alignment = alignLeft;
      r.getCell(5).alignment = alignRight;
      r.getCell(5).numFmt = currencyNumFmt;

      const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
      for (let c = 1; c <= 5; c++) {
        const cell = r.getCell(c);
        cell.font = fontRegular;
        cell.fill = rowFill;
        cell.border = borderThin;
      }
      r.height = 22;
      incRow++;
    });
  }

  const incTotRow = wsInc.getRow(incRow);
  incTotRow.values = [
    "TOTAL INCOME RECORDED",
    "",
    "",
    "",
    incomeTx.length > 0 ? { formula: `SUM(E2:E${incRow - 1})`, result: totalIncomeVal } : 0,
  ];
  incTotRow.font = fontTotal;
  incTotRow.fill = fillTotal;
  incTotRow.getCell(5).numFmt = currencyNumFmt;
  incTotRow.getCell(5).alignment = alignRight;
  incTotRow.height = 24;
  applyRangeStyle(wsInc, 1, incRow, 5, incRow, borderTotal, fillTotal);
  wsInc.mergeCells(`A${incRow}:D${incRow}`);
  wsInc.getCell(`A${incRow}`).alignment = alignLeft;

  wsInc.getColumn("A").width = 14;
  wsInc.getColumn("B").width = 34;
  wsInc.getColumn("C").width = 22;
  wsInc.getColumn("D").width = 22;
  wsInc.getColumn("E").width = 22;

  // ==========================================
  // SHEET 4: EXPENSES
  // ==========================================
  const wsExp = workbook.addWorksheet("Expenses", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  wsExp.getRow(1).values = ["Date", "Description / Payee", "Category", "Payment Account", "Amount (₹)"];
  wsExp.getRow(1).font = fontHeader;
  wsExp.getRow(1).fill = fillHeader;
  wsExp.getRow(1).height = 26;
  wsExp.getRow(1).alignment = alignLeft;
  wsExp.getRow(1).getCell(1).alignment = alignCenter;
  wsExp.getRow(1).getCell(5).alignment = alignRight;
  applyRangeStyle(wsExp, 1, 1, 5, 1, borderThin, fillHeader);

  let expRow = 2;
  if (expenseTx.length === 0) {
    const r = wsExp.getRow(expRow);
    r.values = ["—", "No expense transactions recorded in this period", "—", "—", 0];
    r.getCell(1).alignment = alignCenter;
    r.getCell(2).alignment = alignLeft;
    r.getCell(2).font = fontMutedItalic;
    r.getCell(5).alignment = alignRight;
    r.getCell(5).numFmt = currencyNumFmt;
    applyRangeStyle(wsExp, 1, expRow, 5, expRow, borderThin, fillWhite);
    r.height = 22;
    expRow++;
  } else {
    expenseTx.forEach((t, idx) => {
      const r = wsExp.getRow(expRow);
      r.values = [
        t.date ? t.date.slice(0, 10) : "",
        t.description || t.title || "Expense",
        t.category || "General",
        t.account || "Main Account",
        t.amount,
      ];
      r.getCell(1).alignment = alignCenter;
      r.getCell(1).numFmt = "YYYY-MM-DD";
      r.getCell(2).alignment = alignLeft;
      r.getCell(3).alignment = alignLeft;
      r.getCell(4).alignment = alignLeft;
      r.getCell(5).alignment = alignRight;
      r.getCell(5).numFmt = currencyNumFmt;

      const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
      for (let c = 1; c <= 5; c++) {
        const cell = r.getCell(c);
        cell.font = fontRegular;
        cell.fill = rowFill;
        cell.border = borderThin;
      }
      r.height = 22;
      expRow++;
    });
  }

  const expTotRow = wsExp.getRow(expRow);
  const expEndDataRow = expRow - 1;
  expTotRow.values = [
    "TOTAL EXPENSES RECORDED",
    "",
    "",
    "",
    expenseTx.length > 0 ? { formula: `SUM(E2:E${expEndDataRow})`, result: totalExpenseVal } : 0,
  ];
  expTotRow.font = fontTotal;
  expTotRow.fill = fillTotal;
  expTotRow.getCell(5).numFmt = currencyNumFmt;
  expTotRow.getCell(5).alignment = alignRight;
  expTotRow.height = 24;
  applyRangeStyle(wsExp, 1, expRow, 5, expRow, borderTotal, fillTotal);
  wsExp.mergeCells(`A${expRow}:D${expRow}`);
  wsExp.getCell(`A${expRow}`).alignment = alignLeft;

  wsExp.getColumn("A").width = 14;
  wsExp.getColumn("B").width = 34;
  wsExp.getColumn("C").width = 22;
  wsExp.getColumn("D").width = 22;
  wsExp.getColumn("E").width = 22;

  // ==========================================
  // SHEET 5: MONTHLY BUDGET ENVELOPES
  // ==========================================
  const wsBg = workbook.addWorksheet("Monthly Budget", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  wsBg.getRow(1).values = [
    "Budget Category / Envelope",
    "Monthly Limit (₹)",
    hasDateRange ? `Actual Spent (${startDate} to ${endDate}) (₹)` : "Actual Spent (₹)",
    "Remaining Balance (₹)",
    "Utilization %",
    "Health Status",
  ];
  wsBg.getRow(1).font = fontHeader;
  wsBg.getRow(1).fill = fillHeader;
  wsBg.getRow(1).height = 26;
  wsBg.getRow(1).alignment = alignLeft;
  wsBg.getRow(1).getCell(2).alignment = alignRight;
  wsBg.getRow(1).getCell(3).alignment = alignRight;
  wsBg.getRow(1).getCell(4).alignment = alignRight;
  wsBg.getRow(1).getCell(5).alignment = alignRight;
  wsBg.getRow(1).getCell(6).alignment = alignCenter;
  applyRangeStyle(wsBg, 1, 1, 6, 1, borderThin, fillHeader);

  let bgRow = 2;
  let totalBgLimit = 0;
  let totalBgSpent = 0;

  if (data.budgets.length === 0) {
    const r = wsBg.getRow(bgRow);
    r.values = ["No budget envelopes configured", 0, 0, 0, 0, "—"];
    r.getCell(1).alignment = alignLeft;
    r.getCell(1).font = fontMutedItalic;
    r.getCell(2).numFmt = currencyNumFmt;
    r.getCell(3).numFmt = currencyNumFmt;
    r.getCell(4).numFmt = currencyNumFmt;
    r.getCell(5).numFmt = percentFmt;
    r.getCell(6).alignment = alignCenter;
    applyRangeStyle(wsBg, 1, bgRow, 6, bgRow, borderThin, fillWhite);
    r.height = 22;
    bgRow++;
  } else {
    data.budgets.forEach((b, idx) => {
      const spent = expenseTx
        .filter((t) => (t.category || "").toLowerCase() === (b.name || "").toLowerCase())
        .reduce((s, t) => s + t.amount, 0);

      totalBgLimit += b.limit;
      totalBgSpent += spent;
      const remaining = b.limit - spent;
      const util = b.limit > 0 ? spent / b.limit : 0;

      const r = wsBg.getRow(bgRow);
      r.values = [
        b.name,
        b.limit,
        { formula: `SUMIFS(Expenses!$E$2:$E$${expEndDataRow}, Expenses!$C$2:$C$${expEndDataRow}, A${bgRow})`, result: spent },
        { formula: `B${bgRow}-C${bgRow}`, result: remaining },
        { formula: `IF(B${bgRow}>0, C${bgRow}/B${bgRow}, 0)`, result: util },
        { formula: `IF(C${bgRow}>B${bgRow}, "OVER BUDGET", IF(B${bgRow}>0, IF(C${bgRow}/B${bgRow}>=0.85, "Near Limit", "On Track"), "On Track"))`, result: spent > b.limit ? "OVER BUDGET" : util >= 0.85 ? "Near Limit" : "On Track" },
      ];

      r.getCell(1).alignment = alignLeft;
      r.getCell(2).alignment = alignRight;
      r.getCell(2).numFmt = currencyNumFmt;
      r.getCell(3).alignment = alignRight;
      r.getCell(3).numFmt = currencyNumFmt;
      r.getCell(4).alignment = alignRight;
      r.getCell(4).numFmt = currencyNumFmt;
      r.getCell(5).alignment = alignRight;
      r.getCell(5).numFmt = percentFmt;
      r.getCell(6).alignment = alignCenter;

      // Status pill coloring
      const statusCell = r.getCell(6);
      if (spent > b.limit) {
        statusCell.font = { name: "Segoe UI", size: 9, bold: true, color: THEME.textRed };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: THEME.bgRed };
      } else if (util >= 0.85) {
        statusCell.font = { name: "Segoe UI", size: 9, bold: true, color: THEME.textAmber };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: THEME.bgAmber };
      } else {
        statusCell.font = { name: "Segoe UI", size: 9, bold: true, color: THEME.textGreen };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: THEME.bgGreen };
      }

      const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
      for (let c = 1; c <= 5; c++) {
        const cell = r.getCell(c);
        cell.font = fontRegular;
        cell.fill = rowFill;
        cell.border = borderThin;
      }
      statusCell.border = borderThin;
      r.height = 22;
      bgRow++;
    });
  }

  // Total Row for Budget
  const bgTotRow = wsBg.getRow(bgRow);
  const bgEndDataRow = bgRow - 1;
  bgTotRow.values = [
    "TOTAL MONTHLY BUDGET",
    data.budgets.length > 0 ? { formula: `SUM(B2:B${bgEndDataRow})`, result: totalBgLimit } : 0,
    data.budgets.length > 0 ? { formula: `SUM(C2:C${bgEndDataRow})`, result: totalBgSpent } : 0,
    data.budgets.length > 0 ? { formula: `B${bgRow}-C${bgRow}`, result: totalBgLimit - totalBgSpent } : 0,
    data.budgets.length > 0 ? { formula: `IF(B${bgRow}>0, C${bgRow}/B${bgRow}, 0)`, result: totalBgLimit > 0 ? totalBgSpent / totalBgLimit : 0 } : 0,
    totalBgSpent > totalBgLimit && totalBgLimit > 0 ? "OVER BUDGET" : "Within Budget",
  ];
  bgTotRow.font = fontTotal;
  bgTotRow.fill = fillTotal;
  bgTotRow.getCell(2).numFmt = currencyNumFmt;
  bgTotRow.getCell(3).numFmt = currencyNumFmt;
  bgTotRow.getCell(4).numFmt = currencyNumFmt;
  bgTotRow.getCell(5).numFmt = percentFmt;
  bgTotRow.getCell(2).alignment = alignRight;
  bgTotRow.getCell(3).alignment = alignRight;
  bgTotRow.getCell(4).alignment = alignRight;
  bgTotRow.getCell(5).alignment = alignRight;
  bgTotRow.getCell(6).alignment = alignCenter;
  bgTotRow.height = 24;
  applyRangeStyle(wsBg, 1, bgRow, 6, bgRow, borderTotal, fillTotal);

  wsBg.getColumn("A").width = 30;
  wsBg.getColumn("B").width = 22;
  wsBg.getColumn("C").width = 24;
  wsBg.getColumn("D").width = 22;
  wsBg.getColumn("E").width = 16;
  wsBg.getColumn("F").width = 18;

  // ==========================================
  // SHEET 6: PORTFOLIO & INVESTMENTS
  // ==========================================
  const wsInv = workbook.addWorksheet("Portfolio & Investments", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  wsInv.getRow(1).values = [
    "Asset / Holding Name",
    "Symbol / Ticker",
    "Asset Class",
    "Units Held",
    "Total Invested (₹)",
    "Current Market Value (₹)",
    "Unrealized P&L (₹)",
    "ROI %",
    "Allocation %",
    "Valuation Date",
  ];
  wsInv.getRow(1).font = fontHeader;
  wsInv.getRow(1).fill = fillHeader;
  wsInv.getRow(1).height = 26;
  wsInv.getRow(1).alignment = alignLeft;
  wsInv.getRow(1).getCell(4).alignment = alignRight;
  wsInv.getRow(1).getCell(5).alignment = alignRight;
  wsInv.getRow(1).getCell(6).alignment = alignRight;
  wsInv.getRow(1).getCell(7).alignment = alignRight;
  wsInv.getRow(1).getCell(8).alignment = alignRight;
  wsInv.getRow(1).getCell(9).alignment = alignRight;
  wsInv.getRow(1).getCell(10).alignment = alignCenter;
  applyRangeStyle(wsInv, 1, 1, 10, 1, borderThin, fillHeader);

  let invRow = 2;
  const invExpectedTotRow = data.investments.length > 0 ? data.investments.length + 2 : 3;

  if (data.investments.length === 0) {
    const r = wsInv.getRow(invRow);
    r.values = ["No investment assets recorded", "—", "—", 0, 0, 0, 0, 0, 0, "—"];
    r.getCell(1).alignment = alignLeft;
    r.getCell(1).font = fontMutedItalic;
    r.getCell(5).numFmt = currencyNumFmt;
    r.getCell(6).numFmt = currencyNumFmt;
    r.getCell(7).numFmt = currencyNumFmt;
    r.getCell(8).numFmt = percentFmt;
    r.getCell(9).numFmt = percentFmt;
    r.getCell(10).alignment = alignCenter;
    applyRangeStyle(wsInv, 1, invRow, 10, invRow, borderThin, fillWhite);
    r.height = 22;
    invRow++;
  } else {
    data.investments.forEach((inv, idx) => {
      const gain = inv.current - inv.invested;
      const roi = inv.invested > 0 ? gain / inv.invested : 0;
      const alloc = totalPortfolioCurrentVal > 0 ? inv.current / totalPortfolioCurrentVal : 0;

      const r = wsInv.getRow(invRow);
      r.values = [
        inv.name,
        inv.symbol || "—",
        inv.type || "Stock",
        inv.units || 1,
        inv.invested,
        inv.current,
        { formula: `F${invRow}-E${invRow}`, result: gain },
        { formula: `IF(E${invRow}>0, G${invRow}/E${invRow}, 0)`, result: roi },
        { formula: `IF($F$${invExpectedTotRow}>0, F${invRow}/$F$${invExpectedTotRow}, 0)`, result: alloc },
        inv.date ? inv.date.slice(0, 10) : todayStr,
      ];

      r.getCell(1).alignment = alignLeft;
      r.getCell(2).alignment = alignLeft;
      r.getCell(3).alignment = alignLeft;
      r.getCell(4).alignment = alignRight;
      r.getCell(4).numFmt = "#,##0.00";
      r.getCell(5).alignment = alignRight;
      r.getCell(5).numFmt = currencyNumFmt;
      r.getCell(6).alignment = alignRight;
      r.getCell(6).numFmt = currencyNumFmt;
      r.getCell(7).alignment = alignRight;
      r.getCell(7).numFmt = currencyNumFmt;
      r.getCell(8).alignment = alignRight;
      r.getCell(8).numFmt = percentFmt;
      r.getCell(9).alignment = alignRight;
      r.getCell(9).numFmt = percentFmt;
      r.getCell(10).alignment = alignCenter;
      r.getCell(10).numFmt = "YYYY-MM-DD";

      // P&L color styling
      const pnlCell = r.getCell(7);
      if (gain >= 0) {
        pnlCell.font = { name: "Segoe UI", size: 10, bold: true, color: THEME.textGreen };
      } else {
        pnlCell.font = { name: "Segoe UI", size: 10, bold: true, color: THEME.textRed };
      }

      const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
      for (let c = 1; c <= 10; c++) {
        if (c !== 7) r.getCell(c).font = fontRegular;
        r.getCell(c).fill = rowFill;
        r.getCell(c).border = borderThin;
      }
      r.height = 22;
      invRow++;
    });
  }

  // Portfolio Total Row
  const invTotRow = wsInv.getRow(invRow);
  const invEndDataRow = invRow - 1;
  invTotRow.values = [
    "TOTAL PORTFOLIO HOLDINGS",
    "",
    "",
    "",
    data.investments.length > 0 ? { formula: `SUM(E2:E${invEndDataRow})`, result: totalInvestedVal } : 0,
    data.investments.length > 0 ? { formula: `SUM(F2:F${invEndDataRow})`, result: totalPortfolioCurrentVal } : 0,
    data.investments.length > 0 ? { formula: `SUM(G2:G${invEndDataRow})`, result: totalPortfolioGainVal } : 0,
    data.investments.length > 0 ? { formula: `IF(E${invRow}>0, G${invRow}/E${invRow}, 0)`, result: totalInvestedVal > 0 ? totalPortfolioGainVal / totalInvestedVal : 0 } : 0,
    1,
    "",
  ];
  invTotRow.font = fontTotal;
  invTotRow.fill = fillTotal;
  invTotRow.getCell(5).numFmt = currencyNumFmt;
  invTotRow.getCell(6).numFmt = currencyNumFmt;
  invTotRow.getCell(7).numFmt = currencyNumFmt;
  invTotRow.getCell(8).numFmt = percentFmt;
  invTotRow.getCell(9).numFmt = percentFmt;
  invTotRow.getCell(5).alignment = alignRight;
  invTotRow.getCell(6).alignment = alignRight;
  invTotRow.getCell(7).alignment = alignRight;
  invTotRow.getCell(8).alignment = alignRight;
  invTotRow.getCell(9).alignment = alignRight;
  invTotRow.getCell(10).alignment = alignCenter;
  invTotRow.height = 24;
  applyRangeStyle(wsInv, 1, invRow, 10, invRow, borderTotal, fillTotal);
  wsInv.mergeCells(`A${invRow}:D${invRow}`);
  wsInv.getCell(`A${invRow}`).alignment = alignLeft;

  wsInv.getColumn("A").width = 28;
  wsInv.getColumn("B").width = 16;
  wsInv.getColumn("C").width = 16;
  wsInv.getColumn("D").width = 14;
  wsInv.getColumn("E").width = 22;
  wsInv.getColumn("F").width = 22;
  wsInv.getColumn("G").width = 22;
  wsInv.getColumn("H").width = 14;
  wsInv.getColumn("I").width = 14;
  wsInv.getColumn("J").width = 16;

  // ==========================================
  // SHEET 7: EMIS & DEBT LIABILITIES
  // ==========================================
  const wsEmi = workbook.addWorksheet("EMIs & Liabilities", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  wsEmi.getRow(1).values = [
    "Loan / Liability Name",
    "Lender / Institution",
    "Loan Category",
    "Monthly EMI (₹)",
    "Total Tenure (Mos)",
    "Tenure Paid (Mos)",
    "Remaining (Mos)",
    "Interest Rate (% p.a.)",
    "Total Loan Principal (₹)",
    "Estimated Outstanding Debt (₹)",
    "Auto-Debit Account",
    "Due Day",
  ];
  wsEmi.getRow(1).font = fontHeader;
  wsEmi.getRow(1).fill = fillHeader;
  wsEmi.getRow(1).height = 26;
  wsEmi.getRow(1).alignment = alignLeft;
  wsEmi.getRow(1).getCell(4).alignment = alignRight;
  wsEmi.getRow(1).getCell(5).alignment = alignRight;
  wsEmi.getRow(1).getCell(6).alignment = alignRight;
  wsEmi.getRow(1).getCell(7).alignment = alignRight;
  wsEmi.getRow(1).getCell(8).alignment = alignRight;
  wsEmi.getRow(1).getCell(9).alignment = alignRight;
  wsEmi.getRow(1).getCell(10).alignment = alignRight;
  wsEmi.getRow(1).getCell(12).alignment = alignCenter;
  applyRangeStyle(wsEmi, 1, 1, 12, 1, borderThin, fillHeader);

  let emiRow = 2;
  let totalLoanAmtVal = 0;

  if (data.emis.length === 0) {
    const r = wsEmi.getRow(emiRow);
    r.values = ["No active loans or EMI debt recorded", "—", "—", 0, 0, 0, 0, 0, 0, 0, "—", "—"];
    r.getCell(1).alignment = alignLeft;
    r.getCell(1).font = fontMutedItalic;
    r.getCell(4).numFmt = currencyNumFmt;
    r.getCell(9).numFmt = currencyNumFmt;
    r.getCell(10).numFmt = currencyNumFmt;
    applyRangeStyle(wsEmi, 1, emiRow, 12, emiRow, borderThin, fillWhite);
    r.height = 22;
    emiRow++;
  } else {
    data.emis.forEach((e, idx) => {
      const remMonths = Math.max(0, e.totalTenureMonths - e.paidMonths);
      const estRemaining = e.monthlyEmi * remMonths;
      const loanPrincipal = e.totalAmount || (e.monthlyEmi * e.totalTenureMonths);
      totalLoanAmtVal += loanPrincipal;

      const r = wsEmi.getRow(emiRow);
      r.values = [
        e.name,
        e.lender || "—",
        e.category || "Personal Loan",
        e.monthlyEmi,
        e.totalTenureMonths,
        e.paidMonths,
        { formula: `MAX(0, E${emiRow}-F${emiRow})`, result: remMonths },
        (e.interestRate || 0) / 100,
        loanPrincipal,
        { formula: `D${emiRow}*G${emiRow}`, result: estRemaining },
        e.autoDebitAccount || "Main Account",
        e.dueDay || 5,
      ];

      r.getCell(1).alignment = alignLeft;
      r.getCell(2).alignment = alignLeft;
      r.getCell(3).alignment = alignLeft;
      r.getCell(4).alignment = alignRight;
      r.getCell(4).numFmt = currencyNumFmt;
      r.getCell(5).alignment = alignRight;
      r.getCell(5).numFmt = "#,##0";
      r.getCell(6).alignment = alignRight;
      r.getCell(6).numFmt = "#,##0";
      r.getCell(7).alignment = alignRight;
      r.getCell(7).numFmt = "#,##0";
      r.getCell(8).alignment = alignRight;
      r.getCell(8).numFmt = percentFmt;
      r.getCell(9).alignment = alignRight;
      r.getCell(9).numFmt = currencyNumFmt;
      r.getCell(10).alignment = alignRight;
      r.getCell(10).numFmt = currencyNumFmt;
      r.getCell(11).alignment = alignLeft;
      r.getCell(12).alignment = alignCenter;

      const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
      for (let c = 1; c <= 12; c++) {
        const cell = r.getCell(c);
        cell.font = fontRegular;
        cell.fill = rowFill;
        cell.border = borderThin;
      }
      r.height = 22;
      emiRow++;
    });
  }

  // EMI Total Row
  const emiTotRow = wsEmi.getRow(emiRow);
  const emiEndDataRow = emiRow - 1;
  emiTotRow.values = [
    "TOTAL DEBT LIABILITIES",
    "",
    "",
    data.emis.length > 0 ? { formula: `SUM(D2:D${emiEndDataRow})`, result: totalMonthlyEmiVal } : 0,
    "",
    "",
    "",
    "",
    data.emis.length > 0 ? { formula: `SUM(I2:I${emiEndDataRow})`, result: totalLoanAmtVal } : 0,
    data.emis.length > 0 ? { formula: `SUM(J2:J${emiEndDataRow})`, result: totalRemainingDebtVal } : 0,
    "",
    "",
  ];
  emiTotRow.font = fontTotal;
  emiTotRow.fill = fillTotal;
  emiTotRow.getCell(4).numFmt = currencyNumFmt;
  emiTotRow.getCell(9).numFmt = currencyNumFmt;
  emiTotRow.getCell(10).numFmt = currencyNumFmt;
  emiTotRow.getCell(4).alignment = alignRight;
  emiTotRow.getCell(9).alignment = alignRight;
  emiTotRow.getCell(10).alignment = alignRight;
  emiTotRow.height = 24;
  applyRangeStyle(wsEmi, 1, emiRow, 12, emiRow, borderTotal, fillTotal);
  wsEmi.mergeCells(`A${emiRow}:C${emiRow}`);
  wsEmi.getCell(`A${emiRow}`).alignment = alignLeft;

  wsEmi.getColumn("A").width = 26;
  wsEmi.getColumn("B").width = 22;
  wsEmi.getColumn("C").width = 20;
  wsEmi.getColumn("D").width = 20;
  wsEmi.getColumn("E").width = 16;
  wsEmi.getColumn("F").width = 16;
  wsEmi.getColumn("G").width = 16;
  wsEmi.getColumn("H").width = 18;
  wsEmi.getColumn("I").width = 22;
  wsEmi.getColumn("J").width = 24;
  wsEmi.getColumn("K").width = 22;
  wsEmi.getColumn("L").width = 12;

  // ==========================================
  // SHEET 8: SAVINGS GOALS
  // ==========================================
  const wsSav = workbook.addWorksheet("Savings Goals", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
  });

  wsSav.getRow(1).values = [
    "Savings Goal Title",
    "Target Amount (₹)",
    "Saved Amount (₹)",
    "Remaining to Save (₹)",
    "Progress %",
    "Target Date",
    "Goal Status",
  ];
  wsSav.getRow(1).font = fontHeader;
  wsSav.getRow(1).fill = fillHeader;
  wsSav.getRow(1).height = 26;
  wsSav.getRow(1).alignment = alignLeft;
  wsSav.getRow(1).getCell(2).alignment = alignRight;
  wsSav.getRow(1).getCell(3).alignment = alignRight;
  wsSav.getRow(1).getCell(4).alignment = alignRight;
  wsSav.getRow(1).getCell(5).alignment = alignRight;
  wsSav.getRow(1).getCell(6).alignment = alignCenter;
  wsSav.getRow(1).getCell(7).alignment = alignCenter;
  applyRangeStyle(wsSav, 1, 1, 7, 1, borderThin, fillHeader);

  let savRow = 2;
  let totalSavTarget = 0;
  let totalSavSaved = 0;

  if (data.savingsGoals.length === 0) {
    const r = wsSav.getRow(savRow);
    r.values = ["No savings goals recorded", 0, 0, 0, 0, "—", "—"];
    r.getCell(1).alignment = alignLeft;
    r.getCell(1).font = fontMutedItalic;
    r.getCell(2).numFmt = currencyNumFmt;
    r.getCell(3).numFmt = currencyNumFmt;
    r.getCell(4).numFmt = currencyNumFmt;
    r.getCell(5).numFmt = percentFmt;
    r.getCell(6).alignment = alignCenter;
    r.getCell(7).alignment = alignCenter;
    applyRangeStyle(wsSav, 1, savRow, 7, savRow, borderThin, fillWhite);
    r.height = 22;
    savRow++;
  } else {
    data.savingsGoals.forEach((g, idx) => {
      totalSavTarget += g.target;
      totalSavSaved += g.saved;
      const remaining = Math.max(0, g.target - g.saved);
      const progress = g.target > 0 ? g.saved / g.target : 0;
      const isCompleted = g.saved >= g.target && g.target > 0;

      const r = wsSav.getRow(savRow);
      r.values = [
        g.name,
        g.target,
        g.saved,
        { formula: `MAX(0, B${savRow}-C${savRow})`, result: remaining },
        { formula: `IF(B${savRow}>0, C${savRow}/B${savRow}, 0)`, result: progress },
        g.deadline ? g.deadline.slice(0, 10) : "—",
        { formula: `IF(C${savRow}>=B${savRow}, "Achieved", IF(B${savRow}>0, IF(C${savRow}/B${savRow}>=0.5, "On Track", "In Progress"), "In Progress"))`, result: isCompleted ? "Achieved" : progress >= 0.5 ? "On Track" : "In Progress" },
      ];

      r.getCell(1).alignment = alignLeft;
      r.getCell(2).alignment = alignRight;
      r.getCell(2).numFmt = currencyNumFmt;
      r.getCell(3).alignment = alignRight;
      r.getCell(3).numFmt = currencyNumFmt;
      r.getCell(4).alignment = alignRight;
      r.getCell(4).numFmt = currencyNumFmt;
      r.getCell(5).alignment = alignRight;
      r.getCell(5).numFmt = percentFmt;
      r.getCell(6).alignment = alignCenter;
      r.getCell(7).alignment = alignCenter;

      // Status pill
      const statusCell = r.getCell(7);
      if (isCompleted) {
        statusCell.font = { name: "Segoe UI", size: 9, bold: true, color: THEME.textGreen };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: THEME.bgGreen };
      } else {
        statusCell.font = { name: "Segoe UI", size: 9, bold: true, color: THEME.navyAccent };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: THEME.iceBlue };
      }

      const rowFill = idx % 2 === 0 ? fillZebra : fillWhite;
      for (let c = 1; c <= 6; c++) {
        const cell = r.getCell(c);
        cell.font = fontRegular;
        cell.fill = rowFill;
        cell.border = borderThin;
      }
      statusCell.border = borderThin;
      r.height = 22;
      savRow++;
    });
  }

  // Savings Total Row
  const savTotRow = wsSav.getRow(savRow);
  const savEndDataRow = savRow - 1;
  savTotRow.values = [
    "TOTAL SAVINGS COMMITTED",
    data.savingsGoals.length > 0 ? { formula: `SUM(B2:B${savEndDataRow})`, result: totalSavTarget } : 0,
    data.savingsGoals.length > 0 ? { formula: `SUM(C2:C${savEndDataRow})`, result: totalSavSaved } : 0,
    data.savingsGoals.length > 0 ? { formula: `SUM(D2:D${savEndDataRow})`, result: Math.max(0, totalSavTarget - totalSavSaved) } : 0,
    data.savingsGoals.length > 0 ? { formula: `IF(B${savRow}>0, C${savRow}/B${savRow}, 0)`, result: totalSavTarget > 0 ? totalSavSaved / totalSavTarget : 0 } : 0,
    "-",
    totalSavSaved >= totalSavTarget && totalSavTarget > 0 ? "All Achieved" : "In Progress",
  ];
  savTotRow.font = fontTotal;
  savTotRow.fill = fillTotal;
  savTotRow.getCell(2).numFmt = currencyNumFmt;
  savTotRow.getCell(3).numFmt = currencyNumFmt;
  savTotRow.getCell(4).numFmt = currencyNumFmt;
  savTotRow.getCell(5).numFmt = percentFmt;
  savTotRow.getCell(2).alignment = alignRight;
  savTotRow.getCell(3).alignment = alignRight;
  savTotRow.getCell(4).alignment = alignRight;
  savTotRow.getCell(5).alignment = alignRight;
  savTotRow.getCell(6).alignment = alignCenter;
  savTotRow.getCell(7).alignment = alignCenter;
  savTotRow.height = 24;
  applyRangeStyle(wsSav, 1, savRow, 7, savRow, borderTotal, fillTotal);
  wsSav.mergeCells(`A${savRow}:A${savRow}`);

  wsSav.getColumn("A").width = 30;
  wsSav.getColumn("B").width = 22;
  wsSav.getColumn("C").width = 22;
  wsSav.getColumn("D").width = 22;
  wsSav.getColumn("E").width = 16;
  wsSav.getColumn("F").width = 16;
  wsSav.getColumn("G").width = 18;

  // ==========================================
  // SHEET 9: NET WORTH & BALANCE SHEET
  // ==========================================
  const wsNw = workbook.addWorksheet("Net Worth Statement", {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  wsNw.mergeCells("A1:D1");
  const nwTitle = wsNw.getCell("A1");
  nwTitle.value = "AK FINANCE — CONSOLIDATED BALANCE SHEET & NET WORTH";
  nwTitle.font = fontTitle;
  nwTitle.fill = fillTitle;
  nwTitle.alignment = alignCenter;
  applyRangeStyle(wsNw, 1, 1, 4, 1, borderThin, fillTitle);
  wsNw.getRow(1).height = 40;

  // Metadata
  wsNw.getCell("A2").value = "Client:";
  wsNw.getCell("B2").value = userName;
  wsNw.getCell("C2").value = "Valuation Date:";
  wsNw.getCell("D2").value = endDate || todayStr;
  wsNw.getCell("A2").font = fontCardLabel;
  wsNw.getCell("C2").font = fontCardLabel;
  wsNw.getCell("B2").font = fontRegular;
  wsNw.getCell("D2").font = fontRegular;
  wsNw.getRow(2).height = 20;

  // Section 1: ASSETS
  wsNw.mergeCells("A4:D4");
  const aHeader = wsNw.getCell("A4");
  aHeader.value = "I. ASSET PORTFOLIO & CAPITAL HOLDINGS";
  aHeader.font = fontSection;
  aHeader.fill = fillSection;
  aHeader.alignment = alignLeft;
  applyRangeStyle(wsNw, 1, 4, 4, 4, borderThin, fillSection);
  wsNw.getRow(4).height = 24;

  wsNw.getRow(5).values = ["Asset Description", "Classification", "Valuation Basis", "Current Value (₹)"];
  wsNw.getRow(5).font = fontHeader;
  wsNw.getRow(5).fill = fillHeader;
  wsNw.getRow(5).height = 24;
  wsNw.getRow(5).getCell(4).alignment = alignRight;
  applyRangeStyle(wsNw, 1, 5, 4, 5, borderThin, fillHeader);

  let nwRow = 6;
  const assetStartRow = nwRow;

  // 1. Liquid Bank & Cash Balances (Closing Cash Position)
  wsNw.getRow(nwRow).values = [
    "Liquid Cash & Bank Accounts (Closing Cash Position)",
    "Liquid Financial Assets",
    "Current Balance (C/F)",
    effectiveLiquidCashVal,
  ];
  wsNw.getRow(nwRow).getCell(1).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(2).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(3).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(4).alignment = alignRight;
  wsNw.getRow(nwRow).getCell(4).numFmt = currencyNumFmt;
  for (let c = 1; c <= 4; c++) {
    wsNw.getRow(nwRow).getCell(c).font = { name: "Segoe UI", size: 10, bold: true, color: THEME.navyDark };
    wsNw.getRow(nwRow).getCell(c).fill = fillSection;
    wsNw.getRow(nwRow).getCell(c).border = borderThin;
  }
  wsNw.getRow(nwRow).height = 22;
  nwRow++;

  // 2. Investment Portfolio summary row
  wsNw.getRow(nwRow).values = [
    "Marketable Securities & Investment Portfolio",
    "Liquid Financial Assets",
    "Mark-to-Market",
    totalPortfolioCurrentVal,
  ];
  wsNw.getRow(nwRow).getCell(1).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(2).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(3).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(4).alignment = alignRight;
  wsNw.getRow(nwRow).getCell(4).numFmt = currencyNumFmt;
  for (let c = 1; c <= 4; c++) {
    wsNw.getRow(nwRow).getCell(c).font = fontRegular;
    wsNw.getRow(nwRow).getCell(c).fill = fillZebra;
    wsNw.getRow(nwRow).getCell(c).border = borderThin;
  }
  wsNw.getRow(nwRow).height = 22;
  nwRow++;

  // 3. Fixed & Tangible Assets from data.assets
  if (tangibleAssets.length === 0) {
    const r = wsNw.getRow(nwRow);
    r.values = ["Personal & Household Tangible Assets (Unappraised)", "Tangible Asset", "Estimated", 0];
    r.getCell(1).alignment = alignLeft;
    r.getCell(1).font = fontMutedItalic;
    r.getCell(2).alignment = alignLeft;
    r.getCell(3).alignment = alignLeft;
    r.getCell(4).alignment = alignRight;
    r.getCell(4).numFmt = currencyNumFmt;
    applyRangeStyle(wsNw, 1, nwRow, 4, nwRow, borderThin, fillWhite);
    r.height = 22;
    nwRow++;
  } else {
    tangibleAssets.forEach((a, idx) => {
      const r = wsNw.getRow(nwRow);
      r.values = [
        a.name,
        a.type || "Tangible Asset",
        "Appraised Value",
        a.value,
      ];
      r.getCell(1).alignment = alignLeft;
      r.getCell(2).alignment = alignLeft;
      r.getCell(3).alignment = alignLeft;
      r.getCell(4).alignment = alignRight;
      r.getCell(4).numFmt = currencyNumFmt;

      const rowFill = idx % 2 === 0 ? fillWhite : fillZebra;
      for (let c = 1; c <= 4; c++) {
        r.getCell(c).font = fontRegular;
        r.getCell(c).fill = rowFill;
        r.getCell(c).border = borderThin;
      }
      r.height = 22;
      nwRow++;
    });
  }

  // Assets Total
  const assetEndRow = nwRow - 1;
  const assetTotRow = wsNw.getRow(nwRow);
  assetTotRow.values = [
    "TOTAL ASSETS (A)",
    "",
    "",
    { formula: `SUM(D${assetStartRow}:D${assetEndRow})`, result: totalAssetsVal },
  ];
  assetTotRow.font = fontTotal;
  assetTotRow.fill = fillTotal;
  assetTotRow.getCell(4).numFmt = currencyNumFmt;
  assetTotRow.getCell(4).alignment = alignRight;
  assetTotRow.height = 24;
  applyRangeStyle(wsNw, 1, nwRow, 4, nwRow, borderTotal, fillTotal);
  wsNw.mergeCells(`A${nwRow}:C${nwRow}`);
  wsNw.getCell(`A${nwRow}`).alignment = alignLeft;
  const assetTotalRowIdx = nwRow;
  nwRow += 2;

  // Section 2: LIABILITIES
  wsNw.mergeCells(`A${nwRow}:D${nwRow}`);
  const lHeader = wsNw.getCell(`A${nwRow}`);
  lHeader.value = "II. LIABILITIES & DEBT OBLIGATIONS";
  lHeader.font = fontSection;
  lHeader.fill = fillSection;
  lHeader.alignment = alignLeft;
  applyRangeStyle(wsNw, 1, nwRow, 4, nwRow, borderThin, fillSection);
  wsNw.getRow(nwRow).height = 24;
  nwRow++;

  wsNw.getRow(nwRow).values = ["Liability Description", "Classification", "Payable Terms", "Outstanding Amount (₹)"];
  wsNw.getRow(nwRow).font = fontHeader;
  wsNw.getRow(nwRow).fill = fillHeader;
  wsNw.getRow(nwRow).height = 24;
  wsNw.getRow(nwRow).getCell(4).alignment = alignRight;
  applyRangeStyle(wsNw, 1, nwRow, 4, nwRow, borderThin, fillHeader);
  nwRow++;

  const liabStartRow = nwRow;

  // 1. Outstanding EMI loans summary row
  wsNw.getRow(nwRow).values = [
    "Structured Loans & Contractual Debt (EMIs)",
    "Long-Term & Structured Debt",
    "Amortized Debt",
    totalRemainingDebtVal,
  ];
  wsNw.getRow(nwRow).getCell(1).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(2).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(3).alignment = alignLeft;
  wsNw.getRow(nwRow).getCell(4).alignment = alignRight;
  wsNw.getRow(nwRow).getCell(4).numFmt = currencyNumFmt;
  for (let c = 1; c <= 4; c++) {
    wsNw.getRow(nwRow).getCell(c).font = fontRegular;
    wsNw.getRow(nwRow).getCell(c).fill = fillZebra;
    wsNw.getRow(nwRow).getCell(c).border = borderThin;
  }
  wsNw.getRow(nwRow).height = 22;
  nwRow++;

  // 2. Short-term Liabilities from data.liabilities
  if (data.liabilities.length === 0) {
    const r = wsNw.getRow(nwRow);
    r.values = ["Short-Term & Revolving Credit Dues", "Current Liability", "No Outstanding", 0];
    r.getCell(1).alignment = alignLeft;
    r.getCell(1).font = fontMutedItalic;
    r.getCell(2).alignment = alignLeft;
    r.getCell(3).alignment = alignLeft;
    r.getCell(4).alignment = alignRight;
    r.getCell(4).numFmt = currencyNumFmt;
    applyRangeStyle(wsNw, 1, nwRow, 4, nwRow, borderThin, fillWhite);
    r.height = 22;
    nwRow++;
  } else {
    data.liabilities.forEach((l, idx) => {
      const r = wsNw.getRow(nwRow);
      r.values = [
        l.name,
        l.type || "Short-Term Liability",
        "Current Payable",
        l.amount,
      ];
      r.getCell(1).alignment = alignLeft;
      r.getCell(2).alignment = alignLeft;
      r.getCell(3).alignment = alignLeft;
      r.getCell(4).alignment = alignRight;
      r.getCell(4).numFmt = currencyNumFmt;

      const rowFill = idx % 2 === 0 ? fillWhite : fillZebra;
      for (let c = 1; c <= 4; c++) {
        r.getCell(c).font = fontRegular;
        r.getCell(c).fill = rowFill;
        r.getCell(c).border = borderThin;
      }
      r.height = 22;
      nwRow++;
    });
  }

  // Liabilities Total
  const liabEndRow = nwRow - 1;
  const liabTotRow = wsNw.getRow(nwRow);
  liabTotRow.values = [
    "TOTAL LIABILITIES (B)",
    "",
    "",
    { formula: `SUM(D${liabStartRow}:D${liabEndRow})`, result: totalLiabilitiesVal },
  ];
  liabTotRow.font = fontTotal;
  liabTotRow.fill = fillTotal;
  liabTotRow.getCell(4).numFmt = currencyNumFmt;
  liabTotRow.getCell(4).alignment = alignRight;
  liabTotRow.height = 24;
  applyRangeStyle(wsNw, 1, nwRow, 4, nwRow, borderTotal, fillTotal);
  wsNw.mergeCells(`A${nwRow}:C${nwRow}`);
  wsNw.getCell(`A${nwRow}`).alignment = alignLeft;
  const liabTotalRowIdx = nwRow;
  nwRow += 2;

  // Section 3: NET WORTH GRAND TOTAL
  wsNw.mergeCells(`A${nwRow}:C${nwRow}`);
  const nwFinalLabel = wsNw.getCell(`A${nwRow}`);
  nwFinalLabel.value = "CONSOLIDATED NET WORTH (A – B)";
  nwFinalLabel.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  nwFinalLabel.fill = fillTitle;
  nwFinalLabel.alignment = alignLeft;

  const nwFinalVal = wsNw.getCell(`D${nwRow}`);
  nwFinalVal.value = {
    formula: `D${assetTotalRowIdx}-D${liabTotalRowIdx}`,
    result: netWorthVal,
  };
  nwFinalVal.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  nwFinalVal.fill = fillTitle;
  nwFinalVal.numFmt = currencyNumFmt;
  nwFinalVal.alignment = alignRight;
  wsNw.getRow(nwRow).height = 30;
  applyRangeStyle(wsNw, 1, nwRow, 4, nwRow, borderTotal, fillTitle);

  wsNw.getColumn("A").width = 44;
  wsNw.getColumn("B").width = 28;
  wsNw.getColumn("C").width = 24;
  wsNw.getColumn("D").width = 26;

  // ==========================================
  // BROWSER DOWNLOAD TRIGGER
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = hasDateRange
    ? `AK_Finance_Statement_${startDate}_to_${endDate}.xlsx`
    : `AK_Finance_Statement_${todayStr}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
