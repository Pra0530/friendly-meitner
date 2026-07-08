export const dsaQuestions = [
  {
    category: "13 Must-Know Data Structures",
    questions: [
      { title: "Array" },
      { title: "Linked List" },
      { title: "Stack" },
      { title: "HashMap" },
      { title: "Matrix" },
      { title: "Queue" },
      { title: "Deque" },
      { title: "Binary Tree" },
      { title: "BST (Binary Search Tree)" },
      { title: "Heap" },
      { title: "Trie" },
      { title: "Graph" },
      { title: "Union Find" }
    ]
  },
  {
    category: "15 Patterns",
    questions: [
      { title: "Two Pointers" },
      { title: "Sliding Window" },
      { title: "Binary Search" },
      { title: "Frequency Counting" },
      { title: "Matrix Traversal" },
      { 
        title: "Monotonic Stack",
        code: `// Monotonic Stack Example
function nextGreaterElement(nums) {
  let stack = [];
  let result = new Array(nums.length).fill(-1);
  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {
      let idx = stack.pop();
      result[idx] = nums[i];
    }
    stack.push(i);
  }
  return result;
}
nextGreaterElement([2, 1, 2, 4, 3]);`
      },
      { title: "Prefix Sum" },
      { title: "Overlapping Intervals" },
      { title: "Greedy" },
      { title: "Top K Elements" },
      { title: "Backtracking" },
      { title: "Binary Tree Traversal" },
      { title: "Depth-First Search" },
      { title: "Breadth-First Search" },
      { title: "Dynamic Programming" }
    ]
  },
  {
    category: "Tree Traversals",
    questions: [
      { 
        title: "Preorder Traversal",
        code: `// Preorder Traversal
function preorder(node) {
  if (!node) return;
  console.log(node.val);
  preorder(node.left);
  preorder(node.right);
}`
      },
      { title: "Inorder Traversal" },
      { title: "Postorder Traversal" },
      { title: "Level-order Traversal" }
    ]
  },
  {
    category: "Array",
    questions: [
      {
        title: "Check if pair with the given Sum exists in Array",
        link: "https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/",
        code: `// Two Sum: Check if pair with given Sum exists
// Article Link: https://takeuforward.org/data-structure/two-sum-check-if-a-pair-with-given-sum-exists-in-array/
// Video Link: https://www.youtube.com/watch?v=UXDSeD9mN-k

function twoSum(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  // Requires array to be sorted for two-pointer approach
  arr.sort((a, b) => a - b);
  
  while (left < right) {
    let sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }
  return [-1, -1];
}

// Target is 14. Pair is (3, 11) -> indices in sorted array: 0 and 3
twoSum([11, 15, 3, 7], 14);`
      },
      { title: "Remove Duplicates from Sorted Array" },
      { title: "Move Zeroes" },
      { title: "Rotate Image 90°" },
      { title: "Max Sum Subarray of Size K" },
      {
        title: "Best Time to Buy and Sell Stock",
        link: "https://takeuforward.org/data-structure/stock-buy-and-sell/",
        insight: {
          pattern: "Single-pass Greedy",
          intuition: "Track the lowest price seen so far; at each new price, check if selling today beats the best profit found so far.",
          time: "O(n)",
          space: "O(1)"
        },
        code: `// Best Time to Buy and Sell Stock
// Article Link: https://takeuforward.org/data-structure/stock-buy-and-sell/
// Video Link: https://www.youtube.com/watch?v=excAOvwF_Wk

function maxProfit(prices) {
  let minPrice = Infinity;
  let maxPro = 0;
  
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    } else if (prices[i] - minPrice > maxPro) {
      maxPro = prices[i] - minPrice;
    }
  }
  return maxPro;
}

maxProfit([7, 1, 5, 3, 6, 4]);`
      },
      {
        title: "Find duplicates",
        link: "https://takeuforward.org/data-structure/find-the-duplicate-in-an-array-of-n1-integers/",
        code: `// Find the Duplicate Number (Floyd's Tortoise and Hare)
// Article Link: https://takeuforward.org/data-structure/find-the-duplicate-in-an-array-of-n1-integers/
// Video Link: https://www.youtube.com/watch?v=32Ll35mhWg0

function findDuplicate(nums) {
  let slow = nums[0];
  let fast = nums[0];
  
  // Phase 1: Detect cycle
  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);
  
  // Phase 2: Find cycle entrance (the duplicate)
  fast = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  
  return slow;
}

findDuplicate([1, 3, 4, 2, 2]);`
      },
      {
        title: "Product of Array Except Self",
        link: "https://leetcode.com/problems/product-of-array-except-self/",
        code: `// Product of Array Except Self
// Article Link: https://leetcode.com/problems/product-of-array-except-self/
// Video Link: https://www.youtube.com/watch?v=bNvIQI2wAkg

function productExceptSelf(nums) {
  const n = nums.length;
  const res = new Array(n).fill(1);
  
  // Compute prefix products
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    res[i] = prefix;
    prefix *= nums[i];
  }
  
  // Compute suffix products and multiply with prefix
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    res[i] *= suffix;
    suffix *= nums[i];
  }
  
  return res;
}

productExceptSelf([1, 2, 3, 4]);`
      },
      {
        title: "Maximum Subarray",
        link: "https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/",
        code: `// Maximum Subarray Sum (Kadane's Algorithm)
// Article Link: https://takeuforward.org/data-structure/kadanes-algorithm-maximum-subarray-sum-in-an-array/
// Video Link: https://www.youtube.com/watch?v=AHZpyENo7k4

function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    // Start a new subarray or extend the existing one
    if (nums[i] > currentSum + nums[i]) {
      currentSum = nums[i];
    } else {
      currentSum = currentSum + nums[i];
    }
    
    // Update maximum found so far
    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }
  return maxSum;
}

maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]);`
      },
      {
        title: "Sort Colors (Dutch National Flag)",
        insight: {
          pattern: "Three Pointers",
          intuition: "Use low, mid, and high pointers to partition the array into 0s, 1s, and 2s in a single pass.",
          time: "O(n)",
          space: "O(1)"
        },
        code: `// Sort Colors (Dutch National Flag Problem)
// Array contains only 0s, 1s, and 2s.

function sortColors(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;
  
  while (mid <= high) {
    if (nums[mid] === 0) {
      // Swap low and mid
      let temp = nums[low];
      nums[low] = nums[mid];
      nums[mid] = temp;
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      // Swap mid and high
      let temp = nums[high];
      nums[high] = nums[mid];
      nums[mid] = temp;
      high--;
    }
  }
  return nums;
}

sortColors([2, 0, 2, 1, 1, 0]);`
      },
      {
        title: "Maximum Product Subarray",
        link: "https://takeuforward.org/data-structure/maximum-product-subarray-in-an-array/",
        code: `// Maximum Product Subarray
// Article Link: https://takeuforward.org/data-structure/maximum-product-subarray-in-an-array/
// Video Link: https://www.youtube.com/watch?v=hnswaZdVKOM

function maxProduct(nums) {
  let result = nums[0];
  let currentMax = nums[0];
  let currentMin = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    let temp = currentMax;
    // We must track both min and max because multiplying two negatives yields a positive
    currentMax = Math.max(nums[i], Math.max(nums[i] * currentMax, nums[i] * currentMin));
    currentMin = Math.min(nums[i], Math.min(nums[i] * temp, nums[i] * currentMin));
    
    result = Math.max(result, currentMax);
  }
  return result;
}

maxProduct([2, 3, -2, 4]);`
      },
      {
        title: "Find Minimum in Rotated Sorted Array",
        link: "https://takeuforward.org/data-structure/minimum-in-rotated-sorted-array/",
        code: `// Find Minimum in Rotated Sorted Array (Binary Search)
// Article Link: https://takeuforward.org/data-structure/minimum-in-rotated-sorted-array/
// Video Link: https://www.youtube.com/watch?v=nhEMDKHQX5o

function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;
  let ans = Infinity;

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);

    // If left half is sorted
    if (nums[left] <= nums[mid]) {
      ans = Math.min(ans, nums[left]);
      left = mid + 1; // eliminate left half
    } 
    // If right half is sorted
    else {
      ans = Math.min(ans, nums[mid]);
      right = mid - 1; // eliminate right half
    }
  }
  return ans;
}

findMin([4, 5, 6, 7, 0, 1, 2]);`
      },
      {
        title: "Search in Rotated Sorted Array",
        link: "https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/",
        code: `// Search in Rotated Sorted Array (Modified Binary Search)
// Article Link: https://takeuforward.org/data-structure/search-element-in-a-rotated-sorted-array/
// Video Link: https://www.youtube.com/watch?v=5qGrJbHhqFs

function searchRotated(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    
    // Check if the left half is sorted
    if (nums[left] <= nums[mid]) {
      // Is target in the sorted left half?
      if (nums[left] <= target && target <= nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } 
    // Otherwise, the right half must be sorted
    else {
      // Is target in the sorted right half?
      if (nums[mid] <= target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }
  return -1;
}

searchRotated([4, 5, 6, 7, 0, 1, 2], 0);`
      },
      {
        title: "3 Sum",
        link: "https://takeuforward.org/data-structure/3-sum-find-triplets-that-add-up-to-a-zero/",
        code: `// 3 Sum: Find Triplets that add to zero
// Article Link: https://takeuforward.org/data-structure/3-sum-find-triplets-that-add-up-to-a-zero/
// Video Link: https://www.youtube.com/watch?v=DhFh8VcCddY

function threeSum(nums) {
  let ans = [];
  nums.sort((a, b) => a - b);
  const n = nums.length;
  
  for (let i = 0; i < n; i++) {
    if (i !== 0 && nums[i] === nums[i - 1]) continue;
    let j = i + 1;
    let k = n - 1;
    while (j < k) {
      let sum = nums[i] + nums[j] + nums[k];
      if (sum < 0) {
        j++;
      } else if (sum > 0) {
        k--;
      } else {
        ans.push([nums[i], nums[j], nums[k]]);
        j++;
        k--;
        while (j < k && nums[j] === nums[j - 1]) j++;
        while (j < k && nums[k] === nums[k + 1]) k--;
      }
    }
  }
  return ans;
}

threeSum([-1, 0, 1, 2, -1, -4]);`
      },
      {
        title: "Container With Most Water",
        link: "https://leetcode.com/problems/container-with-most-water/",
        code: `// Article Link: https://leetcode.com/problems/container-with-most-water/
// Video Link: https://www.youtube.com/watch?v=UuiTKBwPgAo

function maxArea(height) {
  let maxWater = 0;
  let left = 0;
  let right = height.length - 1;
  
  while (left < right) {
    let currentHeight = Math.min(height[left], height[right]);
    let currentWidth = right - left;
    let currentArea = currentHeight * currentWidth;
    
    maxWater = Math.max(maxWater, currentArea);
    
    // Move the shorter pointer to try and find a taller boundary
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  
  return maxWater;
}

maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]);`
      },
      { title: "Find the Factorial of a large number" },
      { title: "Trapping Rain Water" },
      { title: "Chocolate Distribution Problem" },
      { title: "Insert Interval" },
      { title: "Merge Intervals" },
      { title: "Non-overlapping Intervals" }
    ]
  },
  {
    category: "Star Patterns",
    questions: [
      {
        title: "Right Triangle",
        insight: {
          pattern: "Nested Loops",
          intuition: "The number of stars in each row equals the row number (1-indexed).",
          time: "O(n²)",
          space: "O(n²)"
        },
        code: `// 1. Right Triangle Star Pattern

function rightTriangle(n) {
  let grid = Array.from({length: n}, () => Array(n).fill(" "));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      grid[i][j] = "*";
    }
  }
  return grid;
}

rightTriangle(5);`
      },
      {
        title: "Hollow Square",
        insight: {
          pattern: "Boundary Checking",
          intuition: "Print a star only if you are on the first row, last row, first column, or last column.",
          time: "O(n²)",
          space: "O(n²)"
        },
        code: `// 2. Hollow Square Star Pattern

function hollowSquare(n) {
  let grid = Array.from({length: n}, () => Array(n).fill(" "));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 || i === n - 1 || j === 0 || j === n - 1) {
        grid[i][j] = "*";
      } else {
        grid[i][j] = " ";
      }
    }
  }
  return grid;
}

hollowSquare(5);`
      },
      {
        title: "Diamond Pattern",
        insight: {
          pattern: "Two Halves / Symmetry",
          intuition: "Split the logic into an upper pyramid and a lower inverted pyramid. Manage spaces and stars mathematically.",
          time: "O(n²)",
          space: "O(n²)"
        },
        code: `// 3. Diamond Star Pattern

function diamond(n) {
  const size = 2 * n - 1;
  let grid = Array.from({length: size}, () => Array(size).fill(" "));
  
  // Upper half
  for (let i = 1; i <= n; i++) {
    let startSpace = n - i;
    let stars = 2 * i - 1;
    for (let j = 0; j < stars; j++) {
      grid[i - 1][startSpace + j] = "*";
    }
  }
  
  // Lower half
  for (let i = n - 1; i >= 1; i--) {
    let startSpace = n - i;
    let stars = 2 * i - 1;
    for (let j = 0; j < stars; j++) {
      grid[(2 * n - 1) - i][startSpace + j] = "*";
    }
  }
  return grid;
}

diamond(3);`
      },
      {
        title: "Butterfly Pattern",
        insight: {
          pattern: "Mirror Symmetry",
          intuition: "Similar to the diamond, split into upper and lower halves. Each row has stars on the left, spaces in the middle, and stars on the right.",
          time: "O(n²)",
          space: "O(n²)"
        },
        code: `// 4. Butterfly Star Pattern

function butterfly(n) {
  const size = 2 * n;
  let grid = Array.from({length: size}, () => Array(size).fill(" "));
  
  // Upper half
  for (let i = 1; i <= n; i++) {
    let spaces = 2 * (n - i);
    // Left stars
    for (let j = 0; j < i; j++) grid[i - 1][j] = "*";
    // Right stars
    for (let j = 0; j < i; j++) grid[i - 1][size - 1 - j] = "*";
  }
  
  // Lower half
  for (let i = n; i >= 1; i--) {
    let rowIdx = (2 * n) - i;
    let spaces = 2 * (n - i);
    // Left stars
    for (let j = 0; j < i; j++) grid[rowIdx][j] = "*";
    // Right stars
    for (let j = 0; j < i; j++) grid[rowIdx][size - 1 - j] = "*";
  }
  
  return grid;
}

butterfly(3);`
      }
    ]
  },
  {
    category: "Matrix",
    questions: [
      { title: "Set Matrix Zeroes" },
      { title: "Spiral Matrix" },
      { title: "Program to find the transpose of a matrix" },
      { title: "Word Search" }
    ]
  },
  {
    category: "String",
    questions: [
      { title: "Reverse String" },
      { title: "Is Subsequence" },
      { title: "Valid Palindrome" },
      { title: "Longest Substring Without Repeating Characters" },
      { title: "Longest Repeating Character Replacement" },
      { title: "Smallest window in a String containing all characters of other String" },
      { title: "Check whether two Strings are anagram of each other" },
      { title: "Print all anagrams together" },
      { title: "Check if given Parentheses expression is balanced or not" },
      { title: "Sentence Palindrome" },
      { title: "Longest Palindromic Substring" },
      { title: "Palindromic Substrings" },
      { title: "Longest Common Prefix" }
    ]
  },
  {
    category: "Linked List",
    questions: [
      { title: "Reverse Linked List II" },
      { title: "Find Start of Cycle" },
      { title: "Reverse a Linked List" },
      { title: "Detect Cycle in a Linked List" },
      { title: "Merge Two Sorted Lists" },
      { title: "Merge K Sorted Lists" },
      { title: "Remove Nth Node From End Of List" },
      { title: "Reorder List" },
      { title: "Add 1 to a number represented as linked list" },
      { title: "Find the middle of a given linked list" },
      { title: "Delete last occurrence of an item from linked list" }
    ]
  },
  {
    category: "Stack & Queue",
    questions: [
      { title: "Queue Data Structure" },
      { title: "Stack Data Structure" },
      { title: "Valid Parentheses" },
      { title: "Convert Infix expression to Postfix expression" },
      { title: "Next Greater Element" },
      { title: "Delete middle element of a stack" },
      { title: "Check mirror in n-ary tree" },
      { title: "The Celebrity Problem" },
      { title: "Length of the longest valid substring" },
      { title: "Print Right View of a Binary Tree" },
      { title: "Find the first circular tour that visits all petrol pumps" }
    ]
  },
  {
    category: "10 Must-Know Graph Algorithms",
    questions: [
      { title: "Bidirectional BFS" },
      { title: "Graph - Adjacency List" },
      { title: "Graph - Adjacency Matrix" },
      { title: "Depth-First Search" },
      { title: "Breadth-First Search" },
      { title: "Topological Sort" },
      { title: "Union Find / DSU" },
      { title: "Cycle Detection" },
      { title: "Connected Components" },
      { title: "Bipartite Check" },
      { title: "Flood Fill" },
      { title: "Minimum Spanning Tree" },
      { title: "Kruskal's Algorithm" },
      { title: "Shortest Path" }
    ]
  },
  {
    category: "Bit Manipulations",
    questions: [
      { title: "Number of 1 Bits" },
      { title: "Counting Bits" },
      { title: "Missing Number" },
      { title: "Reverse Bits" },
      { title: "Find XOR of all subsets of a set" }
    ]
  },
  {
    category: "Dynamic Programming",
    questions: [
      {
        title: "Fibonacci (Recursion vs Memoization)",
        insight: {
          pattern: "Memoization (Top-Down DP)",
          intuition: "Cache results of expensive recursive calls to avoid computing the same subproblems repeatedly.",
          time: "O(n)",
          space: "O(n)"
        },
        code: `// Fibonacci with Memoization
// Visualizing the call tree and cached results

const memo = {};

function fib(n) {
  // Check cache
  if (n in memo) {
    return memo[n];
  }
  
  // Base cases
  if (n <= 1) {
    return n;
  }
  
  // Recursive calls
  const result = fib(n - 1) + fib(n - 2);
  
  // Store in cache
  memo[n] = result;
  
  return result;
}

fib(5);`
      },
      { title: "Count ways to reach the n'th stair" },
      { title: "Coin Change" },
      { title: "0/1 Knapsack Problem" },
      { title: "Longest Increasing Subsequence" },
      { title: "Longest Common Subsequence" },
      { title: "Word Break Problem" },
      { title: "Dice Throw" },
      { title: "Egg Dropping Puzzle" },
      { title: "Matrix Chain Multiplication" },
      { title: "Combination Sum" },
      { title: "Subset Sum Problem" },
      { title: "Find maximum possible stolen value from houses" },
      { title: "Count Possible Decodings of a given Digit Sequence" },
      { title: "Unique paths in a Grid with Obstacles" },
      { title: "Jump Game" },
      { title: "Cutting a Rod" },
      { title: "Maximum Product Cutting" },
      { title: "Count number of ways to cover a distance" }
    ]
  },
  {
    category: "Sorting",
    questions: [
      { title: "Merge Sort" },
      { title: "Quick Sort" },
      { title: "Insertion Sort" },
      { title: "Selection Sort" },
      { title: "Bubble Sort" }
    ]
  },
  {
    category: "Binary Tree",
    questions: [
      { title: "Invert Binary Tree" },
      { title: "Height of Binary Tree" }
    ]
  },
  {
    category: "Backtracking",
    questions: [
      { title: "Subsets" },
      { title: "Generate Parentheses" },
      { title: "N-Queens" }
    ]
  },
  {
    category: "Recursion",
    questions: [
      { title: "Tower of Hanoi" }
    ]
  },
  {
    category: "Computer Science Concepts",
    questions: [
      { title: "Concurrency vs Parallelism" },
      { title: "Big O" }
    ]
  },
  {
    category: "Hashing",
    questions: [
      { title: "Hash Table - Separate Chaining" }
    ]
  },
  {
    category: "SQL",
    questions: [
      { title: "SQL Execution Order" },
      { title: "LEFT JOIN" },
      { title: "RIGHT JOIN" },
      { title: "FULL OUTER JOIN" }
    ]
  },
  {
    category: "System Design (Caching)",
    questions: [
      { 
        title: "Cache Aside",
        insight: {
          pattern: "Read strategy",
          intuition: "App checks cache. On miss, app loads from DB and updates cache. Good for read-heavy workloads.",
          time: "N/A",
          space: "N/A"
        },
        code: `// Cache Aside Strategy
// 1. App requests data from Cache (Miss)
// 2. App reads data from Database
// 3. App writes data to Cache
// 4. App returns data to user

async function getUser(userId) {
  let user = await cache.get(userId);
  if (!user) {
    user = await db.get(userId);
    await cache.set(userId, user);
  }
  return user;
}
getUser(123);`
      },
      { title: "Read Through" },
      { title: "Write Through" },
      { title: "Write Around" },
      { title: "Write Back" }
    ]
  },
  {
    category: "Git Workflows",
    questions: [
      { 
        title: "How Git Works (Commit)",
        insight: {
          pattern: "Version Control",
          intuition: "Files move from Working Directory -> Staging Area -> Local Repo -> Remote",
          time: "N/A",
          space: "N/A"
        },
        code: `// Git workflow for committing changes
// 1. Edit files in Working Directory
// 2. git add (moves to Staging Area)
// 3. git commit (saves to Local Repository)
// 4. git push (uploads to Remote)

function gitWorkflow() {
  editFile("app.js");
  runCmd("git add app.js");
  runCmd("git commit -m 'add feature'");
  runCmd("git push origin main");
}
gitWorkflow();`
      }
    ]
  }
];
