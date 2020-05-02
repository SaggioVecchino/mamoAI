import cbr_script as cbr
import pickle
from random import sample, choice

NB_INIT = 150

def init_db(length = NB_INIT):
  import json
  metrics = {'VP': 0, 'FP': 0, 'VN': 0, 'FN': 0, 'MALIGNANT': 0, 'BENIGN': 0}
  with open('app/python/metrics.json', 'w') as f:
    f.write(json.dumps(metrics))

  with open('app/python/all_rois_infos.db', 'rb') as f:
      mylist = pickle.load(f)

  rois = sample(mylist[100:100+NB_INIT], k=length)

  def get_roi_abstracted(indice, features=None):
      if features is None:
          return rois[indice]
      else:
          res = {}
          for key in features:
              res[key] = rois[indice][key]
          return res

  def get_roi(indice, features=cbr.FEATURES):
      return get_roi_abstracted(indice, features=features)

  for i in range(length):
      roi = get_roi(i)
      cbr.addCaseToDB(roi, updateInfos=True, persist=False)

  cbr.saveDB()

def get_random_roi():
  with open('app/python/all_rois_infos.db', 'rb') as f:
    mylist = pickle.load(f)[100+NB_INIT:]
  case = choice(mylist)
  atts_in_case = list(case.keys())
  for att in atts_in_case:
    if att not in cbr.FEATURES:
      del case[att]
  return case

def try_db(nb_tests=100):
  import json

  VP, VN, FP, FN = 0,0,0,0
  for i in range(nb_tests):
    case=get_random_roi()
    real = case['pathology']
    # print(real)
    prediction = cbr.classify(case, expert=True, updateInfos=True)[0]
    cbr.addCaseToDB(case, updateInfos=True, persist=True)
    # print(prediction)
    if(cbr.DB['infos']['counters']['added'] % 5==0):
      print('deleted ', cbr.deleteWorst(2, updateInfos=True, persist=True))
    if prediction == 'MALIGNANT':
      if prediction == real:
        VP+=1
      else:
        FP+=1
    else:
      if prediction == real:
        VN+=1
      else:
        FN+=1

  with open('app/python/metrics.json', 'r') as f:
    metrics = json.loads(f.read())
  metrics['VP']=VP
  metrics['VN']=VN
  metrics['FP']=FP
  metrics['FN']=FN

  with open('app/python/metrics.json', 'w') as f:
    f.write(json.dumps(metrics))
  print('VP={}   FP={}   VN={}   FN={}'.format(VP,FP,VN,FN))
  print('Accuracy={:.2f}%   Precision={:.2f}%   Recall={:.2f}%'.format(100*(VP+VN)/(VP+VN+FP+FN),100*VP/(VP+FP),100*VP/(VP+FN)))
  print('MALIGNANT: {}    BENIGN: {}'.format(metrics['MALIGNANT'], metrics['BENIGN']))

init_db()
cbr.init()
try_db(150)



print(cbr.DB['infos']['counters'])
# for _ in range(10):
#   roi = get_random_roi()
#   top = cbr.topK(roi, expert=True)
#   # print(top[0][0])
#   print(cbr.classify(roi, expert=True)[1][0][1])

# print(cbr.readCase(10))
