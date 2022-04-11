import { Datetime } from '../Datetime/Datetime';
import { Heading1 } from '../Heading1/Heading1';

interface PageTitleWithDateProps {
  date: string;
  title: string;
  weekday: string;
}

export const PageTitleWithDate = ({ date, title, weekday }: PageTitleWithDateProps) => {
  return (
    <>
      <Datetime>{`${weekday} · ${date}`}</Datetime>
      <Heading1>{title}</Heading1>
    </>
  );
};
