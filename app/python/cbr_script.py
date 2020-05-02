import pickle
import math
import copy


FEATURES = [
'mass margins',
'mass shape',
'assessment',
'ASM',
'energy',
'dissimilarity'
]

FEATURES += ['pathology', 'roi']

class NoSuchCaseException(Exception):
  pass

class UnmatchedTypeException(Exception):
  pass

class ForcedIdInAutoIncrementTypeException(Exception):
  pass

class NoSuchAttributeInDBExcetpion(Exception):
  pass

class MismatchedNumberAttributesException(Exception):
  pass

class IDAlreadyInDBException(Exception):
  pass

class NoSuchIDInDBException(Exception):
  pass


import json

METRICS_PATH = "app/python/metrics.json"

def load_metrics():
  with open(METRICS_PATH, 'r') as f:
    metrics = json.loads(f.read())
  return metrics

def save_metrics(metrics):
  with open(METRICS_PATH, 'w') as f:
    f.write(json.dumps(metrics))

DB_PATH = "app/python/cbr.db"
K = 7
TYPES = {'INTEGER':'int', 'FLOAT':'float', 'STRING':'str', 'INTERVAL_INTEGER':'int',
         'INTERVAL_FLOAT':'float', 'BOOLEAN':'bool', 'ENUM': 'str'}
TYPES_ID = {'MANUAL': 'MANUAL', 'AUTO_INCREMENT': 'AUTO_INCREMENT'}
TYPES_AGG = {'SUM': 'SUM', 'AVERAGE': 'AVERAGE'}

DB = {'config': {'attributes': {'dissimilarity': {'type': 'FLOAT', 'weight': 1.84},
                                'correlation': {'type': 'INTERVAL_FLOAT', 'minInterval': -1, 'maxInterval': 1, 'weight': 1},
                                'homogeneity': {'type': 'FLOAT', 'weight': 1},
                                'ASM': {'type': 'FLOAT', 'weight': 0.52},
                                'energy': {'type': 'FLOAT', 'weight': 0.55},
                                'contrast': {'type': 'FLOAT', 'weight': 1},
                                'breast_density': {'type': 'FLOAT', 'weight': 1},
                                'left or right breast': {'type': 'ENUM', 'enum': ['LEFT', 'RIGHT'], 'weight': 1},
                                'image view': {'type': 'ENUM', 'enum': ['CC', 'MLO'], 'weight': 1},
                                'assessment': {'type': 'FLOAT', 'weight': 24.75},
                                'mass shape': {'type': 'ENUM', 'enum': ['OVAL','IRREGULAR','LOBULATED',
                                                                        'ROUND','ARCHITECTURAL_DISTORTION',
                                                                        'FOCAL_ASYMMETRIC_DENSITY',
                                                                        'ASYMMETRIC_BREAST_TISSUE','LYMPH_NODE'], 'weight': 12.51},
                                'mass margins': {'type': 'ENUM', 'enum': ['OBSCURED','MICROLOBULATED',
                                                                          'ILL_DEFINED','CIRCUMSCRIBED','SPICULATED'], 'weight': 16.56}
                                },
                 'aggregationSimilarity': TYPES_AGG['AVERAGE'],
                 'id': TYPES_ID['AUTO_INCREMENT'],
                 'result': {'name': 'pathology', 'type': 'ENUM', 'enum':['BENIGN', 'MALIGNANT']},
                 'autoIncrement': 1
                },
      'cases': {},
      'infos': {'attributes':{
                'dissimilarity': {'minInDB': +math.inf, 'maxInDB': -math.inf},
                'correlation': {'minInDB': +math.inf, 'maxInDB': -math.inf},
                'homogeneity': {'minInDB': +math.inf, 'maxInDB': -math.inf},
                'ASM': {'minInDB': +math.inf, 'maxInDB': -math.inf},
                'energy': {'minInDB': +math.inf, 'maxInDB': -math.inf},
                'contrast': {'minInDB': +math.inf, 'maxInDB': -math.inf},
                'breast_density': {'minInDB': +math.inf, 'maxInDB': -math.inf},
                'assessment': {'minInDB': +math.inf, 'maxInDB': -math.inf}},
                'cases':{},
                'counters':{'added':0, 'deleted': 0}
               }
      }

