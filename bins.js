const request = require('request');
const moment = require('moment-timezone');
const { parse } = require('node-html-parser');

/**
 * @param {string} postcode
 * @param {string} addressLine1
 * @returns {Promise<string>}
 */
const getRound = (postcode, addressLine1) => {
    return new Promise((resolve, reject) => {
        let lowerAddress = addressLine1.toLowerCase();
        request(`https://www.canterbury.gov.uk/homepage/29/find_your_bin_collection_dates?postcode=` + encodeURIComponent(postcode), (err, res, body) => {
            if (err || !body) {
                console.error(err);
                reject(new Error('I couldn\'t load your collection round from the council website.'));
                return;
            }

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

/**
 * @param {string} round
 * @returns {Promise<string>}
 */
const getNextCollection = (round) => {
    return fetchCollectionInfo(round)
        .then((answer) => {
            return formatCollectionText(answer);
        })
};

/**
 * Loads the page for the collection round and returns the HTMLElement representing the next collection.
 *
 * @param {string} round
 * @returns {Promise<HTMLElement>}
 */
const fetchCollectionInfo = (round) => {
    return new Promise((resolve, reject) => {
        request(`https://www.canterbury.gov.uk/bincalendar?round=${round}`, (err, res, body) => {
            if (err || !body) {
                console.error(err);
                reject(new Error('I couldn\'t load your collection date from the council website.'));
                return;
            }

            let doc = parse(body);
            let answer = doc.querySelector('.widget--your-collection-day').querySelectorAll('p')[0];

            resolve(answer);
        });
    });
};

/**
 * @param {HTMLElement} collectionEl
 */
const formatCollectionText = (collectionEl) => {
    let type = collectionEl.querySelector('strong').innerHTML.trim();
    let speakType = type === 'general' ? 'general waste' : type;

    let dateString = collectionEl.querySelector('.large').innerText.trim();
    let date = parseDate(dateString);
    console.log('date', date);

    let lines = collectionEl.innerHTML.split('<br />');
    let lastLine = lines[lines.length - 1];

    const includesMatch = lastLine.match(/Includes.*\./);
    const binTypes = includesMatch[0].replace('Includes', 'This includes');

    let collectedOn;
    if (date.isToday) {
        collectedOn = `today (${date.formattedDate})`;
    } else if (date.isTomorrow) {
        collectedOn = `tomorrow (${date.formattedDate})`;
    } else {
        collectedOn = `on ${date.formattedDate}`;
    }

    // Build the text.
    const str = `Your next collection is ${speakType}, ${collectedOn}. ${binTypes}`;
    console.log('str', str);

    return str;
};

/**
 * @param {string} dateString
 * @returns {{formattedDate: string, dateString: string, isToday: boolean, isTomorrow: boolean}}
 */
const parseDate = (dateString) => {
    moment.tz.guess();

    dateString = dateString.match(/^\w+ \d{2} \w+/)[0]

    // Fudge for the first collection of the year.
    // If today is Monday December 28th 2020
    // If you pass "Saturday 02 January" to moment there is no year in the string and it assumes it's the
    // current year. It then creates an invalid date because there is no Saturday 02 January 2020.
    // To workaround this, if the string contains "January" and the current month is not 0 assume it's the next year,
    // and append the year to the date string.
    const isNextYear = dateString.indexOf('January') !== -1 && (new Date()).getMonth() !== 0;
    const year = isNextYear ? (new Date()).getFullYear() + 1 : (new Date()).getFullYear();

    dateString += ' ' + year;

    let date = moment.tz(dateString, 'dddd D MMMM YYYY', 'Europe/London');

    let now = moment.tz('Europe/London');
    const isToday = date.format('Y-MM-DD') === now.format('Y-MM-DD');

    let tomorrow = moment.tz('Europe/London').add(1, 'd');
    const isTomorrow = date.format('Y-MM-DD') === tomorrow.format('Y-MM-DD');

    let formattedDate = date.format('dddd MMMM Do');

    return {
        dateString,
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
