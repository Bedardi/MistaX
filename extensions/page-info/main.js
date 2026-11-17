const box = document.createElement("div");

box.style.cssText = `
position:fixed;
z-index:2147483646;
right:15px;
top:15px;
background:#24232b;
color:white;
padding:16px;
border-radius:14px;
max-width:280px;
font:13px Arial;
box-shadow:0 5px 25px #0005;
`;

const title = document.createElement("div");
title.style.fontWeight = "bold";
title.textContent = document.title || "Untitled page";

const url = document.createElement("div");
url.style.marginTop = "8px";
url.style.wordBreak = "break-all";
url.textContent = location.href;

box.append(title, url);

api.addElement(box);

return () => box.remove();