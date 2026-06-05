import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatUTCToIST(utcDateString, format = "DD MMMM YYYY [at] hh:mm a") {
  if (!utcDateString) return "";

  return dayjs.utc(utcDateString).tz("Asia/Kolkata").format(format);
}
