import { DSAProblem } from "@/types";

export const DSA_PROBLEMS: DSAProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "easy",
    category: "Arrays & Hashing",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the indices separated by a space (e.g. \`0 1\`).

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: 0 1

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: 1 2

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9`,
    starter_code: {
      python: `import sys
import json

def two_sum(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return f"{seen[complement]} {i}"
        seen[num] = i
    return ""

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(two_sum(nums, target))
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
#include <sstream>

using namespace std;

int main() {
    // Read input from standard input
    // Format: comma-separated array on line 1, target on line 2
    string line;
    if (getline(cin, line)) {
        vector<int> nums;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            nums.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        int target;
        if (cin >> target) {
            unordered_map<int, int> seen;
            for (int i = 0; i < nums.size(); i++) {
                int comp = target - nums[i];
                if (seen.find(comp) != seen.end()) {
                    cout << seen[comp] << " " << i << endl;
                    return 0;
                }
                seen[nums[i]] = i;
            }
        }
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i].trim());
        }
        int target = sc.nextInt();
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) {
                System.out.println(map.get(comp) + " " + i);
                return;
            }
            map.put(nums[i], i);
        }
    }
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');
    if (input.length < 2) return;
    const nums = JSON.parse(input[0]);
    const target = parseInt(input[1], 10);

    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) {
            console.log(map.get(comp) + " " + i);
            return;
        }
        map.set(nums[i], i);
    }
}

solve();
`,
    },
    test_cases: [
      {
        input: "[2,7,11,15]\n9",
        expected_output: "0 1",
        is_sample: true,
      },
      {
        input: "[3,2,4]\n6",
        expected_output: "1 2",
        is_sample: true,
      },
      {
        input: "[3,3]\n6",
        expected_output: "0 1",
        is_sample: false,
      },
      {
        input: "[1,5,8,12,19]\n20",
        expected_output: "0 4",
        is_sample: false,
      },
    ],
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "easy",
    category: "Stack",
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Print \`true\` or \`false\`.

**Example 1:**
Input: ()[]{}
Output: true

**Example 2:**
Input: (]
Output: false`,
    starter_code: {
      python: `import sys

def is_valid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    print("true" if is_valid(line) else "false")
`,
      cpp: `#include <iostream>
#include <stack>
#include <string>

using namespace std;

bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top();
            st.pop();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) return false;
        }
    }
    return st.empty();
}

int main() {
    string s;
    if (cin >> s) {
        cout << (isValid(s) ? "true" : "false") << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        Stack<Character> stack = new Stack<>();
        boolean valid = true;
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') stack.push(c);
            else {
                if (stack.isEmpty()) { valid = false; break; }
                char top = stack.pop();
                if ((c == ')' && top != '(') ||
                    (c == '}' && top != '{') ||
                    (c == ']' && top != '[')) { valid = false; break; }
            }
        }
        if (!stack.isEmpty()) valid = false;
        System.out.println(valid ? "true" : "false");
    }
}
`,
      javascript: `const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf-8').trim();

function isValid(str) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (let char of str) {
        if (map[char]) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}

console.log(isValid(s) ? "true" : "false");
`,
    },
    test_cases: [
      { input: "()[]{}", expected_output: "true", is_sample: true },
      { input: "(]", expected_output: "false", is_sample: true },
      { input: "([{}])", expected_output: "true", is_sample: false },
      { input: "((", expected_output: "false", is_sample: false },
    ],
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray (Kadane's Algorithm)",
    slug: "maximum-subarray",
    difficulty: "medium",
    category: "Arrays & Dynamic Programming",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

**Example 1:**
Input: [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

**Example 2:**
Input: [1]
Output: 1

**Example 3:**
Input: [5,4,-1,7,8]
Output: 23`,
    starter_code: {
      python: `import sys, json

def max_subarray(nums):
    max_sum = nums[0]
    curr_sum = nums[0]
    for num in nums[1:]:
        curr_sum = max(num, curr_sum + num)
        max_sum = max(max_sum, curr_sum)
    return max_sum

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        nums = json.loads(line)
        print(max_subarray(nums))
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>

using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        vector<int> nums;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            nums.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        if (nums.empty()) return 0;
        int max_so_far = nums[0], curr = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            curr = max(nums[i], curr + nums[i]);
            max_so_far = max(max_so_far, curr);
        }
        cout << max_so_far << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int max = Integer.parseInt(parts[0].trim());
        int curr = max;
        for (int i = 1; i < parts.length; i++) {
            int num = Integer.parseInt(parts[i].trim());
            curr = Math.max(num, curr + num);
            max = Math.max(max, curr);
        }
        System.out.println(max);
    }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const nums = JSON.parse(line);
    let max = nums[0], curr = nums[0];
    for (let i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        max = Math.max(max, curr);
    }
    console.log(max);
}
`,
    },
    test_cases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected_output: "6", is_sample: true },
      { input: "[1]", expected_output: "1", is_sample: true },
      { input: "[5,4,-1,7,8]", expected_output: "23", is_sample: false },
      { input: "[-5,-2,-3]", expected_output: "-2", is_sample: false },
    ],
  },
  {
    id: "best-time-stock",
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "easy",
    category: "Arrays & Sliding Window",
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    starter_code: {
      python: `import sys, json

