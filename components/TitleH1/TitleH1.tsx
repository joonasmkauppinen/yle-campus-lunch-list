/** @jsxImportSource @emotion/react */

interface TitleH1Props {
  children: string;
}

export const TitleH1 = ({ children }: TitleH1Props) => {
  return (
    <h1 
      css={{
        color: '#1B1B1B',
        fontSize: 34,
        margin: 0,
        padding: 0,
        marginBottom: 40,
      }}
    >
      {children}
    </h1>
  )
}