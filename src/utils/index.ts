const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicNumerals(num: number): string {
  return num.toString().split('').map(digit => {
    const parsed = parseInt(digit, 10);
    return isNaN(parsed) ? digit : ARABIC_DIGITS[parsed];
  }).join('');
}
