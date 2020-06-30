import sys
import os
import json
import cbr_script as cbr
from copy import deepcopy

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
  prediction, top = cbr.classify(case, expert=False, updateInfos=False)
  best_cases = []
  def format_case(case):
    case_tmp = deepcopy(case)
    case_tmp['margin'], case_tmp['shape'], case_tmp['subtility'] = case_tmp['mass margins'], case_tmp['mass shape'], case_tmp['assessment']
    del case_tmp['mass margins'], case_tmp['mass shape'], case_tmp['assessment']
    return case_tmp
  for t in top:
    best_cases.append({'similarity': t[1], 'case': format_case(cbr.readCase(t[0]))})

  del case['roi']
  case = format_case(case)
  print(json.dumps({'diagnosis': prediction, 'case': case, 'bestCases': best_cases}))

def update(data):
  case = deepcopy(data)
  del case['command']
  def randomString(stringLength=30):
    import string
    import random
    letters = string.ascii_lowercase + string.ascii_uppercase + ''.join(list(map(str, range(10))))
    return 'aaaaa'+''.join(random.choice(letters) for i in range(stringLength))
  import cv2 as cv
  img = cv.imread(case['roi'])
  case['roi'] = randomString() + str(len(cbr.DB['cases']) + cbr.DB['infos']['counters']['deleted']) + '.png'
  import os
  cv.imwrite(os.path.join('app', 'python', 'rois_db', case['roi']), img)
  predicted = cbr.classify(case, updateInfos=True, expert=True)[0]
  real = case['pathology']
  import json
  with open('app/python/metrics.json', 'r') as f:
    metrics = json.loads(f.read())

  if predicted == 'MALIGNANT':
    if real==predicted:
      metrics['VP'] += 1
    else:
      metrics['FP'] += 1
  else:
    if real==predicted:
      metrics['VN'] += 1
    else:
      metrics['FN'] += 1
  with open('app/python/metrics.json', 'w') as f:
    f.write(json.dumps(metrics))
  cbr.addCaseToDB(case, updateInfos=True, persist=True)
  if(cbr.DB['infos']['counters']['added'] % 10 == 0):
    nb_deleted = cbr.deleteWorst(nbCases=3, updateInfos=True, persist=True)

  print(json.dumps({'metrics': metrics}))

def main(args):
    data = {'command': args[0]}
    if data['command'] == 'diagnose':
      cbr.init()
      data['margin'], data['shape'], data['subtility'], data['roi_path'] = args[1], args[2], int(args[3]), args[4]
      diagnose(data)
    elif data['command'] == 'update':
      cbr.init()
      data['mass margins'], data['mass shape'], data['assessment'], data['ASM'], data['dissimilarity'], data['energy'], data['roi'], data['pathology'] = args[1], args[2], float(args[3]), float(args[4]), float(args[5]), float(args[6]), args[7], args[8]
      update(data)


if __name__ == "__main__":
    main(sys.argv[1:])
