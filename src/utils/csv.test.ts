import { describe, it, expect } from 'vitest';
import { parseEventsCsv, CSV_TEMPLATE } from './csv';
import { parseLocalDate, formatDateForInput } from './dateCalculations';
import { eventColors } from './eventColors';

const BIRTH = parseLocalDate('1990-03-12');
const END_AGE = 90;

const parse = (text: string) => parseEventsCsv(text, BIRTH, END_AGE);
const header = 'title,start_date,end_date,color,icon';

describe('parseEventsCsv — happy path', () => {
  it('parses the bundled template without errors', () => {
    const result = parse(CSV_TEMPLATE);
    expect(result.errors).toEqual([]);
    expect(result.events.length).toBe(4);
    expect(result.events[0].title).toBe('University');
  });

  it('defaults a blank end date to the start date', () => {
    const { events, errors } = parse(`${header}\nWedding,2019-05-18,,#a63d2f,Marriage`);
    expect(errors).toEqual([]);
    expect(formatDateForInput(events[0].endDate)).toBe('2019-05-18');
  });

  it('assigns a palette colour when the colour cell is blank', () => {
    const { events } = parse(`${header}\nA,2019-05-18,,,Star\nB,2019-06-18,,,Star`);
    expect(events[0].color).toBe(eventColors[0]);
    expect(events[1].color).toBe(eventColors[1]);
  });

  it('accepts both 3- and 6-digit hex colours', () => {
    const { events } = parse(`${header}\nA,2019-05-18,,#abc,Star\nB,2019-06-18,,#AABBCC,Star`);
    expect(events[0].color).toBe('#abc');
    expect(events[1].color).toBe('#AABBCC');
  });

  it('falls back to Star for an unknown icon', () => {
    const { events } = parse(`${header}\nA,2019-05-18,,#abc,NotARealIcon`);
    expect(events[0].icon).toBe('Star');
  });

  it('matches icon names case-insensitively', () => {
    const { events } = parse(`${header}\nA,2019-05-18,,#abc,gRaDuAtIoN`);
    expect(events[0].icon).toBe('Graduation');
  });
});

describe('parseEventsCsv — column aliases', () => {
  it.each([
    ['event,from,to', 'event/from/to'],
    ['name,start,end', 'name/start/end'],
    ['milestone,startdate,enddate', 'milestone/startdate/enddate'],
  ])('accepts the %s header spelling', (headerRow) => {
    const { events, errors } = parse(`${headerRow}\nA,2019-05-18,2019-06-18`);
    expect(errors).toEqual([]);
    expect(events[0].title).toBe('A');
  });

  it('ignores header casing and surrounding whitespace', () => {
    const { events, errors } = parse(`  TITLE , Start_Date \nA,2019-05-18`);
    expect(errors).toEqual([]);
    expect(events[0].title).toBe('A');
  });

  it('accepts "colour" as well as "color"', () => {
    const { events } = parse(`title,start_date,colour\nA,2019-05-18,#abc`);
    expect(events[0].color).toBe('#abc');
  });
});

describe('parseEventsCsv — CSV syntax', () => {
  it('handles quoted fields containing commas', () => {
    const { events, errors } = parse(`${header}\n"Smith, Jane & co",2019-05-18,,#abc,Star`);
    expect(errors).toEqual([]);
    expect(events[0].title).toBe('Smith, Jane & co');
  });

  it('handles escaped double quotes', () => {
    const { events } = parse(`${header}\n"The ""big"" move",2019-05-18,,#abc,Star`);
    expect(events[0].title).toBe('The "big" move');
  });

  it('handles CRLF line endings', () => {
    const { events, errors } = parse(`${header}\r\nA,2019-05-18,,#abc,Star\r\n`);
    expect(errors).toEqual([]);
    expect(events.length).toBe(1);
  });

  it('skips blank lines rather than reporting them as errors', () => {
    const { events, errors } = parse(`${header}\n\nA,2019-05-18,,#abc,Star\n\n`);
    expect(errors).toEqual([]);
    expect(events.length).toBe(1);
  });

  it('tolerates rows with missing trailing columns', () => {
    const { events, errors } = parse(`${header}\nA,2019-05-18`);
    expect(errors).toEqual([]);
    expect(events[0].icon).toBe('Star');
  });
});

describe('parseEventsCsv — rejection and partial import', () => {
  it('reports an empty file', () => {
    expect(parse('').errors).toEqual(['The file is empty.']);
  });

  it('rejects a file with no title/start_date columns', () => {
    const { events, errors } = parse('foo,bar\n1,2');
    expect(events).toEqual([]);
    expect(errors[0]).toMatch(/Could not find/);
  });

  it('imports the good rows and reports only the bad ones', () => {
    const { events, errors } = parse(
      `${header}\nGood,2019-05-18,,#abc,Star\n,2019-05-18,,#abc,Star\nAlsoGood,2020-05-18,,#abc,Star`
    );
    expect(events.map(e => e.title)).toEqual(['Good', 'AlsoGood']);
    expect(errors.length).toBe(1);
    expect(errors[0]).toMatch(/Row 3: missing title/);
  });

  it('reports the spreadsheet line number, not the array index', () => {
    const { errors } = parse(`${header}\nGood,2019-05-18\nBad,not-a-date`);
    expect(errors[0]).toMatch(/^Row 3 \(Bad\)/);
  });

  it.each([
    ['not-a-date', 'free text'],
    ['18/05/2019', 'DD/MM/YYYY'],
    ['2019-5-8', 'unpadded parts'],
    ['2020-02-31', 'a date that rolls over'],
    ['2019-13-01', 'month 13'],
  ])('rejects %s (%s) as a start date', (value) => {
    const { events, errors } = parse(`${header}\nA,${value}`);
    expect(events).toEqual([]);
    expect(errors[0]).toMatch(/start date must be YYYY-MM-DD/);
  });

  it('rejects an end date before the start date', () => {
    const { errors } = parse(`${header}\nA,2019-05-18,2019-05-01`);
    expect(errors[0]).toMatch(/end date is before start date/);
  });

  it('rejects an event starting before the birth date', () => {
    const { errors } = parse(`${header}\nA,1989-01-01`);
    expect(errors[0]).toMatch(/starts before your birth date/);
  });

  it('rejects an event ending after the life expectancy', () => {
    const { errors } = parse(`${header}\nA,2085-01-01,2085-06-01`);
    expect(errors[0]).toMatch(/ends after age 90/);
  });

  it('accepts an event on the birth date itself', () => {
    const { events, errors } = parse(`${header}\nBorn,1990-03-12`);
    expect(errors).toEqual([]);
    expect(events.length).toBe(1);
  });
});
