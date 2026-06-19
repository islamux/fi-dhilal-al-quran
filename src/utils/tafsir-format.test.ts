import { describe, it, expect } from 'vitest';
import { formatTafsirParagraphs } from './tafsir-format';

describe('formatTafsirParagraphs', () => {
  it('returns empty array for null', () => {
    expect(formatTafsirParagraphs(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(formatTafsirParagraphs('')).toEqual([]);
  });

  it('joins simple wrapped lines', () => {
    const result = formatTafsirParagraphs('السطر الأول\nالسطر الثاني');
    expect(result).toEqual(['السطر الأول السطر الثاني']);
  });

  it('splits on double newline (section boundary)', () => {
    const result = formatTafsirParagraphs('فقرة أولى.\n\nفقرة ثانية.');
    expect(result).toEqual(['فقرة أولى.', 'فقرة ثانية.']);
  });

  it('starts new paragraph after verse number at end of line with this/these', () => {
    const result = formatTafsirParagraphs('الضَّالِّينَ (7)\nهذه السورة القصيرة ذات الآيات');
    expect(result).toEqual([
      'الضَّالِّينَ (7)',
      'هذه السورة القصيرة ذات الآيات',
    ]);
  });

  it('starts new paragraph with هذا after verse number', () => {
    const result = formatTafsirParagraphs('كُفُواً أَحَدٌ (4)\nهذا الحديث عن التوحيد');
    expect(result).toEqual([
      'كُفُواً أَحَدٌ (4)',
      'هذا الحديث عن التوحيد',
    ]);
  });

  it('does not break on verse continuation within verse text', () => {
    const result = formatTafsirParagraphs('يُوقِنُونَ (4)\nأُولئِكَ عَلى هُدىً مِنْ رَبِّهِمْ');
    expect(result).toEqual(['يُوقِنُونَ (4) أُولئِكَ عَلى هُدىً مِنْ رَبِّهِمْ']);
  });

  it('breaks paragraph at إن after full stop', () => {
    const result = formatTafsirParagraphs('تم المعنى.\nإن هذا هو المقصود.');
    expect(result).toEqual(['تم المعنى.', 'إن هذا هو المقصود.']);
  });

  it('breaks on ثم after full stop', () => {
    const result = formatTafsirParagraphs('ذهب الأول.\nثم جاء الثاني.');
    expect(result).toEqual(['ذهب الأول.', 'ثم جاء الثاني.']);
  });

  it('breaks on لقد after full stop', () => {
    const result = formatTafsirParagraphs('مضى زمن.\nلقد تغير الحال.');
    expect(result).toEqual(['مضى زمن.', 'لقد تغير الحال.']);
  });

  it('does not break on and-prefixed words like وهو', () => {
    const result = formatTafsirParagraphs('تم المعنى.\nوهو أسلوب آخر');
    expect(result).toEqual(['تم المعنى. وهو أسلوب آخر']);
  });

  it('does not break on word not in starter list', () => {
    const result = formatTafsirParagraphs('اكتمل.\nكلمة عادية ليست بداية فقرة.');
    expect(result).toEqual(['اكتمل. كلمة عادية ليست بداية فقرة.']);
  });

  it('handles surah al-fatihah paragraph structure with realistic text', () => {
    const text = 'الضَّالِّينَ (7)\nيردد المسلم هذه السورة القصيرة ذات الآيات السبع\n..\nتبدأ السورة : «بِسْمِ اللَّهِ\nوالبدء باسم اللّه هو الأدب';
    const result = formatTafsirParagraphs(text);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('الضَّالِّينَ (7)');
    expect(result[1]).toContain('يردد المسلم هذه السورة القصيرة');
    expect(result[2]).toContain('تبدأ السورة');
  });

  it('handles إنه as paragraph starter', () => {
    const result = formatTafsirParagraphs('انتهى الأمر.\nإنه المقصود هنا.');
    expect(result).toEqual(['انتهى الأمر.', 'إنه المقصود هنا.']);
  });

  it('handles إنها as paragraph starter', () => {
    const result = formatTafsirParagraphs('تم الكلام.\nإنها آية عظيمة.');
    expect(result).toEqual(['تم الكلام.', 'إنها آية عظيمة.']);
  });

  it('handles multiple sections with double newlines', () => {
    const text = 'فقرة أولى.\n\nالضَّالِّينَ (7)\nيردد المسلم هذه السورة.\n\nفصل جديد.\nإن هذا فصل جديد.';
    const result = formatTafsirParagraphs(text);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe('فقرة أولى.');
    expect(result[1]).toBe('الضَّالِّينَ (7)');
    expect(result[2]).toContain('يردد المسلم هذه السورة.');
    expect(result[3]).toBe('فصل جديد.');
    expect(result[4]).toBe('إن هذا فصل جديد.');
  });

  it('preserves verse-number-start lines attached to previous paragraph', () => {
    const result = formatTafsirParagraphs('نص الآية\n(5) باقي الآية');
    expect(result).toEqual(['نص الآية (5) باقي الآية']);
  });

  it('handles نزلت as paragraph starter', () => {
    const result = formatTafsirParagraphs('كبيرة (5)\nنزلت هذه الآية في كذا.');
    expect(result).toEqual([
      'كبيرة (5)',
      'نزلت هذه الآية في كذا.',
    ]);
  });

  it('handles فأما after full stop', () => {
    const result = formatTafsirParagraphs('انتهى كلام.\nفأما الذين آمنوا.');
    expect(result).toEqual(['انتهى كلام.', 'فأما الذين آمنوا.']);
  });

  it('handles فهذا after full stop', () => {
    const result = formatTafsirParagraphs('تم البيان.\nفهذا هو المقصود.');
    expect(result).toEqual(['تم البيان.', 'فهذا هو المقصود.']);
  });

  it('handles ولكن after full stop', () => {
    const result = formatTafsirParagraphs('كان الأمر كذا.\nولكن هناك تفصيل.');
    expect(result).toEqual(['كان الأمر كذا.', 'ولكن هناك تفصيل.']);
  });

  it('handles وبعد after full stop', () => {
    const result = formatTafsirParagraphs('انتهى المقدمة.\nوبعد ذلك نبدأ.');
    expect(result).toEqual(['انتهى المقدمة.', 'وبعد ذلك نبدأ.']);
  });

  it('does not break at random word after full stop', () => {
    const result = formatTafsirParagraphs('حدث ذلك.\nفجأة تغير الوضع.');
    expect(result).toEqual(['حدث ذلك. فجأة تغير الوضع.']);
  });

  it('handles real tafsir section transition', () => {
    const text = 'مِن رَّبِّهِمْ ۗ وَاللَّهُ لَا يَهْدِي الْقَوْمَ الْكَافِرِينَ (29)\nهذه السورة الكريمة تعالج قضية ضخمة';
    const result = formatTafsirParagraphs(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('(29)');
    expect(result[1]).toContain('هذه السورة الكريمة');
  });

  it('handles فبعد after full stop', () => {
    // فبعد is not a starter, should join
    const result = formatTafsirParagraphs('حدث ذلك.\nفبعد هذا انتهى.');
    expect(result).toEqual(['حدث ذلك. فبعد هذا انتهى.']);
  });
});
