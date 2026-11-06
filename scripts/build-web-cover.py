import sys, os, urllib.request, urllib.parse, subprocess
import numpy as np
from PIL import Image, ImageEnhance

HEADERS = {'User-Agent': 'NoalhubCoverPipeline/1.0 (https://noalhub.com; contact@noalhub.com)'}

def download_and_crop(url, output_tmp_jpg, y_focus=0.45):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        with open(output_tmp_jpg, 'wb') as f:
            f.write(resp.read())

    im = Image.open(output_tmp_jpg).convert('RGB')
    w, h = im.size
    target_ratio = 16 / 9

    if w / h > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        im = im.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = int((h - new_h) * y_focus)
        im = im.crop((0, top, w, top + new_h))

    im = im.resize((640, 360), Image.Resampling.LANCZOS)
    return im

def grade_nocturnal_chiaroscuro(im, gold_boost=1.0):
    arr = np.array(im, dtype=np.float32)

    # Dynamic range expansion
    p_low, p_high = np.percentile(arr, (5, 95))
    arr_norm = np.clip((arr - p_low) / (p_high - p_low + 1e-5), 0.0, 1.0)

    # Nocturnal Scholastic Palette mapping
    shadow_color = np.array([0, 22, 29], dtype=np.float32)   # Deep ink teal
    mid_color = np.array([12, 54, 66], dtype=np.float32)     # Midnight stone
    gold_color = np.array([238, 168, 52], dtype=np.float32) * gold_boost # Warm golden amber

    lum = 0.299 * arr_norm[:,:,0] + 0.587 * arr_norm[:,:,1] + 0.114 * arr_norm[:,:,2]

    out = np.zeros_like(arr)
    for y in range(360):
        for x in range(640):
            l = lum[y, x]
            if l < 0.42:
                t = l / 0.42
                col = shadow_color * (1 - t) + mid_color * t
            else:
                t = (l - 0.42) / 0.58
                col = mid_color * (1 - t) + gold_color * t

            # 30% original color blended with 70% nocturnal mapping
            blended = 0.30 * arr[y, x] * 0.75 + 0.70 * col
            out[y, x] = np.clip(blended, 0, 255)

    return Image.fromarray(np.uint8(out))

def process_topic(topic_id, img_url, y_focus=0.45, gold_boost=1.0):
    print(f'=== Processing topic: {topic_id} ===')
    tmp_raw = f'/tmp/raw_{topic_id}.jpg'
    tmp_graded = f'/tmp/graded_{topic_id}.png'

    im = download_and_crop(img_url, tmp_raw, y_focus=y_focus)
    graded = grade_nocturnal_chiaroscuro(im, gold_boost=gold_boost)
    graded.save(tmp_graded)

    cmd = ['node', 'scripts/batch-trace-cover.mjs', tmp_graded, topic_id]
    subprocess.run(cmd, check=True)

    dest = f'apps/web/public/images/default-covers/{topic_id}.svg'
    sz = os.path.getsize(dest)
    print(f'[SUCCESS] {topic_id}.svg generated ({sz} bytes)\n')

if __name__ == '__main__':
    if len(sys.argv) >= 3:
        process_topic(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 0.45)
