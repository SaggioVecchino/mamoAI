import cbr_script as cbr
import pickle
from random import sample, choice

NB_INIT = 500

def init_db(length = NB_INIT):
  with open('app/python/all_rois_infos.db', 'rb') as f:
      mylist = pickle.load(f)

  rois = sample(mylist, k=length)

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
      cbr.addCaseToDB(get_roi(i), updateInfos=True, persist=False)

  cbr.saveDB()

def get_random_roi():
  with open('app/python/all_rois_infos.db', 'rb') as f:
    mylist = pickle.load(f)
  case = choice(mylist)
  atts_in_case = list(case.keys())
  for att in atts_in_case:
    if att not in cbr.FEATURES:
      del case[att]
  return case

def try_db(nb_tests=100):
  VP, VN, FP, FN = 0,0,0,0
  for i in range(nb_tests):
    case=get_random_roi()
    real = case['pathology']
    prediction = cbr.classify(case, expert=True, updateInfos=False)
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
  print('VP={}   FP={}   VN={}   FN={}'.format(VP,FP,VN,FN))
  print('Accuracy={:.2f}%   Precision={:.2f}%   Recall={:.2f}%'.format(100*(VP+VN)/(VP+VN+FP+FN),100*VP/(VP+FP),100*VP/(VP+FN)))

# init_db()
cbr.init()
print(cbr.DB['infos']['counters'])
try_db(50)
