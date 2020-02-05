module.exports = (db, regions, mailer) => {

    const templateName = 'avisReportedConfirmedEmail';

    let render = (organisme, avis) => {
        return mailer.render(__dirname, templateName, {
            organisme,
            avis
        });
    };

    return {
        templateName,
        render,
        send: async (organisme, avis) => {
            let region = regions.findRegionByCodeRegion(organisme.codeRegion);
            return mailer.createRegionalMailer(region).sendEmail(
                organisme.courriel,
                {
                    subject: 'Pôle Emploi - Avis signalé dans votre Espace Anotéa',
                    body: await render(organisme, avis),
                },
            );
        },
    };
};