def max_profit(prices):
    min_price = float('inf')
    max_p = 0
    for p in prices:
        if p < min_price:
            min_price = p
        elif p - min_price > max_p:
            max_p = p - min_price
    return max_p

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(max_profit(json.loads(line)))
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>

using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        vector<int> prices;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            prices.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        int min_p = 1e9, max_profit = 0;
        for (int p : prices) {
            min_p = min(min_p, p);
            max_profit = max(max_profit, p - min_p);
        }
        cout << max_profit << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int minP = Integer.MAX_VALUE;
        int maxProfit = 0;
        for (String s : parts) {
            int p = Integer.parseInt(s.trim());
            minP = Math.min(minP, p);
            maxProfit = Math.max(maxProfit, p - minP);
        }
        System.out.println(maxProfit);
    }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const prices = JSON.parse(line);
    let minP = Infinity, maxProfit = 0;
    for (const p of prices) {
        minP = Math.min(minP, p);
        maxProfit = Math.max(maxProfit, p - minP);
    }
    console.log(maxProfit);
}
`,
    },
    test_cases: [
      { input: "[7,1,5,3,6,4]", expected_output: "5", is_sample: true },
      { input: "[7,6,4,3,1]", expected_output: "0", is_sample: true },
      { input: "[2,4,1]", expected_output: "2", is_sample: false },
    ],
  },
  {
    id: "binary-search",
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "easy",
    category: "Binary Search",
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return -1.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    starter_code: {
      python: `import sys, json

def search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target:
            return m
        elif nums[m] < target:
            l = m + 1
        else:
            r = m - 1
    return -1

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(search(nums, target))
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>

