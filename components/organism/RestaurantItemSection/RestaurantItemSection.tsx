/** @jsxImportSource @emotion/react */

import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import { MenuItemParagraph } from '../../atom/MenuItemParagraph/MenuItemParagraph';
import { SectionTitleButton } from '../../molecule/SectionTitleButton/SectionTitleButton';

const ContainerSection = styled.section({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 40,
});

interface RestaurantItemSectionProps {
  name: string;
  items: string[];
  ariaLabel: string;
  path: string;
}

export const RestaurantItemSection = ({
  items,
  name,
  ariaLabel,
  path,
}: RestaurantItemSectionProps) => {
  const router = useRouter();

  return (
    <ContainerSection>
      <SectionTitleButton label={name} ariaLabel={ariaLabel} onClick={() => router.push(path)} />
      {items.map((item, index) => (
        <MenuItemParagraph key={`${name}-${index}`}>{item}</MenuItemParagraph>
      ))}
    </ContainerSection>
  );
};
