import ExcelJS from "exceljs";
import type { AppData } from "../context/AppDataContext";

interface ExportOptions {
  currency?: string;
  userName?: string;
}

export async function exportFinancialStatementExcel(data: AppData, options: ExportOptions = {}) {
  const currency = options.currency || "INR";
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₹";
  const currencyNumFmt = `"${currencySymbol}"#,##0.00;("${currencySymbol}"#,##0.00);"-"`;
  const percentFmt = "0.0%";
  const userName = options.userName || "Anand";
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PULSE Financial Intelligence";
  workbook.lastModifiedBy = userName;
  workbook.created = new Date();
  workbook.modified = new Date();

  // Design Theme Constants
  const THEME = {
    headerFill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF18181B" }, // Jet obsidian
    },
    headerFont: {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    },
    sectionFill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFF4F4F5" }, // Light zinc
    },
    sectionFont: {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FF18181B" },
    },
    accentFill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFFFEDD5" }, // Peach / Amber
    },
    accentFont: {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FF9A3412" }, // Amber 800
    },
    totalFill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF27272A" }, // Dark zinc
    },
    totalFont: {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    },
    thinBorder: {
      top: { style: "thin" as const, color: { argb: "FFE4E4E7" } },
      left: { style: "thin" as const, color: { argb: "FFE4E4E7" } },
      bottom: { style: "thin" as const, color: { argb: "FFE4E4E7" } },
      right: { style: "thin" as const, color: { argb: "FFE4E4E7" } },
    },
    totalBorder: {
      top: { style: "thin" as const, color: { argb: "FF18181B" } },
      bottom: { style: "double" as const, color: { argb: "FF18181B" } },
    },
  };

  // Helper: auto-fit columns
  const autoFitColumns = (worksheet: ExcelJS.Worksheet, minWidth = 12) => {
    worksheet.columns.forEach((column) => {
      let maxLen = minWidth;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? cell.value.toString() : "";
        if (valStr.length > maxLen) {
          maxLen = Math.min(valStr.length + 3, 50);
        }
      });
      column.width = maxLen;
    });
  };

  // ==========================================
  // SHEET 1: EXECUTIVE STATEMENT & KPI DASHBOARD
  // ==========================================
  const summarySheet = workbook.addWorksheet("Executive Statement", {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  summarySheet.mergeCells("A1:F1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = "PULSE FINANCIAL STATEMENT & EXECUTIVE SUMMARY";
  titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF090807" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 42;

  // Metadata block
  summarySheet.getCell("A2").value = "Generated For:";
  summarySheet.getCell("B2").value = userName;
  summarySheet.getCell("D2").value = "Statement Date:";
  summarySheet.getCell("E2").value = nowStr;

  summarySheet.getCell("A3").value = "Reporting Currency:";
  summarySheet.getCell("B3").value = `${currency} (${currencySymbol})`;
  summarySheet.getCell("D3").value = "Platform:";
  summarySheet.getCell("E3").value = "PULSE Wealth Intelligence";

  ["A2", "D2", "A3", "D3"].forEach((key) => {
    summarySheet.getCell(key).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF71717A" } };
  });
  ["B2", "E2", "B3", "E3"].forEach((key) => {
    summarySheet.getCell(key).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF18181B" } };
  });

  // Calculate live values
  const totalIncome = data.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = data.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? netSavings / totalIncome : 0;

  const totalInvested = data.investments.reduce((s, i) => s + i.invested, 0);
  const totalPortfolioCurrent = data.investments.reduce((s, i) => s + i.current, 0);
  const totalInvestmentGain = totalPortfolioCurrent - totalInvested;
  const portfolioReturnPct = totalInvested > 0 ? totalInvestmentGain / totalInvested : 0;

  const totalSavingsGoalTarget = data.savingsGoals.reduce((s, g) => s + g.target, 0);
  const totalSavedInGoals = data.savingsGoals.reduce((s, g) => s + g.saved, 0);

  const totalMonthlyEmi = data.emis.reduce((s, e) => s + e.monthlyEmi, 0);
  const totalOutstandingDebt = data.emis.reduce((s, e) => {
    const remaining = Math.max(0, e.totalTenureMonths - e.paidMonths);
    return s + (remaining * e.monthlyEmi);
  }, 0);

  const estimatedLiquidNetWorth = netSavings + totalPortfolioCurrent - totalOutstandingDebt;

  // Key Financial Metrics Table
  summarySheet.getCell("A5").value = "KEY FINANCIAL INDICATORS";
  summarySheet.mergeCells("A5:E5");
  summarySheet.getCell("A5").font = THEME.sectionFont;
  summarySheet.getCell("A5").fill = THEME.sectionFill;
  summarySheet.getRow(5).height = 24;

  const kpis = [
    ["Total Income Inflow", totalIncome, currencyNumFmt, "Total earnings & deposits"],
    ["Total Expenses Outflow", totalExpense, currencyNumFmt, "Total living & discretionary spending"],
    ["Net Operating Cash Flow", netSavings, currencyNumFmt, "Surplus capital (Income - Expenses)"],
    ["Savings Rate", savingsRate, percentFmt, "Percentage of income retained"],
    ["Investments Portfolio Value", totalPortfolioCurrent, currencyNumFmt, "Current market value of assets"],
    ["Unrealized Investment Gain / Loss", totalInvestmentGain, currencyNumFmt, "Net returns on invested capital"],
    ["Overall Portfolio ROI", portfolioReturnPct, percentFmt, "Total percentage return on investments"],
    ["Active Savings In Goals", totalSavedInGoals, currencyNumFmt, "Funds committed to specific targets"],
    ["Total Savings Target", totalSavingsGoalTarget, currencyNumFmt, "Cumulative milestone targets"],
    ["Monthly EMI Debt Obligation", totalMonthlyEmi, currencyNumFmt, "Monthly fixed debt installments"],
    ["Total Outstanding Debt Liability", totalOutstandingDebt, currencyNumFmt, "Remaining principal across all loans"],
    ["Estimated Net Financial Position", estimatedLiquidNetWorth, currencyNumFmt, "Liquid savings + Portfolio - Liabilities"],
  ];

  summarySheet.getRow(6).values = ["Indicator", "Value", "Metric Type", "Description"];
  summarySheet.getRow(6).font = THEME.headerFont;
  summarySheet.getRow(6).fill = THEME.headerFill;
  summarySheet.getRow(6).height = 24;

  let rIdx = 7;
  kpis.forEach(([label, val, fmt, desc]) => {
    const row = summarySheet.getRow(rIdx);
    row.values = [label, val, typeof val === "number" && fmt === percentFmt ? "Rate / %" : "Currency", desc];
    row.getCell(2).numFmt = fmt as string;
    row.getCell(2).font = { name: "Segoe UI", size: 10, bold: true };
    if (label === "Estimated Net Financial Position") {
      row.fill = THEME.accentFill;
      row.font = THEME.accentFont;
      row.getCell(2).font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF9A3412" } };
    }
    row.eachCell((c) => (c.border = THEME.thinBorder));
    rIdx++;
  });

  autoFitColumns(summarySheet, 18);
  summarySheet.getColumn(1).width = 36;
  summarySheet.getColumn(2).width = 24;
  summarySheet.getColumn(4).width = 45;

  // ==========================================
  // SHEET 2: INCOME & INFLOW
  // ==========================================
  const incomeSheet = workbook.addWorksheet("Income Log", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  incomeSheet.getRow(1).values = ["Date", "Description", "Category", "Account / Mode", "Amount"];
  incomeSheet.getRow(1).font = THEME.headerFont;
  incomeSheet.getRow(1).fill = THEME.headerFill;
  incomeSheet.getRow(1).height = 26;

  const incomeTx = data.transactions.filter((t) => t.type === "income").sort((a, b) => b.date.localeCompare(a.date));
  let incRowIdx = 2;
  incomeTx.forEach((t) => {
    const r = incomeSheet.getRow(incRowIdx);
    r.values = [t.date, t.description || t.title || "Income", t.category || "Salary", t.account || "Bank Account", t.amount];
    r.getCell(5).numFmt = currencyNumFmt;
    r.eachCell((c) => (c.border = THEME.thinBorder));
    incRowIdx++;
  });

  // Total Row
  const incTotalRow = incomeSheet.getRow(incRowIdx);
  incTotalRow.values = ["TOTAL INCOME", "", "", "", incomeTx.length > 0 ? { formula: `SUM(E2:E${incRowIdx - 1})`, result: totalIncome } : 0];
  incTotalRow.font = THEME.totalFont;
  incTotalRow.fill = THEME.totalFill;
  incTotalRow.getCell(5).numFmt = currencyNumFmt;
  incTotalRow.height = 24;
  incomeSheet.mergeCells(`A${incRowIdx}:D${incRowIdx}`);
  autoFitColumns(incomeSheet, 16);

  // ==========================================
  // SHEET 3: EXPENSES & OUTFLOW
  // ==========================================
  const expenseSheet = workbook.addWorksheet("Expenses Log", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  expenseSheet.getRow(1).values = ["Date", "Description", "Category", "Account / Mode", "Amount"];
  expenseSheet.getRow(1).font = THEME.headerFont;
  expenseSheet.getRow(1).fill = THEME.headerFill;
  expenseSheet.getRow(1).height = 26;

  const expenseTx = data.transactions.filter((t) => t.type === "expense").sort((a, b) => b.date.localeCompare(a.date));
  let expRowIdx = 2;
  expenseTx.forEach((t) => {
    const r = expenseSheet.getRow(expRowIdx);
    r.values = [t.date, t.description || t.title || "Expense", t.category || "Other", t.account || "UPI", t.amount];
    r.getCell(5).numFmt = currencyNumFmt;
    r.eachCell((c) => (c.border = THEME.thinBorder));
    expRowIdx++;
  });

  // Total Row
  const expTotalRow = expenseSheet.getRow(expRowIdx);
  expTotalRow.values = ["TOTAL EXPENSES", "", "", "", expenseTx.length > 0 ? { formula: `SUM(E2:E${expRowIdx - 1})`, result: totalExpense } : 0];
  expTotalRow.font = THEME.totalFont;
  expTotalRow.fill = THEME.totalFill;
  expTotalRow.getCell(5).numFmt = currencyNumFmt;
  expTotalRow.height = 24;
  expenseSheet.mergeCells(`A${expRowIdx}:D${expRowIdx}`);

  // Category Breakdown Summary table on the side
  const categoryTotals = expenseTx.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  expenseSheet.getCell("G1").value = "Expense Category";
  expenseSheet.getCell("H1").value = "Total Spent";
  expenseSheet.getCell("I1").value = "% Share";
  ["G1", "H1", "I1"].forEach((k) => {
    const c = expenseSheet.getCell(k);
    c.font = THEME.headerFont;
    c.fill = THEME.headerFill;
  });

  let catRowIdx = 2;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    const r = expenseSheet.getRow(catRowIdx);
    r.getCell(7).value = cat;
    r.getCell(8).value = amt;
    r.getCell(8).numFmt = currencyNumFmt;
    r.getCell(9).value = totalExpense > 0 ? amt / totalExpense : 0;
    r.getCell(9).numFmt = percentFmt;
    [r.getCell(7), r.getCell(8), r.getCell(9)].forEach((c) => (c.border = THEME.thinBorder));
    catRowIdx++;
  });

  autoFitColumns(expenseSheet, 16);
  expenseSheet.getColumn(2).width = 30;

  // ==========================================
  // SHEET 4: SAVINGS & GOALS
  // ==========================================
  const savingsSheet = workbook.addWorksheet("Savings Goals", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  savingsSheet.getRow(1).values = [
    "Goal Name",
    "Target Amount",
    "Saved Amount",
    "Progress %",
    "Remaining Needed",
    "Target Deadline",
    "Status",
  ];
  savingsSheet.getRow(1).font = THEME.headerFont;
  savingsSheet.getRow(1).fill = THEME.headerFill;
  savingsSheet.getRow(1).height = 26;

  let savRowIdx = 2;
  data.savingsGoals.forEach((g) => {
    const r = savingsSheet.getRow(savRowIdx);
    const progress = g.target > 0 ? g.saved / g.target : 0;
    const remaining = Math.max(0, g.target - g.saved);
    const isCompleted = g.saved >= g.target;
    r.values = [
      g.name,
      g.target,
      g.saved,
      { formula: `C${savRowIdx}/B${savRowIdx}`, result: progress },
      { formula: `MAX(0, B${savRowIdx}-C${savRowIdx})`, result: remaining },
      g.deadline || "-",
      isCompleted ? "Completed" : progress >= 0.5 ? "On Track" : "In Progress",
    ];
    r.getCell(2).numFmt = currencyNumFmt;
    r.getCell(3).numFmt = currencyNumFmt;
    r.getCell(4).numFmt = percentFmt;
    r.getCell(5).numFmt = currencyNumFmt;
    r.eachCell((c) => (c.border = THEME.thinBorder));
    savRowIdx++;
  });

  // Total row
  const savTotalRow = savingsSheet.getRow(savRowIdx);
  savTotalRow.values = [
    "TOTAL SAVINGS COMMITTED",
    data.savingsGoals.length > 0 ? { formula: `SUM(B2:B${savRowIdx - 1})`, result: totalSavingsGoalTarget } : 0,
    data.savingsGoals.length > 0 ? { formula: `SUM(C2:C${savRowIdx - 1})`, result: totalSavedInGoals } : 0,
    data.savingsGoals.length > 0 ? { formula: `C${savRowIdx}/B${savRowIdx}`, result: totalSavingsGoalTarget ? totalSavedInGoals / totalSavingsGoalTarget : 0 } : 0,
    data.savingsGoals.length > 0 ? { formula: `SUM(E2:E${savRowIdx - 1})`, result: Math.max(0, totalSavingsGoalTarget - totalSavedInGoals) } : 0,
    "-",
    totalSavedInGoals >= totalSavingsGoalTarget && totalSavingsGoalTarget > 0 ? "All Complete" : "In Progress",
  ];
  savTotalRow.font = THEME.totalFont;
  savTotalRow.fill = THEME.totalFill;
  savTotalRow.getCell(2).numFmt = currencyNumFmt;
  savTotalRow.getCell(3).numFmt = currencyNumFmt;
  savTotalRow.getCell(4).numFmt = percentFmt;
  savTotalRow.getCell(5).numFmt = currencyNumFmt;
  savTotalRow.height = 24;
  autoFitColumns(savingsSheet, 16);

  // ==========================================
  // SHEET 5: INVESTMENT PORTFOLIO
  // ==========================================
  const investSheet = workbook.addWorksheet("Investments Portfolio", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  investSheet.getRow(1).values = [
    "Instrument / Holding",
    "Symbol",
    "Asset Class",
    "Units Held",
    "Invested Capital",
    "Current Market Value",
    "Unrealized Gain / Loss",
    "Return on Investment (ROI %)",
    "As of Date",
  ];
  investSheet.getRow(1).font = THEME.headerFont;
  investSheet.getRow(1).fill = THEME.headerFill;
  investSheet.getRow(1).height = 26;

  let invRowIdx = 2;
  data.investments.forEach((i) => {
    const r = investSheet.getRow(invRowIdx);
    const gain = i.current - i.invested;
    const roi = i.invested > 0 ? gain / i.invested : 0;
    r.values = [
      i.name,
      i.symbol || "-",
      i.type || "Stock",
      i.units || 0,
      i.invested,
      i.current,
      { formula: `F${invRowIdx}-E${invRowIdx}`, result: gain },
      { formula: `IF(E${invRowIdx}>0, G${invRowIdx}/E${invRowIdx}, 0)`, result: roi },
      i.date || todayStr,
    ];
    r.getCell(4).numFmt = "#,##0.00";
    r.getCell(5).numFmt = currencyNumFmt;
    r.getCell(6).numFmt = currencyNumFmt;
    r.getCell(7).numFmt = currencyNumFmt;
    r.getCell(8).numFmt = percentFmt;
    r.eachCell((c) => (c.border = THEME.thinBorder));
    invRowIdx++;
  });

  // Total row
  const invTotalRow = investSheet.getRow(invRowIdx);
  invTotalRow.values = [
    "TOTAL PORTFOLIO",
    "",
    "",
    "",
    data.investments.length > 0 ? { formula: `SUM(E2:E${invRowIdx - 1})`, result: totalInvested } : 0,
    data.investments.length > 0 ? { formula: `SUM(F2:F${invRowIdx - 1})`, result: totalPortfolioCurrent } : 0,
    data.investments.length > 0 ? { formula: `SUM(G2:G${invRowIdx - 1})`, result: totalInvestmentGain } : 0,
    data.investments.length > 0 ? { formula: `IF(E${invRowIdx}>0, G${invRowIdx}/E${invRowIdx}, 0)`, result: portfolioReturnPct } : 0,
    "-",
  ];
  invTotalRow.font = THEME.totalFont;
  invTotalRow.fill = THEME.totalFill;
  invTotalRow.getCell(5).numFmt = currencyNumFmt;
  invTotalRow.getCell(6).numFmt = currencyNumFmt;
  invTotalRow.getCell(7).numFmt = currencyNumFmt;
  invTotalRow.getCell(8).numFmt = percentFmt;
  invTotalRow.height = 24;
  investSheet.mergeCells(`A${invRowIdx}:D${invRowIdx}`);
  autoFitColumns(investSheet, 16);

  // ==========================================
  // SHEET 6: EMIS & DEBT SCHEDULE
  // ==========================================
  const emiSheet = workbook.addWorksheet("EMIs & Loans", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  emiSheet.getRow(1).values = [
    "Loan / Asset Name",
    "Lender / Financial Inst.",
    "Category",
    "Monthly EMI Amount",
    "Total Tenure (Months)",
    "Paid Months",
    "Remaining Months",
    "Interest Rate (%)",
    "Total Loan Sanctioned",
    "Estimated Balance",
    "Auto Debit Account",
    "Due Day",
  ];
  emiSheet.getRow(1).font = THEME.headerFont;
  emiSheet.getRow(1).fill = THEME.headerFill;
  emiSheet.getRow(1).height = 26;

  let emiRowIdx = 2;
  data.emis.forEach((e) => {
    const r = emiSheet.getRow(emiRowIdx);
    const remMonths = Math.max(0, e.totalTenureMonths - e.paidMonths);
    const estRemaining = remMonths * e.monthlyEmi;
    r.values = [
      e.name,
      e.lender || "Bank",
      e.category || "Personal",
      e.monthlyEmi,
      e.totalTenureMonths,
      e.paidMonths,
      { formula: `MAX(0, E${emiRowIdx}-F${emiRowIdx})`, result: remMonths },
      (e.interestRate || 0) / 100,
      e.totalAmount || e.monthlyEmi * e.totalTenureMonths,
      { formula: `G${emiRowIdx}*D${emiRowIdx}`, result: estRemaining },
      e.autoDebitAccount || "-",
      e.dueDay || 5,
    ];
    r.getCell(4).numFmt = currencyNumFmt;
    r.getCell(8).numFmt = percentFmt;
    r.getCell(9).numFmt = currencyNumFmt;
    r.getCell(10).numFmt = currencyNumFmt;
    r.eachCell((c) => (c.border = THEME.thinBorder));
    emiRowIdx++;
  });

  // Total row
  const emiTotalRow = emiSheet.getRow(emiRowIdx);
  emiTotalRow.values = [
    "TOTAL DEBT LIABILITIES",
    "",
    "",
    data.emis.length > 0 ? { formula: `SUM(D2:D${emiRowIdx - 1})`, result: totalMonthlyEmi } : 0,
    "",
    "",
    "",
    "",
    data.emis.length > 0 ? { formula: `SUM(I2:I${emiRowIdx - 1})`, result: data.emis.reduce((s, e) => s + (e.totalAmount || 0), 0) } : 0,
    data.emis.length > 0 ? { formula: `SUM(J2:J${emiRowIdx - 1})`, result: totalOutstandingDebt } : 0,
    "",
    "",
  ];
  emiTotalRow.font = THEME.totalFont;
  emiTotalRow.fill = THEME.totalFill;
  emiTotalRow.getCell(4).numFmt = currencyNumFmt;
  emiTotalRow.getCell(9).numFmt = currencyNumFmt;
  emiTotalRow.getCell(10).numFmt = currencyNumFmt;
  emiTotalRow.height = 24;
  emiSheet.mergeCells(`A${emiRowIdx}:C${emiRowIdx}`);
  autoFitColumns(emiSheet, 16);

  // ==========================================
  // SHEET 7: BUDGET ENVELOPES
  // ==========================================
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const budgetSheet = workbook.addWorksheet("Monthly Budget", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  budgetSheet.getRow(1).values = [
    "Category / Envelope",
    "Monthly Limit",
    "Actual Spent (Current Month)",
    "Remaining Balance",
    "Utilization %",
    "Status",
  ];
  budgetSheet.getRow(1).font = THEME.headerFont;
  budgetSheet.getRow(1).fill = THEME.headerFill;
  budgetSheet.getRow(1).height = 26;

  let budRowIdx = 2;
  let totalBudgetLimit = 0;
  let totalBudgetSpent = 0;

  data.budgets.forEach((b) => {
    const spent = data.transactions
      .filter((t) => t.type === "expense" && t.category === b.name && t.date.startsWith(currentMonthKey))
      .reduce((s, t) => s + t.amount, 0);
    totalBudgetLimit += b.limit;
    totalBudgetSpent += spent;
    const remaining = b.limit - spent;
    const util = b.limit > 0 ? spent / b.limit : 0;
    const r = budgetSheet.getRow(budRowIdx);
    r.values = [
      b.name,
      b.limit,
      spent,
      { formula: `B${budRowIdx}-C${budRowIdx}`, result: remaining },
      { formula: `IF(B${budRowIdx}>0, C${budRowIdx}/B${budRowIdx}, 0)`, result: util },
      spent > b.limit ? "OVER BUDGET" : util >= 0.8 ? "Near Limit" : "On Track",
    ];
    r.getCell(2).numFmt = currencyNumFmt;
    r.getCell(3).numFmt = currencyNumFmt;
    r.getCell(4).numFmt = currencyNumFmt;
    r.getCell(5).numFmt = percentFmt;
    r.eachCell((c) => (c.border = THEME.thinBorder));
    budRowIdx++;
  });

  // Total row
  const budTotalRow = budgetSheet.getRow(budRowIdx);
  budTotalRow.values = [
    "TOTAL MONTHLY BUDGET",
    data.budgets.length > 0 ? { formula: `SUM(B2:B${budRowIdx - 1})`, result: totalBudgetLimit } : 0,
    data.budgets.length > 0 ? { formula: `SUM(C2:C${budRowIdx - 1})`, result: totalBudgetSpent } : 0,
    data.budgets.length > 0 ? { formula: `B${budRowIdx}-C${budRowIdx}`, result: totalBudgetLimit - totalBudgetSpent } : 0,
    data.budgets.length > 0 ? { formula: `IF(B${budRowIdx}>0, C${budRowIdx}/B${budRowIdx}, 0)`, result: totalBudgetLimit ? totalBudgetSpent / totalBudgetLimit : 0 } : 0,
    totalBudgetSpent > totalBudgetLimit && totalBudgetLimit > 0 ? "OVER BUDGET" : "Within Budget",
  ];
  budTotalRow.font = THEME.totalFont;
  budTotalRow.fill = THEME.totalFill;
  budTotalRow.getCell(2).numFmt = currencyNumFmt;
  budTotalRow.getCell(3).numFmt = currencyNumFmt;
  budTotalRow.getCell(4).numFmt = currencyNumFmt;
  budTotalRow.getCell(5).numFmt = percentFmt;
  budTotalRow.height = 24;
  autoFitColumns(budgetSheet, 18);

  // Trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PULSE_Financial_Statement_${todayStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
