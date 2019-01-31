import React, { Component } from 'react';

import Stars from './Stars';

import './NoteMoyenne.scss';

class NoteMoyenne extends Component {

    render() {
      return (
        <div className="note-moyenne">
            <span className="title">Note moyenne</span>
            <span className="description">Voici la moyenne des notes que vous avez données.</span>
            <span className="score">{this.props.averageScore}</span>
            <Stars />
          <div className="note-details">
            <span className="label">Détails des notes</span>
            <span className="arrow"></span>
          </div>
        </div>
      );
  }
}

export default NoteMoyenne;
