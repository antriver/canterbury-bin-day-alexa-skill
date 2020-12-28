const { getRound, parseDate } = require('../bins');

describe('getRound', () => {
    it('Should get the bin round', () => {
        return getRound('CT1 1DN', '60 Old Park Avenue')
            .then((result) => {
                expect(result).toBe('WedB');
            });
    });
});

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

    it('Should return object', () => {
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
});
