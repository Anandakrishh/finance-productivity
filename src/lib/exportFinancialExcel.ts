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
    size: 13,
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

  const autoFit = (ws: ExcelJS.Worksheet, minWidth = 12) => {
    ws.columns.forEach((col) => {
      let maxLen = minWidth;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : "";
        if (valStr.length > maxLen) {
          maxLen = Math.min(valStr.length + 3, 48);
        }
      });
      col.width = maxLen;
    });
  };

  // Pre-calculated metrics
  const totalIncomeVal = incomeTx.reduce((s, t) => s + t.amount, 0);
  const totalExpenseVal = expenseTx.reduce((s, t) => s + t.amount, 0);
  const netCashFlowVal = totalIncomeVal - totalExpenseVal;
  const savingsRateVal = totalIncomeVal > 0 ? netCashFlowVal / totalIncomeVal : 0;

  const totalInvestedVal = data.investments.reduce((s, i) => s + i.invested, 0);
  const totalPortfolioCurrentVal = data.investments.reduce((s, i) => s + i.current, 0);
  const totalPortfolioGainVal = totalPortfolioCurrentVal - totalInvestedVal;

  const totalMonthlyEmiVal = data.emis.reduce((s, e) => s + e.monthlyEmi, 0);
  const totalRemainingDebtVal = data.emis.reduce((s, e) => {
    const remMonths = Math.max(0, e.totalTenureMonths - e.paidMonths);
    return s + (e.monthlyEmi * remMonths);
  }, 0);

  const totalAssetsVal = data.assets.reduce((s, a) => s + a.value, 0) + totalPortfolioCurrentVal;
  const totalLiabilitiesVal = data.liabilities.reduce((s, l) => s + l.amount, 0) + totalRemainingDebtVal;
  const netWorthVal = totalAssetsVal - totalLiabilitiesVal;

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

  // KPI Summary Cards (Row 6–9)
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
    if (typeof val === "object" && val !== null) {
      vCell.value = val;
    } else {
      vCell.value = val;
    }
    vCell.font = fontCardValue;
    vCell.fill = { type: "pattern", pattern: "solid", fgColor: THEME.white };
    vCell.alignment = alignCenter;
    if (isCurrency) vCell.numFmt = currencyIntFmt;
    if (isPercent) vCell.numFmt = percentFmt;

    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        wsOv.getRow(r).getCell(c).border = borderThin;
      }
    }
  };

  // Row 6..8: 3 Cards across columns A..B, C..D, E..F
  renderCard(6, 1, 8, 2, "Net Worth", netWorthVal);
  renderCard(6, 3, 8, 4, "Total Assets & Portfolio", totalAssetsVal);
  renderCard(6, 5, 8, 6, "Total Debt & Liabilities", totalLiabilitiesVal);

  // Row 10..12: 3 Cards for Cash Flow
  renderCard(10, 1, 12, 2, "Total Income (Period)", totalIncomeVal);
  renderCard(10, 3, 12, 4, "Total Expenses (Period)", totalExpenseVal);
  renderCard(10, 5, 12, 6, "Net Cash Flow / Savings", netCashFlowVal);

  // Section Header: Executive Financial Breakdown
  wsOv.mergeCells("A14:F14");
  const s14 = wsOv.getCell("A14");
  s14.value = "EXECUTIVE FINANCIAL POSITION & OBLIGATIONS BREAKDOWN";
  s14.font = fontSection;
  s14.fill = fillSection;
  s14.alignment = alignLeft;
  wsOv.getRow(14).height = 24;

  const summaryMetrics = [
    { label: "Net Operating Surplus (Income – Expenses)", val: netCashFlowVal, fmt: currencyNumFmt, note: "Retained liquid operating capital" },
    { label: "Personal Savings Rate %", val: savingsRateVal, fmt: percentFmt, note: "Target benchmark: 20% - 40%" },
    { label: "Investment Portfolio Market Value", val: totalPortfolioCurrentVal, fmt: currencyNumFmt, note: `${data.investments.length} investment assets held` },
    { label: "Portfolio Cumulative Unrealized Gain / Loss", val: totalPortfolioGainVal, fmt: currencyNumFmt, note: totalInvestedVal > 0 ? `ROI: ${((totalPortfolioGainVal / totalInvestedVal) * 100).toFixed(1)}%` : "0.0%" },
    { label: "Recurring Monthly Loan Commitments (EMIs)", val: totalMonthlyEmiVal, fmt: currencyNumFmt, note: `${data.emis.length} active structured debt obligations` },
    { label: "Total Outstanding Loan Principal (EMIs)", val: totalRemainingDebtVal, fmt: currencyNumFmt, note: "Projected remaining contractual debt" },
    { label: "Target Capital for Active Savings Goals", val: data.savingsGoals.reduce((s, g) => s + g.target, 0), fmt: currencyNumFmt, note: `${data.savingsGoals.length} committed savings goals` },
    { label: "Total Capital Saved to Goals", val: data.savingsGoals.reduce((s, g) => s + g.saved, 0), fmt: currencyNumFmt, note: "Capital currently locked in savings goals" },
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
    cellN.font = { name: "Segoe UI", size: 9, italic: true, color: THEME.textMuted };
    cellN.alignment = alignLeft;

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 6; c++) {
      const cell = wsOv.getRow(curRow).getCell(c);
      cell.fill = rowFill;
      cell.border = borderThin;
    }
    wsOv.getRow(curRow).height = 20;
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
  for (let c = 1; c <= 6; c++) wsOv.getRow(curRow).getCell(c).border = borderThin;
  wsOv.getRow(curRow).height = 22;
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
    noExp.font = { name: "Segoe UI", size: 10, italic: true, color: THEME.textMuted };
    noExp.alignment = alignCenter;
    for (let c = 1; c <= 6; c++) wsOv.getRow(curRow).getCell(c).border = borderThin;
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

      const rowFill = cIdx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
      for (let c = 1; c <= 6; c++) {
        const cell = wsOv.getRow(curRow).getCell(c);
        cell.fill = rowFill;
        cell.border = borderThin;
      }
      wsOv.getRow(curRow).height = 20;
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
  // SHEET 2: ALL TRANSACTIONS (CASH FLOW LEDGER)
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
  wsTx.getRow(1).getCell(6).alignment = alignRight;
  for (let c = 1; c <= 6; c++) wsTx.getRow(1).getCell(c).border = borderThin;

  let txRow = 2;
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

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 6; c++) {
      const cell = r.getCell(c);
      cell.font = fontRegular;
      cell.fill = rowFill;
      cell.border = borderThin;
    }
    r.height = 20;
    txRow++;
  });

  // Total summary rows on Transactions sheet
  const txEndDataRow = txRow - 1;
  const incTotalRow = wsTx.getRow(txRow);
  incTotalRow.values = [
    "TOTAL INCOME RECORDED",
    "",
    "",
    "",
    "",
    txEndDataRow >= 2
      ? { formula: `SUMIF(D2:D${txEndDataRow},"Income",F2:F${txEndDataRow})`, result: totalIncomeVal }
      : totalIncomeVal,
  ];
  incTotalRow.font = fontTotal;
  incTotalRow.fill = fillTotal;
  incTotalRow.getCell(6).numFmt = currencyNumFmt;
  incTotalRow.getCell(6).alignment = alignRight;
  incTotalRow.height = 24;
  for (let c = 1; c <= 6; c++) incTotalRow.getCell(c).border = borderTotal;
  wsTx.mergeCells(`A${txRow}:E${txRow}`);
  txRow++;

  const expTotalRow = wsTx.getRow(txRow);
  expTotalRow.values = [
    "TOTAL EXPENSES RECORDED",
    "",
    "",
    "",
    "",
    txEndDataRow >= 2
      ? { formula: `SUMIF(D2:D${txEndDataRow},"Expense",F2:F${txEndDataRow})`, result: totalExpenseVal }
      : totalExpenseVal,
  ];
  expTotalRow.font = fontTotal;
  expTotalRow.fill = fillTotal;
  expTotalRow.getCell(6).numFmt = currencyNumFmt;
  expTotalRow.getCell(6).alignment = alignRight;
  expTotalRow.height = 24;
  for (let c = 1; c <= 6; c++) expTotalRow.getCell(c).border = borderTotal;
  wsTx.mergeCells(`A${txRow}:E${txRow}`);
  txRow++;

  const netCashFlowRow = wsTx.getRow(txRow);
  netCashFlowRow.values = [
    "NET OPERATING CASH FLOW",
    "",
    "",
    "",
    "",
    { formula: `F${txRow - 2}-F${txRow - 1}`, result: netCashFlowVal },
  ];
  netCashFlowRow.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  netCashFlowRow.fill = { type: "pattern", pattern: "solid", fgColor: THEME.navyDark };
  netCashFlowRow.getCell(6).numFmt = currencyNumFmt;
  netCashFlowRow.getCell(6).alignment = alignRight;
  netCashFlowRow.height = 24;
  for (let c = 1; c <= 6; c++) netCashFlowRow.getCell(c).border = borderTotal;
  wsTx.mergeCells(`A${txRow}:E${txRow}`);

  autoFit(wsTx, 14);
  wsTx.getColumn("A").width = 14;
  wsTx.getColumn("B").width = 32;
  wsTx.getColumn("C").width = 20;
  wsTx.getColumn("D").width = 14;
  wsTx.getColumn("E").width = 20;
  wsTx.getColumn("F").width = 20;

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
  for (let c = 1; c <= 5; c++) wsInc.getRow(1).getCell(c).border = borderThin;

  let incRow = 2;
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

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 5; c++) {
      const cell = r.getCell(c);
      cell.font = fontRegular;
      cell.fill = rowFill;
      cell.border = borderThin;
    }
    r.height = 20;
    incRow++;
  });

  const incTotRow = wsInc.getRow(incRow);
  incTotRow.values = [
    "TOTAL INCOME",
    "",
    "",
    "",
    incRow > 2 ? { formula: `SUM(E2:E${incRow - 1})`, result: totalIncomeVal } : 0,
  ];
  incTotRow.font = fontTotal;
  incTotRow.fill = fillTotal;
  incTotRow.getCell(5).numFmt = currencyNumFmt;
  incTotRow.getCell(5).alignment = alignRight;
  incTotRow.height = 24;
  for (let c = 1; c <= 5; c++) incTotRow.getCell(c).border = borderTotal;
  wsInc.mergeCells(`A${incRow}:D${incRow}`);

  autoFit(wsInc, 14);
  wsInc.getColumn("A").width = 14;
  wsInc.getColumn("B").width = 32;
  wsInc.getColumn("C").width = 20;
  wsInc.getColumn("D").width = 20;
  wsInc.getColumn("E").width = 20;

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
  for (let c = 1; c <= 5; c++) wsExp.getRow(1).getCell(c).border = borderThin;

  let expRow = 2;
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

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 5; c++) {
      const cell = r.getCell(c);
      cell.font = fontRegular;
      cell.fill = rowFill;
      cell.border = borderThin;
    }
    r.height = 20;
    expRow++;
  });

  const expTotRow = wsExp.getRow(expRow);
  expTotRow.values = [
    "TOTAL EXPENSES",
    "",
    "",
    "",
    expRow > 2 ? { formula: `SUM(E2:E${expRow - 1})`, result: totalExpenseVal } : 0,
  ];
  expTotRow.font = fontTotal;
  expTotRow.fill = fillTotal;
  expTotRow.getCell(5).numFmt = currencyNumFmt;
  expTotRow.getCell(5).alignment = alignRight;
  expTotRow.height = 24;
  for (let c = 1; c <= 5; c++) expTotRow.getCell(c).border = borderTotal;
  wsExp.mergeCells(`A${expRow}:D${expRow}`);

  autoFit(wsExp, 14);
  wsExp.getColumn("A").width = 14;
  wsExp.getColumn("B").width = 32;
  wsExp.getColumn("C").width = 20;
  wsExp.getColumn("D").width = 20;
  wsExp.getColumn("E").width = 20;

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
  for (let c = 1; c <= 6; c++) wsBg.getRow(1).getCell(c).border = borderThin;

  let bgRow = 2;
  let totalBgLimit = 0;
  let totalBgSpent = 0;

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
      { formula: `SUMIFS(Expenses!$E$2:$E$1000, Expenses!$C$2:$C$1000, A${bgRow})`, result: spent },
      { formula: `B${bgRow}-C${bgRow}`, result: remaining },
      { formula: `IF(B${bgRow}>0, C${bgRow}/B${bgRow}, 0)`, result: util },
      spent > b.limit ? "OVER BUDGET" : util >= 0.85 ? "Near Limit" : "On Track",
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

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 5; c++) {
      const cell = r.getCell(c);
      cell.font = fontRegular;
      cell.fill = rowFill;
      cell.border = borderThin;
    }
    statusCell.border = borderThin;
    r.height = 20;
    bgRow++;
  });

  // Total Row for Budget
  const bgTotRow = wsBg.getRow(bgRow);
  const bgEndDataRow = bgRow - 1;
  bgTotRow.values = [
    "TOTAL MONTHLY BUDGET",
    bgEndDataRow >= 2 ? { formula: `SUM(B2:B${bgEndDataRow})`, result: totalBgLimit } : 0,
    bgEndDataRow >= 2 ? { formula: `SUM(C2:C${bgEndDataRow})`, result: totalBgSpent } : 0,
    bgEndDataRow >= 2 ? { formula: `B${bgRow}-C${bgRow}`, result: totalBgLimit - totalBgSpent } : 0,
    bgEndDataRow >= 2 ? { formula: `IF(B${bgRow}>0, C${bgRow}/B${bgRow}, 0)`, result: totalBgLimit > 0 ? totalBgSpent / totalBgLimit : 0 } : 0,
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
  for (let c = 1; c <= 6; c++) bgTotRow.getCell(c).border = borderTotal;

  autoFit(wsBg, 16);
  wsBg.getColumn("A").width = 28;
  wsBg.getColumn("B").width = 20;
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
  for (let c = 1; c <= 10; c++) wsInv.getRow(1).getCell(c).border = borderThin;

  let invRow = 2;
  const invExpectedTotRow = data.investments.length + 2;

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

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 10; c++) {
      if (c !== 7) r.getCell(c).font = fontRegular;
      r.getCell(c).fill = rowFill;
      r.getCell(c).border = borderThin;
    }
    r.height = 20;
    invRow++;
  });

  // Portfolio Total Row
  const invTotRow = wsInv.getRow(invRow);
  const invEndDataRow = invRow - 1;
  invTotRow.values = [
    "TOTAL PORTFOLIO HOLDINGS",
    "",
    "",
    "",
    invEndDataRow >= 2 ? { formula: `SUM(E2:E${invEndDataRow})`, result: totalInvestedVal } : 0,
    invEndDataRow >= 2 ? { formula: `SUM(F2:F${invEndDataRow})`, result: totalPortfolioCurrentVal } : 0,
    invEndDataRow >= 2 ? { formula: `SUM(G2:G${invEndDataRow})`, result: totalPortfolioGainVal } : 0,
    invEndDataRow >= 2 ? { formula: `IF(E${invRow}>0, G${invRow}/E${invRow}, 0)`, result: totalInvestedVal > 0 ? totalPortfolioGainVal / totalInvestedVal : 0 } : 0,
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
  for (let c = 1; c <= 10; c++) invTotRow.getCell(c).border = borderTotal;
  wsInv.mergeCells(`A${invRow}:D${invRow}`);

  autoFit(wsInv, 14);
  wsInv.getColumn("A").width = 26;
  wsInv.getColumn("B").width = 16;
  wsInv.getColumn("C").width = 16;
  wsInv.getColumn("D").width = 14;
  wsInv.getColumn("E").width = 20;
  wsInv.getColumn("F").width = 22;
  wsInv.getColumn("G").width = 20;
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
  for (let c = 1; c <= 12; c++) wsEmi.getRow(1).getCell(c).border = borderThin;

  let emiRow = 2;
  let totalLoanAmtVal = 0;

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

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 12; c++) {
      const cell = r.getCell(c);
      cell.font = fontRegular;
      cell.fill = rowFill;
      cell.border = borderThin;
    }
    r.height = 20;
    emiRow++;
  });

  // EMI Total Row
  const emiTotRow = wsEmi.getRow(emiRow);
  const emiEndDataRow = emiRow - 1;
  emiTotRow.values = [
    "TOTAL DEBT LIABILITIES",
    "",
    "",
    emiEndDataRow >= 2 ? { formula: `SUM(D2:D${emiEndDataRow})`, result: totalMonthlyEmiVal } : 0,
    "",
    "",
    "",
    "",
    emiEndDataRow >= 2 ? { formula: `SUM(I2:I${emiEndDataRow})`, result: totalLoanAmtVal } : 0,
    emiEndDataRow >= 2 ? { formula: `SUM(J2:J${emiEndDataRow})`, result: totalRemainingDebtVal } : 0,
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
  for (let c = 1; c <= 12; c++) emiTotRow.getCell(c).border = borderTotal;
  wsEmi.mergeCells(`A${emiRow}:C${emiRow}`);

  autoFit(wsEmi, 14);
  wsEmi.getColumn("A").width = 24;
  wsEmi.getColumn("B").width = 20;
  wsEmi.getColumn("C").width = 18;
  wsEmi.getColumn("D").width = 18;
  wsEmi.getColumn("E").width = 16;
  wsEmi.getColumn("F").width = 16;
  wsEmi.getColumn("G").width = 16;
  wsEmi.getColumn("H").width = 18;
  wsEmi.getColumn("I").width = 22;
  wsEmi.getColumn("J").width = 24;
  wsEmi.getColumn("K").width = 20;
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
  for (let c = 1; c <= 7; c++) wsSav.getRow(1).getCell(c).border = borderThin;

  let savRow = 2;
  let totalSavTarget = 0;
  let totalSavSaved = 0;

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
      isCompleted ? "Achieved" : progress >= 0.5 ? "On Track" : "In Progress",
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

    const rowFill = idx % 2 === 0 ? fillZebra : { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white };
    for (let c = 1; c <= 6; c++) {
      const cell = r.getCell(c);
      cell.font = fontRegular;
      cell.fill = rowFill;
      cell.border = borderThin;
    }
    statusCell.border = borderThin;
    r.height = 20;
    savRow++;
  });

  // Savings Total Row
  const savTotRow = wsSav.getRow(savRow);
  const savEndDataRow = savRow - 1;
  savTotRow.values = [
    "TOTAL SAVINGS COMMITTED",
    savEndDataRow >= 2 ? { formula: `SUM(B2:B${savEndDataRow})`, result: totalSavTarget } : 0,
    savEndDataRow >= 2 ? { formula: `SUM(C2:C${savEndDataRow})`, result: totalSavSaved } : 0,
    savEndDataRow >= 2 ? { formula: `SUM(D2:D${savEndDataRow})`, result: Math.max(0, totalSavTarget - totalSavSaved) } : 0,
    savEndDataRow >= 2 ? { formula: `IF(B${savRow}>0, C${savRow}/B${savRow}, 0)`, result: totalSavTarget > 0 ? totalSavSaved / totalSavTarget : 0 } : 0,
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
  for (let c = 1; c <= 7; c++) savTotRow.getCell(c).border = borderTotal;

  autoFit(wsSav, 16);
  wsSav.getColumn("A").width = 28;
  wsSav.getColumn("B").width = 20;
  wsSav.getColumn("C").width = 20;
  wsSav.getColumn("D").width = 22;
  wsSav.getColumn("E").width = 16;
  wsSav.getColumn("F").width = 18;
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
  wsNw.getRow(4).height = 24;

  wsNw.getRow(5).values = ["Asset Description", "Classification", "Valuation Basis", "Current Value (₹)"];
  wsNw.getRow(5).font = fontHeader;
  wsNw.getRow(5).fill = fillHeader;
  wsNw.getRow(5).height = 24;
  wsNw.getRow(5).getCell(4).alignment = alignRight;
  for (let c = 1; c <= 4; c++) wsNw.getRow(5).getCell(c).border = borderThin;

  let nwRow = 6;
  const assetStartRow = nwRow;

  // 1. Investment Portfolio summary row
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
  wsNw.getRow(nwRow).height = 20;
  nwRow++;

  // 2. Fixed & Personal Assets from data.assets
  data.assets.forEach((a, idx) => {
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

    const rowFill = idx % 2 === 0 ? { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white } : fillZebra;
    for (let c = 1; c <= 4; c++) {
      r.getCell(c).font = fontRegular;
      r.getCell(c).fill = rowFill;
      r.getCell(c).border = borderThin;
    }
    r.height = 20;
    nwRow++;
  });

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
  for (let c = 1; c <= 4; c++) assetTotRow.getCell(c).border = borderTotal;
  wsNw.mergeCells(`A${nwRow}:C${nwRow}`);
  const assetTotalRowIdx = nwRow;
  nwRow += 2;

  // Section 2: LIABILITIES
  wsNw.mergeCells(`A${nwRow}:D${nwRow}`);
  const lHeader = wsNw.getCell(`A${nwRow}`);
  lHeader.value = "II. LIABILITIES & DEBT OBLIGATIONS";
  lHeader.font = fontSection;
  lHeader.fill = fillSection;
  lHeader.alignment = alignLeft;
  wsNw.getRow(nwRow).height = 24;
  nwRow++;

  wsNw.getRow(nwRow).values = ["Liability Description", "Classification", "Payable Terms", "Outstanding Amount (₹)"];
  wsNw.getRow(nwRow).font = fontHeader;
  wsNw.getRow(nwRow).fill = fillHeader;
  wsNw.getRow(nwRow).height = 24;
  wsNw.getRow(nwRow).getCell(4).alignment = alignRight;
  for (let c = 1; c <= 4; c++) wsNw.getRow(nwRow).getCell(c).border = borderThin;
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
  wsNw.getRow(nwRow).height = 20;
  nwRow++;

  // 2. Short-term Liabilities from data.liabilities
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

    const rowFill = idx % 2 === 0 ? { type: "pattern" as const, pattern: "solid" as const, fgColor: THEME.white } : fillZebra;
    for (let c = 1; c <= 4; c++) {
      r.getCell(c).font = fontRegular;
      r.getCell(c).fill = rowFill;
      r.getCell(c).border = borderThin;
    }
    r.height = 20;
    nwRow++;
  });

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
  for (let c = 1; c <= 4; c++) liabTotRow.getCell(c).border = borderTotal;
  wsNw.mergeCells(`A${nwRow}:C${nwRow}`);
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
  for (let c = 1; c <= 4; c++) wsNw.getRow(nwRow).getCell(c).border = borderTotal;

  autoFit(wsNw, 18);
  wsNw.getColumn("A").width = 38;
  wsNw.getColumn("B").width = 28;
  wsNw.getColumn("C").width = 22;
  wsNw.getColumn("D").width = 24;

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
