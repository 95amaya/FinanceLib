var moment = Moment.load();

function normalizeFinanceData(FROM_BANK_SHEET, TO_BANK_SHEET, dataVals) {
   let lastColDiff = FROM_BANK_SHEET.LAST_COL_NUM - TO_BANK_SHEET.LAST_COL_NUM;
  
   for(let rowIndx = 0; rowIndx < dataVals.length; rowIndx++) {
      let row = dataVals[rowIndx];
      let rowCopy = [...row];

      // -- Put Values ahead and then splice beginning
      if(lastColDiff > 0) {
         row[TO_BANK_SHEET.DATE_INDEX + lastColDiff] = rowCopy[FROM_BANK_SHEET.DATE_INDEX];
         row[TO_BANK_SHEET.AMOUNT_INDEX + lastColDiff] = rowCopy[FROM_BANK_SHEET.AMOUNT_INDEX];
         row[TO_BANK_SHEET.TRANSACTION_INDEX + lastColDiff] = rowCopy[FROM_BANK_SHEET.TRANSACTION_INDEX];

         // -- SHIFT to the LEFT
         row.splice(0, lastColDiff);
      }
   }
}

function consolidateFinanceData(BANK_SHEET_CONFIG, allDataRangeVals) {
   let amntIndx = BANK_SHEET_CONFIG.AMOUNT_INDEX;
   let exchangeIndx = BANK_SHEET_CONFIG.LAST_COL_NUM;
   let categoryIndx = exchangeIndx + 1;
   let itemIndx = categoryIndx + 1;
  
   let plGrp = groupBy(allDataRangeVals, rowArr => rowArr[exchangeIndx]);
   Object.keys(plGrp).forEach(plKey => {
                              
      let categoryGrp = groupBy(plGrp[plKey], rowArr => rowArr[categoryIndx]); 
      Object.keys(categoryGrp).forEach(categoryKey => {
      
         let itemGrp = groupBy(categoryGrp[categoryKey], rowArr => rowArr[itemIndx]);
         Object.keys(itemGrp).forEach(itemKey => {
            let monthGrp = groupBy(itemGrp[itemKey], rowArr => moment(rowArr[BANK_SHEET_CONFIG.DATE_INDEX]).month());
            itemGrp[itemKey] = monthGrp;
         });
 
         categoryGrp[categoryKey] = itemGrp;
     });

     plGrp[plKey] = categoryGrp;
  });
  
  return plGrp;
}

function buildExchangeRows(exchangeGrp, title, netSumArr) {
   let retVal = [];
   let exchangeMonthlySumArr = buildRowArr(12, 0);
   forEachItemInObject(exchangeGrp, (categoryKey, categoryGrp) => buildRows(categoryKey, categoryGrp, exchangeMonthlySumArr, 1, retVal));
  
   if(netSumArr && netSumArr.length) {
      exchangeMonthlySumArr.forEach((monthSum, indx) => netSumArr[indx] += monthSum);
   }
  
   let totalRow = buildRowArr(CONSTANTS.PL_SHEET.COL_RANGE, 0, title); 
   fillRow(totalRow, exchangeMonthlySumArr);
   retVal.push(totalRow);
   return retVal;
}

function buildRows(key, grp, monthlyArr, count, retVal) {
  
   if(count < 1) {
      let itemRow = buildRowArr(CONSTANTS.PL_SHEET.COL_RANGE, '', key);
      let itemMonthlySumArr = buildRowArr(12, 0);
      forEachItemInObject(grp, (monthKey, monthGrp) => {
                          
         itemMonthlySumArr[monthKey] = Math.round(arrSum(monthGrp, rowArr => rowArr[CONSTANTS.WF_SHEET.AMOUNT_INDEX]) * 100) / 100;
         monthlyArr[monthKey] += itemMonthlySumArr[monthKey];
         
      });

      fillRow(itemRow, itemMonthlySumArr);
      retVal.push(itemRow);
  
   } else {
      let categoryRow = buildRowArr(CONSTANTS.PL_SHEET.COL_RANGE, '', key);
      retVal.push(categoryRow);
  
      let categoryMonthlySumArr = buildRowArr(12, 0);
      forEachItemInObject(grp, (itemKey, itemGrp) => buildRows(itemKey, itemGrp, categoryMonthlySumArr, --count, retVal));
      
      let subTotalRow = buildRowArr(CONSTANTS.PL_SHEET.COL_RANGE, 0, key + ' subtotal');
      fillRow(subTotalRow, categoryMonthlySumArr, monthlyArr);
      retVal.push(subTotalRow);

      let spaceRow = buildRowArr(CONSTANTS.PL_SHEET.COL_RANGE, '', 'SPACE');
      retVal.push(spaceRow);
   }
}