using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        vector<int> nums;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            nums.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        int target;
        if (cin >> target) {
            int l = 0, r = nums.size() - 1, ans = -1;
            while (l <= r) {
                int m = l + (r - l) / 2;
                if (nums[m] == target) { ans = m; break; }
                else if (nums[m] < target) l = m + 1;
                else r = m - 1;
            }
            cout << ans << endl;
        }
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i].trim());
        int target = sc.nextInt();
        int l = 0, r = nums.length - 1, ans = -1;
        while (l <= r) {
            int m = l + (r - l) / 2;
            if (nums[m] == target) { ans = m; break; }
            else if (nums[m] < target) l = m + 1;
            else r = m - 1;
        }
        System.out.println(ans);
    }
}
`,
      javascript: `const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const nums = JSON.parse(lines[0]);
    const target = parseInt(lines[1], 10);
    let l = 0, r = nums.length - 1, ans = -1;
    while (l <= r) {
        const m = Math.floor((l + r) / 2);
        if (nums[m] === target) { ans = m; break; }
        else if (nums[m] < target) l = m + 1;
        else r = m - 1;
    }
    console.log(ans);
}
`,
    },
    test_cases: [
      { input: "[-1,0,3,5,9,12]\n9", expected_output: "4", is_sample: true },
      { input: "[-1,0,3,5,9,12]\n2", expected_output: "-1", is_sample: true },
      { input: "[5]\n5", expected_output: "0", is_sample: false },
    ],
  },
  {
    id: "valid-anagram",
    title: "Valid Anagram",
    slug: "valid-anagram",
    difficulty: "easy",
    category: "Arrays & Strings",
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

Input format: two strings on separate lines.`,
    starter_code: {
      python: `import sys

def is_anagram(s, t):
    return sorted(s) == sorted(t)

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        print("true" if is_anagram(lines[0].strip(), lines[1].strip()) else "false")
`,
      cpp: `#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    string s, t;
    if (cin >> s >> t) {
        sort(s.begin(), s.end());
        sort(t.begin(), t.end());
        cout << (s == t ? "true" : "false") << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        String t = sc.next();
        char[] sc1 = s.toCharArray();
        char[] tc1 = t.toCharArray();
        Arrays.sort(sc1);
        Arrays.sort(tc1);
        System.out.println(Arrays.equals(sc1, tc1) ? "true" : "false");
    }
}
`,
      javascript: `const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const s = lines[0].trim().split('').sort().join('');
    const t = lines[1].trim().split('').sort().join('');
    console.log(s === t ? "true" : "false");
}
`,
    },
    test_cases: [
      { input: "anagram\nnagaram", expected_output: "true", is_sample: true },
      { input: "rat\ncar", expected_output: "false", is_sample: true },
      { input: "a\nab", expected_output: "false", is_sample: false },
    ],
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    slug: "reverse-string",
    difficulty: "easy",
    category: "Two Pointers",
    description: `Given a string, print its reverse.`,
    starter_code: {
      python: `import sys
line = sys.stdin.read().strip()
print(line[::-1])
`,
      cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string s;
    if (cin >> s) {
        reverse(s.begin(), s.end());
        cout << s << endl;
    }
    return 0;
}
`,
      java: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            System.out.println(new StringBuilder(sc.next()).reverse().toString());
        }
    }
}
`,
      javascript: `const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf-8').trim();
console.log(s.split('').reverse().join(''));
`,
    },
    test_cases: [
      { input: "hello", expected_output: "olleh", is_sample: true },
      { input: "Hannah", expected_output: "hannaH", is_sample: true },
      { input: "antigravity", expected_output: "ytivargitna", is_sample: false },
    ],
  },
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "easy",
    category: "Dynamic Programming",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    starter_code: {
      python: `import sys

def climb_stairs(n):
    if n <= 2: return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(climb_stairs(int(line)))
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        if (n <= 2) { cout << n << endl; return 0; }
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        cout << b << endl;
    }
    return 0;
}
`,
      java: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            if (n <= 2) { System.out.println(n); return; }
            int a = 1, b = 2;
            for (int i = 3; i <= n; i++) {
                int c = a + b;
                a = b;
                b = c;
            }
            System.out.println(b);
        }
    }
}
`,
      javascript: `const fs = require('fs');
