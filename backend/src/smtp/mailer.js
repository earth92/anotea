const path = require('path');

module.exports = function(db, logger, configuration, regions) {

    const nodemailer = require('nodemailer');
    const ejs = require('ejs');
    const moment = require('moment');

    const configSmtp = {
        host: configuration.smtp.host,
        port: configuration.smtp.port,
        secure: configuration.smtp.secure,
        tls: {
            rejectUnauthorized: false
        },
        name: configuration.smtp.hostname,
        greetingTimeout: configuration.smtp.greetingTimeout
    };

    if (configuration.smtp.user !== undefined) {
        configSmtp.auth = {
            user: configuration.smtp.user,
            pass: configuration.smtp.password
        };
    }

    const transporter = nodemailer.createTransport(configSmtp);

    const getConsultationLink = trainee => {
        return `${configuration.app.public_hostname}/mail/${trainee.token}?utm_source=PE&utm_medium=mail&utm_campaign=${trainee.campaign}`;
    };

    const getUnsubscribeLink = trainee => {
        return `${configuration.app.public_hostname}/mail/${trainee.token}/unsubscribe`;
    };

    const getFormLink = trainee => {
        return `${configuration.app.public_hostname}/questionnaire/${trainee.token}?utm_source=PE&utm_medium=mail&utm_campaign=${trainee.campaign}`;
    };

    const getTrackingLink = obj => {
        return `${configuration.app.public_hostname}/mail/${obj.token}/track`;
    };

    const getOrganisationPasswordLink = organisation => {
        return `${configuration.app.public_hostname}/admin/activation-compte?token=${organisation.token}`;
    };

    const getRegionEmail = region => {
        return region.contact ? `${region.contact}@pole-emploi.fr` : configuration.smtp.from;
    };

    const getReplyToEmail = region => {
        return `Anotea <${getRegionEmail(region)}>`;
    };

    const buildContent = (template, extension, params) => {
        return new Promise((resolve, reject) => {
            ejs.renderFile(path.join(__dirname, `views/${template}.${extension}`), params, (err, str) => {
                if (err) {
                    logger.error(err);
                    reject(err);
                    return;
                }
                resolve(str);
            });
        });
    };

    const sendMail = (template, params, mailOptions, options = {}) => {
        if (process.env.ANOTEA_MAIL_BCC) {
            mailOptions.bcc = process.env.ANOTEA_MAIL_BCC;
        }
        mailOptions.from = `Anotea <${configuration.smtp.from}>`;

        params.webView = false;

        return new Promise((resolve, reject) => {
            Promise.all([
                buildContent(template, 'txt', params),
                options.textOnly ? Promise.resolve() : buildContent(template, 'ejs', params),
            ])
            .then(values => {
                mailOptions.text = values[0];
                if (!options.textOnly) {
                    mailOptions.html = values[1];
                }

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        logger.error(`An error occurs while sending mail : ${error}̀`);
                        reject(error);
                    } else {
                        logger.info(`Message sent to ${mailOptions.to}`, {
                            messageId: info.messageId,
                            response: info.response,
                        });
                        resolve();
                    }
                });
            }, reason => {
                logger.error(`An error occurs while sending mail : ${reason}`);
                reject(reason);
            });
        });
    };

    const list = {
        help: {
            url: 'https://anotea.pole-emploi.fr/faq'
        },
        unsubscribe: {
            url: 'https://anotea.pole-emploi.fr/admin',
        }
    };

    return {
        getUnsubscribeLink: getUnsubscribeLink,
        getFormLink: getFormLink,
        sendNewCommentsNotification: (emailAddress, data) => {

            let { organisme, pickedComment } = data;

            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            let params = {
                hostname: configuration.app.public_hostname,
                consultationLink: `${configuration.app.public_hostname}/mail/${organisme.token}/nonLus`,
                trackingLink: getTrackingLink(organisme),
                organisme: organisme,
                comment: pickedComment ? pickedComment.comment.text : null,
                contact: getRegionEmail(region)
            };

            return sendMail('organisme_avis_non_lus', params, {
                to: emailAddress,
                list: list,
                replyTo: getReplyToEmail(region),
                subject: `Pôle Emploi - Vous avez ${data.nbUnreadComments} nouveaux avis stagiaires`,
            });
        },
        sendSignalementAccepteNotification: (emailAddress, organisme, avis) => {
            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            let params = {
                hostname: configuration.app.public_hostname,
                trackingLink: getTrackingLink(organisme),
                consultationLink: `${configuration.app.public_hostname}/mail/${organisme.token}/signalementAccepte/${avis.token}`,
                avis: avis.comment.text,
                organisme
            };

            return sendMail('organisme_avis_signale_rejete', params, {
                to: emailAddress,
                subject: `Pôle Emploi - avis signalé dans votre Espace Anotéa`,
                list: list,
                replyTo: getReplyToEmail(region),
            });
        },
        sendSignalementRejeteNotification: (emailAddress, organisme, avis) => {
            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            let params = {
                hostname: configuration.app.public_hostname,
                trackingLink: getTrackingLink(organisme),
                consultationLink: `${configuration.app.public_hostname}/mail/${organisme.token}/signalementRejete/${avis.token}`,
                avis: avis.comment.text,
                organisme
            };

            return sendMail('organisme_avis_signale_publie', params, {
                to: emailAddress,
                subject: `Pôle Emploi - avis signalé dans votre Espace Anotéa`,
                list: list,
                replyTo: getReplyToEmail(region),
            });
        },
        sendReponseRejeteeNotification: (emailAddress, organisme, avis) => {

            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            let params = {
                hostname: configuration.app.public_hostname,
                trackingLink: getTrackingLink(organisme),
                consultationLink: `${configuration.app.public_hostname}/mail/${organisme.token}/reponseRejetee/${avis.token}`,
                contact: getRegionEmail(region),
                organisme: organisme,
                reponse: avis.reponse.text
            };

            return sendMail('organisme_reponse_rejetee', params, {
                to: emailAddress,
                subject: `Pôle Emploi - votre réponse n'a pas été prise en compte`,
                list: list,
                replyTo: getReplyToEmail(region),
            });
        },
        sendOrganisationAccountEmail: (emailAddress, organisme) => {

            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            let params = {
                link: getOrganisationPasswordLink(organisme),
                trackingLink: getTrackingLink(organisme),
                consultationLink: `${configuration.app.public_hostname}/mail/${organisme.token}/password`,
                hostname: configuration.app.public_hostname,
                organisation: organisme,
                contact: getRegionEmail(region)
            };

            return sendMail('organisation_password', params, {
                to: emailAddress,
                subject: 'Pôle Emploi vous donne accès aux avis de vos stagiaires',
                list: list,
                replyTo: getReplyToEmail(region),
            });
        },
        sendQuestionnaireOrganisme: (emailAddress, organisme) => {

            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            let params = {
                formLink: 'https://avril_la_vae_facile.typeform.com/to/X4oxTv',
                consultationLink: `${configuration.app.public_hostname}/mail/${organisme.token}/organisme_questionnaire?utm_source=PE&utm_medium=mail`,
                hostname: configuration.app.public_hostname,
                organisme,
            };

            return sendMail('organisme_questionnaire', params, {
                to: emailAddress,
                subject: 'Aidez-nous à améliorer Anotéa',
                list: list,
                replyTo: getReplyToEmail(region),
            });
        },
        sendForgottenPasswordEmail: (emailAddress, codeRegion, passwordToken, profile) => {

            let link = `${configuration.app.public_hostname}/admin/reinitialisation-mot-de-passe?forgottenPasswordToken=${passwordToken}`;
            let consultationLink = `${configuration.app.public_hostname}/mail/${passwordToken}/passwordForgotten`;
            let params = { link, hostname: configuration.app.public_hostname, codeRegion, profile, consultationLink };
            let region = regions.findRegionByCodeRegion(codeRegion);

            return sendMail('password_forgotten', params, {
                to: emailAddress,
                subject: 'Votre compte Anotéa : Demande de renouvellement de mot de passe',
                list: list,
                replyTo: getReplyToEmail(region),
            });
        },
        sendVotreAvisMail: (emailAddress, trainee) => {

            let unsubscribeLink = getUnsubscribeLink(trainee);
            let region = regions.findRegionByCodeRegion(trainee.codeRegion);
            let params = {
                trainee,
                moment,
                region,
                consultationLink: getConsultationLink(trainee),
                unsubscribeLink: unsubscribeLink,
                formLink: getFormLink(trainee),
                trackingLink: getTrackingLink(trainee),
                hostname: configuration.app.public_hostname,
            };

            return sendMail('votre_avis', params, {
                to: emailAddress,
                subject: 'Pôle Emploi vous demande votre avis sur votre formation',
                replyTo: getReplyToEmail(region),
                list: Object.assign({}, list, {
                    unsubscribe: {
                        url: unsubscribeLink,
                    }
                }),
            });

        },
        sendQuestionnaire6MoisMail: (emailAddress, trainee) => {

            let unsubscribeLink = getUnsubscribeLink(trainee);
            let region = regions.findRegionByCodeRegion(trainee.codeRegion);
            let params = {
                trainee,
                moment,
                region,
                unsubscribeLink: unsubscribeLink,
                consultationLink: `${configuration.app.public_hostname}/mail/${trainee.token}/6mois?utm_source=PE&utm_medium=mail&utm_campaign=${trainee.campaign}`,
                formLink: 'https://avril_la_vae_facile.typeform.com/to/gIFh4q',
                trackingLink: getTrackingLink(trainee),
                hostname: configuration.app.public_hostname,
            };

            let mailOptions = {
                to: emailAddress,
                subject: 'Pôle Emploi - Suivi de votre formation',
                replyTo: getReplyToEmail(region),
                list: Object.assign({}, list, {
                    unsubscribe: {
                        url: unsubscribeLink,
                    }
                }),
            };

            return sendMail('questionnaire_6mois', params, mailOptions);

        },
        sendMalformedImport: params => {
            let mailOptions = {
                to: params.source === 'IDF' ? configuration.smtp.idf_error_to : configuration.smtp.pe_error_to,
                cc: configuration.smtp.import_error_cc,
                subject: 'Imports stagiaires IDF : une erreur est survenue',
            };

            return sendMail('malformed_import_idf', params, mailOptions, { textOnly: true });
        },
        sendInjureMail: (emailAddress, trainee, comment) => {

            let unsubscribeLink = getUnsubscribeLink(trainee);
            let region = regions.findRegionByCodeRegion(trainee.codeRegion);
            let params = {
                trainee,
                comment,
                moment,
                consultationLink: `${configuration.app.public_hostname}/mail/${trainee.token}/injure?utm_source=PE&utm_medium=mail&utm_campaign=${trainee.campaign}`,
                unsubscribeLink: unsubscribeLink,
                formLink: getFormLink(trainee),
                hostname: configuration.app.public_hostname,
                email: getReplyToEmail(region)
            };

            return sendMail('avis_injure', params, {
                to: emailAddress,
                subject: 'Rejet de votre avis sur votre formation' +
                    `${trainee.training.title} à ${trainee.training.organisation.name}`,
                replyTo: getReplyToEmail(region),
                list: Object.assign({}, list, {
                    unsubscribe: {
                        url: unsubscribeLink,
                    }
                }),
            });
        },
        sendAlerteMail: (emailAddress, trainee, comment) => {
            let unsubscribeLink = getUnsubscribeLink(trainee);
            let region = regions.findRegionByCodeRegion(trainee.codeRegion);
            let params = {
                trainee,
                comment,
                moment,
                consultationLink: `${configuration.app.public_hostname}/mail/${trainee.token}/alerte?utm_source=PE&utm_medium=mail&utm_campaign=${trainee.campaign}`,
                unsubscribeLink: unsubscribeLink,
                formLink: getFormLink(trainee),
                hostname: configuration.app.public_hostname,
                email: getReplyToEmail(region)
            };

            return sendMail('avis_alerte', params, {
                to: emailAddress,
                subject: 'Nous avons bien pris en compte votre commentaire',
                replyTo: getReplyToEmail(region),
                list: Object.assign({}, list, {
                    unsubscribe: {
                        url: unsubscribeLink,
                    }
                }),
            });
        }
    };
};
