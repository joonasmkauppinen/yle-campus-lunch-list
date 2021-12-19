/** @jsxImportSource @emotion/react */

import { HTMLAttributes } from "react";

export const MenuTextParagraph = ({ children }: HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      css={{
        margin: 0,
        fontSize: '1em',
        color: '#1B1B1B',
        lineHeight: '38px',
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}