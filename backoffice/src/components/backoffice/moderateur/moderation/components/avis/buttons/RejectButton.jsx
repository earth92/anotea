import React from 'react';
import PropTypes from 'prop-types';
import { rejectAvis } from '../../../moderationService';
import Modal from '../../../../../common/Modal';

export default class RejectButton extends React.Component {

    state = {
        showModal: false,
    };

    static propTypes = {
        avis: PropTypes.object.isRequired,
        onChange: PropTypes.func.isRequired,
    };

    reject = async (avis, reason) => {
        this.setState({ showModal: false });
        let updated = await rejectAvis(avis._id, reason);
        this.props.onChange(updated, {
            message: reason !== 'injure' ? null : {
                title: 'Avis rejeté pour injure',
                text: (<span>L&apos;avis a bien été <b>rejeté</b>, un email a été adressé au stagiaire.</span>)
            }
        });
    };

    handleCancel = () => {
        this.setState({ showModal: false });
    };

    getModal = () => {

        let message = {
            title: 'Rejeter cet avis pour injure',
            text: (
                <span>
                    Le <b>rejet pour injure</b> entraîne <b>l&apos;envoi d&apos;un email</b> automatique au stagiaire pour l&apos;informer que le <b>commentaire ne sera pas publié</b>. Confirmez-vous cette demande ?
                </span>
            )
        };

        return (
            <Modal
                message={message}
                onConfirmed={() => this.reject(this.props.avis, 'injure')}
                onClose={this.handleCancel} />
        );
    };

    render() {
        let { avis } = this.props;

        let isRejected = this.props.avis.rejected;
        return (
            <div className="RejectButton a-dropdown btn-group">
                {this.state.showModal && this.getModal()}
                <button
                    type="button"
                    className={`a-btn-large a-btn-red dropdown-toggle ${isRejected ? 'disabled' : ''}`}
                    data-toggle="dropdown">
                    <i className="far fa-times-circle" />
                </button>
                <div className="dropdown-menu dropdown-menu-right">
                    <h6 className="dropdown-header">Rejeter</h6>
                    <a className="dropdown-item" onClick={() => this.setState({ showModal: true })}>Injure</a>
                    <div className="dropdown-divider" />
                    <a className="dropdown-item" onClick={() => this.reject(avis, 'alerte')}>Alerte</a>
                    <div className="dropdown-divider" />
                    <a className="dropdown-item" onClick={() => this.reject(avis, 'non concerné')}>
                        Non concerné
                    </a>
                </div>
            </div>
        );
    }
}
