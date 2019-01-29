import React from 'react';
import PropTypes from 'prop-types';
import { PaginationStatus } from '../../common/Pagination';
import './Summary.scss';

export default class Summary extends React.Component {

    static propTypes = {
        parameters: PropTypes.object.isRequired,
        results: PropTypes.object.isRequired,
    };

    render() {
        let { query, filter } = this.props.parameters;
        let { pagination } = this.props.results.meta;
        let suffixMapper = {
            'all': '',
            'published': 'publiés',
            'rejected': 'rejetés',
            'reported': 'signalés',
            'toModerate': 'à modérer',
        };


        if (pagination.totalItems === 0) {
            return (<p className="Description">Pas d&apos;avis pour le moment</p>);
        }

        return (
            <p className="Description">
                <span className="name">Liste des avis</span>
                <span className="suffix"> {query ? ` pour la recherche "${query}"` : suffixMapper[filter]}</span>
                <span className="status d-none d-sm-block">
                    <PaginationStatus pagination={pagination} />
                </span>
            </p>
        );
    }
}