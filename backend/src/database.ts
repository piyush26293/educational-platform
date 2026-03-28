import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      points INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      difficulty TEXT NOT NULL DEFAULT 'beginner',
      prerequisites TEXT DEFAULT '[]',
      content TEXT DEFAULT '',
      icon TEXT DEFAULT '📚',
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'easy',
      topic_id INTEGER REFERENCES topics(id),
      acceptance_rate REAL DEFAULT 0.0,
      examples TEXT DEFAULT '[]',
      constraints TEXT DEFAULT '',
      starter_code TEXT DEFAULT '{}',
      test_cases TEXT DEFAULT '[]',
      solution TEXT DEFAULT '',
      time_complexity TEXT DEFAULT '',
      space_complexity TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      topic_id INTEGER REFERENCES topics(id),
      description TEXT,
      difficulty TEXT DEFAULT 'easy',
      time_limit INTEGER DEFAULT 600
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER REFERENCES quizzes(id),
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      explanation TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      question_id INTEGER REFERENCES questions(id),
      status TEXT DEFAULT 'attempted',
      language TEXT DEFAULT 'python',
      code TEXT DEFAULT '',
      solved_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      quiz_id INTEGER REFERENCES quizzes(id),
      score INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      answers TEXT DEFAULT '{}',
      attempted_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT '🏆',
      condition_type TEXT,
      condition_value INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      user_id INTEGER REFERENCES users(id),
      badge_id INTEGER REFERENCES badges(id),
      earned_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY(user_id, badge_id)
    );
  `);

  seedData(db);
}

function seedData(db: Database.Database) {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  if (userCount > 0) return;

  // Seed users
  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash = bcrypt.hashSync('user123', 10);
  db.prepare(`INSERT INTO users (name,email,password,role,points) VALUES (?,?,?,?,?)`).run('Admin', 'admin@dsa.com', adminHash, 'admin', 5000);
  db.prepare(`INSERT INTO users (name,email,password,role,points) VALUES (?,?,?,?,?)`).run('Demo User', 'user@dsa.com', userHash, 'user', 320);

  // Seed topics
  const topics = [
    { name: 'Arrays', slug: 'arrays', description: 'Fundamental data structure for storing elements sequentially', difficulty: 'beginner', icon: '📊', order_index: 1, prerequisites: '[]', content: `# Arrays\n\nAn array is a collection of items stored at contiguous memory locations. It is the simplest and most widely used data structure.\n\n## Key Concepts\n- **Indexing**: Access any element in O(1) time\n- **Traversal**: Visit each element once in O(n)\n- **Insertion/Deletion**: O(n) due to shifting\n\n## Types of Arrays\n- Static arrays (fixed size)\n- Dynamic arrays (resizable)\n\n## Common Operations\n\`\`\`python\narr = [1, 2, 3, 4, 5]\nprint(arr[0])    # Access: O(1)\narr.append(6)    # Insert at end: O(1) amortized\narr.insert(2, 7) # Insert at index: O(n)\narr.remove(3)    # Remove: O(n)\n\`\`\`\n\n## Time Complexity\n| Operation | Average | Worst |\n|-----------|---------|-------|\n| Access | O(1) | O(1) |\n| Search | O(n) | O(n) |\n| Insertion | O(n) | O(n) |\n| Deletion | O(n) | O(n) |\n` },
    { name: 'Strings', slug: 'strings', description: 'Sequence of characters and string manipulation techniques', difficulty: 'beginner', icon: '🔤', order_index: 2, prerequisites: '["arrays"]', content: `# Strings\n\nA string is a sequence of characters. In most languages, strings are immutable.\n\n## Common Techniques\n- Two pointers\n- Sliding window\n- String hashing\n- KMP algorithm\n\n## Key Operations\n\`\`\`python\ns = "hello world"\nprint(s.upper())      # HELLO WORLD\nprint(s.split())      # ['hello', 'world']\nprint(s.replace('o', '0'))  # hell0 w0rld\nprint(s[::-1])        # dlrow olleh\n\`\`\`\n` },
    { name: 'Linked Lists', slug: 'linked-lists', description: 'Linear data structure where elements are linked using pointers', difficulty: 'beginner', icon: '🔗', order_index: 3, prerequisites: '[]', content: `# Linked Lists\n\nA linked list is a linear data structure where elements are stored in nodes, and each node points to the next node.\n\n## Types\n- **Singly Linked List**: Each node has data and next pointer\n- **Doubly Linked List**: Each node has data, prev and next pointers\n- **Circular Linked List**: Last node points to first\n\n## Node Structure\n\`\`\`python\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\`\`\`\n\n## Time Complexity\n| Operation | Average |\n|-----------|---------|\n| Access | O(n) |\n| Search | O(n) |\n| Insertion | O(1) |\n| Deletion | O(1) |\n` },
    { name: 'Stacks', slug: 'stacks', description: 'LIFO data structure with push and pop operations', difficulty: 'beginner', icon: '📚', order_index: 4, prerequisites: '["arrays"]', content: `# Stacks\n\nA stack is a LIFO (Last In First Out) data structure.\n\n## Operations\n- **push(x)**: Add element to top - O(1)\n- **pop()**: Remove top element - O(1)\n- **peek()**: View top element - O(1)\n- **isEmpty()**: Check if empty - O(1)\n\n## Implementation\n\`\`\`python\nstack = []\nstack.append(1)  # push\nstack.append(2)\ntop = stack[-1]  # peek\nstack.pop()      # pop\n\`\`\`\n\n## Applications\n- Function call management\n- Expression evaluation\n- Undo/Redo operations\n- Browser history\n` },
    { name: 'Queues', slug: 'queues', description: 'FIFO data structure used in scheduling and BFS', difficulty: 'beginner', icon: '🚶', order_index: 5, prerequisites: '["arrays"]', content: `# Queues\n\nA queue is a FIFO (First In First Out) data structure.\n\n## Operations\n- **enqueue(x)**: Add to rear - O(1)\n- **dequeue()**: Remove from front - O(1)\n- **front()**: View front element - O(1)\n\n## Types\n- Simple Queue\n- Circular Queue\n- Double-ended Queue (Deque)\n- Priority Queue\n\n## Implementation\n\`\`\`python\nfrom collections import deque\nq = deque()\nq.append(1)    # enqueue\nq.append(2)\nx = q.popleft() # dequeue\n\`\`\`\n` },
    { name: 'Hashing', slug: 'hashing', description: 'Hash tables for O(1) average-case lookup', difficulty: 'intermediate', icon: '#️⃣', order_index: 6, prerequisites: '["arrays"]', content: `# Hashing\n\nHashing is a technique to map data to a fixed-size table for fast lookup.\n\n## Hash Function\nConverts a key to an index in the hash table.\n\n## Collision Resolution\n- **Chaining**: Each bucket is a linked list\n- **Open Addressing**: Find next empty slot\n\n## Python Dictionary (Hash Map)\n\`\`\`python\nhash_map = {}\nhash_map['key'] = 'value'  # Insert: O(1)\nval = hash_map.get('key')   # Lookup: O(1)\ndel hash_map['key']          # Delete: O(1)\n\`\`\`\n` },
    { name: 'Trees', slug: 'trees', description: 'Hierarchical data structure with root and child nodes', difficulty: 'intermediate', icon: '🌳', order_index: 7, prerequisites: '["linked-lists"]', content: `# Trees\n\nA tree is a hierarchical data structure with a root node and subtrees of children.\n\n## Terminology\n- **Root**: Top node with no parent\n- **Leaf**: Node with no children\n- **Height**: Longest path from root to leaf\n- **Depth**: Distance from root\n\n## Binary Tree Node\n\`\`\`python\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\`\`\`\n\n## Tree Traversals\n- **Inorder**: Left → Root → Right\n- **Preorder**: Root → Left → Right  \n- **Postorder**: Left → Right → Root\n- **Level Order**: BFS\n` },
    { name: 'Binary Search Trees', slug: 'bst', description: 'Ordered binary tree with O(log n) search', difficulty: 'intermediate', icon: '🌲', order_index: 8, prerequisites: '["trees"]', content: `# Binary Search Trees\n\nA BST is a binary tree where left child < parent < right child.\n\n## Properties\n- Inorder traversal gives sorted sequence\n- Search, Insert, Delete: O(log n) average, O(n) worst\n\n## Search\n\`\`\`python\ndef search(root, val):\n    if not root or root.val == val:\n        return root\n    if val < root.val:\n        return search(root.left, val)\n    return search(root.right, val)\n\`\`\`\n` },
    { name: 'Heaps', slug: 'heaps', description: 'Complete binary tree for priority queue implementation', difficulty: 'intermediate', icon: '⛰️', order_index: 9, prerequisites: '["trees"]', content: `# Heaps\n\nA heap is a complete binary tree satisfying the heap property.\n\n## Types\n- **Max Heap**: Parent ≥ children\n- **Min Heap**: Parent ≤ children\n\n## Operations\n- **Insert**: O(log n)\n- **Extract Max/Min**: O(log n)\n- **Peek**: O(1)\n\n## Python heapq (Min Heap)\n\`\`\`python\nimport heapq\nheap = []\nheapq.heappush(heap, 3)\nheapq.heappush(heap, 1)\nheapq.heappush(heap, 2)\nmin_val = heapq.heappop(heap)  # 1\n\`\`\`\n` },
    { name: 'Graphs', slug: 'graphs', description: 'Network of nodes connected by edges', difficulty: 'intermediate', icon: '🕸️', order_index: 10, prerequisites: '["trees", "queues"]', content: `# Graphs\n\nA graph G = (V, E) consists of vertices V and edges E.\n\n## Representations\n- **Adjacency Matrix**: 2D array\n- **Adjacency List**: List of neighbors\n\n## Graph Traversals\n### BFS (Breadth First Search)\n\`\`\`python\nfrom collections import deque\ndef bfs(graph, start):\n    visited = set([start])\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n\`\`\`\n\n### DFS (Depth First Search)\n\`\`\`python\ndef dfs(graph, node, visited=None):\n    if visited is None: visited = set()\n    visited.add(node)\n    for neighbor in graph[node]:\n        if neighbor not in visited:\n            dfs(graph, neighbor, visited)\n\`\`\`\n` },
    { name: 'Sorting', slug: 'sorting', description: 'Algorithms to arrange elements in order', difficulty: 'intermediate', icon: '🔀', order_index: 11, prerequisites: '["arrays"]', content: `# Sorting Algorithms\n\n## Comparison Sort Algorithms\n\n### Bubble Sort - O(n²)\n\`\`\`python\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n\`\`\`\n\n### Merge Sort - O(n log n)\n\`\`\`python\ndef merge_sort(arr):\n    if len(arr) <= 1: return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\n\`\`\`\n\n### Quick Sort - O(n log n) average\nUses divide and conquer with a pivot element.\n` },
    { name: 'Searching', slug: 'searching', description: 'Algorithms to find elements efficiently', difficulty: 'beginner', icon: '🔍', order_index: 12, prerequisites: '["arrays"]', content: `# Searching Algorithms\n\n## Linear Search - O(n)\n\`\`\`python\ndef linear_search(arr, target):\n    for i, val in enumerate(arr):\n        if val == target:\n            return i\n    return -1\n\`\`\`\n\n## Binary Search - O(log n)\nRequires sorted array.\n\`\`\`python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: left = mid + 1\n        else: right = mid - 1\n    return -1\n\`\`\`\n` },
    { name: 'Dynamic Programming', slug: 'dp', description: 'Optimization technique using memoization and tabulation', difficulty: 'advanced', icon: '💡', order_index: 13, prerequisites: '["arrays", "trees"]', content: `# Dynamic Programming\n\nDP solves complex problems by breaking them into overlapping subproblems.\n\n## Key Concepts\n- **Memoization** (Top-Down): Cache results of subproblems\n- **Tabulation** (Bottom-Up): Fill a table iteratively\n\n## Classic Example: Fibonacci\n\`\`\`python\n# Memoization\ndef fib(n, memo={}):\n    if n in memo: return memo[n]\n    if n <= 1: return n\n    memo[n] = fib(n-1, memo) + fib(n-2, memo)\n    return memo[n]\n\n# Tabulation\ndef fib_tab(n):\n    dp = [0] * (n+1)\n    dp[1] = 1\n    for i in range(2, n+1):\n        dp[i] = dp[i-1] + dp[i-2]\n    return dp[n]\n\`\`\`\n\n## Common DP Problems\n- Knapsack\n- Longest Common Subsequence\n- Coin Change\n- Edit Distance\n` },
    { name: 'Greedy Algorithms', slug: 'greedy', description: 'Make locally optimal choices for global optimum', difficulty: 'advanced', icon: '🤑', order_index: 14, prerequisites: '["arrays", "sorting"]', content: `# Greedy Algorithms\n\nGreedy algorithms make the locally optimal choice at each step.\n\n## When to use Greedy?\n- Problem has optimal substructure\n- Greedy choice property holds\n\n## Classic Examples\n\n### Activity Selection\nSelect maximum non-overlapping activities.\n\n### Huffman Coding\nOptimal prefix-free encoding.\n\n### Dijkstra's Shortest Path\n\`\`\`python\nimport heapq\ndef dijkstra(graph, start):\n    dist = {node: float('inf') for node in graph}\n    dist[start] = 0\n    pq = [(0, start)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                heapq.heappush(pq, (dist[v], v))\n    return dist\n\`\`\`\n` },
    { name: 'Tries', slug: 'tries', description: 'Tree data structure for efficient string operations', difficulty: 'advanced', icon: '🌿', order_index: 15, prerequisites: '["trees", "hashing"]', content: `# Tries (Prefix Trees)\n\nA trie is a tree where each node represents a character.\n\n## Structure\n\`\`\`python\nclass TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n    \n    def insert(self, word):\n        node = self.root\n        for ch in word:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()\n            node = node.children[ch]\n        node.is_end = True\n    \n    def search(self, word):\n        node = self.root\n        for ch in word:\n            if ch not in node.children: return False\n            node = node.children[ch]\n        return node.is_end\n\`\`\`\n\n## Time Complexity\n- Insert: O(m) where m = word length\n- Search: O(m)\n- StartsWith: O(m)\n` },
  ];

  const insertTopic = db.prepare(`INSERT INTO topics (name,slug,description,difficulty,icon,order_index,prerequisites,content) VALUES (?,?,?,?,?,?,?,?)`);
  for (const t of topics) {
    insertTopic.run(t.name, t.slug, t.description, t.difficulty, t.icon, t.order_index, t.prerequisites, t.content);
  }

  // Seed questions
  const questions = [
    {
      title: 'Two Sum', slug: 'two-sum', difficulty: 'easy', topic_slug: 'arrays', acceptance_rate: 0.49,
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
      examples: JSON.stringify([{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' }, { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }]),
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
      tags: JSON.stringify(['Array', 'Hash Table']),
      test_cases: JSON.stringify([{ input: '[2,7,11,15]\n9', expected: '[0,1]' }, { input: '[3,2,4]\n6', expected: '[1,2]' }, { input: '[3,3]\n6', expected: '[0,1]' }]),
      time_complexity: 'O(n)', space_complexity: 'O(n)',
      starter_code: JSON.stringify({
        python: 'from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your solution here\n        pass',
        javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your solution here\n};',
        java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}',
        cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};',
        c: '#include <stdlib.h>\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your solution here\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    return result;\n}'
      }),
      solution: 'def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i'
    },
    {
      title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'easy', topic_slug: 'stacks', acceptance_rate: 0.40,
      description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n- Every close bracket has a corresponding open bracket of the same type.',
      examples: JSON.stringify([{ input: 's = "()"', output: 'true' }, { input: 's = "()[]{}"', output: 'true' }, { input: 's = "(]"', output: 'false' }]),
      constraints: '1 <= s.length <= 10^4\ns consists of parentheses only.',
      tags: JSON.stringify(['String', 'Stack']),
      test_cases: JSON.stringify([{ input: '()', expected: 'true' }, { input: '()[]{} ', expected: 'true' }, { input: '(]', expected: 'false' }]),
      time_complexity: 'O(n)', space_complexity: 'O(n)',
      starter_code: JSON.stringify({
        python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass',
        javascript: 'var isValid = function(s) {\n    \n};',
        java: 'class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        return false;\n    }\n};',
        c: '#include <stdbool.h>\nbool isValid(char* s) {\n    return false;\n}'
      }),
      solution: ''
    },
    {
      title: 'Reverse Linked List', slug: 'reverse-linked-list', difficulty: 'easy', topic_slug: 'linked-lists', acceptance_rate: 0.73,
      description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
      examples: JSON.stringify([{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }, { input: 'head = [1,2]', output: '[2,1]' }]),
      constraints: 'The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000',
      tags: JSON.stringify(['Linked List', 'Recursion']),
      test_cases: JSON.stringify([{ input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]' }, { input: '[1,2]', expected: '[2,1]' }, { input: '[]', expected: '[]' }]),
      time_complexity: 'O(n)', space_complexity: 'O(1)',
      starter_code: JSON.stringify({
        python: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def reverseList(self, head):\n        pass',
        javascript: 'var reverseList = function(head) {\n    \n};',
        java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        return null;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        return nullptr;\n    }\n};',
        c: 'struct ListNode* reverseList(struct ListNode* head) {\n    return NULL;\n}'
      }),
      solution: ''
    },
    {
      title: 'Binary Search', slug: 'binary-search', difficulty: 'easy', topic_slug: 'searching', acceptance_rate: 0.55,
      description: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.',
      examples: JSON.stringify([{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' }, { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }]),
      constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4',
      tags: JSON.stringify(['Array', 'Binary Search']),
      test_cases: JSON.stringify([{ input: '[-1,0,3,5,9,12]\n9', expected: '4' }, { input: '[-1,0,3,5,9,12]\n2', expected: '-1' }]),
      time_complexity: 'O(log n)', space_complexity: 'O(1)',
      starter_code: JSON.stringify({
        python: 'from typing import List\n\nclass Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        pass',
        javascript: 'var search = function(nums, target) {\n    \n};',
        java: 'class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        return -1;\n    }\n};',
        c: 'int search(int* nums, int numsSize, int target) {\n    return -1;\n}'
      }),
      solution: ''
    },
    {
      title: 'Maximum Depth of Binary Tree', slug: 'max-depth-binary-tree', difficulty: 'easy', topic_slug: 'trees', acceptance_rate: 0.74,
      description: 'Given the `root` of a binary tree, return its maximum depth.\n\nA binary tree\'s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
      examples: JSON.stringify([{ input: 'root = [3,9,20,null,null,15,7]', output: '3' }, { input: 'root = [1,null,2]', output: '2' }]),
      constraints: 'The number of nodes in the tree is in the range [0, 10^4].\n-100 <= Node.val <= 100',
      tags: JSON.stringify(['Tree', 'DFS', 'BFS']),
      test_cases: JSON.stringify([{ input: '[3,9,20,null,null,15,7]', expected: '3' }, { input: '[1,null,2]', expected: '2' }]),
      time_complexity: 'O(n)', space_complexity: 'O(h)',
      starter_code: JSON.stringify({
        python: 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def maxDepth(self, root) -> int:\n        pass',
        javascript: 'var maxDepth = function(root) {\n    \n};',
        java: 'class Solution {\n    public int maxDepth(TreeNode root) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        return 0;\n    }\n};',
        c: 'int maxDepth(struct TreeNode* root) {\n    return 0;\n}'
      }),
      solution: ''
    },
    {
      title: 'Climbing Stairs', slug: 'climbing-stairs', difficulty: 'easy', topic_slug: 'dp', acceptance_rate: 0.51,
      description: 'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?',
      examples: JSON.stringify([{ input: 'n = 2', output: '2', explanation: '1+1 or 2' }, { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' }]),
      constraints: '1 <= n <= 45',
      tags: JSON.stringify(['Math', 'Dynamic Programming']),
      test_cases: JSON.stringify([{ input: '2', expected: '2' }, { input: '3', expected: '3' }, { input: '5', expected: '8' }]),
      time_complexity: 'O(n)', space_complexity: 'O(1)',
      starter_code: JSON.stringify({
        python: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass',
        javascript: 'var climbStairs = function(n) {\n    \n};',
        java: 'class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        return 0;\n    }\n};',
        c: 'int climbStairs(int n) {\n    return 0;\n}'
      }),
      solution: ''
    },
    {
      title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-no-repeat', difficulty: 'medium', topic_slug: 'strings', acceptance_rate: 0.34,
      description: 'Given a string `s`, find the length of the longest substring without repeating characters.',
      examples: JSON.stringify([{ input: 's = "abcabcbb"', output: '3', explanation: '"abc" has length 3' }, { input: 's = "bbbbb"', output: '1' }, { input: 's = "pwwkew"', output: '3' }]),
      constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
      tags: JSON.stringify(['Hash Table', 'String', 'Sliding Window']),
      test_cases: JSON.stringify([{ input: 'abcabcbb', expected: '3' }, { input: 'bbbbb', expected: '1' }, { input: 'pwwkew', expected: '3' }]),
      time_complexity: 'O(n)', space_complexity: 'O(min(m,n))',
      starter_code: JSON.stringify({
        python: 'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass',
        javascript: 'var lengthOfLongestSubstring = function(s) {\n    \n};',
        java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        return 0;\n    }\n};',
        c: 'int lengthOfLongestSubstring(char* s) {\n    return 0;\n}'
      }),
      solution: ''
    },
    {
      title: 'Number of Islands', slug: 'number-of-islands', difficulty: 'medium', topic_slug: 'graphs', acceptance_rate: 0.57,
      description: 'Given an `m x n` 2D binary grid `grid` which represents a map of `\'1\'`s (land) and `\'0\'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
      examples: JSON.stringify([{ input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' }, { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' }]),
      constraints: 'm == grid.length, n == grid[i].length\n1 <= m, n <= 300',
      tags: JSON.stringify(['Array', 'DFS', 'BFS', 'Union Find']),
      test_cases: JSON.stringify([{ input: '1', expected: '1' }, { input: '3', expected: '3' }]),
      time_complexity: 'O(m*n)', space_complexity: 'O(m*n)',
      starter_code: JSON.stringify({
        python: 'from typing import List\n\nclass Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        pass',
        javascript: 'var numIslands = function(grid) {\n    \n};',
        java: 'class Solution {\n    public int numIslands(char[][] grid) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        return 0;\n    }\n};',
        c: 'int numIslands(char** grid, int gridSize, int* gridColSize) {\n    return 0;\n}'
      }),
      solution: ''
    },
    {
      title: 'Coin Change', slug: 'coin-change', difficulty: 'medium', topic_slug: 'dp', acceptance_rate: 0.42,
      description: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.',
      examples: JSON.stringify([{ input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' }, { input: 'coins = [2], amount = 3', output: '-1' }]),
      constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
      tags: JSON.stringify(['Array', 'Dynamic Programming']),
      test_cases: JSON.stringify([{ input: '[1,2,5]\n11', expected: '3' }, { input: '[2]\n3', expected: '-1' }]),
      time_complexity: 'O(S*n)', space_complexity: 'O(S)',
      starter_code: JSON.stringify({
        python: 'from typing import List\n\nclass Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        pass',
        javascript: 'var coinChange = function(coins, amount) {\n    \n};',
        java: 'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return -1;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        return -1;\n    }\n};',
        c: 'int coinChange(int* coins, int coinsSize, int amount) {\n    return -1;\n}'
      }),
      solution: ''
    },
    {
      title: 'LRU Cache', slug: 'lru-cache', difficulty: 'medium', topic_slug: 'hashing', acceptance_rate: 0.41,
      description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class:\n- `LRUCache(int capacity)`: Initialize the LRU cache with positive size `capacity`.\n- `int get(int key)`: Return the value of the key if the key exists, otherwise return `-1`.\n- `void put(int key, int value)`: Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.',
      examples: JSON.stringify([{ input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', output: '[null,null,null,1,null,-1,null,-1,3,4]' }]),
      constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5',
      tags: JSON.stringify(['Hash Table', 'Linked List', 'Design']),
      test_cases: JSON.stringify([{ input: 'LRU', expected: 'Design' }]),
      time_complexity: 'O(1)', space_complexity: 'O(capacity)',
      starter_code: JSON.stringify({
        python: 'class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass',
        javascript: 'class LRUCache {\n    constructor(capacity) {\n        \n    }\n    get(key) {\n        \n    }\n    put(key, value) {\n        \n    }\n}',
        java: 'class LRUCache {\n    public LRUCache(int capacity) {\n    }\n    public int get(int key) {\n        return -1;\n    }\n    public void put(int key, int value) {\n    }\n}',
        cpp: 'class LRUCache {\npublic:\n    LRUCache(int capacity) {\n    }\n    int get(int key) {\n        return -1;\n    }\n    void put(int key, int value) {\n    }\n};',
        c: '// Implement LRU Cache in C\n'
      }),
      solution: ''
    },
    {
      title: 'Trapping Rain Water', slug: 'trapping-rain-water', difficulty: 'hard', topic_slug: 'arrays', acceptance_rate: 0.59,
      description: 'Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.',
      examples: JSON.stringify([{ input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }, { input: 'height = [4,2,0,3,2,5]', output: '9' }]),
      constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
      tags: JSON.stringify(['Array', 'Two Pointers', 'Stack', 'Dynamic Programming']),
      test_cases: JSON.stringify([{ input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expected: '6' }, { input: '[4,2,0,3,2,5]', expected: '9' }]),
      time_complexity: 'O(n)', space_complexity: 'O(1)',
      starter_code: JSON.stringify({
        python: 'from typing import List\n\nclass Solution:\n    def trap(self, height: List[int]) -> int:\n        pass',
        javascript: 'var trap = function(height) {\n    \n};',
        java: 'class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int trap(vector<int>& height) {\n        return 0;\n    }\n};',
        c: 'int trap(int* height, int heightSize) {\n    return 0;\n}'
      }),
      solution: ''
    },
    {
      title: 'Median of Two Sorted Arrays', slug: 'median-two-sorted-arrays', difficulty: 'hard', topic_slug: 'arrays', acceptance_rate: 0.38,
      description: 'Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).',
      examples: JSON.stringify([{ input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000' }, { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.50000' }]),
      constraints: '0 <= m <= 1000\n0 <= n <= 1000',
      tags: JSON.stringify(['Array', 'Binary Search', 'Divide and Conquer']),
      test_cases: JSON.stringify([{ input: '[1,3]\n[2]', expected: '2.0' }, { input: '[1,2]\n[3,4]', expected: '2.5' }]),
      time_complexity: 'O(log(m+n))', space_complexity: 'O(1)',
      starter_code: JSON.stringify({
        python: 'from typing import List\n\nclass Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        pass',
        javascript: 'var findMedianSortedArrays = function(nums1, nums2) {\n    \n};',
        java: 'class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        return 0.0;\n    }\n};',
        c: 'double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    return 0.0;\n}'
      }),
      solution: ''
    },
    {
      title: 'Merge Two Sorted Lists', slug: 'merge-two-sorted-lists', difficulty: 'easy', topic_slug: 'linked-lists', acceptance_rate: 0.62,
      description: 'You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.',
      examples: JSON.stringify([{ input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }, { input: 'list1 = [], list2 = []', output: '[]' }]),
      constraints: 'The number of nodes in both lists is in the range [0, 50].',
      tags: JSON.stringify(['Linked List', 'Recursion']),
      test_cases: JSON.stringify([{ input: '[1,2,4]\n[1,3,4]', expected: '[1,1,2,3,4,4]' }]),
      time_complexity: 'O(n+m)', space_complexity: 'O(1)',
      starter_code: JSON.stringify({
        python: 'class Solution:\n    def mergeTwoLists(self, list1, list2):\n        pass',
        javascript: 'var mergeTwoLists = function(list1, list2) {\n    \n};',
        java: 'class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        return null;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        return nullptr;\n    }\n};',
        c: 'struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {\n    return NULL;\n}'
      }),
      solution: ''
    },
    {
      title: 'Invert Binary Tree', slug: 'invert-binary-tree', difficulty: 'easy', topic_slug: 'trees', acceptance_rate: 0.76,
      description: 'Given the `root` of a binary tree, invert the tree, and return its root.',
      examples: JSON.stringify([{ input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }, { input: 'root = [2,1,3]', output: '[2,3,1]' }]),
      constraints: 'The number of nodes in the tree is in the range [0, 100].\n-100 <= Node.val <= 100',
      tags: JSON.stringify(['Tree', 'DFS', 'BFS']),
      test_cases: JSON.stringify([{ input: '[4,2,7,1,3,6,9]', expected: '[4,7,2,9,6,3,1]' }]),
      time_complexity: 'O(n)', space_complexity: 'O(h)',
      starter_code: JSON.stringify({
        python: 'class Solution:\n    def invertTree(self, root):\n        pass',
        javascript: 'var invertTree = function(root) {\n    \n};',
        java: 'class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        return null;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        return nullptr;\n    }\n};',
        c: 'struct TreeNode* invertTree(struct TreeNode* root) {\n    return NULL;\n}'
      }),
      solution: ''
    },
    {
      title: 'Word Search', slug: 'word-search', difficulty: 'medium', topic_slug: 'graphs', acceptance_rate: 0.40,
      description: 'Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring.',
      examples: JSON.stringify([{ input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true' }]),
      constraints: 'm == board.length\n1 <= m, n <= 6\n1 <= word.length <= 15',
      tags: JSON.stringify(['Array', 'Backtracking', 'DFS']),
      test_cases: JSON.stringify([{ input: 'ABCCED', expected: 'true' }]),
      time_complexity: 'O(m*n*4^L)', space_complexity: 'O(L)',
      starter_code: JSON.stringify({
        python: 'from typing import List\n\nclass Solution:\n    def exist(self, board: List[List[str]], word: str) -> bool:\n        pass',
        javascript: 'var exist = function(board, word) {\n    \n};',
        java: 'class Solution {\n    public boolean exist(char[][] board, String word) {\n        return false;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        return false;\n    }\n};',
        c: 'bool exist(char** board, int boardSize, int* boardColSize, char* word) {\n    return false;\n}'
      }),
      solution: ''
    },
  ];

  const getTopicId = db.prepare('SELECT id FROM topics WHERE slug = ?');
  const insertQ = db.prepare(`INSERT INTO questions (title,slug,difficulty,topic_id,acceptance_rate,description,examples,constraints,tags,test_cases,time_complexity,space_complexity,starter_code,solution) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const q of questions) {
    const topic = getTopicId.get(q.topic_slug) as any;
    const topicId = topic ? topic.id : null;
    insertQ.run(q.title, q.slug, q.difficulty, topicId, q.acceptance_rate, q.description, q.examples, q.constraints, q.tags, q.test_cases, q.time_complexity, q.space_complexity, q.starter_code, q.solution);
  }

  // Seed quizzes
  const quizInsert = db.prepare(`INSERT INTO quizzes (title, topic_id, description, difficulty, time_limit) VALUES (?,?,?,?,?)`);
  const qqInsert = db.prepare(`INSERT INTO quiz_questions (quiz_id, question, options, correct_answer, explanation) VALUES (?,?,?,?,?)`);

  const arrTopic = (getTopicId.get('arrays') as any)?.id;
  const linkedTopic = (getTopicId.get('linked-lists') as any)?.id;
  const treeTopic = (getTopicId.get('trees') as any)?.id;
  const dpTopic = (getTopicId.get('dp') as any)?.id;
  const graphTopic = (getTopicId.get('graphs') as any)?.id;

  const q1 = quizInsert.run('Arrays Fundamentals Quiz', arrTopic, 'Test your knowledge of arrays', 'easy', 300);
  const qqData1 = [
    ['What is the time complexity of accessing an element in an array by index?', JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n²)']), 0, 'Array access by index is O(1) because arrays use contiguous memory.'],
    ['What is the time complexity of inserting an element at the beginning of an array?', JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n²)']), 1, 'All elements need to shift right, making it O(n).'],
    ['Which of these is NOT a characteristic of arrays?', JSON.stringify(['Fixed size (static)', 'O(1) access by index', 'Dynamic resizing without any overhead', 'Contiguous memory allocation']), 2, 'Dynamic resizing in arrays (like ArrayList) does have overhead.'],
    ['What does a 2D array represent?', JSON.stringify(['A linked list', 'A matrix', 'A tree', 'A graph']), 1, 'A 2D array represents a matrix where elements are accessed with two indices.'],
    ['Which sorting algorithm has the best average case performance for arrays?', JSON.stringify(['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort']), 2, 'Quick Sort has O(n log n) average case which is optimal for comparison-based sorting.'],
  ];
  for (const [question, options, correct_answer, explanation] of qqData1) {
    qqInsert.run(q1.lastInsertRowid, question, options, correct_answer, explanation);
  }

  const q2 = quizInsert.run('Linked Lists Quiz', linkedTopic, 'Test your Linked List knowledge', 'easy', 300);
  const qqData2 = [
    ['What is the time complexity of searching for an element in a singly linked list?', JSON.stringify(['O(1)', 'O(n)', 'O(log n)', 'O(n log n)']), 1, 'You must traverse node by node, making it O(n).'],
    ['What extra data does a doubly linked list node contain compared to singly linked?', JSON.stringify(['Two values', 'A previous pointer', 'A size field', 'A hash code']), 1, 'Each node in a doubly linked list has both next and previous pointers.'],
    ['Which operation is O(1) in a linked list but O(n) in an array?', JSON.stringify(['Search', 'Access by index', 'Insertion at beginning', 'Deletion by value']), 2, 'Insertion at the beginning is O(1) for linked lists but O(n) for arrays due to shifting.'],
    ['What is a circular linked list?', JSON.stringify(['A list where all elements are circles', 'A list where last node points back to first', 'A list stored in circular memory', 'A list with circular references in values']), 1, 'In a circular linked list, the last node\'s next pointer points to the head.'],
    ['Which data structure is best for implementing a queue?', JSON.stringify(['Array', 'Linked List', 'Stack', 'Tree']), 1, 'Linked lists allow O(1) insertion at tail and O(1) deletion from head, ideal for queues.'],
  ];
  for (const [question, options, correct_answer, explanation] of qqData2) {
    qqInsert.run(q2.lastInsertRowid, question, options, correct_answer, explanation);
  }

  const q3 = quizInsert.run('Trees Quiz', treeTopic, 'Test your tree data structure knowledge', 'intermediate', 400);
  const qqData3 = [
    ['What traversal visits nodes in the order: Left, Root, Right?', JSON.stringify(['Preorder', 'Inorder', 'Postorder', 'Level Order']), 1, 'Inorder traversal: Left → Root → Right. For BSTs, this gives sorted order.'],
    ['What is the height of a balanced binary tree with n nodes?', JSON.stringify(['O(n)', 'O(log n)', 'O(n²)', 'O(1)']), 1, 'A balanced binary tree has height O(log n) since it\'s perfectly distributed.'],
    ['In a BST, where would you find the minimum element?', JSON.stringify(['At the root', 'At the rightmost node', 'At the leftmost node', 'At a random leaf']), 2, 'In a BST, the minimum element is always at the leftmost node.'],
    ['What is a complete binary tree?', JSON.stringify(['All levels filled, last level filled left to right', 'All leaves at same level', 'Every node has exactly 2 children', 'Root has no children']), 0, 'A complete binary tree has all levels filled except possibly the last, filled from left to right.'],
    ['Which traversal is used for deleting a tree?', JSON.stringify(['Preorder', 'Inorder', 'Postorder', 'Level Order']), 2, 'Postorder (Left → Right → Root) ensures children are processed before parents, safe for deletion.'],
  ];
  for (const [question, options, correct_answer, explanation] of qqData3) {
    qqInsert.run(q3.lastInsertRowid, question, options, correct_answer, explanation);
  }

  const q4 = quizInsert.run('Dynamic Programming Quiz', dpTopic, 'Test your DP knowledge', 'advanced', 500);
  const qqData4 = [
    ['What is memoization in DP?', JSON.stringify(['A memory optimization', 'Caching subproblem results to avoid recomputation', 'Writing faster code', 'Using less memory']), 1, 'Memoization stores results of expensive function calls and returns cached result when same inputs occur.'],
    ['What is the time complexity of computing Fibonacci using DP?', JSON.stringify(['O(2^n)', 'O(n²)', 'O(n)', 'O(log n)']), 2, 'With memoization, each Fibonacci number is computed only once, making it O(n).'],
    ['Which DP problem models filling a knapsack with maximum value?', JSON.stringify(['Coin Change', '0/1 Knapsack', 'LCS', 'Edit Distance']), 1, 'The 0/1 Knapsack problem is about selecting items with weight/value to maximize value within capacity.'],
    ['What does "optimal substructure" mean?', JSON.stringify(['All subproblems are easy', 'Optimal solution contains optimal solutions to subproblems', 'The problem can be solved in O(n)', 'Subproblems do not overlap']), 1, 'Optimal substructure means the globally optimal solution can be constructed from optimal solutions to subproblems.'],
    ['What is the space optimization in DP for Fibonacci?', JSON.stringify(['Use recursion', 'Store only last 2 values instead of entire array', 'Sort the array first', 'Use binary search']), 1, 'You only need the previous two values, reducing space from O(n) to O(1).'],
  ];
  for (const [question, options, correct_answer, explanation] of qqData4) {
    qqInsert.run(q4.lastInsertRowid, question, options, correct_answer, explanation);
  }

  const q5 = quizInsert.run('Graphs Quiz', graphTopic, 'Test your graph algorithm knowledge', 'intermediate', 450);
  const qqData5 = [
    ['What data structure does BFS primarily use?', JSON.stringify(['Stack', 'Queue', 'Heap', 'Array']), 1, 'BFS uses a queue to process nodes level by level.'],
    ['What is the time complexity of BFS/DFS on a graph with V vertices and E edges?', JSON.stringify(['O(V)', 'O(E)', 'O(V + E)', 'O(V * E)']), 2, 'BFS/DFS visits each vertex once and each edge twice, so O(V + E).'],
    ['What is a DAG?', JSON.stringify(['Directed Acyclic Graph', 'Doubly Adjacent Graph', 'Dynamic Array Graph', 'Data And Graph']), 0, 'DAG stands for Directed Acyclic Graph - a directed graph with no cycles.'],
    ['Which algorithm finds shortest paths from a single source in a weighted graph?', JSON.stringify(['BFS', 'DFS', "Dijkstra's", 'Prim\'s']), 2, "Dijkstra's algorithm finds shortest paths from a source vertex to all other vertices."],
    ['What is the space complexity of storing a graph as an adjacency list?', JSON.stringify(['O(V)', 'O(E)', 'O(V + E)', 'O(V²)']), 2, 'An adjacency list stores each vertex once and each edge once, so O(V + E).'],
  ];
  for (const [question, options, correct_answer, explanation] of qqData5) {
    qqInsert.run(q5.lastInsertRowid, question, options, correct_answer, explanation);
  }

  // Seed badges
  const badges = [
    { name: 'First Steps', description: 'Solve your first problem', icon: '🌱', condition_type: 'questions_solved', condition_value: 1 },
    { name: 'Problem Solver', description: 'Solve 10 problems', icon: '💪', condition_type: 'questions_solved', condition_value: 10 },
    { name: 'DSA Expert', description: 'Solve 50 problems', icon: '🏆', condition_type: 'questions_solved', condition_value: 50 },
    { name: 'Quiz Master', description: 'Complete 5 quizzes', icon: '🎓', condition_type: 'quizzes_completed', condition_value: 5 },
    { name: 'Streak Keeper', description: 'Maintain a 7-day streak', icon: '🔥', condition_type: 'streak', condition_value: 7 },
  ];
  for (const b of badges) {
    db.prepare(`INSERT INTO badges (name, description, icon, condition_type, condition_value) VALUES (?,?,?,?,?)`).run(b.name, b.description, b.icon, b.condition_type, b.condition_value);
  }
}
