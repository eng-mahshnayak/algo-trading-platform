import logger from "../common/logger.js";

// SUCCESS Log (info)
export function logSuccess(req, extraData = {}) {
  logger.info("API Request Completed", {
    url: req?.originalUrl||"",
    method: req?.method||"",
    status: true,
    userId: req?.userId || null,
   data: extraData, // 👈 always store here
  });
}

// ERROR Log (error)
export function logError(req, err,extraData = {} ) {
  logger.error(err?.message||"API Request Failed", {
    url: req?.originalUrl||"",
    method: req?.method||"",
    status: false,
    userId: req?.userId || null,
    error: err?.message||"",
    errorObject:err,
    stack: err.stack || null,
    data: extraData, // 👈 always store here
  });
}