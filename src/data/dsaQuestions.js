export const dsaQuestions = [
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
    category: "Graph",
    questions: [
      { title: "Clone Graph" },
      { title: "Course Schedule" },
      { title: "Pacific Atlantic Water Flow" },
      { title: "Number of Islands" },
      { title: "Longest Consecutive Sequence" },
      { title: "Snake and Ladder Problem" },
      { title: "Detect Cycle in a Directed Graph" },
      { title: "Bridges in a graph" },
      { title: "Check whether a given graph is Bipartite or not" },
      { title: "Find size of the largest region in Boolean Matrix" },
      { title: "Flood fill Algorithm" },
      { title: "Strongly Connected Components" },
      { title: "Topological Sorting" }
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
  }
];
