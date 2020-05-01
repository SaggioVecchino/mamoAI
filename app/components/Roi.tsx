import React, { Component } from 'react';
import classNames from 'classnames';
import { PythonShell } from 'python-shell';
import styles from './Roi.css';

type props = { contoursUpscaled: string; simpleRoi: string };

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

type diagnosis = 'BENIGN' | 'MALIGNANT';

type state = {
  margin: margin;
  shape: shape;
  subtility: subtility;
  diagnosis: diagnosis;
};

export default class Roi extends Component<props, state> {
  exited: boolean;

  constructor(props: props) {
    super(props);
    this.exited = false;
  }

  componentDidUpdate() {
    // eslint-disable-next-line no-console
    console.log(this.state);
  }

  componentWillUnmount() {
    this.exited = false;
  }

  get submittable() {
    return (
      this.state &&
      'margin' in this.state &&
      'shape' in this.state &&
      'subtility' in this.state
    );
  }

  get diagnosed() {
    return this.state && 'diagnosis' in this.state;
  }

  get isBenign() {
    if (!this.diagnosed) return false;
    const { diagnosis } = this.state;
    return diagnosis === 'BENIGN';
  }

  get isMalignant() {
    if (!this.diagnosed) return false;
    const { diagnosis } = this.state;
    return diagnosis === 'MALIGNANT';
  }

  get parentStyle() {
    const classnames: { [id: string]: boolean } = {};
    classnames[styles.parent] = true;
    classnames[styles.benign] = this.isBenign;
    classnames[styles.malignant] = this.isMalignant;
    return classNames(classnames);
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

  diagnose = async () => {
    const { margin, shape, subtility } = this.state;
    const { simpleRoi } = this.props;
    // eslint-disable-next-line no-console
    console.log('Calling Python now..');
    // implicit await
    PythonShell.run(
      'app/python/cbr.py',
      {
        args: ['diagnose', margin, shape, `${subtility}`, simpleRoi]
      },
      (err, results) => {
        if (this.exited) return;
        if (err) {
          // eslint-disable-next-line no-console
          console.log(err);
          throw err;
        }
        if (results) {
          const resultPython: { [id: string]: string } = JSON.parse(results[0]);
          // eslint-disable-next-line no-console
          console.log(resultPython);
          this.setState({ diagnosis: resultPython.diagnosis as diagnosis });
        }
      }
    );
  };

  render() {
    const { contoursUpscaled } = this.props;
    return (
      <div>
        <div className={this.parentStyle}>
          <img
            alt="roi_image"
            src={`${contoursUpscaled}?version=${Math.floor(
              1000000000 * Math.random()
            )}`}
          />
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
              <button
                type="button"
                disabled={!this.submittable}
                onClick={this.diagnose}
              >
                Diagnostiquer
              </button>
            </span>
          </div>
        </div>
      </div>
    );
  }
}
