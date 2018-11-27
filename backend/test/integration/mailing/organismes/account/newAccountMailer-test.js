const configuration = require('config');
const assert = require('assert');
const { withMongoDB } = require('../../../../helpers/test-db');
const { newComment, newOrganismeAccount } = require('../../../../helpers/data/dataset');
const logger = require('../../../../helpers/test-logger');
const newAccountMailer = require('../../../../../jobs/mailing/organismes/account/newAccountMailer');

let fakeMailer = spy => {
    return {
        sendOrganisationAccountLink: async (options, organisme, callback) => {
            await callback();
            spy.push(options);
        }
    };
};

describe(__filename, withMongoDB(({ getTestDatabase, insertIntoDatabase }) => {

    it('should send email by siret', async () => {

        let spy = [];
        let db = await getTestDatabase();

        await Promise.all([
            insertIntoDatabase('comment', newComment({
                training: {
                    organisation: {
                        siret: `${31705038300064}`,
                    },
                }
            })),
            insertIntoDatabase('organismes', newOrganismeAccount({
                _id: 31705038300064,
                SIRET: 31705038300064,
                courriel: 'new@organisme.fr',
                meta: {
                    nbAvis: 1,
                    siretAsString: `${31705038300064}`,
                },
                mailSentDate: null,
            })),
        ]);

        let { sendEmailBySiret } = newAccountMailer(db, logger, configuration, fakeMailer(spy));
        let results = await sendEmailBySiret('31705038300064');

        assert.deepEqual(results, { mailSent: 1 });
        assert.deepEqual(spy, [{
            to: 'new@organisme.fr'
        }]);
    });

    it('should send emails by region', async () => {

        let spy = [];
        let db = await getTestDatabase();

        await Promise.all([
            insertIntoDatabase('comment', newComment({
                training: {
                    organisation: {
                        siret: `${31705038300064}`,
                    },
                }
            })),
            insertIntoDatabase('organismes', newOrganismeAccount({
                _id: 31705038300064,
                SIRET: 31705038300064,
                courriel: 'new@organisme.fr',
                meta: {
                    nbAvis: 1,
                    siretAsString: `${31705038300064}`,
                },
                passwordHash: null,
                sources: ['intercarif'],
                mailSentDate: null,
            })),
            insertIntoDatabase('organismes', newOrganismeAccount({
                _id: 11111111111111,
                SIRET: 11111111111111,
                meta: {
                    nbAvis: 0,
                    siretAsString: '11111111111111',
                },
                passwordHash: null,
                sources: ['intercarif'],
                mailSentDate: null,
            })),
        ]);

        let { sendEmailsByRegion } = newAccountMailer(db, logger, configuration, fakeMailer(spy));
        let results = await sendEmailsByRegion('11');

        assert.deepEqual(results, { mailSent: 1 });
        assert.deepEqual(spy, [{
            to: 'new@organisme.fr'
        }]);
    });

    it('should not resent emails', async () => {

        let spy = [];
        let db = await getTestDatabase();

        await Promise.all([
            insertIntoDatabase('comment', newComment({
                training: {
                    organisation: {
                        siret: `${31705038300064}`,
                    },
                }
            })),
            insertIntoDatabase('organismes', newOrganismeAccount({
                _id: 31705038300064,
                SIRET: 31705038300064,
                courriel: 'new@organisme.fr',
                meta: {
                    nbAvis: 1,
                    siretAsString: `${31705038300064}`,
                },
                mailSentDate: new Date(),
            })),
        ]);

        let { sendEmailsByRegion } = newAccountMailer(db, logger, configuration, fakeMailer(spy));
        let results = await sendEmailsByRegion('11');

        assert.deepEqual(results, { mailSent: 0 });
        assert.deepEqual(spy, []);
    });

    it('should ignore account from another region', async () => {

        let spy = [];
        let db = await getTestDatabase();

        await Promise.all([
            insertIntoDatabase('comment', newComment({
                training: {
                    organisation: {
                        siret: `${31705038300064}`,
                    },
                }
            })),
            insertIntoDatabase('organismes', newOrganismeAccount({
                _id: 31705038300064,
                SIRET: 31705038300064,
                courriel: 'new@organisme.fr',
                meta: {
                    nbAvis: 1,
                    siretAsString: `${31705038300064}`,
                },
                codeRegion: '17',
            })),
        ]);

        let { sendEmailsByRegion } = newAccountMailer(db, logger, configuration, fakeMailer(spy));
        let results = await sendEmailsByRegion('11');

        assert.deepEqual(results, { mailSent: 0 });
        assert.deepEqual(spy, []);
    });
}));