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
        texte: ''
    };

    constructor(props) {
        super(props);
        let createBadwordsDebouncer = name => {
            return _.debounce(async value => {
                let sentence = await checkBadwords(value);
                this.props.onChange(name, value, sentence.isGood);
            }, 1000);
        };

        this.badwordValidators = {
            texte: createBadwordsDebouncer('texte')
        };
    }

    onChange = async event => {
        const { name, value, maxLength } = event.target;
        if (value.length <= maxLength) {
            this.setState({ [name]: value }, () => {
                return this.badwordValidators[name](value);
            });
        }
    };

    onBlur = async event => {
        const { name } = event.target;
        this.badwordValidators[name].flush();
    };

    render() {

        let { commentaire } = this.props;
        return (
            <div className="commentaire">

                <div className="row">
                    <div className="col-sm-12 offset-lg-2 col-lg-8 offset-xl-3 col-xl-6">
                        <div className="row inner-row field">
                            <div className="col-sm-12">
                                <textarea
                                    name="texte"
                                    value={this.state.texte}
                                    maxLength={200}
                                    rows="3"
                                    className={`${!commentaire.texte.isValid ? 'badwords' : ''}`}
                                    placeholder="Dites nous ce que vous auriez aimé savoir avant de rentrer en formation. Restez courtois."
                                    onBlur={this.onBlur}
                                    onChange={this.onChange} />
                                {!commentaire.texte.isValid && <Badwords />}
                                <div className="chars-count">Il vous reste {200-this.state.texte.length} caractères.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Commentaire;
