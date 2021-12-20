import { Datetime } from '../../atom/Datetime/Datetime';
import { TitleH1 } from '../../atom/TitleH1/TitleH1';

interface PageTitleWithDateProps {
  date: string;
  title: string;
}

export const PageTitleWithDate = ({ date, title }: PageTitleWithDateProps) => {
  return (
    <>
      <Datetime>{date}</Datetime>
      <TitleH1>{title}</TitleH1>
    </>
  );
};
