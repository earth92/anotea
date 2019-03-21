import React, { Component } from 'react';
import Notes from './questionnaire/notes/Notes';
import Commentaire from './questionnaire/commentaire/Commentaire';
import Autorisations from './questionnaire/Autorisations';
import GlobalError from './questionnaire/GlobalError';
import ErrorAlert from './questionnaire/ErrorAlert';
import Formation from './common/Formation';
import PropTypes from 'prop-types';
import { getStagiaireInfo, submitAvis } from '../lib/stagiaireService';
import GridDisplayer from './common/library/GridDisplayer';
import Summary from './questionnaire/Summary';
import Modal from './common/library/Modal';
import Button from './common/library/Button';
import './questionnaire.scss';

export default class Questionnaire extends Component {

    static propTypes = {
        token: PropTypes.string.isRequired,
        showRemerciements: PropTypes.func.isRequired,
        setStagiaire: PropTypes.func.isRequired
    };

    state = {
        showModal: false,
        averageScore: 0,
        isNotesValid: false,
        notes: [
            { index: 0, value: null },
            { index: 1, value: null },
            { index: 2, value: null },
            { index: 3, value: null },
            { index: 4, value: null },
        ],
        commentaire: {
            titre: {
                value: '',
                isValid: true,
            },
            texte: {
                value: '',
                isValid: true,
            },
            pseudo: {
                value: '',
                isValid: true,
            },
        },
        stagiaire: null,
        accord: false,
        accordEntreprise: false,
        error: null,
        formError: null,
        submitButtonClicked: false
    };

    constructor(props) {
        super(props);
        this.state.token = props.token;
        this.loadInfo(this.state.token);
    }

    loadInfo = async token => {
        try {
            let info = await getStagiaireInfo(token);
            this.setState({ stagiaire: info.trainee });
            this.props.setStagiaire(info.trainee);
        } catch (ex) {
            let error = await ex.json;
            if (error.statusCode === 423) {
                this.setState({ error: 'already sent' });
            } else {
                this.setState({ error: 'error' });
            }
        }
    };

    scrollToTop = () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    };

    openModal = () => {
        if (this.state.isNotesValid) {
            this.setState({ showModal: true });
        } else {
            this.setState({ submitButtonClicked: true }, () => this.scrollToTop());
        }
    };

    closeModal = () => {
        this.setState({ showModal: false });
    };

    submit = async () => {
        let avis = {
            avis_accueil: this.state.notes[0].value,
            avis_contenu_formation: this.state.notes[1].value,
            avis_equipe_formateurs: this.state.notes[2].value,
            avis_moyen_materiel: this.state.notes[3].value,
            avis_accompagnement: this.state.notes[4].value,
            pseudo: this.state.commentaire.pseudo.value,
            commentaire: {
                texte: this.state.commentaire.pseudo.value,
                titre: this.state.commentaire.titre.value,
            },
            accord: this.state.accord,
            accordEntreprise: this.state.accordEntreprise
        };

        try {
            let response = await submitAvis(this.state.token, avis);
            this.props.showRemerciements(response.infos);
        } catch (ex) {
            let error = await ex.json;
            if (error.statusCode === 400) {
                this.setState({ formError: 'bad data' });
            } else {
                this.setState({ error: 'error' });
            }
        }

        this.closeModal();
    };

    computeAverageScore = () => {
        let total = this.state.notes.reduce((acc, note) => {
            acc += note.value;
            return acc;
        }, 0);
        return parseFloat(total) / 5;
    };

    updateNotes = (notes, isValid) => {
        this.setState({ notes, isNotesValid: isValid }, () => {
            if (isValid) {
                this.setState({ averageScore: this.computeAverageScore() });
            }
        });
    };

    updateCommentaire = (fieldName, value, isValid) => {
        this.setState({
            commentaire: Object.assign({}, this.state.commentaire, {
                [fieldName]: { value, isValid }
            })
        });
    };

    updateAccord = ({ accord, accordEntreprise }) => {
        this.setState({ accord, accordEntreprise });
    };

    isFormValid = () => {
        let commentaire = this.state.commentaire;
        let isCommentaireValid = commentaire.texte.isValid && commentaire.titre.isValid && commentaire.pseudo.isValid;

        return this.state.isNotesValid && isCommentaireValid;
    };

    render() {

        if (this.state.error) {
            return <GlobalError error={this.state.error} />;
        }

        return (
            <div className="questionnaire">
                {false && <GridDisplayer />}
                {!this.state.error && this.state.stagiaire &&
                <div className="container">
                    <Formation stagiaire={this.state.stagiaire} />

                    <Notes
                        notes={this.state.notes}
                        averageScore={this.state.averageScore}
                        onChange={this.updateNotes}
                        showErrorMessage={this.state.submitButtonClicked} />

                    {this.state.isNotesValid &&
                    <Commentaire
                        commentaire={this.state.commentaire}
                        onChange={this.updateCommentaire} />
                    }

                    {this.state.isNotesValid &&
                    <Autorisations onChange={this.updateAccord} />
                    }

                    <div className="row">
                        <div className="col-sm-12 offset-lg-2 col-lg-8">
                            <div className="d-flex justify-content-center">
                                <Button
                                    className="send-button"
                                    size="large"
                                    color="blue"
                                    onClick={this.openModal}
                                    disabled={!this.isFormValid()}>
                                    Envoyer
                                </Button>
                            </div>
                        </div>
                    </div>

                    {this.state.formError === 'bad data' && <ErrorAlert />}

                </div>
                }

                {this.state.showModal &&
                <Modal
                    title="Confirmer l&apos;envoi de l&apos;avis ?"
                    body={
                        <Summary
                            averageScore={this.state.averageScore}
                            commentaire={this.state.commentaire} />
                    }
                    onClose={this.closeModal}
                    onConfirmed={this.submit} />
                }

            </div>
        );
    }
}

