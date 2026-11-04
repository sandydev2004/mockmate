import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 20 Placement DSA Problems
const problems = [
  {
    id: "two-sum",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    category: "Arrays & Hashing",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    starter_code: {
      python: "def two_sum(nums, target):\n    # Write your solution here\n    pass",
      cpp: "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}",
      javascript: "function twoSum(nums, target) {\n    // Write your code here\n}"
    },
    test_cases: [
      { input: "[2,7,11,15]\n9", expected_output: "0 1", is_sample: true },
      { input: "[3,2,4]\n6", expected_output: "1 2", is_sample: true },
      { input: "[3,3]\n6", expected_output: "0 1", is_sample: false },
      { input: "[1,5,8,12,19]\n20", expected_output: "0 4", is_sample: false }
    ]
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "easy",
    category: "Stack",
    description: "Determine if input string containing brackets is valid.",
    starter_code: {
      python: "def is_valid(s: str) -> bool:\n    pass",
      cpp: "bool isValid(string s) {\n    return false;\n}",
      java: "class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}",
      javascript: "function isValid(s) {\n    return false;\n}"
    },
    test_cases: [
      { input: "()[]{}", expected_output: "true", is_sample: true },
      { input: "(]", expected_output: "false", is_sample: true },
      { input: "([{}])", expected_output: "true", is_sample: false }
    ]
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray (Kadane's Algorithm)",
    slug: "maximum-subarray",
    difficulty: "medium",
    category: "Arrays & Dynamic Programming",
    description: "Find the subarray with the largest sum and return its sum.",
    starter_code: {
      python: "def max_subarray(nums):\n    pass",
      cpp: "int maxSubArray(vector<int>& nums) {\n    return 0;\n}",
      java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}",
      javascript: "function maxSubArray(nums) {\n    return 0;\n}"
    },
    test_cases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected_output: "6", is_sample: true },
      { input: "[1]", expected_output: "1", is_sample: true },
      { input: "[5,4,-1,7,8]", expected_output: "23", is_sample: false }
    ]
  },
  {
    id: "best-time-stock",
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "easy",
    category: "Arrays & Sliding Window",
    description: "Maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
    starter_code: {
      python: "def max_profit(prices):\n    pass",
      cpp: "int maxProfit(vector<int>& prices) {\n    return 0;\n}",
      java: "class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}",
      javascript: "function maxProfit(prices) {\n    return 0;\n}"
    },
    test_cases: [
      { input: "[7,1,5,3,6,4]", expected_output: "5", is_sample: true },
      { input: "[7,6,4,3,1]", expected_output: "0", is_sample: true }
    ]
  },
  {
    id: "binary-search",
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "easy",
    category: "Binary Search",
    description: "Search target in sorted array in O(log n) time.",
    starter_code: {
      python: "def search(nums, target):\n    pass",
      cpp: "int search(vector<int>& nums, int target) {\n    return -1;\n}",
      java: "class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}",
      javascript: "function search(nums, target) {\n    return -1;\n}"
    },
    test_cases: [
      { input: "[-1,0,3,5,9,12]\n9", expected_output: "4", is_sample: true },
      { input: "[-1,0,3,5,9,12]\n2", expected_output: "-1", is_sample: true }
    ]
  },
  {
    id: "valid-anagram",
    title: "Valid Anagram",
    slug: "valid-anagram",
    difficulty: "easy",
    category: "Arrays & Strings",
    description: "Return true if t is an anagram of s, and false otherwise.",
    starter_code: {
      python: "def is_anagram(s, t):\n    pass",
      cpp: "bool isAnagram(string s, string t) {\n    return false;\n}",
      java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}",
      javascript: "function isAnagram(s, t) {\n    return false;\n}"
    },
    test_cases: [
      { input: "anagram\nnagaram", expected_output: "true", is_sample: true },
      { input: "rat\ncar", expected_output: "false", is_sample: true }
    ]
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    slug: "reverse-string",
    difficulty: "easy",
    category: "Two Pointers",
    description: "Reverse input string.",
    starter_code: {
      python: "def reverse_string(s):\n    return s[::-1]",
      cpp: "string reverseString(string s) { return s; }",
      java: "class Solution { public String reverse(String s) { return s; } }",
      javascript: "function reverse(s) { return s; }"
    },
    test_cases: [
      { input: "hello", expected_output: "olleh", is_sample: true },
      { input: "Hannah", expected_output: "hannaH", is_sample: true }
    ]
  },
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "easy",
    category: "Dynamic Programming",
    description: "In how many distinct ways can you climb n steps taking 1 or 2 steps at a time?",
    starter_code: {
      python: "def climb_stairs(n):\n    pass",
      cpp: "int climbStairs(int n) {\n    return 0;\n}",
      java: "class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}",
      javascript: "function climbStairs(n) {\n    return 0;\n}"
    },
    test_cases: [
      { input: "2", expected_output: "2", is_sample: true },
      { input: "3", expected_output: "3", is_sample: true }
    ]
  },
  {
    id: "coin-change",
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "medium",
    category: "Dynamic Programming",
    description: "Fewest number of coins needed to make up given amount.",
    starter_code: {
      python: "def coin_change(coins, amount):\n    pass",
      cpp: "int coinChange(vector<int>& coins, int amount) { return -1; }",
      java: "class Solution { public int coinChange(int[] coins, int amount) { return -1; } }",
      javascript: "function coinChange(coins, amount) { return -1; }"
    },
    test_cases: [
      { input: "[1,2,5]\n11", expected_output: "3", is_sample: true },
      { input: "[2]\n3", expected_output: "-1", is_sample: true }
    ]
  },
  {
    id: "longest-substring-without-repeat",
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "medium",
    category: "Sliding Window",
    description: "Find the length of the longest substring without repeating characters.",
    starter_code: {
      python: "def length_of_longest(s):\n    pass",
      cpp: "int lengthOfLongestSubstring(string s) { return 0; }",
      java: "class Solution { public int lengthOfLongestSubstring(String s) { return 0; } }",
      javascript: "function lengthOfLongestSubstring(s) { return 0; }"
    },
    test_cases: [
      { input: "abcabcbb", expected_output: "3", is_sample: true },
      { input: "bbbbb", expected_output: "1", is_sample: true }
    ]
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    slug: "container-with-most-water",
    difficulty: "medium",
    category: "Two Pointers",
    description: "Find two lines that together with x-axis form container with maximum water.",
    starter_code: {
      python: "def max_area(height):\n    pass",
      cpp: "int maxArea(vector<int>& height) { return 0; }",
      java: "class Solution { public int maxArea(int[] height) { return 0; } }",
      javascript: "function maxArea(height) { return 0; }"
    },
    test_cases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expected_output: "49", is_sample: true },
      { input: "[1,1]", expected_output: "1", is_sample: true }
    ]
  },
  {
    id: "3sum",
    title: "3Sum",
    slug: "3sum",
    difficulty: "medium",
    category: "Two Pointers",
    description: "Count of unique triplets that sum to 0.",
    starter_code: {
      python: "def three_sum(nums):\n    pass",
      cpp: "int threeSum(vector<int>& nums) { return 0; }",
      java: "class Solution { public int threeSum(int[] nums) { return 0; } }",
      javascript: "function threeSum(nums) { return 0; }"
    },
    test_cases: [
      { input: "[-1,0,1,2,-1,-4]", expected_output: "2", is_sample: true },
      { input: "[0,1,1]", expected_output: "0", is_sample: true }
    ]
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "hard",
    category: "Two Pointers",
    description: "Compute how much water can be trapped after rain.",
    starter_code: {
      python: "def trap(height):\n    pass",
      cpp: "int trap(vector<int>& height) { return 0; }",
      java: "class Solution { public int trap(int[] height) { return 0; } }",
      javascript: "function trap(height) { return 0; }"
    },
    test_cases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expected_output: "6", is_sample: true },
      { input: "[4,2,0,3,2,5]", expected_output: "9", is_sample: true }
    ]
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "medium",
    category: "Arrays & Sorting",
    description: "Merge all overlapping intervals and return count of remaining intervals.",
    starter_code: {
      python: "def merge_intervals(intervals):\n    pass",
      cpp: "int merge(vector<vector<int>>& intervals) { return 0; }",
      java: "class Solution { public int merge(int[][] intervals) { return 0; } }",
      javascript: "function merge(intervals) { return 0; }"
    },
    test_cases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expected_output: "3", is_sample: true },
      { input: "[[1,4],[4,5]]", expected_output: "1", is_sample: true }
    ]
  },
  {
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    slug: "top-k-frequent-elements",
    difficulty: "medium",
    category: "Heap & Hashing",
    description: "Return k most frequent elements in descending frequency.",
    starter_code: {
      python: "def top_k_frequent(nums, k):\n    pass",
      cpp: "string topKFrequent(vector<int>& nums, int k) { return \"\"; }",
      java: "class Solution { public String topKFrequent(int[] nums, int k) { return \"\"; } }",
      javascript: "function topKFrequent(nums, k) { return \"\"; }"
    },
    test_cases: [
      { input: "[1,1,1,2,2,3]\n2", expected_output: "1 2", is_sample: true },
      { input: "[1]\n1", expected_output: "1", is_sample: true }
    ]
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    slug: "number-of-islands",
    difficulty: "medium",
    category: "Graphs / BFS & DFS",
    description: "Count connected components of 1s in 2D binary grid.",
    starter_code: {
      python: "def num_islands(grid):\n    pass",
      cpp: "int numIslands(vector<vector<char>>& grid) { return 0; }",
      java: "class Solution { public int numIslands(char[][] grid) { return 0; } }",
      javascript: "function numIslands(grid) { return 0; }"
    },
    test_cases: [
      { input: "[[\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\"],[\"0\",\"0\",\"1\"]]", expected_output: "2", is_sample: true }
    ]
  },
  {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    difficulty: "medium",
    category: "Binary Search",
    description: "Find index of target in rotated sorted array, or -1.",
    starter_code: {
      python: "def search(nums, target):\n    pass",
      cpp: "int search(vector<int>& nums, int target) { return -1; }",
      java: "class Solution { public int search(int[] nums, int target) { return -1; } }",
      javascript: "function search(nums, target) { return -1; }"
    },
    test_cases: [
      { input: "[4,5,6,7,0,1,2]\n0", expected_output: "4", is_sample: true },
      { input: "[4,5,6,7,0,1,2]\n3", expected_output: "-1", is_sample: true }
    ]
  },
  {
    id: "invert-binary-tree",
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    difficulty: "easy",
    category: "Trees",
    description: "Invert a binary tree represented as level-order array.",
    starter_code: {
      python: "def invert_tree(arr):\n    pass",
      cpp: "string invertTree(string arr) { return arr; }",
      java: "class Solution { public String invertTree(String arr) { return arr; } }",
      javascript: "function invertTree(arr) { return arr; }"
    },
    test_cases: [
      { input: "[4,2,7,1,3,6,9]", expected_output: "[4, 7, 2, 9, 6, 3, 1]", is_sample: true }
    ]
  },
  {
    id: "palindrome-linked-list",
    title: "Palindrome Linked List",
    slug: "palindrome-linked-list",
    difficulty: "easy",
    category: "Linked List",
    description: "Determine if linked list is palindrome.",
    starter_code: {
      python: "def is_palindrome(arr):\n    pass",
      cpp: "bool isPalindrome(vector<int>& arr) { return true; }",
      java: "class Solution { public boolean isPalindrome(int[] arr) { return true; } }",
      javascript: "function isPalindrome(arr) { return true; }"
    },
    test_cases: [
      { input: "[1,2,2,1]", expected_output: "true", is_sample: true },
      { input: "[1,2]", expected_output: "false", is_sample: true }
    ]
  },
  {
    id: "product-of-array-except-self",
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    difficulty: "medium",
    category: "Arrays",
    description: "Return array where answer[i] is product of all elements except nums[i].",
    starter_code: {
      python: "def product_except_self(nums):\n    pass",
      cpp: "vector<int> productExceptSelf(vector<int>& nums) { return {}; }",
      java: "class Solution { public int[] productExceptSelf(int[] nums) { return new int[]{}; } }",
      javascript: "function productExceptSelf(nums) { return []; }"
    },
    test_cases: [
      { input: "[1,2,3,4]", expected_output: "24 12 8 6", is_sample: true },
      { input: "[-1,1,0,-3,3]", expected_output: "0 0 9 0 0", is_sample: true }
    ]
  }
];

async function seed() {
  console.log("Seeding MockMate DSA problems...");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes("mockmate-demo")) {
    console.log(`[INFO] Supabase not connected with live credentials. Loaded ${problems.length} problems into memory/local DSA registry.`);
    console.log("Sample problems ready: Two Sum, Valid Parentheses, Kadane's, Best Time Stock, etc.");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase.from("dsa_problems").upsert(problems, { onConflict: "id" });

  if (error) {
    console.error("Error inserting problems:", error.message);
  } else {
    console.log(`Successfully seeded ${problems.length} DSA problems into Supabase table public.dsa_problems!`);
  }
}

seed();

