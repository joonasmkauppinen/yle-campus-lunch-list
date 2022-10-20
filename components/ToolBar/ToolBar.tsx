import styled from '@emotion/styled';
import { useDarkMode } from '../../jotai/darkModeAtom';

export const ToolBar = () => {
  const { darkMode, setDarkMode } = useDarkMode();

  const handleClick = () => {
    setDarkMode(!darkMode);
  };

  const buttonLabel = darkMode ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Container>
      <ThemeModeToggleButton onClick={handleClick}>{buttonLabel}</ThemeModeToggleButton>
    </Container>
  );
};

const Container = styled.div({
  backgroundColor: 'red',
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
});

const ThemeModeToggleButton = styled.button({});
