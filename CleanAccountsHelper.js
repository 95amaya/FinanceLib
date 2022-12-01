function cleanSheet(sheetName, LT_SHEET_CONFIG, BANK_SHEET_CONFIG, categoryTitle) {
   let rawDataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
   let values = rawDataSheet.getDataRange().getValues();
   let lookupTableDict = getLookupTable(LT_SHEET_CONFIG);
   let mappingColInfo = [];
  
   for(let rowIndx = 0; rowIndx < values.length; rowIndx++) {
      let exchangeDirection = values[rowIndx][BANK_SHEET_CONFIG.AMOUNT_INDEX] > 0 ? 'Income' : 'Expense';
    
      let matchArr = Object.keys(lookupTableDict).filter(searchStr => {
         let regex = new RegExp(searchStr);
         let transStmt = values[rowIndx][BANK_SHEET_CONFIG.TRANSACTION_INDEX];
         return regex.test(transStmt); 
      });
    
      if(matchArr && matchArr.length) {
         let lookupInfo = lookupTableDict[matchArr[0]];
      
         if(lookupInfo[0] > 0) {
            mappingColInfo = ['FILTER OUT', '', ''];
         } else if(categoryTitle) {
            mappingColInfo = [exchangeDirection, categoryTitle, lookupInfo[2]];
         } else {
            mappingColInfo = [exchangeDirection, lookupInfo[1], lookupInfo[2]];
         }
     } else if(categoryTitle) {
        mappingColInfo = [exchangeDirection, categoryTitle, 'Misc.'];
     } else {
        mappingColInfo = [exchangeDirection, 'Other', 'Misc.'];
     }
  
     let cleanRange = rawDataSheet.getRange(rowIndx + 1, BANK_SHEET_CONFIG.LAST_COL_NUM + 1, 1, 3);
     cleanRange.clear();
     cleanRange.setValues([mappingColInfo]);
  }
} 

function getLookupTable(LT_SHEET_CONFIG) {
   let lookupTableDataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LT_SHEET_CONFIG.TITLE);
   let values = lookupTableDataSheet.getDataRange().getDisplayValues();
   let searchDict = {};
  
   for(let rowIndx = 1; rowIndx < values.length; rowIndx++) {
      let strToFind = values[rowIndx][LT_SHEET_CONFIG.REGEX_INDEX];
      
      if(!searchDict[strToFind]) {
         searchDict[strToFind] = values[rowIndx].slice(LT_SHEET_CONFIG.REGEX_INDEX + 1);
      }
   }
   return searchDict;
}
