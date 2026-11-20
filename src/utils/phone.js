export function formatPhoneInput(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0092')) digits = digits.slice(4);
  else if (digits.startsWith('92')) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');
  return digits.slice(0, 10);
}

export function normalizePhone(value) {
  let digits = value.trim().replace(/[\s()-]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('0092')) digits = digits.slice(4);
  else if (digits.startsWith('92')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^3\d{9}$/.test(digits)) throw new Error('Enter a valid Pakistani mobile number, for example 03001234567.');
  return '92' + digits;
}
