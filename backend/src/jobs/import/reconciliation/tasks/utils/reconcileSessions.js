const computeScore = require('./computeScore');
const { flatten } = require('../../../../job-utils');

module.exports = (formation, allAvis) => {

    return formation.actions.reduce((acc, action) => {

        if (!action.lieu_de_formation.coordonnees.adresse) {
            return acc;
        }

        let codePostal = action.lieu_de_formation.coordonnees.adresse.codepostal;
        let siret = action.organisme_formateur.siret_formateur.siret;
        let avis = allAvis.filter(a => {
            return a.formation.action.lieu_de_formation.code_postal === codePostal &&
                a.formation.action.organisme_formateur.siret === siret;
        });

        return [
            ...acc,
            ...action.sessions.map(session => {

                let id = `${formation._attributes.numero}|${action._attributes.numero}|${session._attributes.numero}`;
                return {
                    _id: id,
                    numero: session._attributes.numero,
                    region: action.lieu_de_formation.coordonnees.adresse.region,
                    code_region: action.lieu_de_formation.coordonnees.adresse.code_region,
                    avis: avis || [],
                    score: computeScore(avis),
                    formation: {
                        numero: formation._attributes.numero,
                        intitule: formation.intitule_formation,
                        domaine_formation: {
                            formacodes: formation._meta.formacodes,
                        },
                        certifications: {
                            certifinfos: formation._meta.certifinfos,
                        },
                        organisme_responsable: {
                            raison_sociale: formation.organisme_formation_responsable.raison_sociale,
                            siret: formation.organisme_formation_responsable.siret_organisme_formation.siret,
                            numero: formation.organisme_formation_responsable._attributes.numero,
                        },
                        action: {
                            numero: action._attributes.numero,
                            lieu_de_formation: {
                                code_postal: codePostal,
                                ville: action.lieu_de_formation.coordonnees.adresse.ville,
                            },
                            organisme_financeurs: action.organisme_financeurs ?
                                flatten(action.organisme_financeurs.map(of => of.code_financeur)) : [],
                            organisme_formateur: {
                                raison_sociale: action.organisme_formateur.raison_sociale_formateur,
                                siret: siret,
                                numero: action.organisme_formateur._attributes ? action.organisme_formateur._attributes.numero : null,
                            },
                        },
                    },
                    meta: {
                        import_date: new Date(),
                        source: {//TODO remove source field in v2
                            numero_formation: formation._attributes.numero,
                            numero_action: action._attributes.numero,
                            numero_session: session._attributes.numero,
                            type: 'intercarif',
                        },
                        reconciliation: {
                            //TODO must be converted into an array in v2
                            organisme_formateur: siret,
                            lieu_de_formation: codePostal,
                            certifinfos: formation._meta.certifinfos,
                            formacodes: formation._meta.formacodes,
                        },
                    },
                };
            }),
        ];
    }, []);

};
