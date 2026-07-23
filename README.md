# 🧪 Logic & Automation Playground

Welcome! This workspace contains an interactive web application designed to help you learn and test both **Web Automation Testing** and **Geometric Algorithms (Rectangle Overlap)**.

---

## 🚀 How to Run the Application

Since this is a standalone HTML application, you can run it instantly without installing any dependencies:

1. Open [index.html](file:///Users/praphulragampeta/Documents/antigravity/friendly-meitner/index.html) in any web browser (Chrome, Safari, Firefox).
2. Use the top navigation tabs to switch between:
   - **🧪 Web Automation Testing**: Test form filling, buttons, assertions, and bug injections.
   - **📐 Rectangle Overlap Visualizer**: Test rectangle collision algorithms with 2D Canvas animations and drag-and-drop.

---

## 📐 Rectangle Overlap Algorithm Logic

Given two rectangles specified by their **top-left** point `l` and **bottom-right** point `r`:
- Rectangle 1: `l1 = Point(x1, y1)`, `r1 = Point(x2, y2)`
- Rectangle 2: `l2 = Point(x3, y3)`, `r2 = Point(x4, y4)`

### The De Morgan Overlap Rule
Instead of checking all conditions under which rectangles overlap (which are complex), it is mathematically much simpler to check the **4 conditions under which rectangles DO NOT overlap**:

1. **`l1.x > r2.x`**: Rect 1 is completely to the **right** of Rect 2.
2. **`l2.x > r1.x`**: Rect 2 is completely to the **right** of Rect 1.
3. **`r1.y > l2.y`**: Rect 1 is completely **above** Rect 2 (in Cartesian space where Y increases UP).
4. **`r2.y > l1.y`**: Rect 2 is completely **above** Rect 1 (in Cartesian space where Y increases UP).

If **ANY** of these 4 conditions is `True`, the rectangles are separated and **do not overlap**. If **ALL** 4 conditions are `False`, the rectangles **overlap**!

---

### Python Code Implementation
```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

def do_overlap(l1, r1, l2, r2):
    # 1. If one rectangle is to the left of the other
    if l1.x > r2.x or l2.x > r1.x:
        return False

    # 2. If one rectangle is above the other (in Cartesian Y-Up space)
    if r1.y > l2.y or r2.y > l1.y:
        return False

    return True

# Driver Code
if __name__ == "__main__":
    l1 = Point(0, 10)
    r1 = Point(10, 0)
    l2 = Point(5, 5)
    r2 = Point(15, 0)

    if do_overlap(l1, r1, l2, r2):
        print("Rectangles Overlap") # Output: Rectangles Overlap
    else:
        print("Rectangles Don't Overlap")
```

---

### JavaScript Code Implementation
```javascript
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

function doOverlap(l1, r1, l2, r2) {
  // Horizontal separation check
  if (l1.x > r2.x || l2.x > r1.x) {
    return false;
  }

  // Vertical separation check (Y-Up Cartesian)
  if (r1.y > l2.y || r2.y > l1.y) {
    return false;
  }

  return true;
}
```

---

## 💡 Note on Coordinate Systems (Cartesian vs Screen Space)

In standard mathematical Cartesian space (Y-Up):
- `(0, 10)` is **higher** than `(0, 0)`.
- Top-left `l1` has a **larger Y** value than bottom-right `r1`.

In computer screen/HTML Canvas space (Y-Down):
- `(0, 0)` is at the top-left of the screen.
- Top-left `l1` has a **smaller Y** value than bottom-right `r1`.

The interactive visualizer includes a **"Math Y-Up Space"** toggle button so you can visually test how coordinates translate in both systems!

---

## 🧪 Web Automation Testing Logic (3 Core Building Blocks)

1. **Find / Select**: `document.querySelector('#username')` or `page.locator('#username')`
2. **Act / Simulate**: `input.value = 'admin'`, `button.click()`
3. **Assert / Check**: `expect(page.locator('#message')).toHaveText('Login Successful')`
