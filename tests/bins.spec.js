const { getRound, parseDate, getNextCollection } = require('../bins');

// These tests only make sense at the time they were written, because I'm lazily trying to check a bugfix.

describe('getRound', () => {
    it('Should get the bin round', () => {
        return getRound('CT1 1DN', '60 Old Park Avenue')
            .then((result) => {
                expect(result).toBe('WedB');
            });
    });
});

describe('getNextCollection', () => {
    it('Should return a string', () => {
        return getNextCollection('WedB')
            .then((result) => {
                expect(result).toBe("Your next collection is recycling, on Saturday January 2nd. This includes your red, blue and silver bins or boxes.");
            });
    });
});

describe('parseDate', () => {
    it('Should parse date in current year', () => {
        let dateString = 'Monday 28 December';
        let result = parseDate(dateString);
        expect(result).toEqual(
            {
                dateString: 'Monday 28 December 2020',
                formattedDate: 'Monday December 28th',
                isToday: false,
                isTomorrow: false
            }
        )
    });

    it('Should work with Jan next year', () => {
        let dateString = 'Saturday 02 January';
        let result = parseDate(dateString);
        expect(result).toEqual(
            {
                dateString: 'Saturday 02 January 2021',
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
                dateString: 'Saturday 02 January 2021',
                formattedDate: 'Saturday January 2nd',
                isToday: false,
                isTomorrow: false
            }
        )
    });

    it('Should work with Jan next year junk', () => {
        let dateString = 'Saturday 02 January*includes Christmas date change';
        let result = parseDate(dateString);
        expect(result).toEqual(
            {
                dateString: 'Saturday 02 January 2021',
                formattedDate: 'Saturday January 2nd',
                isToday: false,
                isTomorrow: false
            }
        )
    });
});
