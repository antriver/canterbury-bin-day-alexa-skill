const { getRound, parseDate } = require('../bins');

describe('getRound', () => {
    it('Should get the bin round', () => {
        return getRound('CT1 1DN', '60 Old Park Avenue')
            .then((result) => {
                expect(result).toBe('WedB');
            });
    });
});

// These tests only make sense at the time they were written, because I'm lazily trying to check a bugfix.
describe('parseDate', () => {
    it('Should parse date in current year', () => {
        let dateString = 'Monday 28 December';
        let result = parseDate(dateString);
        expect(result).toEqual(
            {
                formattedDate: 'Monday December 28th',
                isToday: true,
                isTomorrow: false
            }
        )
    });

    it('Should work with Jan next year', () => {
        let dateString = 'Saturday 02 January';
        let result = parseDate(dateString);
        expect(result).toEqual(
            {
                formattedDate: 'Saturday January 2nd',
                isToday: false,
                isTomorrow: false
            }
        )
    });

    it('Should work with Jan next year with asterisk', () => {
        let dateString = 'Saturday 02 January*';
        let result = parseDate(dateString);
        expect(result).toEqual(
            {
                formattedDate: 'Saturday January 2nd',
                isToday: false,
                isTomorrow: false
            }
        )
    });
});
