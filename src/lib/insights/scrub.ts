// Server-side defense in depth. The app scrubs known child names before send;
// this pass only sees the text, so it removes patterned contact and id data.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL = /\b(?:https?:\/\/|www\.)[^\s<>]+/gi;
const PHONE_IL = /(?:\+972[-\s]?|0)5\d[-\s]?\d{3}[-\s]?\d{4}/g;
const PHONE_INTL = /(?<!\w)\+\d{1,3}[-\s]?\d{6,12}\b/g;
const DATE_ISO = /\b\d{4}-\d{2}-\d{2}\b/g;
const DATE_DMY = /\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/g;
const ID9 = /(?<!\d)\d{9}(?!\d)/g;
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function scrubFreeText(input: string): string {
  let text = input.normalize("NFKC");
  text = text.replace(EMAIL, "[email]");
  text = text.replace(URL, "[url]");
  text = text.replace(PHONE_IL, "[phone]");
  text = text.replace(PHONE_INTL, "[phone]");
  text = text.replace(DATE_ISO, "[date]");
  text = text.replace(DATE_DMY, "[date]");
  text = text.replace(ID9, "[id]");
  text = text.replace(CONTROLS, "");
  return text;
}
