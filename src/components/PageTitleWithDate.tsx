import { TIME_ZONE } from "@/utils/timeZone";
import { WEEKDAYS_ARRAY } from "@/utils/weekdays";
import { getDay } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";

type PageTitleWithDateProps = {
  title?: string;
};

export const PageTitleWithDate = ({ title }: PageTitleWithDateProps) => {
  const isoDate = new Date().toISOString();
  const zonedIsoDate = toZonedTime(isoDate, TIME_ZONE);
  const pattern = "d.M.yyyy";
  const date = format(zonedIsoDate, pattern, { timeZone: TIME_ZONE });
  const weekdayIndex = getDay(zonedIsoDate);
  const weekday = WEEKDAYS_ARRAY[weekdayIndex];

  return (
    <h1 className="mt-8 flex flex-col">
      <span className="text-base font-semibold text-gray-500 uppercase dark:text-gray-400">
        {weekday} · {date}
      </span>
      <span className="text-4xl font-bold">{title}</span>
    </h1>
  );
};
