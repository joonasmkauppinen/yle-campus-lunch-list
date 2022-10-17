import styled from '@emotion/styled';

export const RestaurantLink = styled.a({
  fontSize: 13,
  color: 'var(--text-link)',
  marginTop: 8,
  marginBottom: 16,
  alignSelf: 'start',
  ':hover': {
    textDecoration: 'underline',
  },
});
