import React from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import GestionOrganismePage from './gestion-organismes/GestionOrganismePage';
import StagiairesEmailsPreviewPage from './courriels/StagiairesEmailsPreviewPage';
import ModerationAvisPage from './moderation-avis/ModerationAvisPage';
import ModerationReponsesPage from './moderation-avis/ModerationReponsesPage';
import MonComptePage from '../misc/MonComptePage';
import OrganismesEmailsPreviewPage from './courriels/OrganismesEmailsPreviewPage';

export default class ModerateurRoutes extends React.Component {

    static propTypes = {
        navigator: PropTypes.object.isRequired,
    };

    render() {
        let { navigator } = this.props;

        return (
            <>
                <Route path="/admin/moderateur/emails/stagiaires" render={() => {
                    return <StagiairesEmailsPreviewPage navigator={navigator} />;
                }} />
                <Route path="/admin/moderateur/emails/organismes" render={() => {
                    return <OrganismesEmailsPreviewPage navigator={navigator} />;
                }} />
                <Route
                    path="/admin/moderateur/gestion/organismes"
                    render={() => <GestionOrganismePage navigator={navigator} />}
                />
                <Route
                    path="/admin/moderateur/moderation/avis/stagiaires"
                    render={() => <ModerationAvisPage navigator={navigator} />}
                />
                <Route
                    path="/admin/moderateur/moderation/avis/reponses"
                    render={() => <ModerationReponsesPage navigator={navigator} />}
                />

                <Route
                    path={'/admin/moderateur/mon-compte'}
                    component={MonComptePage}
                />
            </>
        );
    }
}