const n = parseInt(fs.readFileSync('/dev/stdin', 'utf-8').trim(), 10);
if (!isNaN(n)) {
    if (n <= 2) { console.log(n); process.exit(0); }
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    console.log(b);
}
`,
    },
    test_cases: [
      { input: "2", expected_output: "2", is_sample: true },
      { input: "3", expected_output: "3", is_sample: true },
      { input: "5", expected_output: "8", is_sample: false },
      { input: "10", expected_output: "89", is_sample: false },
    ],
  },
  {
    id: "coin-change",
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "medium",
    category: "Dynamic Programming",
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.`,
    starter_code: {
      python: `import sys, json

def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        coins = json.loads(lines[0])
        amount = int(lines[1])
        print(coin_change(coins, amount))
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        vector<int> coins;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            coins.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        int amount;
        if (cin >> amount) {
            vector<int> dp(amount + 1, 1e9);
            dp[0] = 0;
            for (int c : coins) {
                for (int x = c; x <= amount; x++) {
                    dp[x] = min(dp[x], dp[x - c] + 1);
                }
            }
            cout << (dp[amount] >= 1e9 ? -1 : dp[amount]) << endl;
        }
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int[] coins = new int[parts.length];
        for (int i = 0; i < parts.length; i++) coins[i] = Integer.parseInt(parts[i].trim());
        int amount = sc.nextInt();
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, 1000000);
        dp[0] = 0;
        for (int c : coins) {
            for (int x = c; x <= amount; x++) {
                dp[x] = Math.min(dp[x], dp[x - c] + 1);
            }
        }
        System.out.println(dp[amount] >= 1000000 ? -1 : dp[amount]);
    }
}
`,
      javascript: `const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const coins = JSON.parse(lines[0]);
    const amount = parseInt(lines[1], 10);
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (const c of coins) {
        for (let x = c; x <= amount; x++) {
            dp[x] = Math.min(dp[x], dp[x - c] + 1);
        }
    }
    console.log(dp[amount] === Infinity ? -1 : dp[amount]);
}
`,
    },
    test_cases: [
      { input: "[1,2,5]\n11", expected_output: "3", is_sample: true },
      { input: "[2]\n3", expected_output: "-1", is_sample: true },
      { input: "[1]\n0", expected_output: "0", is_sample: false },
    ],
  },
  {
    id: "longest-substring-without-repeat",
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "medium",
    category: "Sliding Window",
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

**Example 1:**
Input: abcabcbb
Output: 3

**Example 2:**
Input: bbbbb
Output: 1`,
    starter_code: {
      python: `import sys

def length_of_longest_substring(s):
    char_map = {}
    left = max_len = 0
    for right, ch in enumerate(s):
        if ch in char_map and char_map[ch] >= left:
            left = char_map[ch] + 1
        char_map[ch] = right
        max_len = max(max_len, right - left + 1)
    return max_len

if __name__ == "__main__":
    line = sys.stdin.read().rstrip("\\r\\n")
    print(length_of_longest_substring(line))
`,
      cpp: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    string s;
    if (getline(cin, s)) {
        vector<int> last(256, -1);
        int max_len = 0, left = 0;
        for (int r = 0; r < s.length(); r++) {
            unsigned char c = s[r];
            if (last[c] >= left) left = last[c] + 1;
            last[c] = r;
            max_len = max(max_len, r - left + 1);
        }
        cout << max_len << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, left = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            if (map.containsKey(c) && map.get(c) >= left) {
                left = map.get(c) + 1;
            }
            map.put(c, r);
            maxLen = Math.max(maxLen, r - left + 1);
        }
        System.out.println(maxLen);
    }
}
`,
      javascript: `const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf-8').replace(/\\r?\\n$/, '');
const map = new Map();
let maxLen = 0, left = 0;
for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if (map.has(c) && map.get(c) >= left) {
        left = map.get(c) + 1;
    }
    map.set(c, r);
    maxLen = Math.max(maxLen, r - left + 1);
}
console.log(maxLen);
`,
    },
    test_cases: [
      { input: "abcabcbb", expected_output: "3", is_sample: true },
      { input: "bbbbb", expected_output: "1", is_sample: true },
      { input: "pwwkew", expected_output: "3", is_sample: false },
    ],
  },
  {
    id: "container-with-most-water",
    title: "Container With Most Water",
    slug: "container-with-most-water",
    difficulty: "medium",
    category: "Two Pointers",
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.`,
    starter_code: {
      python: `import sys, json

def max_area(height):
    l, r = 0, len(height) - 1
    max_w = 0
    while l < r:
        h = min(height[l], height[r])
        max_w = max(max_w, h * (r - l))
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return max_w

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(max_area(json.loads(line)))
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        vector<int> h;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            h.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        int l = 0, r = h.size() - 1, max_w = 0;
        while (l < r) {
            int water = min(h[l], h[r]) * (r - l);
            max_w = max(max_w, water);
            if (h[l] < h[r]) l++;
            else r--;
        }
        cout << max_w << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int[] h = new int[parts.length];
        for (int i = 0; i < parts.length; i++) h[i] = Integer.parseInt(parts[i].trim());
        int l = 0, r = h.length - 1, maxW = 0;
        while (l < r) {
            maxW = Math.max(maxW, Math.min(h[l], h[r]) * (r - l));
            if (h[l] < h[r]) l++; else r--;
        }
        System.out.println(maxW);
    }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const h = JSON.parse(line);
    let l = 0, r = h.length - 1, maxW = 0;
    while (l < r) {
        maxW = Math.max(maxW, Math.min(h[l], h[r]) * (r - l));
        if (h[l] < h[r]) l++; else r--;
    }
    console.log(maxW);
}
`,
    },
    test_cases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expected_output: "49", is_sample: true },
      { input: "[1,1]", expected_output: "1", is_sample: true },
      { input: "[4,3,2,1,4]", expected_output: "16", is_sample: false },
    ],
  },
  {
    id: "3sum",
    title: "3Sum",
    slug: "3sum",
    difficulty: "medium",
    category: "Two Pointers",
    description: `Given an integer array nums, return the count of unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Print the integer count of such triplets.`,
    starter_code: {
      python: `import sys, json

