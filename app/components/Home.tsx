/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import fs from 'fs';
import routes from '../constants/routes.json';
import styles from './Home.css';

type State = {
  input: any;
  preview: any;
  path: string;
  VP: number;
  VN: number;
  FP: number;
  FN: number;
  MALIGNANT: number;
  BENIGN: number;
};

export default class Home extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    const metrics = JSON.parse(
      fs.readFileSync('app/python/metrics.json', 'utf8')
    );
    this.state = {
      input: null,
      preview: null,
      path: '',
      VP: metrics.VP,
      VN: metrics.VN,
      FP: metrics.FP,
      FN: metrics.FN,
      MALIGNANT: metrics.MALIGNANT,
      BENIGN: metrics.BENIGN
    };
  }

  componentDidMount() {
    this.setState({
      input: document.querySelector('#mammogr'),
      preview: document.querySelector('#preview')
    });
  }

  get MyLinkSeg() {
    const { path } = this.state;
    if (path === '')
      return (
        <h3>
          Veuillez choisir la mammographie avant de procéder à la segmentation
        </h3>
      );
    return (
      <div>
        <Link
          to={{
            pathname: routes.SEGMENTATION,
            state: { pathImage: path }
          }}
        >
          Procéder à la segmentaion
        </Link>
      </div>
    );
  }

  get recall() {
    const { VP, FN } = this.state;
    if (VP + FN === 0) return `NaN`;
    return `${((100 * VP) / (VP + FN)).toFixed(2)}%`;
  }

  get precision() {
    const { VP, FP } = this.state;
    if (VP + FP === 0) return `NaN`;
    return `${((100 * VP) / (VP + FP)).toFixed(2)}%`;
  }

  get accuracy() {
    const { VP, VN, FP, FN } = this.state;
    if (VP + VN + FP + FN === 0) return `NaN`;
    return `${((100 * (VP + VN)) / (VP + VN + FP + FN)).toFixed(2)}%`;
  }

  updateImageDisplay = () => {
    const { input, preview } = this.state;
    this.setState({ path: '' });
    const curFiles = input.files;

    const fileTypes = ['image/png'];

    function validFileType(file: File) {
      for (let i = 0; i < fileTypes.length; i += 1) {
        if (file.type === fileTypes[i]) {
          return true;
        }
      }

      return false;
    }

    function returnFileSize(number: number) {
      let toReturn = `0 octet`;
      if (number < 1024) {
        toReturn = `${number} octets`;
      } else if (number >= 1024 && number < 1048576) {
        toReturn = `${(number / 1024).toFixed(1)} Ko`;
      } else if (number >= 1048576) {
        toReturn = `${(number / 1048576).toFixed(1)} Mo`;
      }
      return toReturn;
    }

    while (preview.firstChild) {
      preview.removeChild(preview.firstChild);
    }
    if (curFiles.length === 0) {
      const para = document.createElement('p');
      para.textContent = 'No files currently selected for upload';
      preview.appendChild(para);
    } else {
      const list = document.createElement('ol');
      preview.appendChild(list);
      for (let i = 0; i < curFiles.length; i += 1) {
        const listItem = document.createElement('li');
        const para = document.createElement('p');
        if (validFileType(curFiles[i])) {
          para.textContent = `File name ${
            curFiles[i].name
          }, file size ${returnFileSize(curFiles[i].size)}.`;
          const image = document.createElement('img');
          image.src = window.URL.createObjectURL(curFiles[i]);
          listItem.appendChild(image);
          listItem.appendChild(para);
        } else {
          para.textContent = `File name ${curFiles[i].name}: : Not a valid file type. Update your selection.`;
          listItem.appendChild(para);
        }

        list.appendChild(listItem);
        this.setState({ path: curFiles[i].path });
      }
    }
  };

  render() {
    const { VP, VN, FP, FN, MALIGNANT, BENIGN } = this.state;
    return (
      <div>
        <div className={styles.infos}>
          <h1>Quelques informations :</h1>
          <b>Nombre de tumeurs bénignes:</b>
          {(() => {
            return ` ${BENIGN}`;
          })()}
          <br />
          <b>Nombre de tumeurs malignes:</b>
          {(() => {
            return ` ${MALIGNANT}`;
          })()}
          <br />
          <b>VP:</b>
          {(() => {
            return ` ${VP}`;
          })()}
          <br />
          <b>VN:</b>
          {(() => {
            return ` ${VN}`;
          })()}
          <br />
          <b>FP:</b>
          {(() => {
            return ` ${FP}`;
          })()}
          <br />
          <b>FN:</b>
          {(() => {
            return ` ${FN}`;
          })()}
          <br />
          <b>
            Recall:
            {` ${this.recall}`}
          </b>
          <br />
          <b>
            Precision:
            {` ${this.precision}`}
          </b>
          <br />
          <b>
            Accuracy:
            {` ${this.accuracy}`}
          </b>
        </div>
        {this.MyLinkSeg}
        <br />
        <label htmlFor="image_uploads">
          <input
            type="file"
            accept="image/png"
            name="image_uploads"
            id="mammogr"
            onChange={this.updateImageDisplay}
          />
        </label>
        <div id="preview" className={styles.preview}>
          <p>Aucun fichier sélectionné pour le moment</p>
        </div>
      </div>
    );
  }
}
