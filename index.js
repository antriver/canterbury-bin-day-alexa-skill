// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const { getNextCollectionString, getAddress, getCollections } = require('./bins');

const RubbishIntentHandler = {
    canHandle(handlerInput) {
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BIntent')
            || Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {

        const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
        const consentToken = requestEnvelope.context.System.user.permissions
            && requestEnvelope.context.System.user.permissions.consentToken;
        if (!consentToken) {
            return responseBuilder
                .speak('Please enable Location permissions in the Amazon Alexa app.')
                .withAskForPermissionsConsentCard(['read::alexa:device:all:address'])
                .getResponse();
        }

        try {
            const { deviceId } = requestEnvelope.context.System.device;
            const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
            const address = await deviceAddressServiceClient.getFullAddress(deviceId);

            let response;
            if (address.addressLine1 === null && address.stateOrRegion === null) {
                response = responseBuilder
                    .speak(`It looks like you don't have an address set. You can set your address from the companion app.`)
                    .getResponse();
            } else {
                try {
                    // Got the address. Now find which bin round they are from CCC.
                    const addressData = await getAddress(address.postalCode, address.addressLine1);

                    // Find the next collection from CCC.
                    const collections = await getCollections(addressData);

                    const collectionText = getNextCollectionString(collections);

                    return responseBuilder
                        .speak(collectionText)
                        .getResponse();

                } catch (e) {
                    return responseBuilder
                        .speak('Sorry, ' + e.message)
                        .getResponse();
                }
            }
            return response;
        } catch (error) {
            if (error.name !== 'ServiceError') {
                const response = responseBuilder
                    .speak('Uh Oh. Looks like something went wrong.')
                    .getResponse();

                return response;
            }
            throw error;
        }
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .withApiClient(
        new Alexa.DefaultApiClient()
    )
    .addRequestHandlers(
        RubbishIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .lambda();
