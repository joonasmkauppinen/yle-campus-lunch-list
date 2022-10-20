import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const darkModeAtom = atomWithStorage('dark-mode', false);

export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  return { darkMode, setDarkMode };
};
