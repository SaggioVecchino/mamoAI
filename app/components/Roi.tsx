import React, { Component } from 'react';
import styles from './Roi.css';

type props = { src: string };

type margin =
  | 'OBSCURED'
  | 'ILL_DEFINED'
  | 'CIRCUMSCRIBED'
  | 'MICROLOBULATED'
  | 'SPICULATED';

type shape =
  | 'LOBULATED'
  | 'FOCAL_ASYMMETRIC_DENSITY ROUND'
  | 'LYMPH_NODE'
  | 'ASYMMETRIC_BREAST_TISSUE'
  | 'ARCHITECTURAL_DISTORTION'
  | 'IRREGULAR, OVAL';

type subtility = 0 | 1 | 2 | 3 | 4 | 5;

type state = { margin: margin; shape: shape; subtility: subtility };

export default class Roi extends Component<props, state> {
  componentDidUpdate() {
    // eslint-disable-next-line no-console
    console.log(this.state);
  }

  get submittable() {
    return (
      this.state &&
      'margin' in this.state &&
      'shape' in this.state &&
      'subtility' in this.state
    );
  }

  marginChanged = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ margin: event.target.value as margin });
  };

  shapeChanged = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ shape: event.target.value as shape });
  };

  subtilityChanged = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ subtility: parseInt(event.target.value, 10) as subtility });
  };

  render() {
    const { src } = this.props;
    return (
      <div className={styles.parent}>
        <img alt="roi_image" src={src} />
        <div className={styles.infos}>
          <span>
            <label htmlFor="margin">
              Bordure de la masse
              <br />
              <select
                id="margin"
                name="margin"
                defaultValue=""
                onChange={this.marginChanged}
              >
                <option hidden disabled value="">
                  -- select an option --
                </option>
                <option value="OBSCURED">OBSCURED</option>
                <option value="ILL_DEFINED">ILL_DEFINED</option>
                <option value="CIRCUMSCRIBED">CIRCUMSCRIBED</option>
                <option value="MICROLOBULATED">MICROLOBULATED</option>
                <option value="SPICULATED">SPICULATED</option>
              </select>
            </label>
            <br />
            <label htmlFor="shape">
              Forme de la masse
              <br />
              <select
                id="shape"
                name="shape"
                defaultValue=""
                onChange={this.shapeChanged}
              >
                <option hidden disabled value="">
                  -- select an option --
                </option>
                <option value="LOBULATED">LOBULATED</option>
                <option value=" FOCAL_ASYMMETRIC_DENSITY">
                  FOCAL_ASYMMETRIC_DENSITY
                </option>
                <option value="ROUND"> ROUND</option>
                <option value="LYMPH_NODE"> LYMPH_NODE</option>
                <option value="ASYMMETRIC_BREAST_TISSUE">
                  ASYMMETRIC_BREAST_TISSUE
                </option>
                <option value="ARCHITECTURAL_DISTORTION">
                  ARCHITECTURAL_DISTORTION
                </option>
                <option value="IRREGULAR"> IRREGULAR</option>
                <option value="OVAL"> OVAL</option>
              </select>
            </label>
            <br />
            <label htmlFor="subtility">
              Subtilité de la masse
              <br />
              <select
                id="subtility"
                name="subtility"
                defaultValue=""
                onChange={this.subtilityChanged}
              >
                <option hidden disabled value="">
                  -- select an option --
                </option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <br />
            <button type="button" disabled={!this.submittable}>
              Diagnostiquer
            </button>
          </span>
        </div>
      </div>
    );
  }
}
