import { CompanyType, Difficulty, RoundType, TargetCompany } from "@/types";

export interface PracticeQuestion {
  id: string;
  question: string;
  answer: string;
  codeSnippet?: string;
  approach?: string;
  complexity?: string;
  proTip: string;
}

export interface PracticePageData {
  company: TargetCompany;
  companySlug: string;
  slug: string;
  title: string;
  subtitle: string;
  metaDescription: string;
  companyType: CompanyType;
  round: RoundType;
  difficulty: Difficulty;
  readTime: string;
  overview: string;
  selectionProcess: string[];
  keyTopics: string[];
  questions: PracticeQuestion[];
  faqs: Array<{ q: string; a: string }>;
}

export const PRACTICE_PAGES: PracticePageData[] = [
  {
    company: "TCS",
    companySlug: "tcs",
    slug: "tcs-nqt-interview-questions",
    title: "TCS NQT Interview Questions & Answers (2025 Placement Guide)",
    subtitle: "Complete technical & HR questions asked in TCS NQT, Digital, and Prime placement rounds.",
    metaDescription: "Master TCS NQT and TCS Digital technical interview questions. Detailed solutions on DSA, SQL, OOP, and HR questions with mock practice.",
    companyType: "service",
    round: "dsa",
    difficulty: "medium",
    readTime: "8 min read",
    overview: "Tata Consultancy Services (TCS) recruits through the National Qualifier Test (NQT) followed by technical, managerial, and HR interviews. Candidates qualifying for Ninja, Digital, or Prime tracks are evaluated on coding speed, foundational algorithms, core CS concepts, and structured communication.",
    selectionProcess: [
      "TCS NQT Online Assessment (Cognitive + Hands-on Coding)",
      "Technical Interview (DSA, OOP, DBMS & Final Year Project)",
      "Managerial Round (Situational & Problem Solving)",
      "HR Round (Communication, Relocation, Shift Flexibility)",
    ],
    keyTopics: ["Arrays & Strings", "SQL Joins & Group By", "OOP Principles", "Time & Space Complexity", "Relational Database Concepts"],
    questions: [
      {
        id: "tcs-q1",
        question: "How do you find the second largest element in an unsorted array in a single pass?",
        answer: "Maintain two variables: largest and secondLargest initialized to negative infinity. Iterate through the array once: if current element is greater than largest, update secondLargest = largest, then largest = current. If current is strictly between largest and secondLargest, update secondLargest = current.",
        codeSnippet: `int findSecondLargest(vector<int>& arr) {
    int first = INT_MIN, second = INT_MIN;
    for (int x : arr) {
        if (x > first) {
            second = first;
            first = x;
        } else if (x > second && x != first) {
            second = x;
        }
    }
    return second == INT_MIN ? -1 : second;
}`,
        approach: "Single-pass linear scan keeping track of two highest values.",
        complexity: "Time: O(N), Space: O(1)",
        proTip: "TCS interviewers frequently look for single-pass solutions instead of O(N log N) sorting approaches.",
      },
      {
        id: "tcs-q2",
        question: "Explain the difference between WHERE and HAVING clauses in SQL with an example.",
        answer: "The WHERE clause filters individual rows before any grouping occurs and cannot be used with aggregate functions (SUM, AVG, COUNT). The HAVING clause filters aggregated groups after the GROUP BY clause has been applied.",
        codeSnippet: `SELECT department_id, COUNT(*) AS emp_count 
FROM employees 
WHERE salary > 30000 
GROUP BY department_id 
HAVING COUNT(*) > 5;`,
        approach: "WHERE operates on raw tuples; HAVING operates on grouped aggregates.",
        complexity: "Database execution pipeline: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT",
        proTip: "Write out the query on the whiteboard or code editor to demonstrate solid syntax mastery.",
      },
      {
        id: "tcs-q3",
        question: "What are the four pillars of OOP and how do you implement them in real-world software?",
        answer: "1. Encapsulation: Bundling data and methods while restricting direct access via private fields and getters/setters. 2. Abstraction: Hiding implementation details and exposing only essential interfaces. 3. Inheritance: Reusing attributes and methods from a parent class. 4. Polymorphism: Ability to take multiple forms through method overloading (compile-time) and method overriding (runtime).",
        approach: "Explain each pillar with a real project example (e.g. PaymentGateway base class with UPI and Card subclasses).",
        proTip: "Always tie OOP answers back to your final year engineering project rather than generic Animal/Dog analogies.",
      },
    ],
    faqs: [
      {
        q: "What programming languages are permitted in TCS NQT technical interviews?",
        a: "C, C++, Java, and Python are supported in all TCS technical rounds. Python is common, but C++ and Java are preferred by traditional panels for core memory/OOP questions.",
      },
      {
        q: "How important is the final year college project in TCS interviews?",
        a: "Extremely important. Nearly 40% of the technical round in TCS Digital and Ninja focuses on project architecture, database schema, personal contributions, and challenges faced.",
      },
    ],
  },
  {
    company: "Infosys",
    companySlug: "infosys",
    slug: "infosys-hr-round-questions",
    title: "Infosys HR Round Interview Questions & Answers",
    subtitle: "Behavioral and HR interview questions asked in Infosys campus placement recruitment drives.",
    metaDescription: "Crack the Infosys HR interview round. Learn best answers for relocation, conflict handling, career aspirations, and salary expectations.",
    companyType: "service",
    round: "hr",
    difficulty: "easy",
    readTime: "7 min read",
    overview: "The Infosys HR round evaluates candidate communication, corporate adaptability, willingness to relocate to training centers like Infosys Mysore, cultural fit, and long-term commitment. Structured answers using the STAR method make a positive impression.",
    selectionProcess: [
      "Infosys Online Test (Reasoning, Verbal, Mathematical, Pseudo-code)",
      "Technical Interview (Core CS, DBMS, OOP, Programming)",
      "HR Interview (Culture, Background, Mysore Training Readiness)",
    ],
    keyTopics: ["Self Introduction", "Handling Pressure & Deadlines", "Relocation & Shift Flexibility", "Continuous Learning", "Teamwork & Conflict"],
    questions: [
      {
        id: "infy-q1",
        question: "Tell me about yourself in 90 seconds.",
        answer: "Structure your answer in 3 parts: 1) Education & technical foundation (B.Tech branch, college, core interests). 2) Practical engineering highlights (projects, internships, hackathons). 3) Motivation for Infosys (reputation for global delivery, world-class Mysore training, passion to build enterprise software).",
        approach: "Present Present-Past-Future flow: current degree -> past accomplishments -> why Infosys is the ideal launchpad.",
        proTip: "Keep it under 90 seconds. Focus on what is not obvious from reading your resume alone.",
      },
      {
        id: "infy-q2",
        question: "Are you willing to relocate to any Infosys delivery center across India?",
        answer: "Yes, absolutely. As a fresh engineering graduate, my priority is learning, gaining hands-on software development experience, and working with cross-functional teams. I am excited to experience new work cultures across cities like Bengaluru, Pune, Hyderabad, or Mysore.",
        approach: "Direct positive confirmation followed by enthusiasm for professional growth.",
        proTip: "Hesitation on relocation or rotational shifts is one of the top rejection reasons in service company HR rounds.",
      },
      {
        id: "infy-q3",
        question: "Describe a project deadline conflict you faced with a teammate and how you resolved it.",
        answer: "Use STAR: Situation: In our college 6th semester DBMS project, a teammate had exam backlogs and fell behind on the authentication module. Task: We needed to submit the prototype in 48 hours. Action: I sat down with him, broke the module into smaller sub-tasks, took over the token validation logic, while he completed the SQL schema. Result: We submitted on time and received an 'A' grade.",
        approach: "Emphasize empathy, proactive communication, and zero blame.",
        proTip: "Never badmouth peers or professors. Frame challenges as collaborative opportunities.",
      },
    ],
    faqs: [
      {
        q: "Is the Infosys HR round an elimination round?",
        a: "Yes. While technical performance carries the heaviest weight, candidates showing poor communication, reluctance to relocate, or unethical behavior in HR are routinely eliminated.",
      },
      {
        q: "What should I wear for the Infosys virtual interview?",
        a: "Formal attire (collared shirt, neat grooming) in a quiet, well-lit environment with a neutral background.",
      },
    ],
  },
  {
    company: "Amazon",
    companySlug: "amazon",
    slug: "amazon-sde-dsa-interview-questions",
    title: "Amazon SDE DSA Interview Questions & Problem Approaches",
    subtitle: "High-frequency coding and data structure problems for Amazon SDE 1 campus placement rounds.",
    metaDescription: "Ace your Amazon SDE 1 campus interview. In-depth solutions for top Amazon DSA problems, Leadership Principles, and time complexity tradeoffs.",
    companyType: "product",
    round: "dsa",
    difficulty: "hard",
    readTime: "12 min read",
    overview: "Amazon SDE 1 interviews demand optimal data structure solutions, rigorous consideration of edge cases, clean and modular code, and answers aligned with Amazon's 16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep).",
    selectionProcess: [
      "Amazon Online Assessment (OA2: Coding + Work Simulation + Leadership Survey)",
      "Technical Round 1: DSA (Arrays, Strings, Trees, Graphs, Hash Maps)",
      "Technical Round 2: Advanced DSA & Problem Solving (Dynamic Programming, Heaps)",
      "Bar Raiser Round: Coding + Deep Dive on Amazon Leadership Principles",
    ],
    keyTopics: ["Two Pointers & Sliding Window", "Binary Trees & BSTs", "Graph Traversal (BFS/DFS)", "Heaps & Priority Queues", "Amazon Leadership Principles"],
    questions: [
      {
        id: "amz-q1",
        question: "Given an array of integers and a target k, find the length of the longest subarray having sum equal to k.",
        answer: "Use a Hash Map to store cumulative prefix sums and their earliest seen indices. As we traverse the array, maintain prefixSum. If prefixSum == k, maxLen = i + 1. If (prefixSum - k) exists in our hash map, the subarray between map[prefixSum - k] and i sums to k, so update maxLen = max(maxLen, i - map[prefixSum - k]). Store prefixSum in map only if not already present to maximize length.",
        codeSnippet: `int maxSubArrayLen(vector<int>& nums, int k) {
    unordered_map<long long, int> prefixMap;
    long long currentSum = 0;
    int maxLen = 0;
    for (int i = 0; i < nums.size(); i++) {
        currentSum += nums[i];
        if (currentSum == k) maxLen = i + 1;
        if (prefixMap.find(currentSum - k) != prefixMap.end()) {
            maxLen = max(maxLen, i - prefixMap[currentSum - k]);
        }
        if (prefixMap.find(currentSum) == prefixMap.end()) {
            prefixMap[currentSum] = i;
        }
    }
    return maxLen;
}`,
        approach: "Prefix Sum combined with Hash Map lookup to achieve linear time complexity even with negative numbers.",
        complexity: "Time: O(N), Space: O(N)",
        proTip: "Amazon interviewers will explicitly ask how your solution behaves with negative numbers and zero values.",
      },
      {
        id: "amz-q2",
        question: "How do you serialize and deserialize a Binary Tree efficiently?",
        answer: "Use preorder traversal with a delimiter (such as commas) and a sentinel marker (like '#') for null nodes. For deserialization, parse the string using a queue and reconstruct the tree recursively by popping node values.",
        codeSnippet: `// Serialization
void serializeHelper(TreeNode* root, string& out) {
    if (!root) { out += "#,"; return; }
    out += to_string(root->val) + ",";
    serializeHelper(root->left, out);
    serializeHelper(root->right, out);
}`,
        approach: "Pre-order DFS traversal with distinct null identifiers.",
        complexity: "Time: O(N), Space: O(N)",
        proTip: "Mention how this translates to real-world cloud storage of tree-based hierarchical product catalogs.",
      },
    ],
    faqs: [
      {
        q: "How does Amazon evaluate Leadership Principles during coding rounds?",
        a: "Every interview starts or ends with 15 minutes of behavioral questions. Your responses must demonstrate ownership, bias for action, and customer obsession using the STAR method.",
      },
      {
        q: "What is the Bar Raiser at Amazon?",
        a: "An independent interviewer outside the hiring team whose goal is to verify the candidate raises the talent bar of the company beyond 50% of current employees.",
      },
    ],
  },
  {
    company: "Wipro",
    companySlug: "wipro",
    slug: "wipro-technical-interview-questions",
    title: "Wipro Elite Technical Interview Questions & Answers",
    subtitle: "Core technical interview questions asked in Wipro Elite NTH and Turbo placement drives.",
    metaDescription: "Prepare for Wipro Elite National Talent Hunt technical interview. Common questions on OS, DBMS, C/C++/Java, and networking.",
    companyType: "service",
    round: "cs_fundamentals",
    difficulty: "medium",
    readTime: "7 min read",
    overview: "Wipro Elite National Talent Hunt assesses fresh graduates on fundamental computer science principles including operating system memory allocation, relational normalization, C++/Java OOP concepts, and clean project explanations.",
    selectionProcess: [
      "Wipro Elite NTH Online Assessment (Aptitude, Essay Writing, Coding)",
      "Technical Interview (OS, DBMS, OOP, Mini Projects)",
      "HR Interview (Culture, Background, Documentation)",
    ],
    keyTopics: ["Virtual Memory & Paging", "Deadlock 4 Coffman Conditions", "Normalization (1NF to BCNF)", "Java String Immutability"],
    questions: [
      {
        id: "wip-q1",
        question: "Explain the four necessary Coffman conditions for a deadlock to occur.",
        answer: "1. Mutual Exclusion: At least one resource must be held in a non-shareable mode. 2. Hold and Wait: A process holds at least one resource and is waiting to acquire additional resources. 3. No Preemption: Resources cannot be forcibly seized from a process. 4. Circular Wait: A closed chain of processes exists such that each process holds a resource needed by the next.",
        approach: "Enumerate all four clearly, then explain how breaking any one condition prevents deadlocks.",
        proTip: "Illustrate with the classic Dining Philosophers problem.",
      },
      {
        id: "wip-q2",
        question: "Why are String objects immutable in Java?",
        answer: "1. Security: Sensitive data like passwords, network connections, and URLs are passed as Strings. 2. Thread Safety: Immutable strings are inherently thread-safe without synchronization. 3. String Pool Optimization: Multiple references share the same heap memory, conserving RAM. 4. Hash Code Caching: The hashcode is computed once and cached, making Strings optimal HashMap keys.",
        approach: "Highlight security, memory efficiency (String Pool), and multithreading safety.",
        proTip: "Mention StringBuilder and StringBuffer when explaining mutability tradeoffs.",
      },
    ],
    faqs: [
      {
        q: "What is the difference between Wipro Elite and Wipro Turbo?",
        a: "Wipro Elite is the standard hiring track (~3.5 LPA), while Turbo is the higher package track (~6.5 LPA) offering more advanced coding and system questions.",
      },
    ],
  },
  {
    company: "Cognizant",
    companySlug: "cognizant",
    slug: "cognizant-genc-interview-questions",
    title: "Cognizant GenC & GenC Next Technical Questions",
    subtitle: "Top questions asked in Cognizant GenC and GenC Next on-campus placement evaluations.",
    metaDescription: "Master Cognizant GenC and GenC Next technical interview questions. Solved coding problems, SQL database queries, and web fundamentals.",
    companyType: "service",
    round: "dsa",
    difficulty: "medium",
    readTime: "6 min read",
    overview: "Cognizant hires across GenC (fundamental) and GenC Next/Elevate (advanced) profiles. The technical interview focuses on algorithmic problem solving, clean code syntax, SQL joins, and web fundamentals.",
    selectionProcess: [
      "Cognizant Online Assessment (Communication, Aptitude, Coding)",
      "Technical Round (Data Structures, SQL, OOP, Final Year Project)",
      "HR Evaluation (Verification, Cultural Fit)",
    ],
    keyTopics: ["String Manipulation", "Array Rotation", "SQL Aggregate Queries", "REST API Basics"],
    questions: [
      {
        id: "cog-q1",
        question: "Write an algorithm to check whether two strings are anagrams of each other.",
        answer: "If lengths differ, return false. Use a frequency array of size 26 (or hash table for ASCII). Increment frequency for characters in string 1, decrement for string 2. If all counts remain 0, strings are anagrams.",
        codeSnippet: `bool isAnagram(string s, string t) {
    if (s.length() != t.length()) return false;
    int count[26] = {0};
    for (int i = 0; i < s.length(); i++) {
        count[s[i] - 'a']++;
        count[t[i] - 'a']--;
    }
    for (int c : count) if (c != 0) return false;
    return true;
}`,
        approach: "Direct character frequency counting in O(N) time without sorting.",
        complexity: "Time: O(N), Space: O(1) (fixed alphabet size)",
        proTip: "Cognizant interviewers prefer O(1) auxiliary space solutions over O(N log N) sorting.",
      },
    ],
    faqs: [
      {
        q: "How can I upgrade from Cognizant GenC to GenC Next?",
        a: "Scoring in the top percentile in the coding section of the preliminary assessment unlocks the GenC Next technical interview track.",
      },
    ],
  },
  {
    company: "Microsoft",
    companySlug: "microsoft",
    slug: "microsoft-system-design-interview-questions",
    title: "Microsoft System Design & Architecture Questions",
    subtitle: "High Level & Low Level System Design interview questions for Microsoft campus roles.",
    metaDescription: "Prepare for Microsoft SDE system design interview rounds. Scalability, distributed caching, database sharding, and architecture tradeoffs.",
    companyType: "product",
    round: "system_design",
    difficulty: "hard",
    readTime: "11 min read",
    overview: "Microsoft system design interviews for college graduates probe modular design, API contracts, database selection, load balancing, and performance bottlenecks. Clear thought structure and interactive requirement gathering are vital.",
    selectionProcess: [
      "Microsoft Online Assessment (3 Coding Questions on Codility)",
      "Technical Round 1: DSA (Trees, Graphs, DP)",
      "Technical Round 2: Low-Level / High-Level System Design",
      "AA (As Appropriate) Final Round: Technical Architecture & Culture",
    ],
    keyTopics: ["Distributed Caching (Redis/Memcached)", "Rate Limiting Algorithms", "Database Sharding & Replication", "CAP Theorem Tradeoffs"],
    questions: [
      {
        id: "msft-q1",
        question: "Design a scalable URL Shortener service like bit.ly. How do you generate unique short keys?",
        answer: "1. Key Generation: Use Base62 encoding ([a-z, A-Z, 0-9]) on a 64-bit auto-incrementing ID. 6 characters provide 62^6 = 56.8 billion unique URLs. 2. Distributed Counter: Use Apache ZooKeeper or Redis ranges (e.g. Server 1 gets 1-1M, Server 2 gets 1M-2M) to avoid collision. 3. Caching: Cache top 20% URLs using Redis with LRU eviction. 4. Redirection: Return HTTP 301 for permanent redirect or 302 for analytics tracking.",
        approach: "Requirements -> Capacity Estimation -> API Design -> DB Schema -> High Level Architecture -> Bottleneck Identification.",
        complexity: "Read-heavy system (100:1 read to write ratio), sub-10ms response time via distributed cache.",
        proTip: "Always ask clarifying questions first: expected traffic, expiration policy, custom vanity URLs.",
      },
    ],
    faqs: [
      {
        q: "Are freshers expected to design distributed systems at Microsoft?",
        a: "Interviewers evaluate structured thinking, understanding of caching, databases, and trade-offs rather than decade-long DevOps experience.",
      },
    ],
  },
  {
    company: "Swiggy",
    companySlug: "swiggy",
    slug: "swiggy-machine-coding-interview-questions",
    title: "Swiggy Machine Coding & Backend Interview Questions",
    subtitle: "Real-world engineering, concurrency, and LLD questions asked in Swiggy placement drives.",
    metaDescription: "Ace Swiggy SDE machine coding and backend interview rounds. Object-oriented design, real-time logistics, and concurrency problems.",
    companyType: "product",
    round: "system_design",
    difficulty: "hard",
    readTime: "10 min read",
    overview: "Swiggy tests candidates on writing modular, extensible, and executable code under strict 90-minute constraints, alongside handling real-time logistics, order lifecycle state machines, and concurrency.",
    selectionProcess: [
      "Online Coding Challenge (DSA & Edge Case Handling)",
      "Machine Coding Round (90 min executable OOP problem)",
      "Data Structures & Algorithms Deep Dive",
      "Hiring Manager Round (Architecture & Cultural Alignment)",
    ],
    keyTopics: ["State Machine Pattern", "Concurrency & Thread Safety", "Clean Code & SOLID Principles", "Geohashing & Proximity Matching"],
    questions: [
      {
        id: "swiggy-q1",
        question: "How do you handle inventory race conditions when two users order the last biryani simultaneously?",
        answer: "1. Pessimistic Locking: Use SELECT ... FOR UPDATE on the item row during checkout. Guaranteed consistency but reduces throughput under high concurrency. 2. Optimistic Locking: Add an integer version column. UPDATE items SET stock = stock - 1, version = version + 1 WHERE id = ? AND version = ?. If rows affected is 0, another transaction won. 3. Distributed Redis Lock (Redlock): Acquire a key lock for item_id with TTL, decrement in-memory atomic counter with DECR, then sync to DB via message queue.",
        approach: "Compare Pessimistic Locking vs Optimistic Locking vs In-Memory Atomic Redis decrements.",
        proTip: "Swiggy loves candidates who articulate real tradeoffs between absolute database consistency and sub-50ms user latency.",
      },
    ],
    faqs: [
      {
        q: "What design patterns should I know for Swiggy machine coding?",
        a: "Strategy Pattern (for payment/pricing calculation), State Pattern (order lifecycle: Placed -> Accepted -> Cooking -> Dispatched -> Delivered), and Factory Pattern.",
      },
    ],
  },
  {
    company: "CRED",
    companySlug: "cred",
    slug: "cred-backend-interview-questions",
    title: "CRED Backend Engineering & Architecture Questions",
    subtitle: "High-scale fintech architecture and problem solving questions for CRED engineering roles.",
    metaDescription: "Master CRED backend engineering interview questions. Idempotent payment APIs, event-driven architectures, and high-concurrency systems.",
    companyType: "startup",
    round: "cs_fundamentals",
    difficulty: "hard",
    readTime: "9 min read",
    overview: "CRED's engineering bar is famous for prioritizing clean design craft, idempotency in financial transactions, zero-downtime deployments, and scalable event-driven messaging.",
    selectionProcess: [
      "CRED CodeSprint / Hackathon Assessment",
      "Technical Round 1: Machine Coding & Design Craft",
      "Technical Round 2: Distributed Systems & Data Structures",
      "Cultural & Bar Raiser Round",
    ],
    keyTopics: ["Idempotent API Design", "Distributed Transactions (Saga Pattern)", "Kafka Event Streaming", "ACID Isolation Levels"],
    questions: [
      {
        id: "cred-q1",
        question: "How do you design an idempotent payment processing API to prevent duplicate user charges?",
        answer: "The client generates a unique UUID Idempotency-Key with each payment initiation request. When received: 1) Check Redis or database for this key. 2) If found in state 'IN_PROGRESS', reject subsequent calls with 409 Conflict. 3) If found in state 'SUCCESS', immediately return the cached response without reprocessing. 4) If key is new, store key with TTL and process transaction atomically.",
        approach: "Idempotency key header + distributed atomic store (Redis) + transactional outbox.",
        proTip: "Explain double-spend protection and how network timeouts must be handled safely.",
      },
    ],
    faqs: [
      {
        q: "What programming languages does CRED prioritize?",
        a: "Java, Go, Kotlin, and Python are primarily utilized for backend microservices.",
      },
    ],
  },
  {
    company: "Zepto",
    companySlug: "zepto",
    slug: "zepto-frontend-sde-interview-questions",
    title: "Zepto Frontend & Low-Latency UI Engineering Questions",
    subtitle: "Frontend performance, WebSocket state, and UI architecture questions for Zepto SDE roles.",
    metaDescription: "Prepare for Zepto Frontend & SDE technical interviews. JavaScript internals, React rendering performance, WebSockets, and state management.",
    companyType: "startup",
    round: "dsa",
    difficulty: "medium",
    readTime: "8 min read",
    overview: "Zepto's 10-minute delivery model demands responsive client applications, optimized asset payloads, robust offline/online state synchronization, and live WebSocket telemetry.",
    selectionProcess: [
      "Online Coding Challenge (JS / React / DSA)",
      "Machine Coding: Build an Interactive UI Component in 60 mins",
      "Frontend Architecture & Performance Optimization Round",
      "Hiring Manager & Culture Fit",
    ],
    keyTopics: ["JavaScript Event Loop & Microtasks", "Debouncing vs Throttling", "WebSocket Live Tracking", "Virtual DOM & React Reconciliation"],
    questions: [
      {
        id: "zep-q1",
        question: "Implement a robust debounce function in TypeScript with immediate execution support.",
        answer: "A debounce function delays execution until a specified wait time has passed since the last invocation. If immediate is true, it triggers on the leading edge rather than the trailing edge.",
        codeSnippet: `function debounce<T extends (...args: any[]) => void>(
  func: T,
  waitMs: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const callNow = immediate && !timeoutId;
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) func(...args);
    }, waitMs);

    if (callNow) func(...args);
  };
}`,
        approach: "Closure capturing timeout reference + leading/trailing edge logic.",
        complexity: "Time: O(1) invocation overhead, Space: O(1)",
        proTip: "Explain why debouncing is crucial for Zepto's live product catalog search bar.",
      },
    ],
    faqs: [
      {
        q: "Does Zepto test Data Structures for Frontend roles?",
        a: "Yes, candidates face 1-2 standard DSA questions (Trees, Sliding Window, Two Pointers) in the first round.",
      },
    ],
  },
  {
    company: "Razorpay",
    companySlug: "razorpay",
    slug: "razorpay-payments-engineering-interview-questions",
    title: "Razorpay Payments & Distributed Systems Questions",
    subtitle: "High-availability financial infrastructure and transaction questions for Razorpay SDE.",
    metaDescription: "Crack Razorpay technical interview rounds. Detailed questions on webhook delivery, payment gateways, ACID transactions, and database scaling.",
    companyType: "startup",
    round: "system_design",
    difficulty: "hard",
    readTime: "10 min read",
    overview: "Razorpay powers billions in Indian digital payments over UPI, cards, and net banking. Technical interviews evaluate distributed systems resilience, retry backoff strategies, webhook architectures, and database consistency.",
    selectionProcess: [
      "Online Coding Challenge (DSA & Complexity)",
      "Technical Round 1: DSA (Graphs, Dynamic Programming, Queues)",
      "Technical Round 2: System Architecture & Database Design",
      "Values & Engineering Culture Round",
    ],
    keyTopics: ["Webhook At-Least-Once Delivery", "Exponential Backoff & Jitter", "Database Replication Lag", "Distributed Locks"],
    questions: [
      {
        id: "rzp-q1",
        question: "How do you guarantee reliable webhook delivery to merchant servers that may be intermittently offline?",
        answer: "1. Asynchronous Event Bus: When payment state changes, publish event to Apache Kafka / RabbitMQ. 2. Dead Letter Queue & Retry Workers: Workers consume event and attempt HTTP POST to merchant webhook endpoint. 3. Exponential Backoff with Jitter: Retry on failure after 10s, 30s, 2m, 10m, 1h, 6h, 24h with randomized jitter to prevent thundering herd. 4. Signature Verification: Sign payload with HMAC-SHA256 using merchant secret. 5. Merchant Webhook Dashboard: Allow merchants to view delivery logs and trigger manual redelivery.",
        approach: "Decouple delivery via message queues with progressive backoff and cryptographic signature verification.",
        proTip: "Mentioning jitter when explaining exponential backoff demonstrates real-world production engineering depth.",
      },
    ],
    faqs: [
      {
        q: "What is the typical difficulty of DSA questions at Razorpay?",
        a: "Medium to Hard on LeetCode scale, with strong emphasis on explaining time and space complexity tradeoffs.",
      },
    ],
  },
];

export function getPracticePage(companySlug: string, slug: string): PracticePageData | undefined {
  return PRACTICE_PAGES.find(
    (p) => p.companySlug.toLowerCase() === companySlug.toLowerCase() && p.slug.toLowerCase() === slug.toLowerCase()
  );
}

export function getAllPracticePages(): PracticePageData[] {
  return PRACTICE_PAGES;
}