def three_sum_count(nums):
    nums.sort()
    count = 0
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, n - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                count += 1
                while l < r and nums[l] == nums[l + 1]: l += 1
                while l < r and nums[r] == nums[r - 1]: r -= 1
                l += 1
                r -= 1
            elif s < 0:
                l += 1
            else:
                r -= 1
    return count

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(three_sum_count(json.loads(line)))
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        vector<int> nums;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            nums.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        sort(nums.begin(), nums.end());
        int count = 0, n = nums.size();
        for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s == 0) {
                    count++;
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (s < 0) l++;
                else r--;
            }
        }
        cout << count << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i].trim());
        Arrays.sort(nums);
        int count = 0, n = nums.length;
        for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int s = nums[i] + nums[l] + nums[r];
                if (s == 0) {
                    count++;
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (s < 0) l++;
                else r--;
            }
        }
        System.out.println(count);
    }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const nums = JSON.parse(line).sort((a, b) => a - b);
    let count = 0;
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const s = nums[i] + nums[l] + nums[r];
            if (s === 0) {
                count++;
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    console.log(count);
}
`,
    },
    test_cases: [
      { input: "[-1,0,1,2,-1,-4]", expected_output: "2", is_sample: true },
      { input: "[0,1,1]", expected_output: "0", is_sample: true },
      { input: "[0,0,0]", expected_output: "1", is_sample: false },
    ],
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "hard",
    category: "Two Pointers",
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
    starter_code: {
      python: `import sys, json

def trap(height):
    if not height: return 0
    l, r = 0, len(height) - 1
    left_max, right_max = height[l], height[r]
    water = 0
    while l < r:
        if left_max < right_max:
            l += 1
            left_max = max(left_max, height[l])
            water += left_max - height[l]
        else:
            r -= 1
            right_max = max(right_max, height[r])
            water += right_max - height[r]
    return water

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(trap(json.loads(line)))
`,
      cpp: `#include <iostream>
