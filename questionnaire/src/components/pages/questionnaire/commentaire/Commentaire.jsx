import React, { Component } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { checkBadwords } from '../../../../lib/stagiaireService';
import Badwords from './Badwords';
import './commentaire.scss';

class Commentaire extends Component {

    static propTypes = {
        commentaire: PropTypes.object.isRequired,
        onChange: PropTypes.func.isRequired
    };

    state = {
        texte: '',
        titre: '',
        pseudo: '',
    };

    constructor(props) {
        super(props);
        this.checkBadwords = _.debounce(async (name, value) => {
            let sentence = await checkBadwords(value);
            this.props.onChange(name, value, sentence.isGood);
        }, 750);
    }

    onChange = async event => {
        const { name, value, maxLength } = event.target;
        if (value.length <= maxLength) {
            this.setState({ [name]: value }, () => this.checkBadwords(name, value));
        }
    };

    render() {

        let { commentaire } = this.props;
        return (
            <div className="commentaire">

                <div className="row">
                    <div className="col-sm-12 offset-lg-2 col-lg-8">
                        <h3>
                            Commentaire <span className="description">(optionnel)</span>
                        </h3>
                    </div>
                    <div className="col-sm-12 offset-lg-2 col-lg-8">
                        <div className="row inner-row field">
                            <div className="col-sm-12">
                                <div className="title"><strong>Votre commentaire</strong> (optionnel)</div>
                                <textarea
                                    name="texte"
                                    value={this.state.texte}
                                    maxLength={200}
                                    rows="3"
                                    className={`${!commentaire.texte.isValid ? 'badwords' : ''}`}
                                    placeholder="Dites nous ce que vous auriez aimé savoir avant de rentrer en formation. Restez courtois."
                                    onChange={this.onChange} />
                                {!commentaire.texte.isValid && <Badwords />}
                            </div>
                        </div>

                        <div className="row inner-row field">
                            <div className="col-sm-12">
                                <div className="title"><strong>Titre du commentaire</strong> (optionnel)</div>
                                <input
                                    type="text"
                                    name="titre"
                                    value={this.state.titre}
                                    maxLength={50}
                                    className={`${!commentaire.titre.isValid ? 'badwords' : ''}`}
                                    placeholder="Le titre permet d’avoir un résumé de votre expérience de la formation."
                                    onChange={this.onChange} />
                                {!commentaire.titre.isValid && <Badwords />}
                            </div>
                        </div>

                        <div className="row inner-row field">
                            <div className="col-sm-12">
                                <div className="title"><strong>Pseudo</strong> (optionnel)</div>
                                <input
                                    type="text"
                                    name="pseudo"
                                    value={this.state.pseudo}
                                    maxLength={50}
                                    className={`${!commentaire.pseudo.isValid ? 'badwords' : ''}`}
                                    placeholder="Choisissez votre pseudo afin de préserver votre anonymat."
                                    onChange={this.onChange} />
                                {!commentaire.pseudo.isValid && <Badwords />}
                            </div>
                        </div>
                    </div>
                </div>

                <div>

                </div>
            </div>
        );
    }
}

export default Commentaire;