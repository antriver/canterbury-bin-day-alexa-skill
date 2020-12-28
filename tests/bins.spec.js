const { getRound } = require('../bins');

describe('getRound', () => {
    it('Should get the bin round', () => {
        return getRound('CT1 1DN', '60 Old Park Avenue')
            .then((result) => {
                expect(result).toBe('WedB');
            });
    });
});