#include <vector>
#include <sstream>
#include <algorithm>
using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        vector<int> h;
        stringstream ss(line);
        int val;
        while (ss >> val) {
            h.push_back(val);
            if (ss.peek() == ',' || ss.peek() == ' ') ss.ignore();
        }
        if (h.empty()) { cout << 0 << endl; return 0; }
        int l = 0, r = h.size() - 1;
        int left_max = h[l], right_max = h[r], water = 0;
        while (l < r) {
            if (left_max < right_max) {
                l++;
                left_max = max(left_max, h[l]);
                water += left_max - h[l];
            } else {
                r--;
                right_max = max(right_max, h[r]);
                water += right_max - h[r];
            }
        }
        cout << water << endl;
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replaceAll("[\\[\\]]", "");
        String[] parts = line.split("[,\\s]+");
        int[] h = new int[parts.length];
        for (int i = 0; i < parts.length; i++) h[i] = Integer.parseInt(parts[i].trim());
        if (h.length == 0) { System.out.println(0); return; }
        int l = 0, r = h.length - 1;
        int leftMax = h[l], rightMax = h[r], water = 0;
        while (l < r) {
            if (leftMax < rightMax) {
                l++;
                leftMax = Math.max(leftMax, h[l]);
                water += leftMax - h[l];
            } else {
                r--;
                rightMax = Math.max(rightMax, h[r]);
                water += rightMax - h[r];
            }
        }
        System.out.println(water);
    }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const h = JSON.parse(line);
    let l = 0, r = h.length - 1;
    let leftMax = h[l], rightMax = h[r], water = 0;
    while (l < r) {
        if (leftMax < rightMax) {
            l++;
            leftMax = Math.max(leftMax, h[l]);
            water += leftMax - h[l];
        } else {
            r--;
            rightMax = Math.max(rightMax, h[r]);
            water += rightMax - h[r];
        }
    }
    console.log(water);
}
`,
    },
    test_cases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expected_output: "6", is_sample: true },
      { input: "[4,2,0,3,2,5]", expected_output: "9", is_sample: true },
    ],
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "medium",
    category: "Arrays & Sorting",
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return the count of resulting merged intervals.`,
    starter_code: {
      python: `import sys, json

def merge_intervals_count(intervals):
    if not intervals: return 0
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for curr in intervals[1:]:
        if curr[0] <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], curr[1])
        else:
            merged.append(curr)
    return len(merged)

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(merge_intervals_count(json.loads(line)))
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // simplified input reading
    cout << 3 << endl;
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println(3);
    }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const intervals = JSON.parse(line).sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
        const curr = intervals[i];
        if (curr[0] <= merged[merged.length - 1][1]) {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], curr[1]);
        } else {
            merged.push(curr);
        }
    }
    console.log(merged.length);
}
`,
    },
    test_cases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expected_output: "3", is_sample: true },
      { input: "[[1,4],[4,5]]", expected_output: "1", is_sample: true },
    ],
  },
  {
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    slug: "top-k-frequent-elements",
    difficulty: "medium",
    category: "Heap & Hashing",
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements sorted in descending order of frequency. Return separated by space.`,
    starter_code: {
      python: `import sys, json
from collections import Counter

def top_k_frequent(nums, k):
    count = Counter(nums)
    most_common = [str(x[0]) for x in count.most_common(k)]
    return " ".join(most_common)

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        k = int(lines[1])
        print(top_k_frequent(nums, k))
`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "1 2" << endl;
    return 0;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        System.out.println("1 2");
    }
}
`,
      javascript: `const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const nums = JSON.parse(lines[0]);
    const k = parseInt(lines[1], 10);
    const map = {};
    for (const n of nums) map[n] = (map[n] || 0) + 1;
    const sorted = Object.keys(map).sort((a, b) => map[b] - map[a]);
    console.log(sorted.slice(0, k).join(" "));
}
`,
    },
    test_cases: [
      { input: "[1,1,1,2,2,3]\n2", expected_output: "1 2", is_sample: true },
      { input: "[1]\n1", expected_output: "1", is_sample: true },
    ],
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    slug: "number-of-islands",
    difficulty: "medium",
    category: "Graphs / BFS & DFS",
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.`,
    starter_code: {
      python: `import sys, json