db_attributes = list(DB['config']['attributes'].keys())

for att in db_attributes:
  if att not in FEATURES:
    del DB['config']['attributes'][att]
    if att in DB['infos']['attributes'].keys():
      del DB['infos']['attributes'][att]


def init():
  global DB
  with open(DB_PATH, 'rb') as f:
    DB = pickle.load(f)

def saveDB():
  with open(DB_PATH, 'wb') as f:
    pickle.dump(DB, f)

def verifyCase(case, includeResult=True, includeROI=True):
  if includeResult and DB['config']['result']['name'] not in case:
    raise MismatchedNumberAttributesException('result:{} not found in case and specified required'.format(DB['config']['result']['name']))
  if includeROI and 'roi' not in case:
    raise MismatchedNumberAttributesException('roi not found in case and specified required')
  lenCase = len(case) - (1 if DB['config']['id'] == TYPES_ID['MANUAL'] else 0) - (1 if includeResult else 0) - (1 if includeROI else 0)
  if lenCase != len(DB['config']['attributes']):
    raise MismatchedNumberAttributesException('number attributes in case is {}, but {} in configuration DB'
    .format(lenCase, len(DB['config']['attributes'])))
  for key in case:
    if key == 'id':
      if DB['config']['id'] == TYPES_ID['AUTO_INCREMENT']:
        raise ForcedIdInAutoIncrementTypeException()
      else: #DB['config']['id'] == TYPES_ID['MANUAL']
        if str(type(case['id']))[8:-2] != 'int':
          raise UnmatchedTypeException('ID ({}) given manually is not an integer'.format(case[key]))
        if case['id'] in DB['cases']:
          raise IDAlreadyInDBException('ID:{} is already in DB'.format(case['id']))
    elif key not in DB['config']['attributes'] and not (includeResult and key == DB['config']['result']['name']) and not (includeROI and key == 'roi'):
        raise NoSuchAttributeInDBExcetpion('{} not in DB configuration attributes'.format(key))
    elif key!='roi':
      type_ = str(type(case[key]))[8:-2]
      if includeResult and key == DB['config']['result']['name']:
        if  type_ != TYPES[DB['config']['result']['type']]:
          raise UnmatchedTypeException('Unmatched type in result {}, given is {}, but {} in cofiguration DB'.format(key, type_, DB['config']['result']['type']))
        elif DB['config']['result']['type'] in ['INTERVAL_INTEGER', 'INTERVAL_FLOAT']:
          if case[key] < DB['result']['minInterval'] or case[key] > DB['config']['result']['maxInterval']:
            raise UnmatchedTypeException('Interval not respected in result:{}, value is {}, but range in cofiguration DB is [{}, {}]'
            .format(key, case[key], DB['config']['result']['minInterval'], DB['config']['result']['maxInterval']))
        elif DB['config']['result']['type'] == 'ENUM':
          if case[key] not in DB['config']['result']['enum']:
            raise UnmatchedTypeException('Result {}:{} not in {}'.format(key, case[key], DB['config']['result']['enum']))
      elif type_ != TYPES[DB['config']['attributes'][key]['type']]:
        raise UnmatchedTypeException('Unmatched type in attribute {}, given is {}, but {} in cofiguration DB'.format(key, type_, DB['config']['attributes'][key]['type']))
      elif DB['config']['attributes'][key]['type'] in ['INTERVAL_INTEGER', 'INTERVAL_FLOAT']:
        if case[key] < DB['config']['attributes'][key]['minInterval'] or case[key] > DB['config']['attributes'][key]['maxInterval']:
          raise UnmatchedTypeException('Interval not respected in {}, value is {}, but range in cofiguration DB is [{}, {}]'
          .format(key, case[key], DB['config']['attributes'][key]['minInterval'], DB['config']['attributes'][key]['maxInterval']))
      elif DB['config']['attributes'][key]['type'] == 'ENUM':
        if case[key] not in DB['config']['attributes'][key]['enum']:
          raise UnmatchedTypeException('Result {}:{} not in {}'.format(key, case[key], DB['config']['attributes'][key]['enum']))

