import React, { Component } from 'react';
import classNames from 'classnames';
import styles from './Roi.css';

type props = {
  similarity: number;
  margin: margin;
  shape: shape;
  subtility: subtility;
  dissimilarity: number;
  energy: number;
  asm: number;
  diagnosis: diagnosis;
  roi: string;
};

type margin =
  | 'OBSCURED'
  | 'MICROLOBULATED'
  | 'ILL_DEFINED'
  | 'CIRCUMSCRIBED'
  | 'SPICULATED';

type shape =
  | 'OVAL'
  | 'IRREGULAR'
  | 'LOBULATED'
  | 'ROUND'
  | 'ARCHITECTURAL_DISTORTION'
  | 'FOCAL_ASYMMETRIC_DENSITY'
  | 'ASYMMETRIC_BREAST_TISSUE'
  | 'LYMPH_NODE';

type subtility = 0 | 1 | 2 | 3 | 4 | 5;

type diagnosis = 'BENIGN' | 'MALIGNANT';

export default class RoiAlike extends Component<props, {}> {
  get similarityPercentage() {
    const { similarity } = this.props;
    return `${(similarity * 100).toFixed(2)}%`;
  }

  get srcOfROI() {
    const { roi } = this.props;
    // eslint-disable-next-line no-console
    return `file://${__dirname}/${
      process.env.NODE_ENV === 'production' ? 'app/' : ''
    }python/rois_db/${roi}`;
  }

  get isBenign() {
    const { diagnosis } = this.props;
    return diagnosis === 'BENIGN';
  }

  get isMalignant() {
    const { diagnosis } = this.props;
    return diagnosis === 'MALIGNANT';
  }

  get diagnosisStyle() {
    const classnames: { [id: string]: boolean } = {};
    classnames[styles.benign] = this.isBenign;
    classnames[styles.malignant] = this.isMalignant;
    return classNames(classnames);
  }

  get roiInfo() {
    const {
      margin,
      shape,
      subtility,
      asm,
      dissimilarity,
      energy,
      diagnosis
    } = this.props;
    return `Bordure: ${margin}\nForme: ${shape}\nSubtilité: ${subtility}\nASM: ${asm}\nDissimilarité: ${dissimilarity}\nEnergie: ${energy}\nPathologie: ${diagnosis}`;
  }

  render() {
    return (
      <span>
        <img
          src={this.srcOfROI}
          alt={this.srcOfROI}
          className={this.diagnosisStyle}
          title={this.roiInfo}
        />
        <h3>{this.similarityPercentage}</h3>
      </span>
    );
  }
}
