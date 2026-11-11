import { createGlobalStyle } from 'styled-components'

// 全局样式
export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  button, input, select { font-family: inherit; }
  button, input, select, a { -webkit-tap-highlight-color: transparent; }
  button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible {
    outline: 2px solid var(--accent, #385c46);
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`