def addCaseToDB(case, updateInfos=False, persist=False):
  caseToAdd = copy.deepcopy(case)
  verifyCase(caseToAdd, includeResult=True)
  id_tmp = None
  if DB['config']['id'] == TYPES_ID['AUTO_INCREMENT']:
    id_tmp = DB['config']['autoIncrement']
    DB['config']['autoIncrement'] += 1
  else: #DB['config']['id'] == TYPES_ID['MANUAL']
    id_tmp = caseToAdd['id']
    del caseToAdd['id']
  DB['cases'][id_tmp] = caseToAdd
  DB['infos']['cases'][id_tmp] = {'best': -math.inf, 'worst': +math.inf,
                                  'sum': 0,
                                  'best_same': -math.inf, 'worst_same': +math.inf, 'sum_same': 0,
                                  'best_different': +math.inf, 'worst_different': -math.inf, 'sum_different': 0,
                                  'used_in_similarity': 0, 'same_in_similarity': 0, 'different_in_similarity': 0}

  if updateInfos:
    DB['infos']['counters']['added']+=1
    for key in caseToAdd:
      if key == 'roi':
        continue
      inDB = None
      infosInDB = None
      if key == DB['config']['result']['name']:
        inDB = DB['config']['result']
      else:
        inDB = DB['config']['attributes'][key]
      if inDB['type'] in ['INTEGER', 'FLOAT']:
        if key == DB['config']['result']['name']:
          infosInDB = DB['infos']['result']
        else:
          infosInDB = DB['infos']['attributes'][key]
        if caseToAdd[key] < infosInDB['minInDB']:
          infosInDB['minInDB'] = caseToAdd[key]
        if caseToAdd[key] > infosInDB['maxInDB']:
          infosInDB['maxInDB'] = caseToAdd[key]
  metrics = load_metrics()

  if case['pathology'] == 'MALIGNANT':
    metrics['MALIGNANT']+=1
  else:
    metrics['BENIGN']+=1
  save_metrics(metrics)
  if persist:
    saveDB()

def deleteCaseFromDB(id_, updateInfos=False, persist=False):
  if id_ not in DB['cases']:
    raise NoSuchIDInDBExcetpion('ID:{} not present in DB'.format(id_))

  metrics = load_metrics()
  if readCase(id_)['pathology'] == 'MALIGNANT':
    metrics['MALIGNANT']-=1
  else:
    metrics['BENIGN']-=1
  save_metrics(metrics)

  del DB['cases'][id_]
  del DB['infos']['cases'][id_]

  if updateInfos:
    DB['infos']['counters']['deleted']+=1
    for attribute in DB['config']['attributes']:

      if DB['config']['attributes'][attribute]['type'] in ['INTEGER', 'FLOAT']:
        DB['infos']['attributes'][attribute]['minInDB'] = +math.inf
        DB['infos']['attributes'][attribute]['maxInDB'] = -math.inf
        for case_id in DB['cases']:
          if DB['cases'][case_id][attribute] < DB['infos']['attributes'][attribute]['minInDB']:
            DB['infos']['attributes'][attribute]['minInDB'] = DB['cases'][case_id][attribute]
          if DB['cases'][case_id][attribute] > DB['infos']['attributes'][attribute]['maxInDB']:
            DB['infos']['attributes'][attribute]['maxInDB'] = DB['cases'][case_id][attribute]

    if DB['config']['result']['type'] in ['INTEGER', 'FLOAT']:
      DB['infos']['result']['minInDB'] = +math.inf
      DB['infos']['result']['maxInDB'] = -math.inf
      if DB['cases'][case_id][DB['config']['result']['name']] < DB['infos']['result']['minInDB']:
        DB['infos']['result']['minInDB'] = DB['cases'][case_id][DB['config']['result']['name']]
      if DB['cases'][case_id][DB['config']['result']['name']] > DB['infos']['result']['maxInDB']:
        DB['infos']['result']['maxInDB'] = DB['cases'][case_id][DB['config']['result']['name']]
  if persist:
    saveDB()

