import React from 'react';
import PropTypes from 'prop-types';
import Page from '../../backoffice/common/page/Page';
import Panel from '../../backoffice/common/page/panel/Panel';
import InputText from '../../backoffice/common/page/form/InputText';
import Button from '../../backoffice/common/Button';
import { AuthForm } from '../AuthForm';
import { askNewPassword } from './passwordService';
import './MotDePasseOubliePage.scss';

export default class MotDePasseOubliePage extends React.Component {

    static propTypes = {
        navigator: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            identifiant: '',
            error: null,
        };
    }

    onSubmit = () => {
        this.setState({ loading: true });

        askNewPassword(this.state.identifiant)
        .then(() => {
            this.setState({ error: null, identifiant: '', loading: false }, () => {
                this.goToLoginPage();
            });
        })
        .catch(() => {
            this.setState({ error: true, loading: false });
        });
    };

    goToLoginPage = () => {
        this.props.navigator.goToPage('/admin');
    };

    render() {

        return (
            <Page
                className="MotDePasseOubliePage"
                title={'Votre espace Anotéa'}
                panel={
                    <Panel
                        backgroundColor="blue"
                        results={
                            <AuthForm
                                title="Mot de passe oublié"
                                elements={
                                    <>
                                        <label>Entrez votre identifiant et confirmer l'envoi</label>
                                        <InputText
                                            className={this.state.error ? 'input-error' : ''}
                                            value={this.state.identifiant}
                                            placeholder="Adresse email ou siret"
                                            onChange={event => this.setState({ identifiant: event.target.value })}
                                        />
                                        <p className="clarification mt-3">
                                            L&apos;adresse mail est celle sur laquelle vous avez reçu la
                                            proposition de création de compte Anotéa,
                                            si vous ne la connaissez pas,
                                            <a
                                                className="contactez-nous pl-1"
                                                href="mailto:anotea@pole-emploi.fr">
                                                contactez-nous
                                            </a>.
                                        </p>
                                    </>
                                }
                                buttons={
                                    <>
                                        <Button
                                            size="small"
                                            type="submit"
                                            onClick={this.goToLoginPage}
                                        >
                                            Retour
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="large"
                                            color="blue"
                                            disabled={this.state.loading}
                                            onClick={this.onSubmit}
                                        >
                                            Confirmer
                                        </Button>
                                    </>
                                }
                            />
                        }
                    />
                }
            />
        );
    }
}
