import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import moment from "moment-timezone";

// 1) Custom IST timestamp
const istTimestamp = winston.format((info) => {
  info.timestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  return info;
})();

// 2) Strict ordered JSON formatter
const orderedJsonFormat = winston.format((info) => {
  const payload = {
    level: info.level,
    url: info.url ?? null,
    method: info.method ?? null,
    status: info.status ?? null,
    userId: info.userId ?? null,
    data: info.data ?? null,     // ✅ object OR array
    message: info.message,
    timestamp: info.timestamp,
  };

  info[Symbol.for("message")] = JSON.stringify(payload);
  return info;
})();

// 3) ⬅️ Only INFO goes into app-%DATE%.log
const infoRotateTransport = new DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "info",     // ⬅️ Only info logs
});

// 4) ⬅️ Only ERROR goes into error.log
const errorFileTransport = new winston.transports.File({
  filename: "logs/error.log",
  level: "error",    // ⬅️ Only errors
});

// 5) Console shows everything
const consoleTransport = new winston.transports.Console({
  level: "info",
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    istTimestamp,
    orderedJsonFormat
  ),
  transports: [
    infoRotateTransport, // only info written
    errorFileTransport,  // only error written
    consoleTransport
  ],
});

export default logger;
