/** @jsxImportSource @emotion/react */

import Image from 'next/image';

interface SectionTitleButtonProps {
  label: string;
  onClick?: () => void;
  ariaLabel: string;
}

export const SectionTitleButton = ({ label, onClick, ariaLabel }: SectionTitleButtonProps) => {
  return (
    <div
      onClick={onClick}
      css={{
        paddingTop: 9,
        paddingBottom: 8,
        position: 'relative',
        marginBottom: 8,
      }}
    >
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2
          aria-label={ariaLabel}
          css={{
            color: '#1B1B1B',
            fontSize: 23,
            fontWeigh: 700,
            margin: 0,
          }}
        >
          {label}
        </h2>
        <Image
          role="button"
          aria-label="Avaa koko viikon lounaslistat."
          src="/chevron-right.svg"
          width={24}
          height={24}
          alt=""
        />
      </div>
      <span
        css={{
          backgroundColor: '#D9D9D9',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
        }}
      />
    </div>
  );
};
