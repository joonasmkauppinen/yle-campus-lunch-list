import styled from '@emotion/styled';
import Image from 'next/image';
import { DividerLineSpan } from '../../atom/DividerLineSpan/DividerLineSpan';
import { TitleH2 } from '../../atom/TitleH2/TitleH2';

const ContainerDiv = styled.div({
  paddingTop: 9,
  paddingBottom: 8,
  position: 'relative',
  marginBottom: 8,
  cursor: 'pointer',
});

const ElementsContainerDiv = styled.div({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

interface SectionTitleButtonProps {
  label: string;
  onClick?: () => void;
  ariaLabel: string;
}

export const SectionTitleButton = ({ label, onClick, ariaLabel }: SectionTitleButtonProps) => {
  return (
    <ContainerDiv onClick={onClick}>
      <ElementsContainerDiv>
        <TitleH2 aria-label={ariaLabel}>{label}</TitleH2>
        <Image
          role="button"
          aria-label="Avaa koko viikon lounaslistat."
          src="/chevron-right.svg"
          width={24}
          height={24}
          alt=""
        />
      </ElementsContainerDiv>
      <DividerLineSpan />
    </ContainerDiv>
  );
};
