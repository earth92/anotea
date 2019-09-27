import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Summary from '../../common/page/panel/summary/Summary';
import Pagination from '../../common/page/panel/pagination/Pagination';
import Page from '../../common/page/Page';
import Panel from '../../common/page/panel/Panel';
import { Filter, Filters } from '../../common/page/panel/filters/Filters';
import { Form } from '../../common/page/form/Form';
import Button from '../../common/Button';
import InputText from '../../common/page/form/InputText';
import Avis from '../../common/avis/Avis';
import AvisResults from '../../common/page/panel/results/AvisResults';
import { getStats, searchAvis } from '../../avisService';

export default class ModerationAvisPage extends React.Component {

    static propTypes = {
        navigator: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            message: null,
            fulltext: '',
            stats: {},
            results: {
                avis: [],
                meta: {
                    stats: {},
                    pagination: {
                        itemsOnThisPage: 0,
                        itemsPerPage: 0,
                        page: 0,
                        totalItems: 0,
                        totalPages: 0,
                    }
                }
            },
        };
    }

    componentDidMount() {
        let query = this.props.navigator.getQuery();

        this.search();
        this.fetchStats();

        if (query.fulltext) {
            this.setState({
                fulltext: query.fulltext,
            });
        }
    }

    componentDidUpdate(previous) {
        let query = this.props.navigator.getQuery();
        let previousQuery = previous.navigator.getQuery();

        if (!_.isEqual(query, previousQuery)) {
            this.search();
            this.fetchStats();
        }
    }

    search = (options = {}) => {
        return new Promise(resolve => {
            this.setState({ loading: !options.silent }, async () => {
                let query = this.props.navigator.getQuery();
                let results = await searchAvis(query);
                this.setState({ results, loading: false }, () => resolve());
            });
        });
    };

    fetchStats = async () => {
        return new Promise(async resolve => {
            let stats = await getStats(this.getQueryFormParameters());
            this.setState({ stats }, () => resolve());
        });
    };

    getQueryFormParameters = () => {
        let query = this.props.navigator.getQuery();
        return _.pick(query, ['fulltext']);
    };

    onSubmit = () => {
        return this.props.navigator.refreshCurrentPage({
            fulltext: this.state.fulltext,
        });
    };

    onFilterClicked = parameters => {
        return this.props.navigator.refreshCurrentPage({
            ...this.getQueryFormParameters(),
            ...parameters,
        });
    };

    render() {
        let query = this.props.navigator.getQuery();
        let { results, stats } = this.state;

        return (
            <Page
                title="Avis et données stagiaires"
                className="ModerationAvisPage"
                form={
                    <div className="d-flex justify-content-center">
                        <Form className="a-width-50">
                            <div className="d-flex justify-content-between">
                                <div className="a-flex-grow-1 mr-2">
                                    <InputText
                                        value={this.state.fulltext}
                                        placeholder="Recherche un avis"
                                        icon={<i className="fas fa-search" />}
                                        reset={() => this.setState({ fulltext: '' })}
                                        onChange={event => this.setState({ fulltext: event.target.value })}
                                    />
                                </div>
                                <Button type="submit" size="large" color="blue" onClick={this.onSubmit}>Rechercher</Button>
                            </div>
                        </Form>
                    </div>
                }
                panel={
                    <Panel
                        loading={this.state.loading}
                        filters={
                            <Filters>
                                <Filter
                                    label="À modérer"
                                    isActive={() => query.status === 'none'}
                                    getNbElements={() => _.get(stats, 'status.none')}
                                    onClick={() => this.onFilterClicked({ status: 'none', sortBy: 'lastStatusUpdate' })}
                                />

                                <Filter
                                    label="Tous"
                                    isActive={() => !query.status}
                                    onClick={() => this.onFilterClicked({ sortBy: 'date' })}
                                />

                                <Filter
                                    label="Publiés"
                                    isActive={() => query.status === 'published'}
                                    onClick={() => this.onFilterClicked({ status: 'published', sortBy: 'lastStatusUpdate' })}
                                />

                                <Filter
                                    label="Rejetés"
                                    isActive={() => query.status === 'rejected'}
                                    onClick={() => this.onFilterClicked({ status: 'rejected', sortBy: 'lastStatusUpdate' })}
                                />
                            </Filters>
                        }
                        summary={
                            <Summary
                                paginationLabel="avis(s)"
                                pagination={results.meta.pagination}
                            />
                        }
                        results={
                            <AvisResults
                                results={results}
                                message={this.state.message}
                                renderAvis={avis => {
                                    return (
                                        <Avis
                                            avis={avis}
                                            showStatus={['all', 'rejected'].includes(query.status)}
                                            showReponse={false}
                                            onChange={(avis, options) => {
                                                let { message } = options;
                                                if (message) {
                                                    this.setState({ message });
                                                }

                                                return Promise.all([
                                                    this.search({ silent: true }),
                                                    this.fetchStats(),
                                                ]);
                                            }}>
                                        </Avis>
                                    );
                                }}
                            />
                        }
                        pagination={
                            <Pagination
                                pagination={results.meta.pagination}
                                onClick={page => this.onFilterClicked({ ...query, page })}
                            />
                        }
                    />
                }
            />
        );
    }
}
