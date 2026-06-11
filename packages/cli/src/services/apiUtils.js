export const extractDomain = (target) => {
  let url = target.trim();
  url = url.replace(/^https?:\/\//, '');
  url = url.replace(/\/.*$/, '');
  url = url.replace(/:\d+$/, '');
  return url;
};

export const extractHostname = (target) => {
  if (!target) return '';
  try {
    const urlText = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(target) ? target : `https://${target}`;
    return new URL(urlText).hostname;
  } catch {
    if (!target.includes(' ') && (target.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(target))) {
      return target;
    }
    return '';
  }
};
