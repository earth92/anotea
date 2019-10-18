const assert = require('assert');
const { withMongoDB } = require('../../../../../helpers/with-mongodb');
const { newTrainee, randomize } = require('../../../../../helpers/data/dataset');
const logger = require('../../../../../helpers/components/fake-logger');
const Questionnaire6MoisMailer = require('../../../../../../src/jobs/mailing/stagiaires/questionnaire6mois/tasks/Questionnaire6MoisMailer');
const { successMailer, errorMailer } = require('../../fake-mailers');

describe(__filename, withMongoDB(({ getTestDatabase, insertIntoDatabase }) => {

    it('should send email to stagiaire', async () => {

        let emailsSent = [];
        let db = await getTestDatabase();
        let email = `${randomize('name')}@email.fr`;
        await Promise.all([
            insertIntoDatabase('trainee', newTrainee({
                campaign: 'STAGIAIRES_AES_TT_REGIONS_DELTA_2019-04-05',
                trainee: {
                    email,
                },
            })),
            insertIntoDatabase('trainee', newTrainee({
                trainee: {
                    email: 'not-sent@trainee.org',
                },
            })),
        ]);

        let mailer = new Questionnaire6MoisMailer(db, logger, successMailer(emailsSent));
        await mailer.sendEmails();

        assert.deepStrictEqual(emailsSent, [{ to: email }]);
        let trainee = await db.collection('trainee').findOne({ 'trainee.email': email });
        let status = trainee.mailing.questionnaire6Mois;
        assert.ok(status.mailSent);
        assert.ok(status.mailSentDate);
        assert.deepStrictEqual(status.mailError, undefined);
        assert.deepStrictEqual(status.mailErrorDetail, undefined);
        assert.deepStrictEqual(status.mailRetry, 0);
    });

    it('should not resend email to stagiaire', async () => {

        let emailsSent = [];
        let db = await getTestDatabase();
        let email = `${randomize('name')}@email.fr`;
        await Promise.all([
            insertIntoDatabase('trainee', newTrainee({
                campaign: 'STAGIAIRES_AES_TT_REGIONS_DELTA_2019-04-05',
                mailSent: false,
                mailSentDate: null,
                trainee: {
                    email,
                },
                mailing: {
                    questionnaire6Mois: {
                        mailSent: true,
                    }
                }
            })),
        ]);

        let mailer = new Questionnaire6MoisMailer(db, logger, successMailer(emailsSent));
        await mailer.sendEmails();

        assert.deepStrictEqual(emailsSent, []);
    });

    it('should flag trainee when mailer fails', async () => {

        let db = await getTestDatabase();
        let email = `${randomize('name')}@email.fr`;
        await Promise.all([
            insertIntoDatabase('trainee', newTrainee({
                campaign: 'STAGIAIRES_AES_TT_REGIONS_DELTA_2019-04-05',
                trainee: {
                    email,
                },
            })),
        ]);

        let mailer = new Questionnaire6MoisMailer(db, logger, errorMailer());

        try {
            await mailer.sendEmails();
            assert.fail();
        } catch (e) {
            let trainee = await db.collection('trainee').findOne({ 'trainee.email': email });
            let status = trainee.mailing.questionnaire6Mois;
            assert.strictEqual(status.mailSent, true);
            assert.strictEqual(status.mailSentDate, undefined);
            assert.deepStrictEqual(status.mailError, 'smtpError');
            assert.deepStrictEqual(status.mailErrorDetail, 'timeout');
        }

    });
}));
