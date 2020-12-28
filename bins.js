const request = require('request');
const moment = require('moment-timezone');
const { parse } = require('node-html-parser');

const getRound = (postcode, addressLine1) => {
    return new Promise((resolve, reject) => {
        let lowerAddress = addressLine1.toLowerCase();
        request(`https://www.canterbury.gov.uk/homepage/29/find_your_bin_collection_dates?postcode=` + encodeURIComponent(postcode), (err, res, body) => {
            if (err || !body) {
                console.error(err);
                reject(new Error('I couldn\'t load your collection round from the council website.'));
                return;
            }

            // console.log('find_your_bin_collection_dates response', body);

            let doc = parse(body);
            let chooser = doc.querySelector('#chooseaddress');

            if (!chooser) {
                reject(new Error('I couldn\'t find any addresses for your post code. Please check you have entered your post code correctly and it is within Canterbury.'));
                return;
            }

            let options = chooser.querySelectorAll('option');
            for (let i in options) {
                if (options.hasOwnProperty(i)) {
                    let o = options[i];
                    let value = o.attributes.value;
                    let round = value.replace('https://www.canterbury.gov.uk/bincalendar?round=', '');
                    let address = o.innerHTML.trim();
                    // console.log(address, round);
                    if (address.toLowerCase().indexOf(lowerAddress) !== -1) {
                        resolve(round);
                        return;
                    }
                }
            }

            reject(new Error('I couldn\'t find your address for that postcode. Please check how you entered your address in the Alexa app matches how it appears on the council website.'));
        });
    });
};

const getNextCollection = (round) => {
    return new Promise((resolve, reject) => {
        request(`https://www.canterbury.gov.uk/bincalendar?round=${round}`, (err, res, body) => {
            if (err || !body) {
                console.error(err);
                reject(new Error('I couldn\'t load your collection date from the council website.'));
                return;
            }

            // console.log('bincalendar response', body);

            let doc = parse(body);

            let answer = doc.querySelector('.widget--your-collection-day').querySelectorAll('p')[0];

            // console.log('answer', answer);

            resolve(formatCollectionText(answer));
        });
    });
};

/**
 * @param {HTMLElement} collectionEl
 */
const formatCollectionText = (collectionEl) => {
    // console.log('collectionEl', collectionEl.innerHTML);

    let type = collectionEl.querySelector('strong').innerHTML.trim();
    let speakType = type === 'general' ? 'general waste' : type;
    // console.log('type', type);

    let dateString = collectionEl.querySelector('.large').innerHTML.trim();
    // console.log('dateString', dateString);

    // console.log('now', (new Date()).toString());
    // console.log('now london', moment.tz('Europe/London').toString());

    let date = parseDate(dateString);
    // console.log('date', date);

    let lines = collectionEl.innerHTML.split('<br />');
    let lastLine = lines[lines.length - 1];
    lastLine = lastLine.replace('Includes', 'This includes');
    // console.log('lastLine', lastLine);

    let collectedOn;
    if (date.isToday) {
        collectedOn = `today (${date.formattedDate})`;
    } else if (date.isTomorrow) {
        collectedOn = `tomorrow (${date.formattedDate})`;
    } else {
        collectedOn = `on ${date.formattedDate}`;
    }

    // Build the text.
    return `Your next collection is ${speakType}, ${collectedOn}. ${lastLine}`;
};

const parseDate = (dateString) => {
    moment.tz.guess();

    // Fudge for the first collection of the year.
    // If today is Monday December 28th 2020
    // If you pass "Saturday 02 January" to moment there is no year in the string and it assumes it's the
    // current year. It then creates an invalid date because there is no Saturday 02 January 2020.
    // To workaround this, if the string contains "January" and the current month is not 0 assume it's the next year,
    // and append the year to the date string.
    const isNextYear = dateString.indexOf('January') !== -1 && (new Date()).getMonth() !== 0;
    const year = isNextYear ? (new Date()).getFullYear() + 1 : (new Date()).getFullYear();

    dateString += ' ' + year;
    console.log('dateString', dateString);

    let date = moment.tz(dateString, 'dddd D MMMM YYYY', 'Europe/London');

    let now = moment.tz('Europe/London');
    const isToday = date.format('Y-MM-DD') === now.format('Y-MM-DD');

    let tomorrow = moment.tz('Europe/London').add(1, 'd');
    const isTomorrow = date.format('Y-MM-DD') === tomorrow.format('Y-MM-DD');

    let formattedDate = date.format('dddd MMMM Do');

    return {
        formattedDate,
        isToday,
        isTomorrow
    }
};

module.exports = {
    getRound,
    getNextCollection,
    parseDate
};
