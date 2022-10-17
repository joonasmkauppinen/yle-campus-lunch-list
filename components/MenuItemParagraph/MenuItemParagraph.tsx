import styled from '@emotion/styled';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export const StyledLi = styled.li({
  margin: 0,
  marginBottom: 16,
  fontSize: '1em',
  color: 'var(--text-primary)',
  lineHeight: '26px',
  fontWeight: 500,
});

interface MenuItemTextProps {
  markdown: string;
}

export const MenuItemText = ({ markdown }: MenuItemTextProps) => {
  return (
    <ReactMarkdown
      // eslint-disable-next-line react/no-children-prop
      children={markdown}
      rehypePlugins={[rehypeRaw]}
      components={{
        p: ({ children }) => <StyledLi>{children}</StyledLi>,
      }}
    />
  );
};
