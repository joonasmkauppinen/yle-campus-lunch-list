/** @jsxImportSource @emotion/react */

import styled from '@emotion/styled';
import { MenuTextParagraph } from '../MenuTextParagraph/MenuTextParagraph';
import { SectionTitleButton } from '../SectionTitleButton/SectionTitleButton';

const ContainerSection = styled.section({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 40,
});

interface RestaurantItemSectionProps {
  name: string;
  items: string[];
  ariaLabel: string;
}

export const RestaurantItemSection = ({ items, name, ariaLabel }: RestaurantItemSectionProps) => {
  return (
    <ContainerSection>
      <SectionTitleButton
        label={name}
        ariaLabel={ariaLabel}
        onClick={() => alert(`TODO: Navigate to details page for '${name}'`)}
      />
      {items.map((item, index) => (
        <MenuTextParagraph key={`${name}-${index}`}>{item}</MenuTextParagraph>
      ))}
    </ContainerSection>
  );
};