function fillRow(row, filledMonthlySumArr, totalMonthlySumArr) {
   row.splice(CONSTANTS.PL_SHEET.MONTH_INDEX, 12, ...filledMonthlySumArr); // - could be push
   let filterZero = filledMonthlySumArr.filter(num => num != 0);
   row[17] = arrSum(filledMonthlySumArr, item => item); 
   row[18] = arrAvg(filterZero, item => item); 
   if(totalMonthlySumArr && totalMonthlySumArr.length) {
      filledMonthlySumArr.forEach((sum, indx) => totalMonthlySumArr[indx] += sum);
   }
}

function buildRowArr(len, defaultVal, firstVal) {
  let retVal = new Array(len);
  retVal.fill(defaultVal);
  if(firstVal) {
    retVal[0] = firstVal;
  }
  return retVal;
}
                       
function writeToSheet(rows, NAMED_RANGE) { 
   let range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(NAMED_RANGE);
   range.clear();

   forEachRangeCell(range, (cell, rowNum, colNum) => {
      let row = rows[rowNum - 1];
      let rangeCell = row && colNum <= row.length ? rows[rowNum - 1][colNum - 1]: '';
      let isSpace =  /SPACE/.test(rangeCell);
      let isHeaderCell = (rowNum == 1 && colNum == 1) 
         || (rowNum > 1 && colNum == 1 && rows[rowNum - 2] && rows[rowNum - 2].length &&  /SPACE/.test(rows[rowNum - 2][0]));
      
      if(CONSTANTS.PL_SHEET.SKIP_COLS.filter(skipColNum => skipColNum == colNum).length < 1 && row && rangeCell) {
         if(isHeaderCell) {
            cell.setFontWeight("bold");
         }
         if(isSpace) {
            cell.setValue('');
         } else {
            cell.setValue(rangeCell);
         }
      }
  });
}

function arrSum(arr, selector) {
  let sum = 0;
  arr.forEach(item => {
    sum += selector(item);
  });
  return sum;
}

function arrAvg(arr, selector) {
  return Math.round((arrSum(arr, selector) / arr.length) * 100) / 100;
}

function arrContains(arr, selector, searchItem) {
  arr.forEach(item => {
    if(selector(item) == searchItem) {
       return true;
    }
  });
  return false;
}

function forEachRangeCell(range, func) {
  const numRows = range.getNumRows();
  const numCols = range.getNumColumns();

  for (let i = 1; i <= numCols; i++) {
    for (let j = 1; j <= numRows; j++) {
      const cell = range.getCell(j, i);

      func(cell, j, i);
    }
  }
}

// -- Return Range as A1 Notation string 
function getRangeByStr(sheetName, startRowNum, startColNum, endRowNum, endColNum) {
  return sheetName + '!' + ALPHA_ARR[startColNum - 1] + startRowNum + ":" + ALPHA_ARR[endColNum - 1] + endRowNum;
}

/*!
 * Group items from an array together by some criteria or value.
 * (c) 2019 Tom Bremmer (https://tbremer.com/) and Chris Ferdinandi (https://gomakethings.com), MIT License,
 * @param  {Array}           arr      The array to group items from
 * @param  {String|Function} criteria The criteria to group by
 * @return {Object}                   The grouped object
 */
var groupBy = function (arr, criteria) {
	return arr.reduce(function (obj, item) {

		// Check if the criteria is a function to run on the item or a property of it
		var key = typeof criteria === 'function' ? criteria(item) : item[criteria];

		// If the key doesn't exist yet, create it
		if (!obj.hasOwnProperty(key)) {
			obj[key] = [];
		}

		// Push the value to the object
		obj[key].push(item);

		// Return the object to the next item in the loop
		return obj;

	}, {});
};

function forEachItemInObject(obj, func) {
  Object.keys(obj).forEach(key => func(key, obj[key]));
}

function log(val) {
  Logger.log(val)
}