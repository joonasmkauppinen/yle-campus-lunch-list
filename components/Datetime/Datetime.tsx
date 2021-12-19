/** @jsxImportSource @emotion/react */

import { TimeHTMLAttributes } from "react"

export const Datetime = ({ children, ...htmlTimeProps }: TimeHTMLAttributes<HTMLElement>) => {
  return (
    <time 
      css={{
        color: '#808080',
        textTransform: 'uppercase',
        fontSize: 16,
        fontWeight: 600,
      }}
      {...htmlTimeProps}
    >
      {children}
    </time>
  )
}