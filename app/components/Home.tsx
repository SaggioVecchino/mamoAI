import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';
import styles from './Home.css';

type State = {
  input: any;
  preview: any;
  path: string;
};

export default class Home extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      input: null,
      preview: null,
      path: ''
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
        <span>
          Veuillez choisir la mammographie avant de procéder à la segmentation
        </span>
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
    return (
      <div>
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