def readCase(id_):
  for caseId in DB['cases']:
    if caseId==id_:
      return DB['cases'][caseId]
  raise NoSuchCaseException('No case with the id: {} in the database.'.format(id_))

def similarity(newCase, caseId, updateInfos=False, expert=False, persist=False):
  verifyCase(newCase, includeResult=expert)
  realClassification = None
  if expert:
    realClassification = newCase[DB['config']['result']['name']]
  def normalizeCase(case):
    caseToNormalize = copy.deepcopy(case)
    for attribute in caseToNormalize:
      if attribute in ['id', 'roi']:
        continue
      if DB['config']['attributes'][attribute]['type'] in ['INTEGER', 'FLOAT']:
        if DB['infos']['attributes'][attribute]['maxInDB']-DB['infos']['attributes'][attribute]['minInDB']==0:
          caseToNormalize[attribute] = .5
        else:
          caseToNormalize[attribute] = (caseToNormalize[attribute] - DB['infos']['attributes'][attribute]['minInDB']) / (DB['infos']['attributes'][attribute]['maxInDB']-DB['infos']['attributes'][attribute]['minInDB'])
      elif DB['config']['attributes'][attribute]['type'] in ['INTERVAL_INTEGER', 'INTERVAL_FLOAT']:
        if DB['config']['attributes'][attribute]['maxInterval']-DB['config']['attributes'][attribute]['minInterval']:
          caseToNormalize[attribute] = .5
        else:
          caseToNormalize[attribute] = (caseToNormalize[attribute] - DB['config']['attributes'][attribute]['minInterval']) / (DB['config']['attributes'][attribute]['maxInterval']-DB['config']['attributes'][attribute]['minInterval'])
    return caseToNormalize
  def similarityHelper(case1, case2):
    result = 0
    sumWeights = 0
    case1, case2 = normalizeCase(case1), normalizeCase(case2)
    for attribute in case1:
      if attribute in ['id', 'roi']:
        continue
      if DB['config']['attributes'][attribute]['type'] in ['STRING', 'BOOLEAN', 'ENUM']:
        result += DB['config']['attributes'][attribute]['weight'] if case1[attribute] == case2[attribute] else 0
      else:
        result += (1-abs(case1[attribute] - case2[attribute])) * DB['config']['attributes'][attribute]['weight']
      sumWeights += DB['config']['attributes'][attribute]['weight']
    if DB['config']['aggregationSimilarity'] == TYPES_AGG['AVERAGE']:
      return result / sumWeights
    #else: #DB['config']['aggregationSimilarity'] == TYPES_AGG['SUM']
    return result
  case1, case2 = copy.deepcopy(newCase), copy.deepcopy(readCase(caseId))
  if expert:
    del case1[DB['config']['result']['name']]
  del case2[DB['config']['result']['name']]
  result = similarityHelper(case1, case2)
  if updateInfos:
    DB['infos']['cases'][caseId]['used_in_similarity'] += 1
    if expert:
      if realClassification == DB['cases'][caseId][DB['config']['result']['name']]:
        DB['infos']['cases'][caseId]['same_in_similarity'] += 1
      else:
        DB['infos']['cases'][caseId]['different_in_similarity'] += 1
    if result > DB['infos']['cases'][caseId]['best']:
      DB['infos']['cases'][caseId]['best'] = result
    if result < DB['infos']['cases'][caseId]['worst']:
      DB['infos']['cases'][caseId]['worst'] = result
    DB['infos']['cases'][caseId]['sum'] += result
    if expert:
      if realClassification == readCase(caseId)[DB['config']['result']['name']]:
        if result > DB['infos']['cases'][caseId]['best_same']:
          DB['infos']['cases'][caseId]['best_same'] = result
        if result < DB['infos']['cases'][caseId]['worst_same']:
          DB['infos']['cases'][caseId]['worst_same'] = result
        DB['infos']['cases'][caseId]['sum_same'] += result
      else:
        if result < DB['infos']['cases'][caseId]['best_different']:
          DB['infos']['cases'][caseId]['best_different'] = result
        if result > DB['infos']['cases'][caseId]['worst_different']:
          DB['infos']['cases'][caseId]['worst_different'] = result
        DB['infos']['cases'][caseId]['sum_different'] += result
    if persist:
      saveDB()
  return result

