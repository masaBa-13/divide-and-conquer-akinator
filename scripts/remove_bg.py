"""
白背景を透過するスクリプト。
四隅からflood fillで背景を検出し、透過処理を行う。
"""
import sys
from PIL import Image
from collections import deque


def remove_white_bg(input_path: str, output_path: str, tolerance: int = 30) -> None:
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    visited = [[False] * h for _ in range(w)]
    queue: deque[tuple[int, int]] = deque()

    # 四隅をシードとしてキューに追加
    for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if not visited[sx][sy]:
            visited[sx][sy] = True
            queue.append((sx, sy))

    def is_background(r: int, g: int, b: int) -> bool:
        return r >= 255 - tolerance and g >= 255 - tolerance and b >= 255 - tolerance

    # BFSで背景ピクセルを透過
    while queue:
        x, y = queue.popleft()
        r, g, b, a = pixels[x, y]
        if not is_background(r, g, b):
            continue
        pixels[x, y] = (r, g, b, 0)

        for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                visited[nx][ny] = True
                queue.append((nx, ny))

    img.save(output_path, "PNG")
    print(f"✓ {output_path}")


if __name__ == "__main__":
    targets = sys.argv[1:] if len(sys.argv) > 1 else []
    for path in targets:
        remove_white_bg(path, path)
