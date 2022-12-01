const CONSTANTS = {
  ACCOUNTS: {
    NEEDS_CHECKING: 'NeedsChecking',
    WANTS_CHECKING: 'WantsChecking',
    NEEDS_CARD: 'NeedsCard',
    WANTS_CARD: 'WantsCard',
  },
  LOOKUP_TABLE_SHEET: {
    TITLE: 'Lookup Table',
    REGEX_INDEX: 0,
  },
  WF_SHEET: {
    DATE_INDEX: 0,
    AMOUNT_INDEX: 1,
    TRANSACTION_INDEX: 4,
    LAST_COL_NUM: 5,
  },
  JPM_SHEET: {
    DATE_INDEX: 0,
    AMOUNT_INDEX: 5,
    TRANSACTION_INDEX: 2,
    LAST_COL_NUM: 6,
  },
  PL_SHEET: {
    TITLE: 'P/L STMT',
    NAMED_RANGE: {
      INCOME: 'IncomeCategoryRange',
      EXPENSES: 'ExpenseCategoryRange', 
      NET: 'NetCategoryRange',
    },
    COL_RANGE: 19,
    SKIP_COLS: [2, 3, 4, 17],
    MONTH_INDEX: 4 
  },
  ALPHA: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
}

var ALPHA_ARR = [...CONSTANTS.ALPHA];