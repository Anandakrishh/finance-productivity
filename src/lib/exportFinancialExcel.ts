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

  const startDate = options.startDate;
  const endDate = options.endDate;
  const hasDateRange = Boolean(startDate && endDate);

  const statementDateStr = endDate || todayStr;
  const statementYear = parseInt(statementDateStr.slice(0, 4), 10) || new Date().getFullYear();
  const statementMonthStart = startDate || `${statementDateStr.slice(0, 7)}-01`;

  // Filter transactions within the selected date range (inclusive)
  const filteredTransactions = hasDateRange
    ? data.transactions.filter((t) => {
        const d = t.date ? t.date.slice(0, 10) : "";
        return d >= startDate! && d <= endDate!;
      })
    : data.transactions;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "All-in-One Personal Finance";
  workbook.lastModifiedBy = userName;
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================================
  // DESIGN THEME CONSTANTS: Corporate Executive Navy & Slate
  // ==========================================
  const THEME = {
    navyDark: { argb: "FF0F2042" },
    navySecondary: { argb: "FF1E3A8A" },
    navyAccent: { argb: "FF2563EB" },
    iceBlue: { argb: "FFF0F4F8" },
    inputBg: { argb: "FFEFF6FF" },
    inputBorder: { argb: "FF93C5FD" },
    zebraBg: { argb: "FFF8FAFC" },
    cardBg: { argb: "FFF1F5F9" },
    borderColor: { argb: "FFCBD5E1" },
    textMain: { argb: "FF0F172A" },
    textMuted: { argb: "FF475569" },
    white: { argb: "FFFFFFFF" },
  };

  const fontTitle = { name: "Segoe UI", size: 14, bold: true, color: { argb: THEME.white.argb } };
  const fontSection = { name: "Segoe UI", size: 10, bold: true, color: { argb: THEME.white.argb } };
  const fontTblHeader = { name: "Segoe UI", size: 10, bold: true, color: { argb: THEME.textMain.argb } };
  const fontBold = { name: "Segoe UI", size: 10, bold: true, color: { argb: THEME.textMain.argb } };
  const fontRegular = { name: "Segoe UI", size: 10, color: { argb: THEME.textMain.argb } };
  const fontInput = { name: "Segoe UI", size: 10, bold: true, color: { argb: THEME.navyDark.argb } };
  const fontMuted = { name: "Segoe UI", size: 9, italic: true, color: { argb: THEME.textMuted.argb } };
  const fontTotal = { name: "Segoe UI", size: 10, bold: true, color: { argb: THEME.white.argb } };
  const fontNote = { name: "Segoe UI", size: 9, color: { argb: THEME.textMuted.argb } };

  const fillTitle: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: THEME.navyDark };
  const fillSection: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: THEME.navySecondary };
  const fillTblHeader: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: THEME.iceBlue };
  const fillInput: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: THEME.inputBg };
  const fillZebra: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: THEME.zebraBg };
  const fillCard: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: THEME.cardBg };
  const fillTotal: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: THEME.navyDark };

  const thinBorderSide: Partial<ExcelJS.Border> = { style: "thin", color: THEME.borderColor };
  const borderCell: Partial<ExcelJS.Borders> = {
    left: thinBorderSide,
    right: thinBorderSide,
    top: thinBorderSide,
    bottom: thinBorderSide,
  };
  const borderInput: Partial<ExcelJS.Borders> = {
    left: { style: "thin", color: THEME.inputBorder },
    right: { style: "thin", color: THEME.inputBorder },
    top: { style: "thin", color: THEME.inputBorder },
    bottom: { style: "thin", color: THEME.inputBorder },
  };
  const borderTotal: Partial<ExcelJS.Borders> = {
    left: thinBorderSide,
    right: thinBorderSide,
    top: { style: "thin", color: THEME.navyDark },
    bottom: { style: "double", color: THEME.navyDark },
  };

  const alignCenter: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" };
  const alignLeft: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle" };
  const alignRight: Partial<ExcelJS.Alignment> = { horizontal: "right", vertical: "middle" };
  const alignWrapLeft: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle", wrapText: true };

  // ==========================================
  // MASTER CATEGORY TAXONOMY (85 Categories)
  // ==========================================
  const CATEGORIES_DATA: [string, string, string][] = [
    ["Income", "Income", "Wages & Tips"],
    ["Income", "Income", "Interest Income"],
    ["Income", "Income", "Dividends"],
    ["Income", "Income", "Gifts Received"],
    ["Income", "Income", "Refunds / Reimbursements"],
    ["Income", "Income", "Financial Aid"],
    ["Income", "Income", "Rental Income"],
    ["Income", "Income", "Other Income"],
    ["Expense", "Home", "Mortgage / Rent"],
    ["Expense", "Home", "Home Insurance"],
    ["Expense", "Home", "Electricity"],
    ["Expense", "Home", "Gas / Oil"],
    ["Expense", "Home", "Water / Sewer / Trash"],
    ["Expense", "Home", "Phone"],
    ["Expense", "Home", "Cable / Satellite"],
    ["Expense", "Home", "Internet"],
    ["Expense", "Home", "Furnishings / Appliances"],
    ["Expense", "Home", "Lawn / Garden"],
    ["Expense", "Home", "Maintenance / Supplies"],
    ["Expense", "Home", "Home Improvements"],
    ["Expense", "Home", "Home Supplies"],
    ["Expense", "Home", "Home - Other"],
    ["Expense", "Transportation", "Vehicle / Car Payment"],
    ["Expense", "Transportation", "Auto Insurance"],
    ["Expense", "Transportation", "Fuel"],
    ["Expense", "Transportation", "Bus / Taxi / Train Fare"],
    ["Expense", "Transportation", "Car Repair / Licenses"],
    ["Expense", "Transportation", "Car Replacement Fund"],
    ["Expense", "Transportation", "Transportation - Other"],
    ["Expense", "Health", "Health Insurance"],
    ["Expense", "Health", "Doctor / Dentist"],
    ["Expense", "Health", "Medicine / Drugs"],
    ["Expense", "Health", "Health Club Dues"],
    ["Expense", "Health", "Life Insurance"],
    ["Expense", "Health", "Veterinarian / Pet Care"],
    ["Expense", "Health", "Health - Other"],
    ["Expense", "Family & Care", "Child Care"],
    ["Expense", "Family & Care", "Education / Lessons"],
    ["Expense", "Family & Care", "Family - Other"],
    ["Expense", "Charity & Gifts", "Gifts Given"],
    ["Expense", "Charity & Gifts", "Charitable Donations"],
    ["Expense", "Charity & Gifts", "Religious Donations"],
    ["Expense", "Charity & Gifts", "Charity / Gifts - Other"],
    ["Expense", "Daily Living", "Groceries"],
    ["Expense", "Daily Living", "Personal Supplies"],
    ["Expense", "Daily Living", "Clothing"],
    ["Expense", "Daily Living", "Cleaning"],
    ["Expense", "Daily Living", "Dining / Eating Out"],
    ["Expense", "Daily Living", "Salon / Barber"],
    ["Expense", "Daily Living", "Pet Food"],
    ["Expense", "Daily Living", "Daily Living - Other"],
    ["Expense", "Entertainment", "Activities"],
    ["Expense", "Entertainment", "Books"],
    ["Expense", "Entertainment", "Games"],
    ["Expense", "Entertainment", "Hobbies"],
    ["Expense", "Entertainment", "Media / Subscriptions"],
    ["Expense", "Entertainment", "Outdoor Recreation"],
    ["Expense", "Entertainment", "Sports"],
    ["Expense", "Entertainment", "Toys / Gadgets"],
    ["Expense", "Entertainment", "Vacation / Travel"],
    ["Expense", "Entertainment", "Fun / Entertainment"],
    ["Expense", "Entertainment", "Entertainment - Other"],
    ["Expense", "Obligations", "Student Loans"],
    ["Expense", "Obligations", "Credit Card Debt"],
    ["Expense", "Obligations", "Other Loans"],
    ["Expense", "Obligations", "Alimony / Child Support"],
    ["Expense", "Obligations", "Federal Taxes"],
    ["Expense", "Obligations", "State / Local Taxes"],
    ["Expense", "Obligations", "Interest Expense"],
    ["Expense", "Obligations", "Debt Payment - Other"],
    ["Expense", "Subscriptions", "Newspaper"],
    ["Expense", "Subscriptions", "Magazines"],
    ["Expense", "Subscriptions", "Dues / Memberships"],
    ["Expense", "Subscriptions", "Subscriptions - Other"],
    ["Expense", "Utilities", "Utilities - Electricity"],
    ["Expense", "Utilities", "Utilities - Gas"],
    ["Expense", "Utilities", "Utilities - Phone"],
    ["Expense", "Utilities", "Utilities - TV / Internet"],
    ["Expense", "Utilities", "Utilities - Water"],
    ["Expense", "Miscellaneous", "Bank Fees"],
    ["Expense", "Miscellaneous", "Postage"],
    ["Expense", "Miscellaneous", "Discretionary"],
    ["Expense", "Miscellaneous", "Miscellaneous - Other"],
    ["Transfer", "Savings Goals", "Emergency Fund Transfer"],
    ["Transfer", "Savings Goals", "Car Replacement Transfer"],
    ["Transfer", "Savings Goals", "Retirement Fund Transfer"],
    ["Transfer", "Savings Goals", "Investment Transfer"],
    ["Transfer", "Savings Goals", "Education Fund Transfer"],
    ["Transfer", "Savings Goals", "Other Savings Transfer"],
    ["Transfer", "Account Transfer", "Account Transfer"],
  ];

  const numCats = CATEGORIES_DATA.length;
  const firstBgRow = 4;
  const lastBgRow = 3 + numCats;
  const lastCatRow = 3 + numCats;

  // ==========================================
  // 1. WORKSHEET: Overview
  // ==========================================
  const wsOv = workbook.addWorksheet("Overview", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 0, ySplit: 3 }],
  });

  // Title Banner
  wsOv.mergeCells("A1:F1");
  const ovTitle = wsOv.getCell("A1");
  ovTitle.value = "PERSONAL FINANCE — CONSOLIDATED OVERVIEW";
  ovTitle.font = fontTitle;
  ovTitle.fill = fillTitle;
  ovTitle.alignment = alignCenter;
  wsOv.getRow(1).height = 36;

  // Statement date & Selected year
  wsOv.getCell("A2").value = "Statement date";
  wsOv.getCell("A2").font = fontBold;
  wsOv.getCell("A2").alignment = alignLeft;

  wsOv.getCell("B2").value = statementDateStr;
  wsOv.getCell("B2").font = fontInput;
  wsOv.getCell("B2").fill = fillInput;
  wsOv.getCell("B2").border = borderInput;
  wsOv.getCell("B2").numFmt = "YYYY-MM-DD";
  wsOv.getCell("B2").alignment = alignCenter;

  wsOv.getCell("A3").value = "Selected year";
  wsOv.getCell("A3").font = fontBold;
  wsOv.getCell("A3").alignment = alignLeft;

  wsOv.getCell("B3").value = statementYear;
  wsOv.getCell("B3").font = fontInput;
  wsOv.getCell("B3").fill = fillInput;
  wsOv.getCell("B3").border = borderInput;
  wsOv.getCell("B3").numFmt = "#,##0";
  wsOv.getCell("B3").alignment = alignCenter;

  // Section Headers
  wsOv.mergeCells("A5:B5");
  wsOv.getCell("A5").value = "PERIOD ACTIVITY — MONTH TO DATE";
  wsOv.getCell("A5").font = fontSection;
  wsOv.getCell("A5").fill = fillSection;
  wsOv.getCell("A5").alignment = alignLeft;
  wsOv.getRow(5).height = 24;

  wsOv.mergeCells("D5:E5");
  wsOv.getCell("D5").value = "FINANCIAL POSITION — AS OF STATEMENT DATE";
  wsOv.getCell("D5").font = fontSection;
  wsOv.getCell("D5").fill = fillSection;
  wsOv.getCell("D5").alignment = alignLeft;

  const ovMetrics = [
    {
      l1: "Income recorded",
      f1: 'SUMIFS(Transactions!I$4:I$500,Transactions!B$4:B$500,"Income",Transactions!A$4:A$500,">="&DATE(YEAR(B2),MONTH(B2),1),Transactions!A$4:A$500,"<="&B2)',
      fmt1: currencyIntFmt,
      l2: "Assets",
      f2: 'SUMIF(Accounts!C$4:C$30,"Asset",Accounts!E$4:E$30)',
      fmt2: currencyIntFmt,
    },
    {
      l1: "Expenses recorded",
      f1: 'SUMIFS(Transactions!I$4:I$500,Transactions!B$4:B$500,"Expense",Transactions!A$4:A$500,">="&DATE(YEAR(B2),MONTH(B2),1),Transactions!A$4:A$500,"<="&B2)',
      fmt1: currencyIntFmt,
      l2: "Liabilities",
      f2: 'SUMIF(Accounts!C$4:C$30,"Liability",Accounts!E$4:E$30)',
      fmt2: currencyIntFmt,
    },
    {
      l1: "Net cash flow",
      f1: "B6-B7",
      fmt1: currencyIntFmt,
      l2: "Net worth",
      f2: "E6+E7",
      fmt2: currencyIntFmt,
    },
    {
      l1: "Savings rate",
      f1: 'IF(B6>0,B8/B6,"n.a.")',
      fmt1: percentFmt,
      l2: "Accounts tracked",
      f2: "COUNTA(Accounts!A$4:A$30)-COUNTBLANK(Accounts!A$4:A$30)",
      fmt2: "#,##0",
    },
  ];

  ovMetrics.forEach((m, idx) => {
    const rowNum = 6 + idx;
    const cellA = wsOv.getCell(`A${rowNum}`);
    cellA.value = m.l1;
    cellA.font = fontRegular;
    cellA.fill = fillCard;
    cellA.border = borderCell;
    cellA.alignment = alignLeft;

    const cellB = wsOv.getCell(`B${rowNum}`);
    cellB.value = { formula: m.f1, result: 0 };
    cellB.font = fontBold;
    cellB.fill = fillCard;
    cellB.border = borderCell;
    cellB.numFmt = m.fmt1;
    cellB.alignment = alignRight;

    const cellD = wsOv.getCell(`D${rowNum}`);
    cellD.value = m.l2;
    cellD.font = fontRegular;
    cellD.fill = fillCard;
    cellD.border = borderCell;
    cellD.alignment = alignLeft;

    const cellE = wsOv.getCell(`E${rowNum}`);
    cellE.value = { formula: m.f2, result: 0 };
    cellE.font = fontBold;
    cellE.fill = fillCard;
    cellE.border = borderCell;
    cellE.numFmt = m.fmt2;
    cellE.alignment = alignRight;

    wsOv.getRow(rowNum).height = 22;
  });

  // Features
  wsOv.mergeCells("A11:E11");
  wsOv.getCell("A11").value = "ALL-IN-ONE FEATURES";
  wsOv.getCell("A11").font = fontSection;
  wsOv.getCell("A11").fill = fillSection;
  wsOv.getCell("A11").alignment = alignLeft;
  wsOv.getRow(11).height = 24;

  const features = [
    "• One transaction ledger with income, expenses and internal transfers",
    "• Account register with date-specific balances and asset/liability classification",
    "• Annual category budget with monthly plans, weekly targets and year-to-date actuals",
    "• Monthly and weekly actual-versus-budget reports, plus savings goal tracking",
  ];
  features.forEach((feat, idx) => {
    const rowNum = 12 + idx;
    wsOv.mergeCells(`A${rowNum}:E${rowNum}`);
    const c = wsOv.getCell(`A${rowNum}`);
    c.value = feat;
    c.font = fontRegular;
    c.alignment = alignLeft;
    wsOv.getRow(rowNum).height = 20;
  });

  // Guidance note
  wsOv.mergeCells("A17:E19");
  const cNote = wsOv.getCell("A17");
  cNote.value =
    "This is a consolidated corporate personal finance template. Enter your own opening balances on the Accounts tab " +
    "and transactions on the Transactions tab. Transfers between your own accounts and savings goals are excluded from " +
    "income/expense totals to preserve true operating cash flow.";
  cNote.font = fontNote;
  cNote.alignment = alignWrapLeft;
  cNote.fill = fillZebra;
  for (let r = 17; r <= 19; r++) {
    for (let c = 1; c <= 5; c++) {
      wsOv.getRow(r).getCell(c).border = borderCell;
    }
  }

  wsOv.getColumn("A").width = 24;
  wsOv.getColumn("B").width = 22;
  wsOv.getColumn("C").width = 6;
  wsOv.getColumn("D").width = 24;
  wsOv.getColumn("E").width = 22;
  wsOv.getColumn("F").width = 12;

  // ==========================================
  // 2. WORKSHEET: Transactions
  // ==========================================
  const wsTx = workbook.addWorksheet("Transactions", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 0, ySplit: 3 }],
  });

  wsTx.mergeCells("A1:J1");
  const txTitle = wsTx.getCell("A1");
  txTitle.value = "TRANSACTION LEDGER";
  txTitle.font = fontTitle;
  txTitle.fill = fillTitle;
  txTitle.alignment = alignCenter;
  wsTx.getRow(1).height = 36;

  wsTx.mergeCells("A2:J2");
  const txSub = wsTx.getCell("A2");
  txSub.value =
    "Filterable consolidated ledger. Enter Income, Expenses, and Transfers. Transfers between own accounts do not affect net income or expenses.";
  txSub.font = fontNote;
  txSub.fill = fillZebra;
  txSub.alignment = alignWrapLeft;
  for (let c = 1; c <= 10; c++) {
    wsTx.getRow(2).getCell(c).border = borderCell;
  }
  wsTx.getRow(2).height = 24;

  const txHeaders = [
    "Date",
    "Type",
    "Account",
    "Transfer To",
    "Category",
    "Payee / Description",
    "Reference",
    "Cleared",
    "Amount (₹)",
    "Notes",
  ];
  txHeaders.forEach((h, idx) => {
    const c = wsTx.getRow(3).getCell(idx + 1);
    c.value = h;
    c.font = fontTblHeader;
    c.fill = fillTblHeader;
    c.border = borderCell;
    c.alignment = idx === 8 ? alignRight : alignLeft;
  });
  wsTx.getRow(3).height = 26;

  // Populate actual transactions
  const totalLedgerRows = Math.max(100, filteredTransactions.length + 30);
  for (let i = 0; i < totalLedgerRows; i++) {
    const rowNum = 4 + i;
    const hasTx = i < filteredTransactions.length;
    const tx = hasTx ? filteredTransactions[i] : null;

    const cellA = wsTx.getCell(`A${rowNum}`);
    if (tx && tx.date) {
      cellA.value = tx.date.slice(0, 10);
    }
    cellA.numFmt = "YYYY-MM-DD";
    cellA.alignment = alignCenter;

    const cellB = wsTx.getCell(`B${rowNum}`);
    if (tx) {
      cellB.value = tx.type === "income" ? "Income" : (tx.type as string) === "transfer" ? "Transfer" : "Expense";
    }
    cellB.alignment = alignLeft;
    cellB.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Income,Expense,Transfer"'],
    };

    const cellC = wsTx.getCell(`C${rowNum}`);
    if (tx) {
      cellC.value = tx.account || (tx.type === "expense" ? "Credit Card" : "Checking");
    }
    cellC.alignment = alignLeft;
    cellC.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["=Accounts!$A$4:$A$25"],
    };

    const cellD = wsTx.getCell(`D${rowNum}`);
    cellD.alignment = alignLeft;
    cellD.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["=Accounts!$A$4:$A$25"],
    };

    const cellE = wsTx.getCell(`E${rowNum}`);
    if (tx) {
      cellE.value = tx.category || (tx.type === "income" ? "Other Income" : "Miscellaneous - Other");
    }
    cellE.alignment = alignLeft;
    cellE.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`=Categories!$C$4:$C$${lastCatRow}`],
    };

    const cellF = wsTx.getCell(`F${rowNum}`);
    if (tx) {
      cellF.value = tx.title || tx.description || "";
    }
    cellF.alignment = alignLeft;

    const cellG = wsTx.getCell(`G${rowNum}`);
    if (tx) {
      cellG.value = tx.id ? `TX-${tx.id}` : "";
    }
    cellG.alignment = alignCenter;

    const cellH = wsTx.getCell(`H${rowNum}`);
    if (tx) {
      cellH.value = "Cleared";
    }
    cellH.alignment = alignLeft;
    cellH.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Cleared,Pending,Reconciled"'],
    };

    const cellI = wsTx.getCell(`I${rowNum}`);
    if (tx) {
      cellI.value = tx.amount;
    }
    cellI.numFmt = currencyNumFmt;
    cellI.alignment = alignRight;

    const cellJ = wsTx.getCell(`J${rowNum}`);
    cellJ.alignment = alignLeft;

    for (let c = 1; c <= 10; c++) {
      const cell = wsTx.getRow(rowNum).getCell(c);
      cell.font = fontRegular;
      cell.border = borderCell;
      if (rowNum % 2 === 0) {
        cell.fill = fillZebra;
      }
    }
    wsTx.getRow(rowNum).height = 20;
  }

  wsTx.autoFilter = { from: "A3", to: `J${3 + totalLedgerRows}` };
  wsTx.getColumn("A").width = 14;
  wsTx.getColumn("B").width = 14;
  wsTx.getColumn("C").width = 18;
  wsTx.getColumn("D").width = 18;
  wsTx.getColumn("E").width = 30;
  wsTx.getColumn("F").width = 32;
  wsTx.getColumn("G").width = 16;
  wsTx.getColumn("H").width = 14;
  wsTx.getColumn("I").width = 18;
  wsTx.getColumn("J").width = 28;

  // ==========================================
  // 3. WORKSHEET: Accounts
  // ==========================================
  const wsAcc = workbook.addWorksheet("Accounts", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 0, ySplit: 3 }],
  });

  wsAcc.mergeCells("A1:E1");
  const accTitle = wsAcc.getCell("A1");
  accTitle.value = "ACCOUNTS REGISTER & BALANCES";
  accTitle.font = fontTitle;
  accTitle.fill = fillTitle;
  accTitle.alignment = alignCenter;
  wsAcc.getRow(1).height = 36;

  wsAcc.mergeCells("A2:E2");
  const accSub = wsAcc.getCell("A2");
  accSub.value =
    "Enter asset balances as positive and liability balances as negative. Current balances update from transactions through the Overview statement date. Transfers reduce the source account and increase the destination account.";
  accSub.font = fontNote;
  accSub.fill = fillZebra;
  accSub.alignment = alignWrapLeft;
  for (let c = 1; c <= 5; c++) {
    wsAcc.getRow(2).getCell(c).border = borderCell;
  }
  wsAcc.getRow(2).height = 26;

  const accHeaders = [
    "Account Name",
    "Account Type",
    "Classification",
    "Opening Balance (₹)",
    "Balance at Statement Date (₹)",
  ];
  accHeaders.forEach((h, idx) => {
    const c = wsAcc.getRow(3).getCell(idx + 1);
    c.value = h;
    c.font = fontTblHeader;
    c.fill = fillTblHeader;
    c.border = borderCell;
    c.alignment = idx >= 3 ? alignRight : alignLeft;
  });
  wsAcc.getRow(3).height = 26;

  // Pre-seed accounts + user's actual accounts from assets / liabilities
  const accountsList: [string, string, string, number][] = [
    ["Cash", "Cash", "Asset", 0],
    ["Checking", "Checking", "Asset", 0],
    ["Savings", "Savings", "Asset", 0],
    ["Credit Card", "Credit Card", "Liability", 0],
  ];

  if (data.assets && data.assets.length > 0) {
    data.assets.forEach((a) => {
      if (!accountsList.some((acc) => acc[0].toLowerCase() === a.name.toLowerCase())) {
        accountsList.push([a.name, a.type || "Asset", "Asset", a.value || 0]);
      }
    });
  }
  if (data.liabilities && data.liabilities.length > 0) {
    data.liabilities.forEach((l) => {
      if (!accountsList.some((acc) => acc[0].toLowerCase() === l.name.toLowerCase())) {
        accountsList.push([l.name, l.type || "Liability", "Liability", -(l.amount || 0)]);
      }
    });
  }

  for (let idx = 4; idx <= 25; idx++) {
    const listIdx = idx - 4;
    const isSeeded = listIdx < accountsList.length;
    const accItem = isSeeded ? accountsList[listIdx] : null;

    wsAcc.getCell(`A${idx}`).value = accItem ? accItem[0] : "";
    wsAcc.getCell(`A${idx}`).font = isSeeded ? fontBold : fontRegular;
    wsAcc.getCell(`A${idx}`).alignment = alignLeft;

    const cellB = wsAcc.getCell(`B${idx}`);
    cellB.value = accItem ? accItem[1] : "";
    cellB.font = fontRegular;
    cellB.alignment = alignLeft;
    cellB.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Cash,Checking,Savings,Credit Card,Investment,Loan,Mortgage,Other Asset,Other Liability"'],
    };

    const cellC = wsAcc.getCell(`C${idx}`);
    cellC.value = accItem ? accItem[2] : "";
    cellC.font = fontRegular;
    cellC.alignment = alignLeft;
    cellC.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Asset,Liability"'],
    };

    const cellD = wsAcc.getCell(`D${idx}`);
    cellD.value = accItem ? accItem[3] : "";
    cellD.font = fontInput;
    cellD.fill = fillInput;
    cellD.numFmt = currencyNumFmt;
    cellD.alignment = alignRight;

    const cellE = wsAcc.getCell(`E${idx}`);
    const formulaBal =
      `IF(A${idx}="","",D${idx}` +
      `+SUMIFS(Transactions!I$4:I$500,Transactions!C$4:C$500,A${idx},Transactions!B$4:B$500,"Income",Transactions!A$4:A$500,"<="&Overview!$B$2,Transactions!A$4:A$500,">0")` +
      `+SUMIFS(Transactions!I$4:I$500,Transactions!D$4:D$500,A${idx},Transactions!B$4:B$500,"Transfer",Transactions!A$4:A$500,"<="&Overview!$B$2,Transactions!A$4:A$500,">0")` +
      `-SUMIFS(Transactions!I$4:I$500,Transactions!C$4:C$500,A${idx},Transactions!B$4:B$500,"Expense",Transactions!A$4:A$500,"<="&Overview!$B$2,Transactions!A$4:A$500,">0")` +
      `-SUMIFS(Transactions!I$4:I$500,Transactions!C$4:C$500,A${idx},Transactions!B$4:B$500,"Transfer",Transactions!A$4:A$500,"<="&Overview!$B$2,Transactions!A$4:A$500,">0"))`;
    cellE.value = { formula: formulaBal, result: 0 };
    cellE.font = fontBold;
    cellE.numFmt = currencyNumFmt;
    cellE.alignment = alignRight;

    for (let c = 1; c <= 5; c++) {
      const cell = wsAcc.getRow(idx).getCell(c);
      cell.border = borderCell;
      if (idx % 2 === 0 && c !== 4) {
        cell.fill = fillZebra;
      }
    }
    wsAcc.getRow(idx).height = 22;
  }

  // Summary Totals on Accounts
  wsAcc.mergeCells("A26:D26");
  wsAcc.getCell("A26").value = "TOTAL ASSETS";
  wsAcc.getCell("A26").font = fontTotal;
  wsAcc.getCell("A26").fill = fillTotal;
  wsAcc.getCell("A26").alignment = alignLeft;
  wsAcc.getCell("E26").value = { formula: 'SUMIF(C4:C25,"Asset",E4:E25)', result: 0 };
  wsAcc.getCell("E26").font = fontTotal;
  wsAcc.getCell("E26").fill = fillTotal;
  wsAcc.getCell("E26").numFmt = currencyNumFmt;
  wsAcc.getCell("E26").alignment = alignRight;
  for (let c = 1; c <= 5; c++) wsAcc.getRow(26).getCell(c).border = borderTotal;
  wsAcc.getRow(26).height = 24;

  wsAcc.mergeCells("A27:D27");
  wsAcc.getCell("A27").value = "TOTAL LIABILITIES (Signed Negative)";
  wsAcc.getCell("A27").font = fontTotal;
  wsAcc.getCell("A27").fill = fillTotal;
  wsAcc.getCell("A27").alignment = alignLeft;
  wsAcc.getCell("E27").value = { formula: 'SUMIF(C4:C25,"Liability",E4:E25)', result: 0 };
  wsAcc.getCell("E27").font = fontTotal;
  wsAcc.getCell("E27").fill = fillTotal;
  wsAcc.getCell("E27").numFmt = currencyNumFmt;
  wsAcc.getCell("E27").alignment = alignRight;
  for (let c = 1; c <= 5; c++) wsAcc.getRow(27).getCell(c).border = borderTotal;
  wsAcc.getRow(27).height = 24;

  wsAcc.mergeCells("A28:D28");
  wsAcc.getCell("A28").value = "NET LIQUID POSITION (ASSETS + LIABILITIES)";
  wsAcc.getCell("A28").font = fontTotal;
  wsAcc.getCell("A28").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  wsAcc.getCell("A28").alignment = alignLeft;
  wsAcc.getCell("E28").value = { formula: "E26+E27", result: 0 };
  wsAcc.getCell("E28").font = fontTotal;
  wsAcc.getCell("E28").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  wsAcc.getCell("E28").numFmt = currencyNumFmt;
  wsAcc.getCell("E28").alignment = alignRight;
  for (let c = 1; c <= 5; c++) wsAcc.getRow(28).getCell(c).border = borderTotal;
  wsAcc.getRow(28).height = 26;

  wsAcc.getColumn("A").width = 24;
  wsAcc.getColumn("B").width = 20;
  wsAcc.getColumn("C").width = 18;
  wsAcc.getColumn("D").width = 24;
  wsAcc.getColumn("E").width = 30;

  // ==========================================
  // 4. WORKSHEET: Budget
  // ==========================================
  const wsBg = workbook.addWorksheet("Budget", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 2, ySplit: 3 }],
  });

  wsBg.mergeCells("A1:R1");
  const bgTitle = wsBg.getCell("A1");
  bgTitle.value = "ANNUAL BUDGET & CASH FLOW PLAN";
  bgTitle.font = fontTitle;
  bgTitle.fill = fillTitle;
  bgTitle.alignment = alignCenter;
  wsBg.getRow(1).height = 36;

  wsBg.mergeCells("A2:R2");
  const bgSub = wsBg.getCell("A2");
  bgSub.value =
    "Enter monthly plans or weekly target. Actual YTD calculates from Transactions for Selected Year on Overview. Budget remaining = Plan - Actual.";
  bgSub.font = fontNote;
  bgSub.fill = fillZebra;
  bgSub.alignment = alignWrapLeft;
  for (let c = 1; c <= 18; c++) wsBg.getRow(2).getCell(c).border = borderCell;
  wsBg.getRow(2).height = 24;

  const budgetMonthCols: string[] = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];

  const bgHeaders = [
    "Category",
    "Type",
    "Weekly Plan (₹)",
    "Jan (₹)",
    "Feb (₹)",
    "Mar (₹)",
    "Apr (₹)",
    "May (₹)",
    "Jun (₹)",
    "Jul (₹)",
    "Aug (₹)",
    "Sep (₹)",
    "Oct (₹)",
    "Nov (₹)",
    "Dec (₹)",
    "Annual Plan (₹)",
    "Actual YTD (₹)",
    "Budget Remaining (₹)",
  ];
  bgHeaders.forEach((h, idx) => {
    const c = wsBg.getRow(3).getCell(idx + 1);
    c.value = h;
    c.font = fontTblHeader;
    c.fill = fillTblHeader;
    c.border = borderCell;
    c.alignment = idx >= 2 ? alignRight : alignLeft;
  });
  wsBg.getRow(3).height = 26;

  CATEGORIES_DATA.forEach(([tType, , tCat], catIdx) => {
    const rowNum = firstBgRow + catIdx;
    wsBg.getCell(`A${rowNum}`).value = tCat;
    wsBg.getCell(`A${rowNum}`).font = fontBold;
    wsBg.getCell(`A${rowNum}`).alignment = alignLeft;

    wsBg.getCell(`B${rowNum}`).value = tType;
    wsBg.getCell(`B${rowNum}`).font = fontRegular;
    wsBg.getCell(`B${rowNum}`).alignment = alignLeft;

    // Col C: Weekly Plan
    const cellC = wsBg.getCell(`C${rowNum}`);
    cellC.numFmt = currencyIntFmt;
    cellC.font = fontInput;
    cellC.fill = fillInput;
    cellC.alignment = alignRight;

    // Check if user has budget configured
    const userBudget = data.budgets?.find(
      (b) => ((b as any).category && (b as any).category.toLowerCase() === tCat.toLowerCase()) || (b.name && b.name.toLowerCase() === tCat.toLowerCase())
    );
    const monthlyLimit = userBudget ? Math.round(userBudget.limit) : undefined;

    // Col D..O: Jan..Dec
    budgetMonthCols.forEach((colLetter) => {
      const cellM = wsBg.getCell(`${colLetter}${rowNum}`);
      if (monthlyLimit !== undefined) {
        cellM.value = monthlyLimit;
      }
      cellM.numFmt = currencyIntFmt;
      cellM.font = fontRegular;
      cellM.alignment = alignRight;
    });

    // Col P: Annual Plan
    const cellP = wsBg.getCell(`P${rowNum}`);
    cellP.value = { formula: `SUM(D${rowNum}:O${rowNum})`, result: monthlyLimit ? monthlyLimit * 12 : 0 };
    cellP.numFmt = currencyIntFmt;
    cellP.font = fontBold;
    cellP.alignment = alignRight;

    // Col Q: Actual YTD
    const cellQ = wsBg.getCell(`Q${rowNum}`);
    cellQ.value = {
      formula:
        `SUMIFS(Transactions!I$4:I$500,Transactions!E$4:E$500,A${rowNum},` +
        `Transactions!A$4:A$500,">="&DATE(Overview!$B$3,1,1),` +
        `Transactions!A$4:A$500,"<="&DATE(Overview!$B$3,12,31))`,
      result: 0,
    };
    cellQ.numFmt = currencyIntFmt;
    cellQ.font = fontBold;
    cellQ.alignment = alignRight;

    // Col R: Budget Remaining
    const cellR = wsBg.getCell(`R${rowNum}`);
    cellR.value = {
      formula: `IF(B${rowNum}="Income",Q${rowNum}-P${rowNum},P${rowNum}-Q${rowNum})`,
      result: 0,
    };
    cellR.numFmt = currencyIntFmt;
    cellR.font = fontBold;
    cellR.alignment = alignRight;

    for (let c = 1; c <= 18; c++) {
      const cell = wsBg.getRow(rowNum).getCell(c);
      cell.border = borderCell;
      if (rowNum % 2 === 0 && c !== 3) {
        cell.fill = fillZebra;
      }
    }
    wsBg.getRow(rowNum).height = 20;
  });

  // Summary Totals on Budget
  const rInc = lastBgRow + 1;
  wsBg.mergeCells(`A${rInc}:B${rInc}`);
  wsBg.getCell(`A${rInc}`).value = "TOTAL INCOME";
  wsBg.getCell(`A${rInc}`).font = fontTotal;
  wsBg.getCell(`A${rInc}`).fill = fillTotal;
  wsBg.getCell(`A${rInc}`).alignment = alignLeft;

  const bgCols = ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
  bgCols.forEach((colLetter) => {
    const c = wsBg.getCell(`${colLetter}${rInc}`);
    c.value = {
      formula: `SUMIF($B$4:$B$${lastBgRow},"Income",${colLetter}4:${colLetter}${lastBgRow})`,
      result: 0,
    };
    c.font = fontTotal;
    c.fill = fillTotal;
    c.border = borderTotal;
    c.numFmt = currencyIntFmt;
    c.alignment = alignRight;
  });
  wsBg.getRow(rInc).height = 24;

  const rExp = rInc + 1;
  wsBg.mergeCells(`A${rExp}:B${rExp}`);
  wsBg.getCell(`A${rExp}`).value = "TOTAL EXPENSES";
  wsBg.getCell(`A${rExp}`).font = fontTotal;
  wsBg.getCell(`A${rExp}`).fill = fillTotal;
  wsBg.getCell(`A${rExp}`).alignment = alignLeft;

  bgCols.forEach((colLetter) => {
    const c = wsBg.getCell(`${colLetter}${rExp}`);
    c.value = {
      formula: `SUMIF($B$4:$B$${lastBgRow},"Expense",${colLetter}4:${colLetter}${lastBgRow})`,
      result: 0,
    };
    c.font = fontTotal;
    c.fill = fillTotal;
    c.border = borderTotal;
    c.numFmt = currencyIntFmt;
    c.alignment = alignRight;
  });
  wsBg.getRow(rExp).height = 24;

  const rNet = rExp + 1;
  wsBg.mergeCells(`A${rNet}:B${rNet}`);
  wsBg.getCell(`A${rNet}`).value = "NET OPERATING SURPLUS / (DEFICIT)";
  wsBg.getCell(`A${rNet}`).font = fontTotal;
  wsBg.getCell(`A${rNet}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  wsBg.getCell(`A${rNet}`).alignment = alignLeft;

  bgCols.forEach((colLetter) => {
    const c = wsBg.getCell(`${colLetter}${rNet}`);
    c.value = {
      formula: `${colLetter}${rInc}-${colLetter}${rExp}`,
      result: 0,
    };
    c.font = fontTotal;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    c.border = borderTotal;
    c.numFmt = currencyIntFmt;
    c.alignment = alignRight;
  });
  wsBg.getRow(rNet).height = 26;

  const rTrf = rNet + 1;
  wsBg.mergeCells(`A${rTrf}:B${rTrf}`);
  wsBg.getCell(`A${rTrf}`).value = "TOTAL TRANSFERS (Excluded from Operating Cash Flow)";
  wsBg.getCell(`A${rTrf}`).font = fontMuted;
  wsBg.getCell(`A${rTrf}`).fill = fillCard;
  wsBg.getCell(`A${rTrf}`).alignment = alignLeft;

  bgCols.forEach((colLetter) => {
    const c = wsBg.getCell(`${colLetter}${rTrf}`);
    c.value = {
      formula: `SUMIF($B$4:$B$${lastBgRow},"Transfer",${colLetter}4:${colLetter}${lastBgRow})`,
      result: 0,
    };
    c.font = fontBold;
    c.fill = fillCard;
    c.border = borderCell;
    c.numFmt = currencyIntFmt;
    c.alignment = alignRight;
  });
  wsBg.getRow(rTrf).height = 22;

  wsBg.getColumn("A").width = 28;
  wsBg.getColumn("B").width = 14;
  wsBg.getColumn("C").width = 16;
  budgetMonthCols.forEach((colLetter) => {
    wsBg.getColumn(colLetter).width = 14;
  });
  wsBg.getColumn("P").width = 18;
  wsBg.getColumn("Q").width = 18;
  wsBg.getColumn("R").width = 20;

  // ==========================================
  // 5. WORKSHEET: Monthly Report
  // ==========================================
  const wsMr = workbook.addWorksheet("Monthly Report", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 0, ySplit: 5 }],
  });

  wsMr.mergeCells("A1:E1");
  const mrTitle = wsMr.getCell("A1");
  mrTitle.value = "MONTHLY BUDGET AND ACTUAL REPORT";
  mrTitle.font = fontTitle;
  mrTitle.fill = fillTitle;
  mrTitle.alignment = alignCenter;
  wsMr.getRow(1).height = 36;

  wsMr.getCell("A2").value = "Report month";
  wsMr.getCell("A2").font = fontBold;
  wsMr.getCell("A2").alignment = alignLeft;

  wsMr.getCell("B2").value = statementMonthStart;
  wsMr.getCell("B2").font = fontInput;
  wsMr.getCell("B2").fill = fillInput;
  wsMr.getCell("B2").border = borderInput;
  wsMr.getCell("B2").numFmt = "YYYY-MM-DD";
  wsMr.getCell("B2").alignment = alignCenter;

  wsMr.mergeCells("A3:E3");
  const mrSub = wsMr.getCell("A3");
  mrSub.value =
    "Values in INR (₹). Actuals include the full selected calendar month; transfers are excluded from operating cash flow.";
  mrSub.font = fontNote;
  mrSub.fill = fillZebra;
  mrSub.alignment = alignWrapLeft;
  for (let c = 1; c <= 5; c++) wsMr.getRow(3).getCell(c).border = borderCell;
  wsMr.getRow(3).height = 24;

  const mrHeaders = ["Type", "Category", "Budget (₹)", "Actual (₹)", "Variance (₹)"];
  mrHeaders.forEach((h, idx) => {
    const c = wsMr.getRow(5).getCell(idx + 1);
    c.value = h;
    c.font = fontTblHeader;
    c.fill = fillTblHeader;
    c.border = borderCell;
    c.alignment = idx >= 2 ? alignRight : alignLeft;
  });
  wsMr.getRow(5).height = 26;

  const firstMrRow = 6;
  const lastMrRow = 5 + numCats;

  CATEGORIES_DATA.forEach(([tType, , tCat], catIdx) => {
    const rowNum = firstMrRow + catIdx;
    wsMr.getCell(`A${rowNum}`).value = tType;
    wsMr.getCell(`A${rowNum}`).font = fontRegular;
    wsMr.getCell(`A${rowNum}`).alignment = alignLeft;

    wsMr.getCell(`B${rowNum}`).value = tCat;
    wsMr.getCell(`B${rowNum}`).font = fontBold;
    wsMr.getCell(`B${rowNum}`).alignment = alignLeft;

    // Budget pulled dynamically from Budget sheet based on MONTH($B$2)
    const cellC = wsMr.getCell(`C${rowNum}`);
    cellC.value = {
      formula: `INDEX(Budget!D$4:O$${lastBgRow},MATCH(B${rowNum},Budget!A$4:A$${lastBgRow},0),MONTH(B$2))`,
      result: 0,
    };
    cellC.font = fontRegular;
    cellC.numFmt = currencyIntFmt;
    cellC.alignment = alignRight;

    // Actual from Transactions for that category & month
    const cellD = wsMr.getCell(`D${rowNum}`);
    cellD.value = {
      formula:
        `SUMIFS(Transactions!I$4:I$500,Transactions!E$4:E$500,B${rowNum},` +
        `Transactions!A$4:A$500,">="&B$2,Transactions!A$4:A$500,"<="&EOMONTH(B$2,0))`,
      result: 0,
    };
    cellD.font = fontBold;
    cellD.numFmt = currencyIntFmt;
    cellD.alignment = alignRight;

    // Variance
    const cellE = wsMr.getCell(`E${rowNum}`);
    cellE.value = {
      formula: `IF(A${rowNum}="Income",D${rowNum}-C${rowNum},C${rowNum}-D${rowNum})`,
      result: 0,
    };
    cellE.font = fontBold;
    cellE.numFmt = currencyIntFmt;
    cellE.alignment = alignRight;

    for (let c = 1; c <= 5; c++) {
      const cell = wsMr.getRow(rowNum).getCell(c);
      cell.border = borderCell;
      if (rowNum % 2 === 0) cell.fill = fillZebra;
    }
    wsMr.getRow(rowNum).height = 20;
  });

  const rMrNet = lastMrRow + 1;
  wsMr.mergeCells(`A${rMrNet}:B${rMrNet}`);
  wsMr.getCell(`A${rMrNet}`).value = "NET OPERATING CASH FLOW (Transfers excluded)";
  wsMr.getCell(`A${rMrNet}`).font = fontTotal;
  wsMr.getCell(`A${rMrNet}`).fill = fillTotal;
  wsMr.getCell(`A${rMrNet}`).alignment = alignLeft;

  wsMr.getCell(`C${rMrNet}`).value = {
    formula: `SUMIFS(C6:C${lastMrRow},A6:A${lastMrRow},"Income")-SUMIFS(C6:C${lastMrRow},A6:A${lastMrRow},"Expense")`,
    result: 0,
  };
  wsMr.getCell(`C${rMrNet}`).font = fontTotal;
  wsMr.getCell(`C${rMrNet}`).fill = fillTotal;
  wsMr.getCell(`C${rMrNet}`).border = borderTotal;
  wsMr.getCell(`C${rMrNet}`).numFmt = currencyIntFmt;
  wsMr.getCell(`C${rMrNet}`).alignment = alignRight;

  wsMr.getCell(`D${rMrNet}`).value = {
    formula: `SUMIFS(D6:D${lastMrRow},A6:A${lastMrRow},"Income")-SUMIFS(D6:D${lastMrRow},A6:A${lastMrRow},"Expense")`,
    result: 0,
  };
  wsMr.getCell(`D${rMrNet}`).font = fontTotal;
  wsMr.getCell(`D${rMrNet}`).fill = fillTotal;
  wsMr.getCell(`D${rMrNet}`).border = borderTotal;
  wsMr.getCell(`D${rMrNet}`).numFmt = currencyIntFmt;
  wsMr.getCell(`D${rMrNet}`).alignment = alignRight;

  wsMr.getCell(`E${rMrNet}`).value = {
    formula: `D${rMrNet}-C${rMrNet}`,
    result: 0,
  };
  wsMr.getCell(`E${rMrNet}`).font = fontTotal;
  wsMr.getCell(`E${rMrNet}`).fill = fillTotal;
  wsMr.getCell(`E${rMrNet}`).border = borderTotal;
  wsMr.getCell(`E${rMrNet}`).numFmt = currencyIntFmt;
  wsMr.getCell(`E${rMrNet}`).alignment = alignRight;
  wsMr.getRow(rMrNet).height = 26;

  wsMr.getColumn("A").width = 16;
  wsMr.getColumn("B").width = 30;
  wsMr.getColumn("C").width = 20;
  wsMr.getColumn("D").width = 20;
  wsMr.getColumn("E").width = 20;

  // ==========================================
  // 6. WORKSHEET: Weekly Report
  // ==========================================
  const wsWr = workbook.addWorksheet("Weekly Report", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 0, ySplit: 5 }],
  });

  wsWr.mergeCells("A1:E1");
  const wrTitle = wsWr.getCell("A1");
  wrTitle.value = "WEEKLY BUDGET AND ACTUAL REPORT";
  wrTitle.font = fontTitle;
  wrTitle.fill = fillTitle;
  wrTitle.alignment = alignCenter;
  wsWr.getRow(1).height = 36;

  // Week begins & Week ends
  wsWr.getCell("A2").value = "Week begins";
  wsWr.getCell("A2").font = fontBold;
  wsWr.getCell("A2").alignment = alignLeft;

  wsWr.getCell("B2").value = startDate || "2026-10-19";
  wsWr.getCell("B2").font = fontInput;
  wsWr.getCell("B2").fill = fillInput;
  wsWr.getCell("B2").border = borderInput;
  wsWr.getCell("B2").numFmt = "YYYY-MM-DD";
  wsWr.getCell("B2").alignment = alignCenter;

  wsWr.getCell("C2").value = "Week ends";
  wsWr.getCell("C2").font = fontBold;
  wsWr.getCell("C2").alignment = alignLeft;

  wsWr.getCell("D2").value = endDate || "2026-10-25";
  wsWr.getCell("D2").font = fontInput;
  wsWr.getCell("D2").fill = fillInput;
  wsWr.getCell("D2").border = borderInput;
  wsWr.getCell("D2").numFmt = "YYYY-MM-DD";
  wsWr.getCell("D2").alignment = alignCenter;

  wsWr.mergeCells("A3:E3");
  const wrSub = wsWr.getCell("A3");
  wrSub.value =
    "Values in INR (₹). Weekly budget comes from the Budget tab. Actuals include both endpoint dates; transfers are excluded from operating cash flow.";
  wrSub.font = fontNote;
  wrSub.fill = fillZebra;
  wrSub.alignment = alignWrapLeft;
  for (let c = 1; c <= 5; c++) wsWr.getRow(3).getCell(c).border = borderCell;
  wsWr.getRow(3).height = 24;

  mrHeaders.forEach((h, idx) => {
    const c = wsWr.getRow(5).getCell(idx + 1);
    c.value = h;
    c.font = fontTblHeader;
    c.fill = fillTblHeader;
    c.border = borderCell;
    c.alignment = idx >= 2 ? alignRight : alignLeft;
  });
  wsWr.getRow(5).height = 26;

  const firstWrRow = 6;
  const lastWrRow = 5 + numCats;

  CATEGORIES_DATA.forEach(([tType, , tCat], catIdx) => {
    const rowNum = firstWrRow + catIdx;
    wsWr.getCell(`A${rowNum}`).value = tType;
    wsWr.getCell(`A${rowNum}`).font = fontRegular;
    wsWr.getCell(`A${rowNum}`).alignment = alignLeft;

    wsWr.getCell(`B${rowNum}`).value = tCat;
    wsWr.getCell(`B${rowNum}`).font = fontBold;
    wsWr.getCell(`B${rowNum}`).alignment = alignLeft;

    // Weekly Budget pulled from Budget Weekly Plan (Col C)
    const cellC = wsWr.getCell(`C${rowNum}`);
    cellC.value = {
      formula: `INDEX(Budget!C$4:C$${lastBgRow},MATCH(B${rowNum},Budget!A$4:A$${lastBgRow},0))`,
      result: 0,
    };
    cellC.numFmt = currencyIntFmt;
    cellC.font = fontRegular;
    cellC.alignment = alignRight;

    // Actual sum from Transactions for that category between $B$2 and $D$2
    const cellD = wsWr.getCell(`D${rowNum}`);
    cellD.value = {
      formula:
        `SUMIFS(Transactions!I$4:I$500,Transactions!E$4:E$500,B${rowNum},` +
        `Transactions!A$4:A$500,">="&B$2,Transactions!A$4:A$500,"<="&D$2)`,
      result: 0,
    };
    cellD.font = fontBold;
    cellD.numFmt = currencyIntFmt;
    cellD.alignment = alignRight;

    // Variance
    const cellE = wsWr.getCell(`E${rowNum}`);
    cellE.value = {
      formula: `IF(A${rowNum}="Income",D${rowNum}-C${rowNum},C${rowNum}-D${rowNum})`,
      result: 0,
    };
    cellE.font = fontBold;
    cellE.numFmt = currencyIntFmt;
    cellE.alignment = alignRight;

    for (let c = 1; c <= 5; c++) {
      const cell = wsWr.getRow(rowNum).getCell(c);
      cell.border = borderCell;
      if (rowNum % 2 === 0) cell.fill = fillZebra;
    }
    wsWr.getRow(rowNum).height = 20;
  });

  const rWrNet = lastWrRow + 1;
  wsWr.mergeCells(`A${rWrNet}:B${rWrNet}`);
  wsWr.getCell(`A${rWrNet}`).value = "NET OPERATING CASH FLOW (Transfers excluded)";
  wsWr.getCell(`A${rWrNet}`).font = fontTotal;
  wsWr.getCell(`A${rWrNet}`).fill = fillTotal;
  wsWr.getCell(`A${rWrNet}`).alignment = alignLeft;

  wsWr.getCell(`C${rWrNet}`).value = {
    formula: `SUMIFS(C6:C${lastWrRow},A6:A${lastWrRow},"Income")-SUMIFS(C6:C${lastWrRow},A6:A${lastWrRow},"Expense")`,
    result: 0,
  };
  wsWr.getCell(`C${rWrNet}`).font = fontTotal;
  wsWr.getCell(`C${rWrNet}`).fill = fillTotal;
  wsWr.getCell(`C${rWrNet}`).border = borderTotal;
  wsWr.getCell(`C${rWrNet}`).numFmt = currencyIntFmt;
  wsWr.getCell(`C${rWrNet}`).alignment = alignRight;

  wsWr.getCell(`D${rWrNet}`).value = {
    formula: `SUMIFS(D6:D${lastWrRow},A6:A${lastWrRow},"Income")-SUMIFS(D6:D${lastWrRow},A6:A${lastWrRow},"Expense")`,
    result: 0,
  };
  wsWr.getCell(`D${rWrNet}`).font = fontTotal;
  wsWr.getCell(`D${rWrNet}`).fill = fillTotal;
  wsWr.getCell(`D${rWrNet}`).border = borderTotal;
  wsWr.getCell(`D${rWrNet}`).numFmt = currencyIntFmt;
  wsWr.getCell(`D${rWrNet}`).alignment = alignRight;

  wsWr.getCell(`E${rWrNet}`).value = {
    formula: `D${rWrNet}-C${rWrNet}`,
    result: 0,
  };
  wsWr.getCell(`E${rWrNet}`).font = fontTotal;
  wsWr.getCell(`E${rWrNet}`).fill = fillTotal;
  wsWr.getCell(`E${rWrNet}`).border = borderTotal;
  wsWr.getCell(`E${rWrNet}`).numFmt = currencyIntFmt;
  wsWr.getCell(`E${rWrNet}`).alignment = alignRight;
  wsWr.getRow(rWrNet).height = 26;

  wsWr.getColumn("A").width = 16;
  wsWr.getColumn("B").width = 30;
  wsWr.getColumn("C").width = 20;
  wsWr.getColumn("D").width = 20;
  wsWr.getColumn("E").width = 20;

  // ==========================================
  // 7. WORKSHEET: Savings Goals
  // ==========================================
  const wsSg = workbook.addWorksheet("Savings Goals", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 0, ySplit: 3 }],
  });

  wsSg.mergeCells("A1:I1");
  const sgTitle = wsSg.getCell("A1");
  sgTitle.value = "SAVINGS GOALS & MILESTONES";
  sgTitle.font = fontTitle;
  sgTitle.fill = fillTitle;
  sgTitle.alignment = alignCenter;
  wsSg.getRow(1).height = 36;

  wsSg.mergeCells("A2:I2");
  const sgSub = wsSg.getCell("A2");
  sgSub.value =
    "Track milestones and capital accumulation. Linked accounts automatically pull live balances from the Accounts tab. Do not count linked goal accounts a second time as assets.";
  sgSub.font = fontNote;
  sgSub.fill = fillZebra;
  sgSub.alignment = alignWrapLeft;
  for (let c = 1; c <= 9; c++) wsSg.getRow(2).getCell(c).border = borderCell;
  wsSg.getRow(2).height = 24;

  const sgHeaders = [
    "Goal",
    "Target Amount (₹)",
    "Saved Manually (₹)",
    "Linked Account",
    "Saved Amount (₹)",
    "Remaining (₹)",
    "Progress",
    "Target Date",
    "Status",
  ];
  sgHeaders.forEach((h, idx) => {
    const c = wsSg.getRow(3).getCell(idx + 1);
    c.value = h;
    c.font = fontTblHeader;
    c.fill = fillTblHeader;
    c.border = borderCell;
    c.alignment = [1, 2, 4, 5, 6].includes(idx) ? alignRight : alignLeft;
  });
  wsSg.getRow(3).height = 26;

  // Populate goals: user's actual savingsGoals or defaults
  const goalsSeed: [string, number, number, string, string][] = [
    ["Emergency Fund", 0, 0, "", ""],
    ["Car Replacement", 0, 0, "", ""],
    ["Retirement Fund", 0, 0, "", ""],
    ["Education Fund", 0, 0, "", ""],
    ["Vacation", 0, 0, "", ""],
    ["Other Goal", 0, 0, "", ""],
  ];

  if (data.savingsGoals && data.savingsGoals.length > 0) {
    data.savingsGoals.forEach((g) => {
      const existing = goalsSeed.find((gs) => gs[0].toLowerCase() === g.name.toLowerCase());
      if (existing) {
        existing[1] = g.target || 0;
        existing[2] = g.saved || 0;
        existing[4] = g.deadline ? g.deadline.slice(0, 10) : "";
      } else {
        goalsSeed.push([g.name, g.target || 0, g.saved || 0, "", g.deadline ? g.deadline.slice(0, 10) : ""]);
      }
    });
  }

  for (let idx = 4; idx <= 20; idx++) {
    const listIdx = idx - 4;
    const isSeed = listIdx < goalsSeed.length;
    const goalItem = isSeed ? goalsSeed[listIdx] : null;

    wsSg.getCell(`A${idx}`).value = goalItem ? goalItem[0] : "";
    wsSg.getCell(`A${idx}`).font = isSeed ? fontBold : fontRegular;
    wsSg.getCell(`A${idx}`).alignment = alignLeft;

    const cellB = wsSg.getCell(`B${idx}`);
    cellB.value = goalItem ? goalItem[1] : "";
    cellB.font = fontInput;
    cellB.fill = fillInput;
    cellB.numFmt = currencyIntFmt;
    cellB.alignment = alignRight;

    const cellC = wsSg.getCell(`C${idx}`);
    cellC.value = goalItem ? goalItem[2] : "";
    cellC.font = fontInput;
    cellC.fill = fillInput;
    cellC.numFmt = currencyIntFmt;
    cellC.alignment = alignRight;

    const cellD = wsSg.getCell(`D${idx}`);
    cellD.value = goalItem ? goalItem[3] : "";
    cellD.font = fontRegular;
    cellD.alignment = alignLeft;
    cellD.dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["=Accounts!$A$4:$A$25"],
    };

    const cellE = wsSg.getCell(`E${idx}`);
    cellE.value = {
      formula: `IF(A${idx}="","",IF(D${idx}<>"",IFERROR(VLOOKUP(D${idx},Accounts!$A$4:$E$25,5,FALSE),C${idx}),C${idx}))`,
      result: goalItem ? goalItem[2] : 0,
    };
    cellE.font = fontBold;
    cellE.numFmt = currencyIntFmt;
    cellE.alignment = alignRight;

    const cellF = wsSg.getCell(`F${idx}`);
    cellF.value = {
      formula: `IF(A${idx}="","",MAX(0,B${idx}-E${idx}))`,
      result: 0,
    };
    cellF.font = fontRegular;
    cellF.numFmt = currencyIntFmt;
    cellF.alignment = alignRight;

    const cellG = wsSg.getCell(`G${idx}`);
    cellG.value = {
      formula: `IF(A${idx}="","",IF(B${idx}>0,MIN(1,E${idx}/B${idx}),0))`,
      result: 0,
    };
    cellG.font = fontBold;
    cellG.numFmt = percentFmt;
    cellG.alignment = alignRight;

    const cellH = wsSg.getCell(`H${idx}`);
    cellH.value = goalItem && goalItem[4] ? goalItem[4] : "";
    cellH.font = fontRegular;
    cellH.numFmt = "YYYY-MM-DD";
    cellH.alignment = alignCenter;

    const cellI = wsSg.getCell(`I${idx}`);
    cellI.value = {
      formula: `IF(A${idx}="","",IF(B${idx}=0,"Set target",IF(E${idx}>=B${idx},"Completed",IF(E${idx}>0,"In Progress","Not Started"))))`,
      result: "Set target",
    };
    cellI.font = fontBold;
    cellI.alignment = alignCenter;

    for (let c = 1; c <= 9; c++) {
      const cell = wsSg.getRow(idx).getCell(c);
      cell.border = borderCell;
      if (idx % 2 === 0 && c !== 2 && c !== 3) {
        cell.fill = fillZebra;
      }
    }
    wsSg.getRow(idx).height = 22;
  }

  // Total Row on Savings Goals
  const rSgTot = 21;
  wsSg.getCell(`A${rSgTot}`).value = "TOTAL";
  wsSg.getCell(`A${rSgTot}`).font = fontTotal;
  wsSg.getCell(`A${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`A${rSgTot}`).alignment = alignLeft;

  wsSg.getCell(`B${rSgTot}`).value = { formula: "SUM(B4:B20)", result: 0 };
  wsSg.getCell(`B${rSgTot}`).font = fontTotal;
  wsSg.getCell(`B${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`B${rSgTot}`).border = borderTotal;
  wsSg.getCell(`B${rSgTot}`).numFmt = currencyIntFmt;
  wsSg.getCell(`B${rSgTot}`).alignment = alignRight;

  wsSg.getCell(`C${rSgTot}`).value = { formula: "SUM(C4:C20)", result: 0 };
  wsSg.getCell(`C${rSgTot}`).font = fontTotal;
  wsSg.getCell(`C${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`C${rSgTot}`).border = borderTotal;
  wsSg.getCell(`C${rSgTot}`).numFmt = currencyIntFmt;
  wsSg.getCell(`C${rSgTot}`).alignment = alignRight;

  wsSg.getCell(`D${rSgTot}`).value = "";
  wsSg.getCell(`D${rSgTot}`).font = fontTotal;
  wsSg.getCell(`D${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`D${rSgTot}`).border = borderTotal;

  wsSg.getCell(`E${rSgTot}`).value = { formula: "SUM(E4:E20)", result: 0 };
  wsSg.getCell(`E${rSgTot}`).font = fontTotal;
  wsSg.getCell(`E${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`E${rSgTot}`).border = borderTotal;
  wsSg.getCell(`E${rSgTot}`).numFmt = currencyIntFmt;
  wsSg.getCell(`E${rSgTot}`).alignment = alignRight;

  wsSg.getCell(`F${rSgTot}`).value = { formula: "SUM(F4:F20)", result: 0 };
  wsSg.getCell(`F${rSgTot}`).font = fontTotal;
  wsSg.getCell(`F${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`F${rSgTot}`).border = borderTotal;
  wsSg.getCell(`F${rSgTot}`).numFmt = currencyIntFmt;
  wsSg.getCell(`F${rSgTot}`).alignment = alignRight;

  wsSg.getCell(`G${rSgTot}`).value = { formula: "IF(B21>0,E21/B21,0)", result: 0 };
  wsSg.getCell(`G${rSgTot}`).font = fontTotal;
  wsSg.getCell(`G${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`G${rSgTot}`).border = borderTotal;
  wsSg.getCell(`G${rSgTot}`).numFmt = percentFmt;
  wsSg.getCell(`G${rSgTot}`).alignment = alignRight;

  wsSg.getCell(`H${rSgTot}`).value = "";
  wsSg.getCell(`H${rSgTot}`).font = fontTotal;
  wsSg.getCell(`H${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`H${rSgTot}`).border = borderTotal;

  wsSg.getCell(`I${rSgTot}`).value = "";
  wsSg.getCell(`I${rSgTot}`).font = fontTotal;
  wsSg.getCell(`I${rSgTot}`).fill = fillTotal;
  wsSg.getCell(`I${rSgTot}`).border = borderTotal;
  wsSg.getRow(rSgTot).height = 24;

  wsSg.mergeCells("A23:I24");
  const sgNote = wsSg.getCell("A23");
  sgNote.value =
    "Note: Do not count linked goal accounts a second time as assets on the Overview tab. The balance is tracked here for milestone progress.";
  sgNote.font = fontNote;
  sgNote.fill = fillZebra;
  sgNote.alignment = alignWrapLeft;
  for (let r = 23; r <= 24; r++) {
    for (let c = 1; c <= 9; c++) {
      wsSg.getRow(r).getCell(c).border = borderCell;
    }
  }

  wsSg.getColumn("A").width = 24;
  wsSg.getColumn("B").width = 20;
  wsSg.getColumn("C").width = 20;
  wsSg.getColumn("D").width = 20;
  wsSg.getColumn("E").width = 20;
  wsSg.getColumn("F").width = 18;
  wsSg.getColumn("G").width = 14;
  wsSg.getColumn("H").width = 16;
  wsSg.getColumn("I").width = 16;

  // ==========================================
  // 8. WORKSHEET: Categories
  // ==========================================
  const wsCat = workbook.addWorksheet("Categories", {
    views: [{ showGridLines: true, state: "frozen", xSplit: 0, ySplit: 3 }],
  });

  wsCat.mergeCells("A1:C1");
  const catTitle = wsCat.getCell("A1");
  catTitle.value = "CATEGORIES & TAXONOMY DIRECTORY";
  catTitle.font = fontTitle;
  catTitle.fill = fillTitle;
  catTitle.alignment = alignCenter;
  wsCat.getRow(1).height = 36;

  wsCat.getCell("A2").value =
    "Savings allocations and own-account movements are Transfers, not income or expenses.";
  wsCat.getCell("B2").value = "Categories consolidated from standard accounting taxonomy.";
  wsCat.getCell("C2").value = "Used as source for ledger dropdowns & reports.";
  for (const colLetter of ["A", "B", "C"]) {
    const c = wsCat.getCell(`${colLetter}2`);
    c.font = fontMuted;
    c.fill = fillZebra;
    c.border = borderCell;
  }
  wsCat.getRow(2).height = 24;

  const catHeaders = ["Transaction Type", "Category Group", "Category"];
  catHeaders.forEach((h, idx) => {
    const c = wsCat.getRow(3).getCell(idx + 1);
    c.value = h;
    c.font = fontTblHeader;
    c.fill = fillTblHeader;
    c.border = borderCell;
    c.alignment = alignLeft;
  });
  wsCat.getRow(3).height = 26;

  CATEGORIES_DATA.forEach(([tType, tGroup, tCat], catIdx) => {
    const rowNum = 4 + catIdx;
    const c1 = wsCat.getCell(`A${rowNum}`);
    c1.value = tType;
    const c2 = wsCat.getCell(`B${rowNum}`);
    c2.value = tGroup;
    const c3 = wsCat.getCell(`C${rowNum}`);
    c3.value = tCat;

    [c1, c2, c3].forEach((c) => {
      c.font = fontRegular;
      c.border = borderCell;
      c.alignment = alignLeft;
      if (rowNum % 2 === 0) c.fill = fillZebra;
    });
    wsCat.getRow(rowNum).height = 20;
  });

  for (let rowNum = lastCatRow + 1; rowNum <= lastCatRow + 25; rowNum++) {
    for (let colIdx = 1; colIdx <= 3; colIdx++) {
      const c = wsCat.getRow(rowNum).getCell(colIdx);
      c.font = fontRegular;
      c.border = borderCell;
      if (colIdx === 1) {
        c.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"Income,Expense,Transfer"'],
        };
      }
    }
    wsCat.getRow(rowNum).height = 20;
  }

  wsCat.getColumn("A").width = 22;
  wsCat.getColumn("B").width = 24;
  wsCat.getColumn("C").width = 32;

  // ==========================================
  // Trigger Browser Download
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = hasDateRange
    ? `All_in_One_Personal_Finance_${startDate}_to_${endDate}.xlsx`
    : `All_in_One_Personal_Finance_${todayStr}.xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
