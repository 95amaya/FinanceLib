function buildMenu() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Google Scripts')
      .addItem('Clean Accounts', 'cleanAccounts')
      .addItem('Consolidate Accounts', 'consolidate')
      .addToUi();
}

function cleanAccounts() {
   cleanSheet(CONSTANTS.ACCOUNTS.NEEDS_CHECKING, CONSTANTS.LOOKUP_TABLE_SHEET, CONSTANTS.WF_SHEET);
   cleanSheet(CONSTANTS.ACCOUNTS.WANTS_CHECKING, CONSTANTS.LOOKUP_TABLE_SHEET, CONSTANTS.WF_SHEET);
   cleanSheet(CONSTANTS.ACCOUNTS.NEEDS_CARD, CONSTANTS.LOOKUP_TABLE_SHEET, CONSTANTS.WF_SHEET, 'Needs Credit Card');
   cleanSheet(CONSTANTS.ACCOUNTS.WANTS_CARD, CONSTANTS.LOOKUP_TABLE_SHEET, CONSTANTS.JPM_SHEET, 'Wants Credit Card');
}

function consolidate() {
   let netRows = [];
   let netSumArr = buildRowArr(12, 0);
  
   let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
   let needsCheckingData = activeSpreadsheet.getSheetByName(CONSTANTS.ACCOUNTS.NEEDS_CHECKING).getDataRange().getValues();
   let wantsCheckingData = activeSpreadsheet.getSheetByName(CONSTANTS.ACCOUNTS.WANTS_CHECKING).getDataRange().getValues();
   let needsCreditData = activeSpreadsheet.getSheetByName(CONSTANTS.ACCOUNTS.NEEDS_CARD).getDataRange().getValues();
   let wantsCreditData = activeSpreadsheet.getSheetByName(CONSTANTS.ACCOUNTS.WANTS_CARD).getDataRange().getValues();
   normalizeFinanceData(CONSTANTS.JPM_SHEET, CONSTANTS.WF_SHEET, wantsCreditData)
   
   let creditData = needsCreditData.concat(wantsCreditData);
   let creditDataGrp = consolidateFinanceData(CONSTANTS.WF_SHEET, creditData);
   let checkingData = needsCheckingData.concat(wantsCheckingData);
   let checkingDataGrp = consolidateFinanceData(CONSTANTS.WF_SHEET, checkingData);
  
   
   let incomeVals = buildExchangeRows(checkingDataGrp['Income'], 'TOTAL INCOME', netSumArr); 
   let expenseVals = buildExchangeRows(checkingDataGrp['Expense'], 'TOTAL EXPENSES', netSumArr); 
   let creditExpenseBreakdown = buildExchangeRows(creditDataGrp['Expense'], 'TOTAL CREDIT EXPENSES');
  
   
   let netSumRow = buildRowArr(CONSTANTS.PL_SHEET.COL_RANGE, '', 'NET REMAINING'); 
   fillRow(netSumRow, netSumArr);
   let spaceRow = buildRowArr(CONSTANTS.PL_SHEET.COL_RANGE, '', 'SPACE');
   netRows.push(netSumRow);
   netRows.push(spaceRow);
  
   writeToSheet(incomeVals, CONSTANTS.PL_SHEET.NAMED_RANGE.INCOME);
   writeToSheet(expenseVals, CONSTANTS.PL_SHEET.NAMED_RANGE.EXPENSES);
   writeToSheet(netRows.concat(creditExpenseBreakdown), CONSTANTS.PL_SHEET.NAMED_RANGE.NET); 
   
}
