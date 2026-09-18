import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthPicker({
  value,
  onChange,
  id,
  yearsBack = 2,
  yearsForward = 2,
}: {
  /** "yyyy-MM" */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  yearsBack?: number;
  yearsForward?: number;
}) {
  const [yearStr, monthStr] = value.split("-");
  const monthIndex = Number(monthStr) - 1;
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: yearsBack + yearsForward + 1 },
    (_, i) => currentYear - yearsBack + i,
  );
  // in case `value` points at a year outside the default window
  if (!years.includes(Number(yearStr))) years.unshift(Number(yearStr));

  function handleMonthChange(newMonthIndex: string) {
    onChange(`${yearStr}-${String(Number(newMonthIndex) + 1).padStart(2, "0")}`);
  }

  function handleYearChange(newYear: string) {
    onChange(`${newYear}-${monthStr}`);
  }

  return (
    <div className="flex gap-2">
      <Select value={String(monthIndex)} onValueChange={handleMonthChange}>
        <SelectTrigger id={id} className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, i) => (
            <SelectItem key={name} value={String(i)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={yearStr} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years
            .sort((a, b) => a - b)
            .map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
