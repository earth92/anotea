import React from 'react';
import PropTypes from 'prop-types';
import '../components/QueryBadges.scss';
import _ from 'lodash';
import { getStats } from '../../financeurService';
import NewPanel from '../../../common/page/panel/NewPanel';
import QueryBadges from '../components/QueryBadges';
import Loader from '../../../common/Loader';
import CommentairesStats from '../../../common/page/panel/results/stats/CommentairesStats';
import NoteDetails from '../../../common/page/panel/results/stats/NoteDetails';
import EmptyResults from '../../../common/page/panel/results/EmptyResults';

export default class StatsPanel extends React.Component {

    static propTypes = {
        query: PropTypes.object.isRequired,
        form: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            results: {},
        };
    }

    componentDidMount() {
        this.fetchStats();
    }

    componentDidUpdate(previous) {
        if (!_.isEqual(this.props.query, previous.query)) {
            this.fetchStats();
        }
    }

    fetchStats = () => {
        return new Promise(resolve => {
            this.setState({ loading: true }, async () => {
                let results = await getStats(this.props.query);
                this.setState({ results, loading: false }, () => resolve());
            });
        });
    };

    render() {

        let { query, form } = this.props;
        let stats = this.state.results;

        return (
            <NewPanel
                backgroundColor="grey"
                summary={
                    <div className="row">
                        <div className="col-sm-10">
                            <QueryBadges form={form} query={query} ellipsis={30} />
                        </div>
                    </div>
                }
                results={
                    this.state.loading ?
                        <div className="d-flex justify-content-center"><Loader /></div> :
                        _.isEmpty(stats) ? <EmptyResults /> :
                            <>
                                <div className="row">
                                    <div className="col-sm-12">
                                        <div className="section-title">Les commentaires</div>
                                        <CommentairesStats stats={stats} />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-sm-12">
                                        <div className="section-title">Les notes</div>
                                        <NoteDetails notes={stats.notes} total={stats.total} />
                                    </div>
                                </div>
                            </>
                }
            />
        );

    }

}