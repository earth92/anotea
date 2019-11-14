const emailHelper = require('../../../smtp/emailHelper');
const getOrganismeEmail = require('../../utils/getOrganismeEmail');

module.exports = (db, mailer, configuration, regions) => {

    let helper = emailHelper(configuration);

    let build = (organisme, comment, options = {}) => {
        return helper.templates('organisme_avis_signale_publie', {
            trackingLink: helper.getTrackingLink(organisme.token),
            consultationLink: `${configuration.app.public_hostname}/mail/${organisme.token}/reponseRejetee/${avis.token}`,
            avis: comment.comment.text,
            organisme,
            ...options,
        });
    };

    return {
        build,
        send: async (organisme, comment) => {

            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            let content = await build(organisme, comment, { webView: false });

            return mailer.sendNewEmail(getOrganismeEmail(organisme), region, {
                subject: `Pôle Emploi - avis signalé dans votre Espace Anotéa`,
                ...content,
            });
        },
    };
};
