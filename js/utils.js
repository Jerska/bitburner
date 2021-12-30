export function escapeHTML(s) {
  const p = document.createElement('p');
  const text = document.createTextNode(s);
  p.appendChild(text);
  return p.innerHTML;
}

export async function wait(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}
