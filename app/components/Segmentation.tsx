import React, { Component } from 'react';
import { PythonShell } from 'python-shell';
import { Link } from 'react-router-dom';
import Roi from './Roi';
import routes from '../constants/routes.json';

type state = { nbRois: number; segmentationDone: boolean };

type props = { pathImage: string };

export default class Segmentation extends Component<props, state> {
  exited: boolean;

  constructor(props: props) {
    super(props);
    this.exited = false;
    this.state = {
      nbRois: 0,
      segmentationDone: false
    };
  }

  async componentDidMount() {
    const { pathImage } = this.props;
    await this.python(pathImage);
  }

  componentWillUnmount() {
    this.exited = true;
  }

  python = async (pathImage: string) => {
    // eslint-disable-next-line no-console
    console.log('Calling Python now..');
    // implicit await
    PythonShell.run(
      'app/python/segmentation.py',
      {
        args: [pathImage]
      },
      (err, results) => {
        if (this.exited) return;
        if (err) {
          // eslint-disable-next-line no-console
          console.log(err);
          throw err;
        }
        if (results) {
          const resultPython = JSON.parse(results[0]);
          // eslint-disable-next-line no-console
          console.log(resultPython);
          this.setState({
            nbRois: resultPython.nb_rois,
            segmentationDone: true
          });
        }
      }
    );
  };

  imageWithoutCache = (srcImageDev: string) => {
    const srcGen = `file://${__dirname}/${
      process.env.NODE_ENV === 'production' ? 'app/' : ''
    }${srcImageDev}?version=${Math.floor(1000000000 * Math.random())}`;
    return <img src={srcGen} alt={srcGen} />;
  };

  showSegmentationResults = () => {
    let srcs: {
      [id: string]: string;
    }[] = [];
    const { nbRois } = this.state;
    if (nbRois === 0) return <h2>Aucune masse trouvée</h2>;
    for (let i = 0; i < nbRois; i += 1)
      srcs = [
        ...srcs,
        {
          contoursUpscaled: `file://${__dirname}/${
            process.env.NODE_ENV === 'production' ? 'app/' : ''
          }python/rois/roi_${i}_contours_upscaled.png`,
          simpleRoi: `app/python/rois/roi_${i}.png`
        }
      ];
    const message = `${
      nbRois > 1 ? `${nbRois} masses trouvées` : `Une seule masse trouvée`
    }`;
    return (
      <div>
        <h3>{message}</h3>
        <h5>Masque global :</h5>
        {this.imageWithoutCache('python/image_original_redim.png')}
        {this.imageWithoutCache('python/image_with_contours.png')}
        {(() => {
          if (nbRois > 1) return <h5>Masses :</h5>;
          return <h5>Masse :</h5>;
        })()}
        {srcs.map((val, ind) => {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={ind}>
              <Roi
                contoursUpscaled={val.contoursUpscaled}
                simpleRoi={val.simpleRoi}
              />
              <br />
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    const { segmentationDone } = this.state;
    return (
      <div>
        <Link to={routes.HOME}>Retourner !</Link>
        {(() => {
          if (!segmentationDone)
            return (
              <div>
                <br />
                <h2>Veuillez attendre la segmentation automatique..</h2>
              </div>
            );
          return this.showSegmentationResults();
        })()}
      </div>
    );
  }
}
