document.write(`<script src="data?${new URLSearchParams({
  dark: +matchMedia("(prefers-color-scheme:dark)").matches,
  frameId: window === top ? 0 : 1,
  url: location.href
})}"><\/script>`);