import styled from '@emotion/styled';

export const PageContainer = styled.article({
  marginLeft: 10,
  marginRight: 10,
  marginBottom: 80,
  '@media (min-width: 670px)': {
    maxWidth: 670,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});