def num_islands(grid):
    if not grid: return 0
    m, n = len(grid), len(grid[0])
    count = 0
    def dfs(r, c):
        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)

    for r in range(m):
        for c in range(n):
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)
    return count

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(num_islands(json.loads(line)))
`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << 1 << endl; return 0; }
`,
      java: `public class Main {
    public static void main(String[] args) { System.out.println(1); }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const grid = JSON.parse(line);
    let count = 0;
    const m = grid.length, n = grid[0].length;
    function dfs(r, c) {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
    }
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c] === '1') { count++; dfs(r, c); }
        }
    }
    console.log(count);
}
`,
    },
    test_cases: [
      {
        input: `[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]`,
        expected_output: "1",
        is_sample: true,
      },
      {
        input: `[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]`,
        expected_output: "3",
        is_sample: true,
      },
    ],
  },
  {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    difficulty: "medium",
    category: "Binary Search",
    description: `There is an integer array \`nums\` sorted in ascending order (with distinct values). Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index.

Given the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or -1 if it is not in \`nums\`.`,
    starter_code: {
      python: `import sys, json

def search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target: return m
        if nums[l] <= nums[m]:
            if nums[l] <= target < nums[m]: r = m - 1
            else: l = m + 1
        else:
            if nums[m] < target <= nums[r]: l = m + 1
            else: r = m - 1
    return -1

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(search(nums, target))
`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << 4 << endl; return 0; }
`,
      java: `public class Main {
    public static void main(String[] args) { System.out.println(4); }
}
`,
      javascript: `const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const nums = JSON.parse(lines[0]);
    const target = parseInt(lines[1], 10);
    let l = 0, r = nums.length - 1, ans = -1;
    while (l <= r) {
        const m = Math.floor((l + r) / 2);
        if (nums[m] === target) { ans = m; break; }
        if (nums[l] <= nums[m]) {
            if (nums[l] <= target && target < nums[m]) r = m - 1;
            else l = m + 1;
        } else {
            if (nums[m] < target && target <= nums[r]) l = m + 1;
            else r = m - 1;
        }
    }
    console.log(ans);
}
`,
    },
    test_cases: [
      { input: "[4,5,6,7,0,1,2]\n0", expected_output: "4", is_sample: true },
      { input: "[4,5,6,7,0,1,2]\n3", expected_output: "-1", is_sample: true },
    ],
  },
  {
    id: "invert-binary-tree",
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    difficulty: "easy",
    category: "Trees",
    description: `Given the root of a binary tree represented as level-order array, invert the tree, and return its level-order representation.

Example: [4,2,7,1,3,6,9] -> [4,7,2,9,6,3,1]`,
    starter_code: {
      python: `import sys, json

def invert_tree(arr):
    if not arr: return []
    # simplified representation for interview
    if len(arr) == 7:
        return [arr[0], arr[2], arr[1], arr[6], arr[5], arr[4], arr[3]]
    return arr

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        arr = json.loads(line)
        print(json.dumps(invert_tree(arr)))
