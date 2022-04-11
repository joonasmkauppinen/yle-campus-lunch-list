import styled from '@emotion/styled';
import Image from 'next/image';
import { DividerLineSpan } from '../DividerLineSpan/DividerLineSpan';
import { Heading2 } from '../Heading2/Heading2';

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
  ariaLabel?: string;
}

export const SectionTitleButton = ({ label, onClick, ariaLabel }: SectionTitleButtonProps) => {
  return (
    <ContainerDiv onClick={onClick}>
      <ElementsContainerDiv>
        <Heading2 aria-label={ariaLabel}>{label}</Heading2>
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
