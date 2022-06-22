const { parseDate, getAddress, getCollections, getNextCollectionString } = require('../bins');

// These tests only make sense at the time they were written, because I'm lazily trying to check a bugfix.

describe('getAddress', () => {
    it('Should find the parts for the address', () => {
        return getAddress('CT1 1DN', '78 Old Park Avenue')
            .then((result) => {
                expect(result).toEqual({
                    uprn: '100060818993',
                    usrn: '5600947',
                });
            });
    });
});

describe('getCollections', () => {
    it('Should return collection info', () => {
        return getCollections({ uprn: '100060818993', usrn: '5600947' })
            .then((result) => {
                console.log('result', result);
            });
    });
});

describe('getNextCollectionString', () => {
    it('Should return nice text', () => {
        const collections = [
            {
                date: new Date('2022-06-23T06:00:00.000Z'),
                ymd: '2022-06-23',
                collections: ['gardenBinDay'],
            },
            {
                date: new Date('2022-06-28T23:00:00.000Z'),
                ymd: '2022-06-29',
                collections: ['recyclingBinDay', 'foodBinDay'],
            },
        ];

        const result = getNextCollectionString(collections);

        console.log('result', result);
    });
});

xdescribe('parseDate', () => {
    it('Should parse date in current year', () => {
        let dateString = 'Monday 20 June';
        let result = parseDate(dateString);
        expect(result).toEqual(
            {
                formattedDate: 'Monday June 20th',
                isToday: false,
                isTomorrow: false,
            },
        );
    });

    // it('Should work with Jan next year', () => {
    //     let dateString = 'Saturday 02 January';
    //     let result = parseDate(dateString);
    //     expect(result).toEqual(
    //         {
    //             formattedDate: 'Saturday January 2nd',
    //             isToday: false,
    //             isTomorrow: false
    //         }
    //     )
    // });

    // it('Should work with Jan next year with asterisk', () => {
    //     let dateString = 'Saturday 02 January*';
    //     let result = parseDate(dateString);
    //     expect(result).toEqual(
    //         {
    //             formattedDate: 'Saturday January 2nd',
    //             isToday: false,
    //             isTomorrow: false
    //         }
    //     )
    // });

    // it('Should work with Jan next year junk', () => {
    //     let dateString = 'Saturday 02 January*includes Christmas date change';
    //     let result = parseDate(dateString);
    //     expect(result).toEqual(
    //         {
    //             formattedDate: 'Saturday January 2nd',
    //             isToday: false,
    //             isTomorrow: false
    //         }
    //     )
    // });
});
