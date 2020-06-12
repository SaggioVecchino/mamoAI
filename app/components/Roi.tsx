import React, { Component } from 'react';
import classNames from 'classnames';
import { PythonShell } from 'python-shell';
import RoiAlike from './RoiAlike';
import styles from './Roi.css';

type props = { contoursUpscaled: string; simpleRoi: string };

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

type diagnosis = 'BENIGN' | 'MALIGNANT' | 'waiting';

type state = {
  margin: margin;
  shape: shape;
  subtility: subtility;
  marginDiagnosed: margin;
  shapeDiagnosed: shape;
  subtilityDiagnosed: subtility;
  asm: number;
  dissimilarity: number;
  energy: number;
  diagnosis: diagnosis;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bestCases: [{ [id: string]: any }];
  confirmed: boolean;
  corrected: boolean;
};

export default class Roi extends Component<props, state> {
  exited: boolean;

  constructor(props: props) {
    super(props);
    this.exited = false;
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
    if (this.state && 'diagnosis' in this.state) {
      const { diagnosis } = this.state;
      return diagnosis !== 'waiting';
    }
    return false;
  }

  get isWaiting() {
    if (this.state && 'diagnosis' in this.state) {
      const { diagnosis } = this.state;
      return diagnosis === 'waiting';
    }
    return false;
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

  get diagnosisStyle() {
    const classnames: { [id: string]: boolean } = {};
    classnames[styles.container] = true;
    classnames[styles.benign] = this.isBenign;
    classnames[styles.malignant] = this.isMalignant;
    return classNames(classnames);
  }

  get isConfirmed() {
    if (this.state && 'confirmed' in this.state) {
      const { confirmed } = this.state;
      return confirmed;
    }
    return false;
  }

  get isCorrected() {
    if (this.state && 'corrected' in this.state) {
      const { corrected } = this.state;
      return corrected;
    }
    return false;
  }

  get roiInfos() {
    if (!this.diagnosed) return `Pas encore diagnostiquée`;
    const {
      marginDiagnosed,
      shapeDiagnosed,
      subtilityDiagnosed,
      asm,
      dissimilarity,
      energy,
      diagnosis
    } = this.state;
    return `****Vous avez jugé:\nBordure: ${marginDiagnosed}\nForme: ${shapeDiagnosed}\nSubtilité: ${subtilityDiagnosed}\n****Caractéristiques de texture calculées automatiquement\nASM: ${asm}\nDissimilarité: ${dissimilarity}\nEnergie: ${energy}\n\n----** DIAGNOSTIQUE: ${
      diagnosis === 'BENIGN' ? 'TUMEUR BENIGNE' : 'TUMEUR MALIGNE'
    } **----`;
  }

  get waitingMessage() {
    if (!this.isWaiting) return ``;
    return (
      <span>
        {(() => {
          return (
            <div>
              {(() => {
                return `Veuillez attendre un petit instant s'il vous plaît`;
              })()}
            </div>
          );
        })()}
      </span>
    );
  }

  get roisAlike() {
    const { bestCases } = this.state;
    return bestCases.map(val => {
      return (
        <RoiAlike
          similarity={val.similarity}
          margin={val.case.margin}
          shape={val.case.shape}
          subtility={val.case.subtility}
          dissimilarity={val.case.dissimilarity}
          energy={val.case.energy}
          asm={val.case.ASM}
          diagnosis={val.case.pathology}
          roi={val.case.roi}
          key={val.case.roi}
        />
      );
    });
  }

  marginChanged = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ margin: event.target.value as margin });
  };

  shapeChanged = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ shape: event.target.value as shape });
  };

  subtilityChanged = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      subtility: parseInt(event.target.value, 10) as subtility
    });
  };

  expertDiagnose = async (diagnosis: diagnosis) => {
    const {
      marginDiagnosed,
      shapeDiagnosed,
      subtilityDiagnosed,
      asm,
      dissimilarity,
      energy
    } = this.state;

    const { simpleRoi } = this.props;

    // implicit await
    PythonShell.run(
      'app/python/cbr.py',
      {
        args: [
          'update',
          marginDiagnosed,
          shapeDiagnosed,
          `${subtilityDiagnosed}`,
          `${asm}`,
          `${dissimilarity}`,
          `${energy}`,
          simpleRoi,
          diagnosis
        ]
      },
      err => {
        if (this.exited) return;
        if (err) {
          throw err;
        }
      }
    );
  };

  confirm = async () => {
    const { diagnosis } = this.state;
    await this.expertDiagnose(diagnosis);
    this.setState({ confirmed: true });
  };

  correct = async () => {
    const diagnosis = (this.isBenign ? 'MALIGNANT' : 'BENIGN') as diagnosis;
    await this.expertDiagnose(diagnosis);
    this.setState({ corrected: true });
  };

  diagnose = async () => {
    this.setState({ diagnosis: 'waiting' });
    const { margin, shape, subtility } = this.state;
    const { simpleRoi } = this.props;
    // implicit await
    PythonShell.run(
      'app/python/cbr.py',
      {
        args: ['diagnose', margin, shape, `${subtility}`, simpleRoi]
      },
      (err, results) => {
        if (this.exited) return;
        if (err) {
          throw err;
        }
        if (results) {
          const resultPython = JSON.parse(results[0]);
          this.setState({
            asm: resultPython.case.ASM,
            dissimilarity: resultPython.case.dissimilarity,
            energy: resultPython.case.energy,
            shapeDiagnosed: resultPython.case.shape,
            marginDiagnosed: resultPython.case.margin,
            subtilityDiagnosed: resultPython.case.subtility,
            diagnosis: resultPython.diagnosis as diagnosis,
            bestCases: resultPython.bestCases,
            confirmed: false,
            corrected: false
          });
        }
      }
    );
  };

  render() {
    const { contoursUpscaled } = this.props;
    return (
      <div className={this.diagnosisStyle}>
        <div className={styles.parent}>
          <img
            title={this.roiInfos}
            alt={`${contoursUpscaled}`}
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
                  <option value="FOCAL_ASYMMETRIC_DENSITY">
                    FOCAL_ASYMMETRIC_DENSITY
                  </option>
                  <option value="ROUND">ROUND</option>
                  <option value="LYMPH_NODE">LYMPH_NODE</option>
                  <option value="ASYMMETRIC_BREAST_TISSUE">
                    ASYMMETRIC_BREAST_TISSUE
                  </option>
                  <option value="ARCHITECTURAL_DISTORTION">
                    ARCHITECTURAL_DISTORTION
                  </option>
                  <option value="IRREGULAR">IRREGULAR</option>
                  <option value="OVAL">OVAL</option>
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
              <div>
                <button
                  type="button"
                  disabled={!this.submittable || this.isWaiting}
                  onClick={this.diagnose}
                >
                  Diagnostiquer
                </button>
                {this.waitingMessage}
              </div>
            </span>
          </div>
        </div>
        {(() => {
          if (this.diagnosed)
            return (
              <div className={styles.roisAlikeContainer}>
                <h1>Masses similaires dans la base de données</h1>
                <div className={styles.roisAlike}>{this.roisAlike}</div>
                <button
                  type="button"
                  disabled={this.isConfirmed || this.isCorrected}
                  onClick={this.confirm}
                >
                  Confirmer le diagnostique
                </button>
                <button
                  type="button"
                  disabled={this.isConfirmed || this.isCorrected}
                  onClick={this.correct}
                >
                  Corriger le diagnostique
                </button>
              </div>
            );
          return <div />;
        })()}
      </div>
    );
  }
}