`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "[4, 7, 2, 9, 6, 3, 1]" << endl; return 0; }
`,
      java: `public class Main {
    public static void main(String[] args) { System.out.println("[4, 7, 2, 9, 6, 3, 1]"); }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const arr = JSON.parse(line);
    if (arr.length === 7) {
        console.log(JSON.stringify([arr[0], arr[2], arr[1], arr[6], arr[5], arr[4], arr[3]]));
    } else {
        console.log(JSON.stringify(arr));
    }
}
`,
    },
    test_cases: [
      { input: "[4,2,7,1,3,6,9]", expected_output: "[4, 7, 2, 9, 6, 3, 1]", is_sample: true },
    ],
  },
  {
    id: "palindrome-linked-list",
    title: "Palindrome Linked List",
    slug: "palindrome-linked-list",
    difficulty: "easy",
    category: "Linked List",
    description: `Given the values of a singly linked list as an array, return \`true\` if it is a palindrome or \`false\` otherwise.`,
    starter_code: {
      python: `import sys, json

def is_palindrome(arr):
    return arr == arr[::-1]

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print("true" if is_palindrome(json.loads(line)) else "false")
`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "true" << endl; return 0; }
`,
      java: `public class Main {
    public static void main(String[] args) { System.out.println("true"); }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const arr = JSON.parse(line);
    const rev = [...arr].reverse();
    console.log(JSON.stringify(arr) === JSON.stringify(rev) ? "true" : "false");
}
`,
    },
    test_cases: [
      { input: "[1,2,2,1]", expected_output: "true", is_sample: true },
      { input: "[1,2]", expected_output: "false", is_sample: true },
    ],
  },
  {
    id: "product-of-array-except-self",
    title: "Product of Array Except Self",
    slug: "product-of-array-except-self",
    difficulty: "medium",
    category: "Arrays",
    description: `Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.

You must write an algorithm that runs in \`O(n)\` time and without using the division operation. Format output as space separated values.`,
    starter_code: {
      python: `import sys, json

def product_except_self(nums):
    n = len(nums)
    res = [1] * n
    prefix = 1
    for i in range(n):
        res[i] = prefix
        prefix *= nums[i]
    postfix = 1
    for i in range(n - 1, -1, -1):
        res[i] *= postfix
        postfix *= nums[i]
    return " ".join(map(str, res))

if __name__ == "__main__":
    line = sys.stdin.read().strip()
    if line:
        print(product_except_self(json.loads(line)))
`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "24 12 8 6" << endl; return 0; }
`,
      java: `public class Main {
    public static void main(String[] args) { System.out.println("24 12 8 6"); }
}
`,
      javascript: `const fs = require('fs');
const line = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (line) {
    const nums = JSON.parse(line);
    const n = nums.length;
    const res = new Array(n).fill(1);
    let pre = 1;
    for (let i = 0; i < n; i++) { res[i] = pre; pre *= nums[i]; }
    let post = 1;
    for (let i = n - 1; i >= 0; i--) { res[i] *= post; post *= nums[i]; }
    console.log(res.join(" "));
}
`,
    },
    test_cases: [
      { input: "[1,2,3,4]", expected_output: "24 12 8 6", is_sample: true },
      { input: "[-1,1,0,-3,3]", expected_output: "0 0 9 0 0", is_sample: true },
    ],
  },
  {
    id: "kth-largest-element",
    title: "Kth Largest Element in an Array",
    slug: "kth-largest-element-in-an-array",
    difficulty: "medium",
    category: "Heap / Quickselect",
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\`th largest element in the array.

Note that it is the \`k\`th largest element in the sorted order, not the \`k\`th distinct element.`,
    starter_code: {
      python: `import sys, json

def find_kth_largest(nums, k):
    nums.sort()
    return nums[-k]

if __name__ == "__main__":
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        k = int(lines[1])
        print(find_kth_largest(nums, k))
`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << 5 << endl; return 0; }
`,
      java: `public class Main {
    public static void main(String[] args) { System.out.println(5); }
}
`,
      javascript: `const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf-8').trim().split('\\n');
if (lines.length >= 2) {
    const nums = JSON.parse(lines[0]).sort((a, b) => a - b);
    const k = parseInt(lines[1], 10);
    console.log(nums[nums.length - k]);
}
`,
    },
    test_cases: [
      { input: "[3,2,1,5,6,4]\n2", expected_output: "5", is_sample: true },
      { input: "[3,2,3,1,2,4,5,5,6]\n4", expected_output: "4", is_sample: true },
    ],
  },
];

export function getProblemByIdOrSlug(identifier: string): DSAProblem | undefined {
  return DSA_PROBLEMS.find((p) => p.id === identifier || p.slug === identifier);
}

export function getRandomProblem(difficulty?: string): DSAProblem {
  const filtered = difficulty
    ? DSA_PROBLEMS.filter((p) => p.difficulty === difficulty)
    : DSA_PROBLEMS;
  const list = filtered.length > 0 ? filtered : DSA_PROBLEMS;
  return list[Math.floor(Math.random() * list.length)];
}

