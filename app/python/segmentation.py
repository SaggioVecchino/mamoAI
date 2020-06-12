import sys
import os
import json
import cv2 as cv
import numpy as np
from torch import tensor
import torch
import torchvision.transforms as transforms

DEVICE = 'cpu'
ROOT = os.path.join('.','app','python')

def apply_contours(image):
  mask = cv.imread(os.path.join(ROOT, 'pr_mask.png'), 0)
  def get_surface(rect):
    return rect[2]*rect[3]
  def get_coordinates(rect):
    xmin, ymin, xmax, ymax = rect[0], rect[1], rect[0]+rect[2], rect[1]+rect[3]
    return xmin, ymin, xmax, ymax
  def crop_image(image, xmin, ymin, xmax, ymax, margin = 0):
    xmin = max(0, xmin - margin)
    ymin = max(0, ymin - margin)
    xmax = min(256, xmax + margin)
    ymax = min(512, ymax + margin)
    return image[ymin:ymax, xmin:xmax].copy()
  contours_, hierarchy_ = cv.findContours(mask, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

  contours = []
  rectangles = []
  surfaces = []
  lens = []
  for contour in contours_:
    rect = cv.boundingRect(contour)
    surface = get_surface(rect)
    surfaces.append(surface)
    lens.append(len(contour))
    if surface < 100:
      continue
    contours.append(contour)
    rectangles.append(rect)

  print(json.dumps({'rectangles': rectangles, 'surfaces':surfaces, 'lens': lens, 'nb_rois': len(rectangles)}))
  image_with_contours = cv.drawContours(image.copy(), contours, -1, (0, 0, 255), 1)
  margin = 10
  for i, rect in enumerate(rectangles):
    xmin, ymin, xmax, ymax = get_coordinates(rect)
    cv.imwrite(os.path.join(ROOT, 'rois', 'roi_'+str(i)+'.png'), crop_image(image.copy(), xmin, ymin, xmax, ymax, margin = margin))
    contoured = crop_image(image_with_contours.copy(), xmin, ymin, xmax, ymax, margin = margin)
    scale = 2
    contoured_upscaled = cv.resize(contoured, (int(contoured.shape[1]*scale),int(contoured.shape[0]*scale)), cv.INTER_AREA)
    cv.imwrite(os.path.join(ROOT, 'rois', 'roi_'+str(i)+'_contours_upscaled.png'), contoured_upscaled)
    cv.rectangle(image, (xmin, ymin), (xmax, ymax), (0, 0, 255), 1)
  cv.imwrite(os.path.join(ROOT, 'image_with_contours.png'), image)
  return image

def visualize(**images):
    import matplotlib.pyplot as plt
    """PLot images in one row."""
    n = len(images)
    plt.figure(figsize=(16, 5))
    for i, (name, image) in enumerate(images.items()):
        plt.subplot(1, n, i + 1)
        plt.xticks([])
        plt.yticks([])
        plt.title(' '.join(name.split('_')).title())
        plt.imshow(image)
    plt.show()

def predic_mask(image_path):
    from time import sleep
    def preprocessing(image):
      transform_img = transforms.Compose([transforms.ToTensor(), transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])])
      return transform_img(image)
    image_read = cv.imread(image_path, 1)
    image_read = cv.cvtColor(image_read, cv.COLOR_BGR2GRAY)
    image_read = cv.split(cv.cvtColor(cv.cvtColor(image_read, cv.COLOR_GRAY2BGR), cv.COLOR_BGR2LAB))[0]
    clahe = cv.createCLAHE()
    image_read = clahe.apply(image_read)
    image_read = cv.cvtColor(image_read, cv.COLOR_GRAY2BGR)
    image_read = cv.medianBlur(image_read, 3)
    image_read = cv.resize(image_read, dsize=(256, 512))
    image_ = preprocessing(image_read)
    x_tensor = torch.from_numpy(image_.numpy()).type(torch.FloatTensor).to(DEVICE).unsqueeze(0)
    model = torch.load(os.path.join(ROOT, 'vgg13_full.pth'), map_location=torch.device(DEVICE))
    model = model.to(DEVICE)
    pr_mask = model.predict(x_tensor)
    pr_mask = (pr_mask.squeeze().cpu().numpy())
    pr_mask = np.where(pr_mask>.5, 1, 0)*255
    cv.imwrite(os.path.join(ROOT, 'pr_mask.png'), pr_mask)
    image_with_contours = apply_contours(image_read.copy())

def main(args):
    data = {'path': args[0]}
    predic_mask(data['path'])
    print(json.dumps(data))


if __name__ == "__main__":
    main(sys.argv[1:])
