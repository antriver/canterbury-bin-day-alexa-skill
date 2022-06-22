const moment = require('moment-timezone');
const axios = require('axios');

/**
 * @param {string} postcode
 * @param {string} addressLine1
 *
 * @returns {Promise<{}>}
 */
const getAddress = (postcode, addressLine1) => {
    let lowerAddress = addressLine1.toLowerCase();

    return axios
        .get('https://trsewmllv7.execute-api.eu-west-2.amazonaws.com/dev/address?type=standard&postcode=' + encodeURIComponent(postcode))
        .then((response) => {
            const addressResult = response.data.candidates.find((candidate) => {
                return candidate.address.toLowerCase().indexOf(lowerAddress) !== -1;
            });

            if (!addressResult) {
                throw new Error('I couldn\'t find any addresses for your post code. Please check you have entered your post code correctly and it is within Canterbury.');
            }

            const uprn = addressResult.attributes.UPRN;
            const usrn = addressResult.attributes.USRN;

            return {
                uprn,
                usrn,
            };
        });
};

const getCollections = ({uprn, usrn}) => {
    return axios
        .post(
            'https://zbr7r13ke2.execute-api.eu-west-2.amazonaws.com/Beta/get-bin-dates',
            {
                uprn,
                usrn,
            },
        )
        .then((response) => {
            const dates = JSON.parse(response.data.dates);

            return organiseDates(dates);
        });
};

const organiseDates = (data) => {
    const byDates = [];

    const keys = [
        'blackBinDay',
        'recyclingBinDay',
        'gardenBinDay',
        'foodBinDay',
    ];

    keys.forEach((key) => {
        data[key].forEach((date) => {
            date = new Date(date);
            let ymd = dateToYmd(date);
            if (!byDates.hasOwnProperty(ymd)) {
                byDates[ymd] = {
                    date,
                    ymd,
                    collections: [],
                };
            }

            byDates[ymd].collections.push(key);
        });
    });

    // Sort by date.
    let collections = Object.values(byDates);
    collections.sort((a, b) => {
        return a.date.getTime() - b.date.getTime();
    });

    return collections;
};

function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

/**
 * @param {Date} date
 *
 * @return {string}
 */
const dateToYmd = (date) => {
    return String(date.getFullYear()) + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());

    // Could do this but then the UK time is converted to UTC and it can end up being the wrong date.
    // return date.toISOString().substr(0, 10);
};

/**
 * @param {{date: Date, collections: string[]}[]} collections
 *
 * @return {string}
 */
const getNextCollectionString = (collections) => {
    let string = '';

    let firstCollection = collections[0];
    if (firstCollection) {
        string += 'Your next collection is ' + collectionToString(firstCollection) + '.';
    }

    let secondCollection = collections[1];
    if (secondCollection) {
        string += ' The following collection is ' + collectionToString(secondCollection) + '.';
    }

    return string;
};

/**
 * @param {{date: Date, collections: string[]}} collection
 *
 * @return {string}
 */
const collectionToString = (collection) => {
    const collectionNames = collection.collections.map(convertCollectionName);

    let text = collectionNames.join(' and ');
    const date = parseDate(collection.date);
    if (date.isToday) {
        text += `, today (${date.formattedDate})`;
    } else if (date.isTomorrow) {
        text += `, tomorrow (${date.formattedDate})`;
    } else {
        text += `, on ${date.formattedDate}`;
    }

    return text;
};

const convertCollectionName = (collectionName) => {
    const names = {
        'blackBinDay': 'general waste',
        'recyclingBinDay': 'recylcing',
        'gardenBinDay': 'garden waste',
        'foodBinDay': 'food waste',
    }

    return names[collectionName] || collectionName;
}

/**
 * @param {Date} date
 * @returns {{formattedDate: string, isToday: boolean, isTomorrow: boolean}}
 */
const parseDate = (date) => {
    date = moment.tz(dateToYmd(date), 'YYYY-MM-DD', 'Europe/London');

    let now = moment.tz('Europe/London');
    const isToday = date.format('Y-MM-DD') === now.format('Y-MM-DD');

    let tomorrow = moment.tz('Europe/London').add(1, 'd');
    const isTomorrow = date.format('Y-MM-DD') === tomorrow.format('Y-MM-DD');

    let formattedDate = date.format('dddd MMMM Do');

    return {
        formattedDate,
        isToday,
        isTomorrow,
    };
};

module.exports = {
    getAddress,
    getCollections,
    getNextCollectionString,
    parseDate,
};
