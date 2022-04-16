import styled from '@emotion/styled';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export const StyledParagraph = styled.p({
  margin: 0,
  marginBottom: 16,
  fontSize: '1em',
  color: '#1B1B1B',
  lineHeight: '26px',
  fontWeight: 500,
});

interface MenuItemParagraphProps {
  markdown: string;
}

export const MenuItemParagraph = ({ markdown }: MenuItemParagraphProps) => {
  return (
    <ReactMarkdown
      // eslint-disable-next-line react/no-children-prop
      children={markdown}
      rehypePlugins={[rehypeRaw]}
      components={{
        p: ({ children }) => <StyledParagraph>{children}</StyledParagraph>,
      }}
    />
  );
};
