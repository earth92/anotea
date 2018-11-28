const assert = require('assert');
const configuration = require('config');
const { withMongoDB } = require('../../../../helpers/test-db');
const { newTrainee, randomize } = require('../../../../helpers/data/dataset');
const logger = require('../../../../helpers/test-logger');
const CampaignMailer = require('../../../../../jobs/mailing/campaign/CampaignMailer');
const SendAction = require('../../../../../jobs/mailing/campaign/actions/SendAction');
const { successMailer } = require('../fake-mailers');

describe(__filename, withMongoDB(({ getTestDatabase, insertIntoDatabase }) => {

    it('should select trainee according to its state', async () => {

        let emailsSent = [];
        let db = await getTestDatabase();
        let id = randomize('trainee');
        let email = `${randomize('name')}@email.fr`;
        await Promise.all([
            insertIntoDatabase('trainee', newTrainee({
                _id: id,
                sourceIDF: null,
                mailSent: false,
                unsubscribe: false,
                trainee: {
                    email: email,
                },
            })),
        ]);

        let campaignMailer = new CampaignMailer(db, logger, successMailer(emailsSent));
        let handler = new SendAction(db, configuration);

        await campaignMailer.sendEmails(handler);

        assert.deepEqual(emailsSent, [{ to: email }]);
    });


}));