def deleteWorst(nbCases=None, updateInfos=False, reinitInfos=False, persist=False):
  weights = {}
  c0 = 10
  c1 = 3
  c2 = 3
  alpha = .2
  for caseId in DB['cases']:
    if DB['infos']['cases'][caseId]['used_in_similarity'] > c0:#to be able to judge
      if (DB['infos']['cases'][caseId]['same_in_similarity'] > c1 and DB['infos']['cases'][caseId]['different_in_similarity'] > c2):
        weights[caseId] = (alpha*DB['infos']['cases'][caseId]['sum_same']/DB['infos']['cases'][caseId]['same_in_similarity']
                         -(1-alpha)*DB['infos']['cases'][caseId]['sum_different']/DB['infos']['cases'][caseId]['different_in_similarity']
                         )/DB['infos']['cases'][caseId]['used_in_similarity']
        # weights[caseId] = DB['infos']['cases'][caseId]['sum_same']/DB['infos']['cases'][caseId]['same_in_similarity']
        # weights[caseId] = -DB['infos']['cases'][caseId]['sum_different']/DB['infos']['cases'][caseId]['different_in_similarity']
    if updateInfos and reinitInfos:
      DB['infos']['cases'][caseId] = {'best': -math.inf, 'worst': +math.inf, 'sum': 0,
                                    'best_same': -math.inf, 'worst_same': +math.inf, 'sum_same': 0,
                                    'best_different': +math.inf, 'worst_different': -math.inf, 'sum_different': 0,
                                    'used_in_similarity': DB['infos']['cases'][caseId]['used_in_similarity'],
                                    'same_in_similarity': DB['infos']['cases'][caseId]['same_in_similarity'],
                                    'different_in_similarity': DB['infos']['cases'][caseId]['different_in_similarity']
                                    }#We keep the same used_in_similarity, same_in_similarity and different_in_similarity
  toBeDel = None
  if nbCases is not None:
    toBeDel = list({k: v for k, v in sorted(weights.items(), key=lambda item: item[1], reverse=False)}.keys())[:nbCases]
  else:
    toBeDel = list({k: v for k, v in weights.items() if v <= 0}.keys())
  for key in toBeDel:
    deleteCaseFromDB(key, updateInfos=updateInfos, persist=persist)

  return len(toBeDel)

def topK(case, k=K, updateInfos=False, persist=False, expert=False):
  verifyCase(case, includeResult=expert)
  similarities = {}
  for caseId in DB['cases']:
    similarities[caseId] = similarity(case, caseId, updateInfos=updateInfos, expert=expert, persist=False)
  if updateInfos and persist:
    saveDB()

  return list(sorted(similarities.items(), key = lambda kv:(kv[1], kv[0]), reverse=True))[:k]

def classify(case, k=K, updateInfos=False, expert=False, persist=False):
  top = topK(case, k=k, updateInfos=updateInfos, expert=expert, persist=persist)
  output_classes = {key: {'sum': 0, 'counter': 0} for key in DB['config']['result']['enum']}
  for t in top:
    output = output_classes[DB['cases'][t[0]][DB['config']['result']['name']]]
    output['sum'] += t[1]
    output['counter'] += 1
  diagnosis = list({k: v for k, v in sorted(output_classes.items(), key=lambda item: (item[1]['counter'], item[1]['sum']), reverse=True)}.keys())[0]
  return diagnosis, top
