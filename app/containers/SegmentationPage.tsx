import React from 'react';
import Segmentation from '../components/Segmentation';

export default function SegmentationPage(props: any) {
  const { location } = props;
  return <Segmentation pathImage={location.state.pathImage} />;
}
