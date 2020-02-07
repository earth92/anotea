import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route, Switch } from 'react-router-dom';
import MonComptePage from '../common/MonComptePage';
import OrganismePage from './OrganismePage';

export default class OrganismeRoutes extends React.Component {

    static propTypes = {
        router: PropTypes.object.isRequired,
    };

    render() {
        let { router } = this.props;
        return (
            <Switch>
                <Route path={'/backoffice/organisme/avis'} render={() => {
                    return <OrganismePage router={router} />;
                }} />
                <Route path={'/backoffice/organisme/mon-compte'} component={MonComptePage} />
                <Redirect to="/backoffice/organisme/avis" />
            </Switch>
        );
    }
}
