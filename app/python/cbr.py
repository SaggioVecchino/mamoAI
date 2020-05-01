import sys
import os
import json
import cbr_script as cbr

def diagnose(data):
  def generate_case(data):
    def glcm_features(image_path, distances=[5], angles=[0], keys=['dissimilarity', 'correlation', 'homogeneity', 'ASM', 'contrast', 'energy']):
      import cv2 as cv
      from skimage.feature import greycomatrix, greycoprops
      image = cv.imread(image_path, 0)
      glcm = greycomatrix(image, distances=distances, angles=angles, levels=256, symmetric=True, normed=True)
      features = {}
      for k in keys:
        features[k] = greycoprops(glcm, k)[0][0].item()
      return features

    glcm = glcm_features(data['roi_path'])
    case = {'roi': data['roi_path']}
    case['mass margins'], case['mass shape'], case['assessment'] = data['margin'], data['shape'], data['subtility'] + .0
    for feature in glcm:
      if feature in cbr.FEATURES:
        case[feature] = glcm[feature]
    atts_in_case = list(case.keys())
    for att in atts_in_case:
      if att not in cbr.FEATURES:
        del case[att]
    return case

  case = generate_case(data)
  # print(json.dumps(case))
  cbr.init()
  prediction = cbr.classify(case, expert=False, updateInfos=False)
  print(json.dumps({'diagnosis': prediction}))

def main(args):
    data = {'command': args[0]}
    if data['command'] == 'diagnose':
      data['margin'], data['shape'], data['subtility'], data['roi_path'] = args[1], args[2], int(args[3]), args[4]
      diagnose(data)



if __name__ == "__main__":
    main(sys.argv[1:])
