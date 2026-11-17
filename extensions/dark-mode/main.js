const style = api.addStyle(`
html {
    filter: invert(0.88) hue-rotate(180deg) !important;
    background: #111 !important;
}

img, video, picture, canvas, iframe {
    filter: invert(1) hue-rotate(180deg) !important;
}
`);

api.toast("Dark Mode enabled");

return () => style.remove();