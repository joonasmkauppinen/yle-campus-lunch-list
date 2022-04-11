/* eslint-disable no-unused-vars */

export enum WeekDayEnum {
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

export const regexSingleWeekDay = [
  /maanantai/i,
  /tiistai/i,
  /keskiviikko/i,
  /torstai/i,
  /perjantai/i,
  /lauantai/i,
  /sunnuntai/i,
];

export const regexWeekDay = /\b((mon|tues|wednes|thurs|fri)(day))\b/gi;
