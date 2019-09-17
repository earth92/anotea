import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { searchAvis } from './moderationService';
import Loader from '../../common/Loader';
import Panel from '../../common/panel/Panel';
import Summary from '../../common/panel/summary/Summary';
import { Filter, Toolbar } from '../../common/panel/filters/Toolbar';
import GlobalMessage from '../../common/message/GlobalMessage';
import Pagination from '../../common/panel/pagination/Pagination';
import Avis from '../../common/avis/Avis';
import ResultDivider from '../../common/panel/results/ResultDivider';

export default class ModerationReponsesPanel extends React.Component {

    static propTypes = {
        query: PropTypes.object.isRequired,
        onNewQuery: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            message: null,
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
        this.search();
    }

    componentDidUpdate(previous) {
        if (!_.isEqual(this.props.query, previous.query)) {
            this.search();
        }
    }

    search = (options = {}) => {
        return new Promise(resolve => {
            this.setState({ loading: !options.silent }, async () => {
                let results = await searchAvis(this.props.query);
                this.setState({ results, loading: false }, () => resolve());
            });
        });
    };

    render() {
        let { query, onNewQuery } = this.props;
        let results = this.state.results;

        return (
            <Panel
                header={
                    <div>
                        <h1 className="title">Réponses des organismes</h1>
                        <p className="subtitle">
                            Ici, vous trouverez les réponses des organismes de formation adressées aux stagiaires ainsi
                            que les avis signalés par les organismes.
                        </p>
                    </div>
                }
                filters={
                    <Toolbar>
                        <Filter
                            label="À modérer"
                            onClick={() => onNewQuery({ reponseStatus: 'none', sortBy: 'reponse.lastStatusUpdate' })}
                            isActive={() => query.reponseStatus === 'none'}
                            getNbElements={() => _.get(results.meta.stats, 'reponseStatus.none')} />

                        <Filter
                            label="Publiés"
                            onClick={() => onNewQuery({
                                reponseStatus: 'published',
                                sortBy: 'reponse.lastStatusUpdate'
                            })}
                            isActive={() => query.reponseStatus === 'published'} />

                        <Filter
                            label="Rejetés"
                            onClick={() => onNewQuery({
                                reponseStatus: 'rejected',
                                sortBy: 'reponse.lastStatusUpdate'
                            })}
                            isActive={() => query.reponseStatus === 'rejected'} />

                        <Filter
                            label="Signalés"
                            onClick={() => onNewQuery({ status: 'reported', sortBy: 'lastStatusUpdate' })}
                            isActive={() => query.status === 'reported'}
                            getNbElements={() => _.get(results.meta.stats, 'status.reported')} />

                        <Filter
                            label="Tous"
                            onClick={() => onNewQuery({ reponseStatus: 'all', sortBy: 'date' })}
                            isActive={() => query.reponseStatus === 'all'} />
                    </Toolbar>
                }
                summary={
                    this.state.loading ? <div /> :
                        <Summary
                            pagination={results.meta.pagination}
                            paginationLabel={query.status === 'reported' ? 'avis' : 'réponse(s)'}
                        />
                }
                results={
                    this.state.loading ?
                        <div className="d-flex justify-content-center"><Loader /></div> :
                        <div>
                            {this.state.message &&
                            <GlobalMessage
                                message={this.state.message}
                                onClose={() => this.setState({ message: null })} />
                            }
                            {
                                results.avis.map(avis => {
                                    return (
                                        <div key={avis._id}>
                                            <Avis
                                                avis={avis}
                                                readonly={query.status !== 'reported'}
                                                showStatus={false}
                                                showReponse={query.status !== 'reported'}
                                                onChange={(avis, options = {}) => {
                                                    let { message } = options;
                                                    if (message) {
                                                        this.setState({ message });
                                                    }
                                                    this.search({ silent: true });
                                                }}>
                                            </Avis>
                                            <ResultDivider />
                                        </div>
                                    );
                                })
                            }
                        </div>

                }
                pagination={
                    this.state.loading ?
                        <div /> :
                        <Pagination
                            pagination={results.meta.pagination}
                            onClick={page => onNewQuery(_.merge({}, query, { page }))} />
                }
            />
        );
    }
}
