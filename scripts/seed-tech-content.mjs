/**
 * Brainepedia — Tech & IT content seeder
 * Usage: node scripts/seed-tech-content.mjs
 *
 * Requires: ADMIN_EMAIL / ADMIN_PASSWORD env vars (or hardcoded below)
 * Connects directly to https://api.brainepedia.com
 */

const BASE = "https://api.brainepedia.com";
const EMAIL    = process.env.ADMIN_EMAIL    || "admin@brainepedia.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Braintech-2017";

/* ── helpers ─────────────────────────────────────────────────────────────── */
async function post(path, body, token, isForm = false) {
  const headers = {};
  if (token) { headers["Authorization"] = `Bearer ${token}`; headers["X-Token"] = `Bearer ${token}`; }
  if (!isForm) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: isForm ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function get(path, token) {
  const headers = {};
  if (token) { headers["Authorization"] = `Bearer ${token}`; headers["X-Token"] = `Bearer ${token}`; }
  const res = await fetch(`${BASE}${path}`, { headers });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

function fd(fields) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null) f.append(k, String(v));
  return f;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(msg, sub = false) {
  const prefix = sub ? "    " : "";
  console.log(`${prefix}${msg}`);
}

/* ── curated content ─────────────────────────────────────────────────────── */
const PROFESSIONS = [
  {
    name: "Software Engineer",
    districts: [
      {
        name: "Code Foundations",
        description: "Master the building blocks of programming: variables, loops, functions, and problem-solving logic that underpin every application.",
        nodes: [
          {
            title: "Build a Command-Line Calculator",
            context: "A command-line calculator is one of the most foundational projects for any programmer. It teaches you to handle user input, perform arithmetic operations, and manage edge cases like division by zero.",
            missionBrief: "Create a Python or JavaScript CLI calculator that accepts two numbers and an operator (+, -, *, /) from the user and prints the result. Handle division by zero gracefully.",
            constraints: ["Must run from the terminal without a GUI","Must handle division by zero with a clear error message","Must accept user input via stdin","Must support at least four operators: +, -, *, /"],
            expectedOutcomes: ["Calculator accepts input and returns correct results","Division by zero prints a friendly error instead of crashing","All four operators work correctly","Code is under 50 lines and readable"],
            xp: 100, minutes: 30, level: 1,
          },
          {
            title: "Write a Word and Line Counter",
            context: "Text processing is a core skill for software engineers. Reading a file and computing basic statistics teaches file I/O, string manipulation, and data aggregation.",
            missionBrief: "Write a script that reads a plain-text file provided as a command-line argument and prints the total number of lines, words, and characters in that file.",
            constraints: ["File path is passed as a CLI argument","If the file does not exist, print a clear error and exit","Count words by splitting on whitespace","Must work on files up to 10 MB"],
            expectedOutcomes: ["Correct line, word, and character counts for a sample file","Error message displayed if file is missing","Output matches results of the `wc` command on the same file","Script runs in under 1 second for a 1 MB file"],
            xp: 100, minutes: 25, level: 1,
          },
          {
            title: "Implement FizzBuzz with Configurable Rules",
            context: "FizzBuzz is a classic interview problem. Extending it with configurable rules reinforces conditionals, modular arithmetic, and how to write flexible, maintainable code.",
            missionBrief: "Write a function that takes a number N and a list of (divisor, label) pairs, then prints numbers 1 to N replacing multiples with their label. Multiple rules can apply to the same number (e.g., 15 → 'FizzBuzz').",
            constraints: ["Rules are passed as a parameter, not hardcoded","Numbers matching multiple rules concatenate all labels","Function must be unit-testable (pure, no side effects)","Include at least three test cases in a separate test file"],
            expectedOutcomes: ["Output matches expected for N=20 with classic FizzBuzz rules","Adding a new rule requires changing only the rules list","Three passing test cases included","Function handles empty rules list by printing all numbers"],
            xp: 120, minutes: 35, level: 1,
          },
        ],
      },
      {
        name: "Data Structures & Algorithms",
        description: "Understand the core structures and algorithms that power efficient software, from linked lists to sorting and searching techniques.",
        nodes: [
          {
            title: "Implement a Singly Linked List",
            context: "Linked lists are fundamental data structures used in operating systems, compilers, and many algorithms. Building one from scratch deepens your understanding of pointers and memory management.",
            missionBrief: "Implement a singly linked list class with methods: append(value), prepend(value), delete(value), search(value), and print_list(). Write tests confirming each method works correctly.",
            constraints: ["No use of built-in linked list libraries","Must handle deleting the head node","Must handle searching in an empty list","Include at least five test cases"],
            expectedOutcomes: ["All five methods pass their test cases","Deleting the head node correctly updates the head pointer","Searching an empty list returns None/null without error","print_list() outputs all values in order"],
            xp: 200, minutes: 60, level: 2,
          },
          {
            title: "Validate Balanced Brackets Using a Stack",
            context: "Stack-based bracket validation is used in code editors, compilers, and JSON parsers. It demonstrates how a simple data structure solves a real-world parsing problem.",
            missionBrief: "Write a function that takes a string and returns true if every opening bracket (, [, { has a matching closing bracket in the correct order, and false otherwise.",
            constraints: ["Must use a stack data structure (implement your own or use an array)","Must handle strings with no brackets (return true)","Must handle nested brackets: ({[]})","Must handle mismatched types: ([)] returns false"],
            expectedOutcomes: ["'({[]})' returns true","'([)]' returns false","Empty string returns true","'(((' returns false","All four test cases pass"],
            xp: 150, minutes: 40, level: 2,
          },
          {
            title: "Implement Binary Search and Measure Performance",
            context: "Binary search reduces search time from O(n) to O(log n). Understanding when and why to use it is a key interview skill and practical performance optimisation.",
            missionBrief: "Implement binary search on a sorted array. Compare its runtime against linear search on arrays of size 1 000, 10 000, and 100 000 elements. Print the time taken for each search method.",
            constraints: ["Array must be sorted before searching","Binary search must be implemented from scratch, not using library functions","Measure wall-clock time for each search","Test with a target near the beginning, middle, and end of the array"],
            expectedOutcomes: ["Binary search returns the correct index or -1 when not found","Timing output shows binary search is significantly faster on large arrays","Three array sizes tested and results printed","Code includes comments explaining the O(log n) reasoning"],
            xp: 175, minutes: 50, level: 2,
          },
        ],
      },
      {
        name: "Object-Oriented Design",
        description: "Apply OOP principles — encapsulation, inheritance, and polymorphism — to design clean, reusable, and maintainable software.",
        nodes: [
          {
            title: "Design a Library Management System",
            context: "A library management system is a classic OOP exercise that involves modelling real-world entities and their relationships. It reinforces class design, composition, and data encapsulation.",
            missionBrief: "Design classes for Book, Member, and Library. The Library should support: add_book, remove_book, check_out(member, book), return_book(member, book), and list_available_books. Demonstrate the system with a short script.",
            constraints: ["Each book tracks its availability status","A member cannot check out more than 3 books at once","Checking out an unavailable book raises an error","No database required — use in-memory data structures"],
            expectedOutcomes: ["All five Library methods work correctly","Checking out more than 3 books raises an appropriate exception","list_available_books only shows books with status Available","Demo script shows a full checkout and return flow"],
            xp: 250, minutes: 75, level: 2,
          },
          {
            title: "Implement the Strategy Design Pattern",
            context: "The Strategy pattern lets you swap algorithms at runtime without changing the code that uses them. It is widely used in payment systems, sorting, and report generation.",
            missionBrief: "Build a SortingContext class that accepts a sorting strategy (BubbleSort, SelectionSort, or MergeSort) and delegates sorting to it. Demonstrate swapping strategies at runtime on the same dataset.",
            constraints: ["All strategies must implement the same interface/base class","Switching strategy requires changing only one line in the demo","Include all three sorting algorithms","Test with a list of at least 20 integers"],
            expectedOutcomes: ["All three strategies sort the list correctly","Runtime demo shows three strategies producing identical sorted output","Swapping strategy changes only the strategy object, not the context","Each strategy is in its own class/file"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Build a Shape Calculator with Polymorphism",
            context: "Polymorphism is at the heart of OOP. A shape calculator demonstrates how a single interface can behave differently depending on the underlying object — a foundational concept in frameworks and game engines.",
            missionBrief: "Create a base Shape class with area() and perimeter() methods. Subclass it into Circle, Rectangle, and Triangle. Write a function that takes a list of mixed shapes and prints area and perimeter for each.",
            constraints: ["Each shape overrides area() and perimeter()","The function must not check the type of each shape (no isinstance checks)","Include at least two shapes of each type in the demo list","Round results to 2 decimal places"],
            expectedOutcomes: ["area() and perimeter() return correct values for all three shapes","Demo function processes a mixed list without type-checking","Circle uses π = 3.14159265","All results rounded to 2 decimal places"],
            xp: 175, minutes: 45, level: 1,
          },
        ],
      },
      {
        name: "Testing & Quality Assurance",
        description: "Write tests that give you confidence to ship code, detect regressions early, and make refactoring safe.",
        nodes: [
          {
            title: "Write Unit Tests for a Shopping Cart",
            context: "A shopping cart is a common e-commerce component with well-defined behaviour. Writing tests for it teaches you how to structure unit tests, mock dependencies, and think in terms of inputs and expected outputs.",
            missionBrief: "Given a ShoppingCart class with add_item, remove_item, apply_discount, and total methods, write at least eight unit tests covering normal use, edge cases, and error conditions. Achieve 100% method coverage.",
            constraints: ["Use pytest (Python) or Jest (JavaScript)","Each test must have a descriptive name explaining what it verifies","Cover at least: empty cart, negative quantity, discount over 100%","No real database or network calls in tests"],
            expectedOutcomes: ["Eight or more tests all pass","100% of ShoppingCart methods are covered","Three edge-case tests included","Tests run in under 5 seconds"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Create a Test Plan for a Login Feature",
            context: "Before writing a single line of test code, a structured test plan helps teams agree on what needs testing. This is a critical skill for QA engineers and developers working in regulated industries.",
            missionBrief: "Write a test plan document for a login page with email + password fields, a 'Remember me' checkbox, and a 'Forgot password' link. Cover functional, security, and UX test cases.",
            constraints: ["Minimum 15 distinct test cases","Group tests by category: functional, security, UX","Each test case must have: ID, description, steps, expected result","Include at least two security test cases (e.g. SQL injection, brute force)"],
            expectedOutcomes: ["15+ test cases documented","At least three categories covered","Two security test cases included","Document is readable as a Markdown or plain-text file"],
            xp: 125, minutes: 35, level: 1,
          },
          {
            title: "Set Up API Tests with Postman and Newman",
            context: "Automated API testing catches regressions before they reach production. Postman and its CLI runner Newman are industry-standard tools used by thousands of engineering teams.",
            missionBrief: "Create a Postman collection with five requests testing a public REST API (e.g. JSONPlaceholder). Add test scripts to verify status codes, response schema, and data values. Export the collection and run it via Newman, achieving all tests green.",
            constraints: ["Use JSONPlaceholder (https://jsonplaceholder.typicode.com) or another free public API","Test GET, POST, and at least one more method","Each request must have at least two automated assertions","Run the collection with Newman and screenshot the passing output"],
            expectedOutcomes: ["All five requests complete with their expected status codes","Newman CLI run shows 0 failures","Each request verifies status code and at least one response field","Exported collection JSON file included in submission"],
            xp: 200, minutes: 60, level: 2,
          },
        ],
      },
      {
        name: "System Design Basics",
        description: "Learn to think at scale — model systems, choose the right components, and document architectural decisions that real engineers make every day.",
        nodes: [
          {
            title: "Design a URL Shortener System",
            context: "URL shorteners like bit.ly handle millions of requests per day. Designing one covers databases, hashing, caching, and scaling — core system design topics in senior engineering interviews.",
            missionBrief: "Produce a system design document for a URL shortener that handles 1 000 write requests and 100 000 read requests per second. Cover: API design, database schema, key generation strategy, caching layer, and one scaling concern.",
            constraints: ["Document must fit on two A4 pages or fewer","Include an API spec with at least two endpoints: shorten and redirect","Propose a specific database (justify your choice)","Address what happens when the same long URL is submitted twice"],
            expectedOutcomes: ["Two-endpoint API spec included","Database schema with at least two tables/collections","Cache strategy documented (what to cache and TTL)","Duplicate URL handling explained","One scaling bottleneck identified with a proposed solution"],
            xp: 300, minutes: 90, level: 3,
          },
          {
            title: "Model an E-Commerce Database Schema",
            context: "A well-designed database schema is the foundation of every production application. Modelling an e-commerce store teaches normalisation, foreign keys, indexing, and thinking about query patterns before writing code.",
            missionBrief: "Design an entity-relationship (ER) diagram and SQL DDL for an e-commerce store covering: Users, Products, Categories, Orders, OrderItems, and Payments. Include primary keys, foreign keys, and three indexes you would add for performance.",
            constraints: ["All tables must have a primary key","Foreign keys must be declared explicitly","Include NOT NULL constraints where appropriate","Add at least three indexes and explain why each was chosen"],
            expectedOutcomes: ["Six tables modelled with correct relationships","ER diagram (even hand-drawn and photographed) included","Three indexes added with one-sentence justification each","Schema can be run against PostgreSQL without errors"],
            xp: 250, minutes: 70, level: 2,
          },
          {
            title: "Plan a Notification Service Architecture",
            context: "Every modern app sends notifications — email, SMS, push. Designing a reliable notification service teaches message queues, retry logic, and service separation; skills directly applicable to any backend role.",
            missionBrief: "Design the architecture for a notification service that supports email, SMS, and push notifications, can handle 50 000 notifications per minute, and retries failed deliveries up to 3 times. Produce a component diagram and a brief write-up.",
            constraints: ["Must use a message queue (e.g. RabbitMQ, SQS, Kafka — justify your choice)","Separate workers for each notification channel","Retry logic must be documented with back-off strategy","Diagram must show all components and data flow arrows"],
            expectedOutcomes: ["Component diagram with queue, workers, and delivery providers shown","Retry back-off strategy documented (e.g. 1 min, 5 min, 30 min)","Channel separation clearly shown","Queue technology chosen with one-paragraph justification"],
            xp: 275, minutes: 80, level: 3,
          },
        ],
      },
    ],
  },

  {
    name: "Data Scientist",
    districts: [
      {
        name: "Statistics & Probability",
        description: "Build the mathematical intuition that powers every data-driven decision: distributions, hypothesis testing, and statistical inference.",
        nodes: [
          {
            title: "Compute Descriptive Statistics on a Real Dataset",
            context: "Before building any model, a data scientist must understand the data. Computing descriptive statistics is the first step in every exploratory data analysis (EDA).",
            missionBrief: "Download the Titanic dataset from Kaggle or seaborn. Compute mean, median, mode, standard deviation, and interquartile range for all numeric columns. Identify which columns have outliers using the IQR method and list them.",
            constraints: ["Use Python with pandas and scipy","Do not drop any columns before computing stats","Use IQR (Q3 - Q1) method to flag outliers","Print results in a formatted table"],
            expectedOutcomes: ["All numeric column stats printed","Outlier columns identified correctly","IQR method used (not z-score)","Script runs end-to-end without errors"],
            xp: 125, minutes: 40, level: 1,
          },
          {
            title: "Run an A/B Test and Interpret the Results",
            context: "A/B testing is the most common statistical method used in product and marketing analytics. Understanding p-values and statistical significance is essential for any data role.",
            missionBrief: "Simulate an A/B test: generate two groups of 500 users each with conversion rates of 10% (control) and 13% (treatment). Run a two-proportion z-test, compute the p-value, and write a 3-sentence interpretation stating whether to ship the change.",
            constraints: ["Use numpy to generate data with a fixed random seed (42)","Use scipy.stats or statsmodels for the z-test","Significance threshold is α = 0.05","Interpretation must be in plain English, not just p < 0.05"],
            expectedOutcomes: ["Correct p-value computed and printed","Decision (ship / do not ship) stated clearly","Interpretation explains what the result means in business terms","Random seed 42 used so results are reproducible"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Visualise a Normal Distribution and Central Limit Theorem",
            context: "The Central Limit Theorem (CLT) is one of the most important theorems in statistics — it explains why so many real-world processes follow a normal distribution and underpins most hypothesis tests.",
            missionBrief: "Generate 10 000 samples from a uniform distribution (min=0, max=10). Then take 1 000 samples of means (n=30 each) and plot both distributions side by side. Label axes and add a title explaining the CLT.",
            constraints: ["Use matplotlib or seaborn for plotting","Save the figure as a PNG, do not just display it","Use numpy for random number generation with seed 7","Add axis labels, a legend, and a figure title"],
            expectedOutcomes: ["Two subplots: one uniform, one sampling distribution","Sampling distribution visibly bell-shaped","PNG file saved to disk","Title references the Central Limit Theorem"],
            xp: 150, minutes: 45, level: 1,
          },
        ],
      },
      {
        name: "Data Wrangling & Cleaning",
        description: "Transform raw, messy data into structured, analysis-ready datasets using the tools professionals use every day.",
        nodes: [
          {
            title: "Clean a Messy CSV Dataset",
            context: "Real-world data is almost always messy — missing values, inconsistent formatting, duplicate rows, and incorrect data types. Data cleaning typically takes 70–80% of a data scientist's time.",
            missionBrief: "Download the 'NYC 311 Service Requests' dataset (available on NYC Open Data). Perform: remove duplicate rows, fill missing values in the top 3 null columns with sensible defaults, standardise the 'Borough' column to title case, and convert 'Created Date' to datetime. Report row counts before and after.",
            constraints: ["Use pandas","Report initial and final row counts","Borough column must be title case (e.g. 'BROOKLYN' → 'Brooklyn')","Created Date column must be dtype datetime64"],
            expectedOutcomes: ["Zero duplicate rows in output","Top 3 null columns filled with appropriate defaults","Borough column in title case","Created Date column is datetime type","Before/after row counts printed"],
            xp: 175, minutes: 55, level: 2,
          },
          {
            title: "Engineer Features from a DateTime Column",
            context: "Feature engineering from datetime columns is a high-impact skill in forecasting, fraud detection, and demand planning. Extracting hour, day, week, and is_weekend signals from a timestamp can dramatically improve model accuracy.",
            missionBrief: "Using the cleaned NYC 311 dataset (or any dataset with a datetime column), extract: hour_of_day, day_of_week, month, quarter, and is_weekend. Plot the distribution of requests by hour and by day of week.",
            constraints: ["All five features must be new columns in the dataframe","is_weekend is boolean (True for Saturday/Sunday)","Two plots required: requests by hour and by day of week","Save plots as PNG files"],
            expectedOutcomes: ["Five new feature columns present and correct","is_weekend is boolean type","Requests-by-hour plot saved as PNG","Requests-by-day plot saved as PNG"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Merge and Aggregate Two Datasets",
            context: "Almost every real analytics task involves combining data from multiple sources. Joining and aggregating DataFrames is a daily task for data analysts and scientists.",
            missionBrief: "Using the seaborn 'tips' and a small hand-crafted 'restaurant_info' CSV (columns: day, restaurant_name), merge them on 'day'. Compute: total_bill per day, average tip percentage per day, and total transactions per day. Output a clean summary table.",
            constraints: ["Create the restaurant_info CSV programmatically in the script","Use a left join so no tip rows are lost","Tip percentage = tip / total_bill * 100","Summary table must have four columns: day, total_bill, avg_tip_pct, transactions"],
            expectedOutcomes: ["Merged dataset has same row count as tips dataset","Summary table has exactly four columns","avg_tip_pct rounded to 2 decimal places","Output printed to console as a formatted table"],
            xp: 150, minutes: 45, level: 1,
          },
        ],
      },
      {
        name: "Machine Learning Fundamentals",
        description: "Train your first predictive models, evaluate them rigorously, and understand what makes a model learn from data.",
        nodes: [
          {
            title: "Train a Logistic Regression Classifier on the Iris Dataset",
            context: "Logistic Regression is one of the most widely used classification algorithms in industry — from credit scoring to medical diagnosis. The Iris dataset is a clean, well-understood benchmark that lets you focus on the modelling workflow.",
            missionBrief: "Load the Iris dataset from sklearn, split it 80/20 train/test (random_state=42), train a Logistic Regression model, and evaluate it. Print accuracy, precision, recall, and F1 score. Plot a confusion matrix.",
            constraints: ["Use scikit-learn for everything","random_state=42 for reproducibility","Print a full classification_report","Save confusion matrix as a PNG"],
            expectedOutcomes: ["Accuracy above 90% on the test set","Full classification_report printed","Confusion matrix PNG saved","No data leakage (fit only on training set)"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Compare Three Regression Models on the Boston Housing Dataset",
            context: "Choosing the right algorithm is a core data science skill. Comparing models side by side on the same dataset teaches you how to benchmark fairly and interpret RMSE and R² correctly.",
            missionBrief: "Load the California Housing dataset from sklearn. Train Linear Regression, Decision Tree, and Random Forest regressors. Evaluate each using 5-fold cross-validation, reporting mean RMSE and R². State which model you would recommend and why in 2–3 sentences.",
            constraints: ["Use sklearn.model_selection.cross_val_score for all models","Report RMSE (not MSE) — use np.sqrt","Use the same random_state=42 for all models","Recommendation must be written as a code comment"],
            expectedOutcomes: ["Three models compared with mean RMSE and R²","Cross-validation used (not a single train/test split)","RMSE values printed for all three models","Recommendation written in a comment citing the metrics"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Detect Overfitting with Learning Curves",
            context: "Overfitting is the most common pitfall in machine learning. Learning curves are a visual diagnostic every practitioner must be able to read and act upon.",
            missionBrief: "Train a Decision Tree on the Iris dataset with max_depth ranging from 1 to 20. For each depth, record training accuracy and 5-fold CV accuracy. Plot both curves on one figure. Identify the depth where overfitting begins and mark it on the chart.",
            constraints: ["Use scikit-learn for training and cross-validation","X-axis is max_depth (1–20), Y-axis is accuracy","Two lines on the same figure: train and CV accuracy","Mark the overfitting point with a vertical dashed line and annotation"],
            expectedOutcomes: ["Chart shows both training and CV accuracy lines","Vertical dashed line marks the overfitting point","Annotation on chart states the optimal depth","Plot saved as PNG"],
            xp: 200, minutes: 60, level: 2,
          },
        ],
      },
      {
        name: "Data Visualization",
        description: "Turn raw numbers into compelling charts and dashboards that tell a clear story to both technical and non-technical audiences.",
        nodes: [
          {
            title: "Build a Sales Dashboard with Matplotlib",
            context: "A dashboard is often the first deliverable a data scientist produces for a business stakeholder. Building one with Matplotlib teaches layout, labelling, colour choice, and how to make data accessible.",
            missionBrief: "Using the 'Superstore' dataset (available on Kaggle), create a 2×2 dashboard showing: monthly sales trend (line chart), top 10 products by revenue (bar chart), sales by region (pie chart), and profit margin by category (horizontal bar). Save as a single PNG at 150 dpi.",
            constraints: ["All four charts in one figure (2 rows, 2 columns)","Each chart must have a title and labelled axes (except pie)","Use a consistent colour palette across charts","PNG must be at least 1200×900 pixels"],
            expectedOutcomes: ["2×2 figure with all four charts","Each chart has a descriptive title","Consistent colour palette used","PNG saved at ≥150 dpi"],
            xp: 225, minutes: 70, level: 2,
          },
          {
            title: "Create an Interactive Chart with Plotly",
            context: "Interactive charts let stakeholders explore data themselves — zooming, filtering, and hovering for details. Plotly is the standard library for interactive data visualisation in Python.",
            missionBrief: "Using the Gapminder dataset (available in plotly.express), create an animated bubble chart showing GDP per capita vs Life Expectancy over time, with bubble size = population and colour = continent. Add a title, axis labels, and export as an HTML file.",
            constraints: ["Use plotly.express","Animate over the 'year' dimension","Bubble size must represent population","Export as a standalone HTML file (write_html)"],
            expectedOutcomes: ["Animated bubble chart renders in a browser","GDP per capita on X axis, Life Expectancy on Y","Bubble size proportional to population","HTML file exported and openable without a server"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Visualise Feature Correlations with a Heatmap",
            context: "Understanding which features are correlated is essential before modelling. High correlation between predictors (multicollinearity) can destabilise linear models and mislead interpretation.",
            missionBrief: "Load the California Housing dataset. Compute a Pearson correlation matrix for all numeric features. Plot a seaborn heatmap with correlation values annotated, a diverging colour palette, and features sorted by their correlation with the target (MedHouseVal).",
            constraints: ["Use seaborn heatmap","Annotate each cell with its correlation value (2 decimal places)","Use a diverging palette (e.g. coolwarm)","Sort features by their correlation with MedHouseVal"],
            expectedOutcomes: ["Heatmap shows all feature pairs","Values annotated in each cell","Diverging palette used","Features sorted by target correlation","PNG saved"],
            xp: 150, minutes: 40, level: 1,
          },
        ],
      },
      {
        name: "SQL & Database Querying",
        description: "Write production-grade SQL queries to extract, aggregate, and transform data from relational databases — a daily task in every data role.",
        nodes: [
          {
            title: "Write Five Aggregation Queries on a Sales Database",
            context: "Aggregation queries are the backbone of business intelligence. Every data analyst or scientist needs to fluently write GROUP BY, HAVING, and window functions to answer business questions quickly.",
            missionBrief: "Using the Northwind or Chinook sample database, write five SQL queries: (1) total revenue by customer, (2) top 5 products by units sold, (3) monthly revenue trend, (4) customers who have not placed an order in the last 90 days, (5) average order value by country. Each query must return the correct result and run under 2 seconds.",
            constraints: ["Queries must be standard SQL (PostgreSQL or SQLite compatible)","Each query in a separate numbered file or clearly labelled section","No subqueries where a JOIN is more readable","Include comments explaining each query's business purpose"],
            expectedOutcomes: ["All five queries return non-empty results on the sample database","Each query runs in under 2 seconds","Comments present above each query","No SELECT * in any query"],
            xp: 200, minutes: 60, level: 2,
          },
          {
            title: "Optimise a Slow SQL Query",
            context: "Query optimisation is one of the highest-leverage skills a data professional can have. A poorly written query that runs in 30 seconds can often be rewritten to run in under 1 second.",
            missionBrief: "Given a provided slow query (a nested subquery with no indexes), rewrite it using a JOIN and an appropriate index. Measure the execution time before and after on a table with at least 100 000 rows. Document your changes and the performance improvement.",
            constraints: ["Demonstrate the slow query first, then the optimised version","Use EXPLAIN ANALYZE (PostgreSQL) or EXPLAIN QUERY PLAN (SQLite) to show query plans","Table must have at least 100 000 rows (generate synthetic data if needed)","Report the execution time before and after"],
            expectedOutcomes: ["Before and after execution times documented","EXPLAIN output shown for both versions","Optimised query returns identical results to the original","Performance improvement of at least 50%"],
            xp: 250, minutes: 70, level: 3,
          },
          {
            title: "Build a Customer Cohort Analysis in SQL",
            context: "Cohort analysis is a standard technique for measuring user retention over time. It answers the question: 'Of the users who joined in month X, how many were still active in month X+1, X+2…?' This is a key metric for any subscription or e-commerce business.",
            missionBrief: "Using an orders table with columns (user_id, order_date), write SQL that groups users by their acquisition month (cohort), then shows the percentage of each cohort still active in each of the following 3 months. Output as a cohort × month matrix.",
            constraints: ["Use window functions (ROW_NUMBER or FIRST_VALUE)","Percentages must be between 0 and 100 and rounded to 1 decimal place","Output must be a pivot-style table","Works on PostgreSQL 13+"],
            expectedOutcomes: ["Cohort table produced with correct acquisition months","Retention percentages calculated correctly","Month-0 retention is always 100%","Query uses window functions, not self-joins"],
            xp: 300, minutes: 90, level: 3,
          },
        ],
      },
    ],
  },

  {
    name: "DevOps Engineer",
    districts: [
      {
        name: "Linux & Shell Scripting",
        description: "Master the command line — the primary interface for every DevOps engineer — from file manipulation to process management and automation scripts.",
        nodes: [
          {
            title: "Write a Bash Script to Automate Backups",
            context: "Backup automation is a fundamental DevOps task. A reliable backup script protects business data and is often one of the first scripts a junior DevOps engineer is asked to write.",
            missionBrief: "Write a bash script that compresses a given directory into a timestamped .tar.gz archive, saves it to a backup directory, and deletes archives older than 7 days. Log each operation with a timestamp to a log file.",
            constraints: ["Accept the source directory and backup directory as command-line arguments","Timestamp format: YYYY-MM-DD_HH-MM-SS","Delete files older than 7 days using find -mtime +7","Append each operation to backup.log with a timestamp"],
            expectedOutcomes: ["Script creates a timestamped .tar.gz archive","Archives older than 7 days are removed after each run","All operations logged to backup.log","Script exits with code 1 and a helpful message if arguments are missing"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Monitor Disk Usage and Send an Alert",
            context: "Running out of disk space is one of the most common causes of production outages. A simple monitoring script that alerts when disk usage exceeds a threshold prevents costly downtime.",
            missionBrief: "Write a bash script that checks disk usage for all mounted filesystems. If any filesystem exceeds 80% usage, write an alert message to a log file and (optionally) send an email using the mail command. Schedule the script to run every 15 minutes via cron.",
            constraints: ["Use df -h to check disk usage","Parse percentage values correctly even if they are two or three digits","Alert message must include: filesystem name, current usage percentage, and timestamp","Include the cron entry as a comment at the top of the script"],
            expectedOutcomes: ["Script correctly identifies filesystems above 80%","Alert logged with filesystem, percentage, and timestamp","Cron schedule comment present at the top","Script handles systems with no over-threshold filesystems silently"],
            xp: 150, minutes: 45, level: 1,
          },
          {
            title: "Parse and Summarise an Apache Access Log",
            context: "Log analysis is a daily DevOps task. Being able to quickly parse a log file and extract actionable information using standard Unix tools (awk, grep, sort, uniq) is a core skill.",
            missionBrief: "Given an Apache access log, write a bash one-liner or short script that outputs: (1) total requests, (2) top 5 IP addresses by request count, (3) top 5 requested URLs, (4) count of 404 responses. Format output clearly with headers.",
            constraints: ["Use standard Unix tools: awk, grep, sort, uniq, wc","No Python or external tools","Output must have a header for each section","Works on a standard Apache Combined Log Format file"],
            expectedOutcomes: ["Total request count correct","Top 5 IPs and URLs listed in descending order","404 count accurate","All four sections output with clear headers"],
            xp: 150, minutes: 40, level: 2,
          },
        ],
      },
      {
        name: "CI/CD Pipelines",
        description: "Automate the path from code commit to production deployment, reducing manual errors and shipping software faster with confidence.",
        nodes: [
          {
            title: "Set Up a GitHub Actions Pipeline for a Node.js App",
            context: "GitHub Actions is the most widely adopted CI platform, used by millions of open-source and enterprise projects. Setting up a basic pipeline is now a baseline expectation for every DevOps engineer.",
            missionBrief: "Create a GitHub Actions workflow file (.github/workflows/ci.yml) for a Node.js application that: installs dependencies, runs lint, runs unit tests, and builds the app. The pipeline must run on every push to main and on pull requests.",
            constraints: ["Use the official actions/checkout and actions/setup-node actions","Node.js version must be pinned (e.g. 20)","Pipeline must fail fast if lint fails (tests should not run)","Include a badge in README.md showing the pipeline status"],
            expectedOutcomes: ["Workflow file triggers on push to main and on PRs","Lint step runs before tests","Build step runs after tests pass","README.md includes the GitHub Actions status badge"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Add Automated Deployment to a CI Pipeline",
            context: "Continuous Deployment (CD) removes the manual step of deploying code after tests pass. Adding it to an existing pipeline is how teams achieve multiple daily deployments safely.",
            missionBrief: "Extend the GitHub Actions pipeline to deploy the app to a free hosting platform (e.g. Render, Railway, or a VPS via SSH) after tests pass on main only. Use GitHub Secrets to store credentials and never expose them in the workflow file.",
            constraints: ["Deployment step only runs on the main branch, not on PRs","All credentials stored in GitHub Secrets (never hardcoded)","Add a 'smoke test' step after deployment: curl the deployed URL and fail if status != 200","Document the deployment target in a comment in the workflow file"],
            expectedOutcomes: ["Deployment step is skipped on PRs","Secrets used for all credentials","Smoke test curl step present","Deployment target documented in a comment"],
            xp: 250, minutes: 75, level: 3,
          },
          {
            title: "Implement a Semantic Versioning Release Pipeline",
            context: "Semantic versioning (semver) gives every release a meaningful version number (MAJOR.MINOR.PATCH). Automating it removes human error and makes changelogs and rollbacks straightforward.",
            missionBrief: "Set up a pipeline using conventional commits and semantic-release (or release-please) that automatically bumps the version, generates a CHANGELOG.md, and creates a GitHub Release with release notes on every merge to main.",
            constraints: ["Commit messages must follow Conventional Commits format","Version bump must follow semver rules (feat → minor, fix → patch, BREAKING CHANGE → major)","CHANGELOG.md must be updated automatically","GitHub Release created with auto-generated notes"],
            expectedOutcomes: ["Version bumped correctly based on commit type","CHANGELOG.md updated with this release's changes","GitHub Release created automatically","BREAKING CHANGE commit triggers a major version bump"],
            xp: 225, minutes: 65, level: 3,
          },
        ],
      },
      {
        name: "Docker & Containerisation",
        description: "Package applications and their dependencies into portable containers that run consistently across every environment.",
        nodes: [
          {
            title: "Containerise a Python Flask App",
            context: "Docker is the industry standard for packaging applications. Containerising a Flask app teaches you Dockerfile syntax, layer caching, and the difference between development and production configurations.",
            missionBrief: "Write a Dockerfile for a simple Flask 'Hello World' app. The image must: use a non-root user, expose port 5000, use a .dockerignore file, and have a final image size under 200 MB. Build and run the image, confirming the app responds on localhost:5000.",
            constraints: ["Base image: python:3.11-slim","App must run as a non-root user",".dockerignore must exclude: .git, __pycache__, *.pyc, venv","Final image must be under 200 MB"],
            expectedOutcomes: ["docker build completes without errors","docker run -p 5000:5000 serves the app","Non-root user confirmed with docker exec whoami","Image size under 200 MB (check with docker images)"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Orchestrate a Multi-Service App with Docker Compose",
            context: "Most real-world applications consist of multiple services — a web server, a database, and perhaps a cache. Docker Compose lets you define, start, and connect them all with a single command.",
            missionBrief: "Write a docker-compose.yml file that starts three services: a Node.js API, a PostgreSQL database, and a Redis cache. The API must depend_on the database, use environment variables for credentials, and expose port 3000 on the host. All three services must be reachable by name within the Docker network.",
            constraints: ["Use docker compose v3.8+ syntax","PostgreSQL credentials in .env file (never hardcoded in compose file)","API container must restart: unless-stopped","Health check on the PostgreSQL service using pg_isready"],
            expectedOutcomes: ["docker compose up -d starts all three services","API service waits for the DB health check to pass","Credentials read from .env, not hardcoded","All services communicate by service name (not localhost)"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Optimise a Docker Image Using Multi-Stage Builds",
            context: "Bloated Docker images slow down deployments and increase attack surface. Multi-stage builds are the standard technique for producing lean production images without sacrificing the build toolchain.",
            missionBrief: "Take an existing Dockerfile for a React app (or any compiled language) and rewrite it using a multi-stage build: stage 1 builds the artefact, stage 2 serves it with nginx. Measure and document the image size before and after.",
            constraints: ["Stage 1: use the full build image (e.g. node:20)","Stage 2: use nginx:alpine","Only built artefacts are copied to stage 2 (no node_modules, no source)","Document before/after image size in a code comment"],
            expectedOutcomes: ["Two FROM statements in the Dockerfile","Stage 2 image contains only built files and nginx","Before/after sizes documented in a comment","Final image serves the app correctly on port 80"],
            xp: 200, minutes: 55, level: 2,
          },
        ],
      },
      {
        name: "Infrastructure as Code",
        description: "Define, provision, and manage cloud infrastructure through code — making infrastructure reproducible, auditable, and version-controlled.",
        nodes: [
          {
            title: "Provision an EC2 Instance with Terraform",
            context: "Terraform is the most widely used Infrastructure as Code tool, supporting every major cloud provider. Provisioning an EC2 instance is the 'Hello World' of Terraform and teaches resources, providers, variables, and outputs.",
            missionBrief: "Write a Terraform configuration that provisions an AWS EC2 t2.micro instance in us-east-1 with a security group allowing SSH (port 22) and HTTP (port 80). Use variables for the AMI ID and instance type. Output the public IP address.",
            constraints: ["Use Terraform >= 1.0","All configurable values in variables.tf","Security group must be a separate resource block","Output the public IP in outputs.tf"],
            expectedOutcomes: ["terraform plan shows the two resources (instance + security group)","terraform apply creates the instance and outputs the IP","Variables file contains at least ami_id and instance_type","State file created (do not commit to git)"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Write an Ansible Playbook to Configure a Web Server",
            context: "Ansible automates server configuration in a human-readable YAML format. Writing a playbook to configure a web server teaches idempotency, roles, and how to manage state across a fleet of servers.",
            missionBrief: "Write an Ansible playbook that: installs nginx, copies a custom index.html, enables and starts the nginx service, and opens port 80 in the firewall. The playbook must be idempotent — running it twice must produce no changes on the second run.",
            constraints: ["Target: Ubuntu 22.04","Use ansible.builtin modules only","Custom index.html must contain the server hostname","Playbook must pass --check mode without errors"],
            expectedOutcomes: ["nginx installed and running after one playbook run","Custom index.html served at http://<host>/","Second run reports 0 changes","--check mode passes without errors"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Store Terraform State Remotely in S3",
            context: "Storing Terraform state locally breaks team collaboration. Moving state to S3 with DynamoDB locking is the standard pattern for teams — it prevents concurrent modifications and provides an audit trail.",
            missionBrief: "Refactor an existing local-state Terraform project to use an S3 backend with a DynamoDB table for state locking. Document the migration steps and add a README section explaining why remote state matters.",
            constraints: ["S3 bucket must have versioning enabled","DynamoDB table must have LockID as the hash key","terraform init must succeed with the remote backend","Never commit the .tfstate file to git — add it to .gitignore"],
            expectedOutcomes: ["terraform init configures the S3 backend","State file stored in S3, not locally","DynamoDB table used for locking (visible in AWS Console)","README section explains remote state benefits","tfstate in .gitignore"],
            xp: 250, minutes: 70, level: 3,
          },
        ],
      },
      {
        name: "Monitoring & Observability",
        description: "Gain full visibility into your systems: track metrics, correlate logs, and set up alerts before users report problems.",
        nodes: [
          {
            title: "Set Up Prometheus and Grafana with Docker Compose",
            context: "Prometheus and Grafana are the de-facto open-source monitoring stack. Setting them up gives you a working observability platform within minutes and is a required skill for any DevOps role.",
            missionBrief: "Use Docker Compose to run Prometheus and Grafana. Configure Prometheus to scrape its own metrics and the host Node Exporter. Create a Grafana dashboard showing CPU usage, memory usage, and disk I/O for the host. Export the dashboard as a JSON file.",
            constraints: ["Use official Docker images for all three services","Prometheus scrape interval: 15 seconds","Grafana dashboard must have at least three panels","Export dashboard JSON to dashboards/host-metrics.json"],
            expectedOutcomes: ["docker compose up starts Prometheus, Grafana, and Node Exporter","Prometheus targets page shows all three targets as UP","Grafana dashboard shows CPU, memory, and disk panels","Dashboard JSON exported to the correct path"],
            xp: 250, minutes: 75, level: 2,
          },
          {
            title: "Create Alerting Rules in Prometheus",
            context: "Metrics without alerts are just noise. Alerting rules in Prometheus define the conditions that trigger notifications — a core DevOps skill that directly reduces mean time to detection (MTTD).",
            missionBrief: "Write Prometheus alerting rules for: (1) instance down for more than 1 minute, (2) CPU usage above 85% for 5 minutes, (3) disk usage above 90%. Configure Alertmanager to route alerts to a webhook (use webhook.site for testing). Verify each alert fires by simulating the condition.",
            constraints: ["Rules in a YAML file loaded by Prometheus","All three alerts must have: severity label, description, and summary annotations","Alertmanager routes to the webhook URL","Demonstrate at least one alert firing in a screenshot or log excerpt"],
            expectedOutcomes: ["Three alerting rules defined in YAML","Each rule has severity, description, and summary annotations","Alertmanager configured with the webhook receiver","Evidence of at least one alert firing provided"],
            xp: 225, minutes: 65, level: 3,
          },
          {
            title: "Centralise Logs with the ELK Stack",
            context: "Searching through logs across multiple servers manually is impossible at scale. The ELK stack (Elasticsearch, Logstash, Kibana) centralises logs, making them searchable and visualisable — essential for debugging distributed systems.",
            missionBrief: "Set up Elasticsearch, Logstash, and Kibana using Docker Compose. Configure Logstash to ingest a sample Apache access log file, parse it with the grok filter, and index it to Elasticsearch. Create a Kibana dashboard showing request counts per minute and a table of error responses.",
            constraints: ["Use Docker Compose for all three services","Logstash grok pattern must correctly parse Apache Combined Log Format","Index pattern in Kibana must match the Logstash output index","Dashboard must have at least two visualisations"],
            expectedOutcomes: ["All three services start and communicate","Logstash correctly parses log fields (IP, method, status, bytes)","Kibana shows indexed documents","Dashboard with requests-per-minute chart and error table created"],
            xp: 275, minutes: 80, level: 3,
          },
        ],
      },
    ],
  },

  {
    name: "Cybersecurity Analyst",
    districts: [
      {
        name: "Network Security Basics",
        description: "Understand how networks operate and how attackers exploit them — the foundation of every cybersecurity career.",
        nodes: [
          {
            title: "Capture and Analyse Network Traffic with Wireshark",
            context: "Wireshark is the most widely used network protocol analyser. Being able to capture and read packet captures is a fundamental skill for security analysts investigating incidents or analysing suspicious traffic.",
            missionBrief: "Capture 2 minutes of your own network traffic with Wireshark. Identify and document: (1) the top 3 protocols by packet count, (2) one DNS query and its response, (3) one TCP three-way handshake. Export the capture as a .pcap file.",
            constraints: ["Capture on your own machine only","Filter sensitive credentials from screenshots before submitting","Identify protocols using Wireshark's built-in protocol dissectors","Export as pcap format"],
            expectedOutcomes: ["Top 3 protocols identified with packet counts","DNS query/response pair identified with domain name","TCP SYN, SYN-ACK, ACK sequence shown","pcap file exported"],
            xp: 150, minutes: 45, level: 1,
          },
          {
            title: "Configure a Firewall with iptables Rules",
            context: "iptables is the standard Linux firewall. Configuring it correctly is a basic security hardening task performed on every Linux server before it is exposed to the internet.",
            missionBrief: "On a Linux VM, configure iptables to: (1) default DENY all incoming traffic, (2) allow established and related connections, (3) allow SSH (port 22) from a specific IP only, (4) allow HTTP and HTTPS from anywhere, (5) drop all ICMP ping requests. Save the rules so they persist after reboot.",
            constraints: ["Use a VM or container — never test on a production machine","Test each rule before finalising","Save rules with iptables-save and restore on boot","Document each rule with a comment in the save file"],
            expectedOutcomes: ["Default policy is DROP for INPUT chain","SSH only accessible from the specified IP","HTTP/HTTPS accessible from any IP","Ping requests dropped and not visible in tcpdump","Rules persist after reboot"],
            xp: 200, minutes: 60, level: 2,
          },
          {
            title: "Scan a Network with Nmap and Document Findings",
            context: "Nmap is the industry-standard network scanner used by both defenders and attackers. Understanding what Nmap reveals about your own network is essential for attack surface management.",
            missionBrief: "Using Nmap on your own local network (or a lab environment like TryHackMe), perform: (1) a host discovery scan, (2) a port scan on one target, (3) a service/version detection scan, (4) an OS detection scan. Produce a one-page findings report.",
            constraints: ["Only scan networks you own or have explicit permission to scan","Use at least three different Nmap flags","Report must include: IP, open ports, detected services, OS guess","Save raw Nmap output with -oN flag"],
            expectedOutcomes: ["Four scan types performed","Raw output saved with -oN","Findings report includes IP, ports, services, OS","Report readable by a non-technical manager"],
            xp: 175, minutes: 50, level: 2,
          },
        ],
      },
      {
        name: "Web Application Security",
        description: "Learn the OWASP Top 10 vulnerabilities and how to find, exploit (safely), and remediate them in web applications.",
        nodes: [
          {
            title: "Find and Exploit SQL Injection on a Lab Target",
            context: "SQL Injection is consistently one of the most critical web vulnerabilities. Understanding how it works — not just theoretically but practically — is essential for any security analyst or pentester.",
            missionBrief: "Using DVWA (Damn Vulnerable Web Application) set to Low security, exploit the SQL Injection vulnerability to: (1) confirm injection with a single quote, (2) determine the number of columns, (3) dump all usernames and passwords from the database. Document each step with a screenshot and the payload used.",
            constraints: ["Use DVWA running locally — never test on live websites","Document every payload used","Screenshots required for each step","Explain what each payload does in one sentence"],
            expectedOutcomes: ["Injection confirmed with single quote error","Column count determined","Usernames and hashed passwords dumped","Each step documented with payload and screenshot"],
            xp: 225, minutes: 70, level: 2,
          },
          {
            title: "Identify and Remediate XSS Vulnerabilities",
            context: "Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into web pages viewed by other users, enabling session hijacking, phishing, and defacement. Understanding it is mandatory for any web security role.",
            missionBrief: "On DVWA (Low security), exploit both the Reflected and Stored XSS vulnerabilities with a simple alert(). Then switch to High security and document what mitigation is applied. Write a one-paragraph remediation recommendation for each XSS type.",
            constraints: ["Test on DVWA locally only","Payloads must use alert() or console.log() — no credential theft","Document the input field and payload for each XSS type","Remediation must reference specific HTTP headers or encoding methods"],
            expectedOutcomes: ["Reflected XSS alert demonstrated","Stored XSS alert demonstrated","High security mitigation documented","Remediation recommendations reference Content-Security-Policy and output encoding"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Perform a Security Headers Audit on a Website",
            context: "Missing HTTP security headers are a quick win for attackers and an easy fix for developers. Auditing headers is a lightweight task that any security analyst should be able to perform in minutes.",
            missionBrief: "Using curl and securityheaders.com, audit three real-world websites of your choice (use public sites like example.com). For each, document which security headers are present/missing and rate each site A–F. Provide one remediation recommendation per missing header.",
            constraints: ["Audit at least three distinct websites","Check for: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy","Use curl -I to fetch headers independently","Document findings in a table"],
            expectedOutcomes: ["Three websites audited","Header presence/absence documented for all five headers","A–F rating assigned to each site","One remediation recommendation per missing header"],
            xp: 125, minutes: 35, level: 1,
          },
        ],
      },
      {
        name: "Ethical Hacking & Recon",
        description: "Think like an attacker — use open-source intelligence, enumeration, and exploitation techniques to find weaknesses before malicious actors do.",
        nodes: [
          {
            title: "Conduct OSINT Reconnaissance on a Test Target",
            context: "Reconnaissance is the first phase of any penetration test. Open-source intelligence (OSINT) lets attackers gather information without ever touching a target — understanding this helps defenders know what adversaries can see.",
            missionBrief: "Conduct OSINT on a fictional company or your own public profile. Using only public sources (Google, LinkedIn, Shodan, WHOIS, BuiltWith), document: email format, tech stack, public subdomains, employee names, and job postings that reveal technology choices. Create a one-page recon report.",
            constraints: ["Use only legal, publicly available sources","Do not attempt to access any private systems","Document every tool and query used","Anonymise any real personal data before submitting"],
            expectedOutcomes: ["Five OSINT categories documented","At least three tools used (e.g. Shodan, WHOIS, Google dorks)","One-page report produced","Report includes a risk summary: what could an attacker do with this data?"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Perform Subdomain Enumeration with Subfinder",
            context: "Subdomain enumeration discovers forgotten or unprotected parts of a target's infrastructure — staging servers, admin panels, and development environments that are often less secure than the main site.",
            missionBrief: "Install Subfinder and run it against a domain you own or a bug bounty programme that explicitly allows subdomain enumeration. Identify all unique subdomains, resolve their IPs with dnsx, and flag any that return a 200 status code on port 80/443.",
            constraints: ["Only scan domains you own or have explicit permission to scan","Save raw output to a text file","Use dnsx for DNS resolution after enumeration","Flag live subdomains with httpx or curl"],
            expectedOutcomes: ["Subfinder run produces a list of subdomains","dnsx resolves IPs for all discovered subdomains","Live subdomains (200 status) flagged separately","Raw output saved to a file"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Exploit a Misconfigured Linux Service in a CTF",
            context: "Privilege escalation through misconfigured services is one of the most common paths attackers take after gaining initial access. Practising in a CTF environment builds intuition for spotting these weaknesses.",
            missionBrief: "Complete the 'Basic Pentesting' or 'RootMe' room on TryHackMe (both are free). Document the steps to: gain initial access, enumerate the system for privilege escalation vectors, and capture the root flag. Include every command run.",
            constraints: ["Use a TryHackMe room — not a live production system","Document every command in order","Explain why each command was run in one sentence","Include the root flag as proof of completion"],
            expectedOutcomes: ["Initial access step documented","Privilege escalation vector identified and exploited","Root flag captured","All commands documented with one-sentence explanations"],
            xp: 275, minutes: 90, level: 3,
          },
        ],
      },
      {
        name: "Incident Response",
        description: "Contain, investigate, and recover from security incidents systematically — turning chaos into a structured process that protects the organisation.",
        nodes: [
          {
            title: "Write an Incident Response Playbook for a Phishing Attack",
            context: "Phishing is the most common initial access vector for data breaches. A well-defined playbook ensures the team responds consistently and quickly, reducing dwell time and damage.",
            missionBrief: "Write an incident response playbook for a phishing email that delivers malware. Cover all six NIST phases: Preparation, Identification, Containment, Eradication, Recovery, and Lessons Learned. Each phase must have specific, actionable steps with responsible roles assigned.",
            constraints: ["All six NIST IR phases must be covered","Each phase must have at least three specific action items","Roles assigned to each action item (e.g. Analyst, IT Admin, CISO)","Playbook must be in Markdown format"],
            expectedOutcomes: ["All six NIST phases present","Three or more action items per phase","Roles assigned to every action item","Playbook in Markdown and readable without IT background"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Analyse a Sample Malware with Static Analysis",
            context: "Static analysis examines a malicious file without executing it, extracting indicators of compromise (IoCs) like file hashes, strings, and imported functions — all without risking infection.",
            missionBrief: "Using a known-safe malware sample from MalwareBazaar (download in a VM), perform static analysis with: file, strings, sha256sum, and PEview/pestudio (for PE files). Document: file hash, file type, suspicious strings, and network indicators (IPs/domains found in strings).",
            constraints: ["Work inside a VM — never on a host machine","Download only tagged 'safe to share' samples from MalwareBazaar","Document SHA-256 hash as the first line of your report","Do not execute the sample"],
            expectedOutcomes: ["SHA-256 hash documented","File type identified with file command","Suspicious strings listed","Network indicators (IPs or domains) extracted from strings output"],
            xp: 200, minutes: 60, level: 2,
          },
          {
            title: "Build a Simple SIEM Alert in Splunk Free",
            context: "SIEM platforms centralise security logs and generate alerts. Building a simple alert in Splunk teaches you how analysts detect threats in real time and is a core skill in any SOC role.",
            missionBrief: "Install Splunk Free, ingest a sample Windows Security Event Log (available from EVTX-ATTACK-SAMPLES on GitHub), and create a saved search alert that fires when more than 5 failed logon events (EventID 4625) occur within 5 minutes from the same source IP.",
            constraints: ["Use Splunk Free (no license required)","Ingest at least 1 000 events","Alert threshold: 5 failed logons in 5 minutes","Alert must trigger on the sample data and be documented with a screenshot"],
            expectedOutcomes: ["Sample logs ingested and searchable","SPL query correctly filters EventID 4625","Alert configured with 5-minute window and count > 5 threshold","Screenshot showing the alert firing"],
            xp: 250, minutes: 75, level: 3,
          },
        ],
      },
      {
        name: "Cryptography & Encryption",
        description: "Understand how modern encryption works, when to use it, and how to implement it correctly — mistakes here can undermine every other security control.",
        nodes: [
          {
            title: "Encrypt and Decrypt Files with GPG",
            context: "GPG (GNU Privacy Guard) is the standard tool for asymmetric encryption. Using it correctly ensures that sensitive files can only be read by the intended recipient — a skill used daily in security teams.",
            missionBrief: "Generate a GPG key pair, export the public key, encrypt a text file for a recipient (yourself), decrypt it, and verify the decrypted content matches the original. Then sign a file and verify the signature. Document every command used.",
            constraints: ["Use GPG from the command line (not a GUI)","Key must be at least 3072 bits RSA","Demonstrate both encryption/decryption and signing/verification","Document every command with its output"],
            expectedOutcomes: ["Key pair generated and listed in keyring","File encrypted and decrypted successfully","Decrypted content matches original","File signed and signature verified with --verify"],
            xp: 150, minutes: 40, level: 1,
          },
          {
            title: "Implement Secure Password Hashing in Python",
            context: "Storing passwords incorrectly (plain text, MD5, or SHA-1) is one of the most common security failures. Understanding bcrypt, scrypt, and Argon2 and why they are better is essential for any developer or security professional.",
            missionBrief: "Write a Python script that: (1) hashes a password with bcrypt, (2) verifies a correct password returns True, (3) verifies an incorrect password returns False, (4) demonstrates why MD5 is unsuitable by showing it can be cracked with a simple dictionary attack on a common password.",
            constraints: ["Use the bcrypt library for hashing","MD5 demonstration must use hashlib, not an external service","Dictionary attack must load a wordlist from a file","Include comments explaining the work factor and why it matters"],
            expectedOutcomes: ["bcrypt hash produced and verified correctly","Incorrect password returns False","MD5 of 'password123' cracked in under 1 second with a wordlist","Comments explain the work factor concept"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Set Up TLS on a Local Web Server and Inspect the Certificate",
            context: "TLS (Transport Layer Security) protects data in transit. Configuring it correctly — and knowing how to inspect a certificate — is a baseline skill for developers and security engineers alike.",
            missionBrief: "Use mkcert to generate a locally trusted TLS certificate. Configure nginx to serve a simple site over HTTPS on localhost. Use openssl s_client to inspect the certificate chain and document: issuer, subject, validity period, and cipher suite negotiated.",
            constraints: ["Use mkcert for certificate generation","nginx config must redirect HTTP to HTTPS","Use openssl s_client -connect localhost:443 to inspect the certificate","Document: issuer, subject, not_before, not_after, cipher suite"],
            expectedOutcomes: ["Site accessible at https://localhost without certificate warnings","HTTP request redirects to HTTPS","openssl s_client output shows valid certificate","Four certificate fields documented"],
            xp: 200, minutes: 55, level: 2,
          },
        ],
      },
    ],
  },

  {
    name: "Cloud Architect",
    districts: [
      {
        name: "Cloud Computing Fundamentals",
        description: "Understand the core concepts, shared responsibility model, and economics of cloud computing that underpin every cloud architecture decision.",
        nodes: [
          {
            title: "Compare AWS, Azure, and GCP on Five Criteria",
            context: "Choosing the right cloud provider is a strategic decision that affects cost, capability, and hiring. A structured comparison is the first step any cloud architect takes before recommending a platform.",
            missionBrief: "Research and write a two-page comparison of AWS, Azure, and GCP across five criteria: (1) compute offerings, (2) managed database services, (3) global region count, (4) pricing model for 8 vCPU + 32 GB RAM compute, and (5) free tier limitations. Conclude with a recommendation for a startup's first cloud deployment.",
            constraints: ["Use only official pricing pages and public documentation","Price comparison must be for on-demand, same or equivalent specs","Recommendation must name one provider and give two justifications","Document must be in Markdown"],
            expectedOutcomes: ["Five criteria covered for all three providers","Pricing comparison uses identical or equivalent specs","One provider recommended with two cited reasons","Document is in Markdown and under two pages"],
            xp: 150, minutes: 45, level: 1,
          },
          {
            title: "Architect a Three-Tier Application on AWS",
            context: "The three-tier architecture (presentation, application, data) is the most common pattern for web applications. Knowing how to map it onto AWS services is a foundational cloud architecture skill.",
            missionBrief: "Design an AWS architecture for a three-tier web application handling 10 000 daily active users. Specify: (1) presentation tier using CloudFront + S3, (2) application tier using EC2 or ECS behind an ALB, (3) data tier using RDS Multi-AZ. Produce an architecture diagram and a brief rationale for each choice.",
            constraints: ["All services must be within one AWS region","Multi-AZ must be used for the data tier","Diagram must show: VPC, subnets (public/private), ALB, EC2/ECS, RDS, CloudFront, S3","Each service choice must have a one-sentence justification"],
            expectedOutcomes: ["Three tiers clearly labelled in the diagram","Multi-AZ RDS shown","Public and private subnets shown","One-sentence justification per service"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Calculate the Total Cost of Ownership for a Cloud Migration",
            context: "Cloud migrations are often justified by cost savings, but they require a rigorous TCO analysis to validate. Cloud architects must be able to model costs accurately to support business cases.",
            missionBrief: "Using the AWS Pricing Calculator, model the monthly cost for: 5 × t3.medium EC2 instances, 2 × RDS db.t3.medium (Multi-AZ), 1 TB S3 Standard, and 10 TB CloudFront data transfer. Compare to the equivalent on-premises cost (use $5 000/server/year as the on-prem baseline). Calculate break-even in months.",
            constraints: ["Use AWS Pricing Calculator (calculator.aws)","On-premises baseline: $5 000/server/year","Calculate and state the monthly cloud cost and annual on-prem cost","State the break-even point in months"],
            expectedOutcomes: ["AWS monthly cost calculated and stated","On-premises annual cost calculated","Break-even month identified","Screenshot of the AWS Pricing Calculator included"],
            xp: 175, minutes: 50, level: 2,
          },
        ],
      },
      {
        name: "AWS Core Services",
        description: "Get hands-on with the most-used AWS services — the building blocks that appear in virtually every cloud architecture.",
        nodes: [
          {
            title: "Host a Static Website on S3 with a CloudFront Distribution",
            context: "Hosting static content on S3 backed by CloudFront is one of the most cost-effective and scalable architectures in AWS. It is used by thousands of companies for landing pages, documentation, and single-page applications.",
            missionBrief: "Create an S3 bucket with static website hosting enabled, upload an index.html and a CSS file, create a CloudFront distribution pointing to the S3 origin, and configure a custom error page for 404 errors. Verify the site loads via the CloudFront URL.",
            constraints: ["S3 bucket must NOT be public — use CloudFront OAC for access","Bucket name must include your initials","Custom 404 error page must be a separate 404.html","Verify with the CloudFront URL, not the S3 website URL"],
            expectedOutcomes: ["Site accessible via CloudFront URL","S3 bucket is not publicly accessible directly","Custom 404.html served for non-existent paths","CloudFront distribution shows 'Deployed' status"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Build and Test an AWS Lambda Function with API Gateway",
            context: "Lambda and API Gateway together form the core of serverless architectures. They let you run code without managing servers, scaling automatically to any load — a fundamental skill for modern cloud architects.",
            missionBrief: "Write a Python Lambda function that receives a name via a POST request body and returns 'Hello, {name}!' with a 200 status code. Expose it via API Gateway with a POST /greet endpoint. Test with curl. Set the Lambda timeout to 5 seconds and memory to 128 MB.",
            constraints: ["Function runtime: Python 3.11","Timeout: 5 seconds, Memory: 128 MB","API Gateway endpoint: POST /greet","Test with curl and document the exact command and output"],
            expectedOutcomes: ["curl POST returns 'Hello, {name}!' with 200 status","Lambda timeout set to 5 seconds","Memory set to 128 MB","curl test command and output documented"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Set Up IAM Roles and Policies Following Least Privilege",
            context: "IAM misconfigurations are the leading cause of AWS security breaches. Understanding how to grant only the permissions a service needs — and nothing more — is the most important security skill in AWS.",
            missionBrief: "Create an IAM role for a Lambda function that needs to: read from one specific S3 bucket, write to DynamoDB (one table only), and write CloudWatch logs. Create the policy using the JSON editor, not the visual editor, and verify the Lambda can perform each action but cannot access other S3 buckets.",
            constraints: ["Policy must use specific ARNs, not wildcards (arn:aws:s3:::my-bucket/*, not *)","Test that the Lambda cannot access a different S3 bucket","Use the principle of least privilege — no overly broad actions","Policy must be in JSON and included in submission"],
            expectedOutcomes: ["Lambda reads from the specified S3 bucket","Lambda writes to the specified DynamoDB table","Lambda cannot access other S3 buckets (AccessDenied)","Policy JSON uses specific ARNs without wildcards"],
            xp: 225, minutes: 65, level: 2,
          },
        ],
      },
      {
        name: "Cloud Networking",
        description: "Design secure, performant cloud networks — VPCs, subnets, peering, and DNS — that form the backbone of every cloud deployment.",
        nodes: [
          {
            title: "Design and Deploy a VPC with Public and Private Subnets",
            context: "A well-designed VPC is the foundation of cloud security. Separating public-facing and private resources into different subnets, with controlled traffic flow, prevents most common cloud breach scenarios.",
            missionBrief: "Create a VPC (10.0.0.0/16) with: two public subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs, two private subnets (10.0.3.0/24, 10.0.4.0/24) in different AZs, an Internet Gateway for public subnets, and a NAT Gateway for private subnet outbound access. Launch an EC2 in the private subnet and verify it can reach the internet through the NAT Gateway.",
            constraints: ["Use two AZs for high availability","NAT Gateway in a public subnet (not a NAT instance)","Private EC2 must not have a public IP","Verify internet access from private EC2 with curl ifconfig.me"],
            expectedOutcomes: ["VPC created with correct CIDR blocks","Internet Gateway attached to public subnets","NAT Gateway in public subnet","Private EC2 can reach internet (curl succeeds) but has no public IP"],
            xp: 250, minutes: 70, level: 2,
          },
          {
            title: "Configure VPC Peering Between Two VPCs",
            context: "VPC peering enables private communication between VPCs without traffic traversing the public internet — essential for multi-account architectures, microservices, and shared services patterns.",
            missionBrief: "Create two VPCs (10.0.0.0/16 and 10.1.0.0/16), establish a peering connection, update route tables in both VPCs, and verify that an EC2 in VPC-A can ping an EC2 in VPC-B by private IP. Document the route table entries required.",
            constraints: ["Non-overlapping CIDR blocks required","Security groups must allow ICMP (for ping test)","Route tables in both VPCs must be updated","Document the exact route entries added to each route table"],
            expectedOutcomes: ["Peering connection status is Active","EC2 in VPC-A can ping EC2 in VPC-B by private IP","Route table entries documented for both VPCs","Security groups allow ICMP"],
            xp: 225, minutes: 60, level: 2,
          },
          {
            title: "Set Up Route 53 with Health Checks and Failover Routing",
            context: "DNS-based failover is one of the simplest high-availability mechanisms available. Route 53 health checks detect unhealthy endpoints and automatically route traffic to healthy ones — a critical pattern for production systems.",
            missionBrief: "Register a subdomain in Route 53 and create two A records (primary and secondary) pointing to two EC2 instances with a failover routing policy. Configure health checks on both. Stop the primary instance and verify that DNS resolves to the secondary within 60 seconds.",
            constraints: ["Use Route 53 health checks, not just routing policies","Health check interval: 10 seconds","Stop (not terminate) the primary instance to test failover","Verify DNS resolution with dig or nslookup and document the output"],
            expectedOutcomes: ["Failover routing policy configured","Health checks on both A records","Stopping primary causes DNS to resolve to secondary within 60 seconds","dig output before and after failover documented"],
            xp: 250, minutes: 70, level: 3,
          },
        ],
      },
      {
        name: "Cloud Storage & Databases",
        description: "Choose and configure the right storage and database services for every use case — from object storage to relational, NoSQL, and caching layers.",
        nodes: [
          {
            title: "Design a Data Storage Strategy for Three Use Cases",
            context: "AWS offers over a dozen storage and database services. Knowing which to use for which use case is one of the most frequently tested cloud architect skills and has a direct impact on performance and cost.",
            missionBrief: "For each of three use cases — (1) user session data requiring sub-millisecond reads, (2) historical order records needing complex SQL queries, (3) media file storage for user-uploaded images — recommend the appropriate AWS service, justify your choice, and specify the key configuration settings.",
            constraints: ["One AWS service recommended per use case","Each recommendation must include: service name, justification, and two key config settings","Document must be structured as a table","No generic answers — config settings must be specific"],
            expectedOutcomes: ["Three use cases each have a specific service named","Each has a concise one-sentence justification","Two specific config settings per service","Table format used in document"],
            xp: 150, minutes: 40, level: 1,
          },
          {
            title: "Migrate a Local PostgreSQL Database to RDS",
            context: "Database migrations are a common and high-stakes task for cloud architects. Migrating from a local PostgreSQL instance to RDS with zero data loss requires careful planning and the right tools.",
            missionBrief: "Using pg_dump and pg_restore, migrate a local PostgreSQL database (minimum 5 tables, 1 000 rows) to an AWS RDS PostgreSQL instance. Verify row counts match before and after migration. Document the migration steps and the time taken.",
            constraints: ["RDS instance must be in a private subnet (not publicly accessible)","Use a bastion host or AWS Systems Manager for connectivity","Verify row counts for all 5 tables before and after","Document every command used in order"],
            expectedOutcomes: ["All 5 tables present in RDS with matching row counts","RDS is in a private subnet","pg_dump and pg_restore commands documented","Migration time recorded"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Implement a Caching Layer with ElastiCache Redis",
            context: "Caching with Redis reduces database load by orders of magnitude for read-heavy workloads. Implementing it correctly — with a sensible TTL and cache invalidation strategy — is a key skill for any cloud architect.",
            missionBrief: "Set up an ElastiCache Redis cluster in a private subnet. Modify a simple Python application that queries RDS to cache query results in Redis with a 5-minute TTL. Measure and document the response time with and without the cache using time.time().",
            constraints: ["ElastiCache cluster in a private subnet","TTL must be exactly 300 seconds (5 minutes)","Measure response time for the same query with and without cache","Cache miss must still return correct data from RDS"],
            expectedOutcomes: ["Redis cluster in private subnet","TTL set to 300 seconds","Response time with cache < 50% of response time without cache","Cache miss correctly falls back to RDS"],
            xp: 225, minutes: 65, level: 2,
          },
        ],
      },
      {
        name: "Cost Optimisation & FinOps",
        description: "Control and reduce cloud spending without sacrificing performance — a skill that directly impacts the bottom line of every organisation using the cloud.",
        nodes: [
          {
            title: "Analyse and Right-Size EC2 Instances with AWS Compute Optimiser",
            context: "Overprovisioned EC2 instances are one of the biggest sources of cloud waste. AWS Compute Optimiser uses machine learning to identify instances that can be downsized without impacting performance.",
            missionBrief: "Enable AWS Compute Optimiser for your account. After 24 hours, review the recommendations for at least three EC2 instances. For each, document: current instance type, recommended instance type, estimated savings, and whether you would apply the recommendation (with justification).",
            constraints: ["Compute Optimiser must be enabled (free tier is sufficient)","Document at least three instances","Estimated savings must come from Compute Optimiser, not calculated manually","Include a screenshot of the Compute Optimiser dashboard"],
            expectedOutcomes: ["Compute Optimiser enabled","Three instance recommendations documented","Estimated monthly savings noted for each","Apply/decline decision with justification for each"],
            xp: 150, minutes: 45, level: 1,
          },
          {
            title: "Set Up AWS Budgets and Cost Anomaly Detection",
            context: "Unexpected cloud bills are a leading cause of startup CFO nightmares. AWS Budgets and Cost Anomaly Detection catch overspending before it becomes a crisis — a must-have control for any cloud account.",
            missionBrief: "Create two AWS Budgets: (1) a monthly cost budget of $50 with alerts at 80% and 100%, (2) a service-level budget for EC2 at $20/month. Enable Cost Anomaly Detection with a $10 anomaly threshold. Document the alert configuration with screenshots.",
            constraints: ["Both budgets must have email alert actions","Cost Anomaly Detection alert threshold: $10","Alerts must go to a real email address","Screenshot each budget's configuration page"],
            expectedOutcomes: ["Two budgets created with correct thresholds","Alert actions configured for both budgets","Cost Anomaly Detection enabled with $10 threshold","Screenshots of both budgets and anomaly detection included"],
            xp: 150, minutes: 40, level: 1,
          },
          {
            title: "Calculate Savings from Reserved Instances vs On-Demand",
            context: "Reserved Instances can save up to 72% over On-Demand pricing for stable workloads. Understanding when and how to commit to reservations is a critical FinOps skill that cloud architects must advise on regularly.",
            missionBrief: "Using the AWS Pricing Calculator, compare the 1-year cost of three t3.large instances (Linux, us-east-1) across three payment options: On-Demand, 1-year Standard Reserved (All Upfront), and 1-year Convertible Reserved (No Upfront). Calculate break-even in months for each reserved option vs On-Demand. Produce a comparison table.",
            constraints: ["Use AWS Pricing Calculator for all prices","Same region and specs for all options","Calculate monthly equivalent cost for all three options","State break-even month for each reserved option"],
            expectedOutcomes: ["Three pricing options compared in a table","Monthly equivalent cost stated for each","Break-even month calculated for both reserved options","Recommendation made with one-sentence justification"],
            xp: 175, minutes: 50, level: 2,
          },
        ],
      },
    ],
  },

  {
    name: "Frontend Developer",
    districts: [
      {
        name: "HTML & CSS Mastery",
        description: "Build solid, semantic, and accessible web foundations — the craft that every great frontend developer has mastered before touching a framework.",
        nodes: [
          {
            title: "Build a Responsive Product Card Component",
            context: "Product cards are one of the most common UI components in e-commerce and SaaS applications. Building one from scratch with pure HTML and CSS reinforces flexbox, responsive design, and CSS specificity.",
            missionBrief: "Build an HTML/CSS product card with: product image, title, rating (star icons), price, and an 'Add to Cart' button. The card must be responsive — display at full width on mobile and 300px wide on desktop. Use CSS custom properties for colours and spacing.",
            constraints: ["No JavaScript","No CSS frameworks — pure CSS only","Use CSS custom properties (--variables) for all colours","Card must be responsive: full width on mobile (<768px), 300px on desktop"],
            expectedOutcomes: ["Card renders correctly at 375px and 1280px viewport widths","Star rating displayed with CSS (not images)","At least three CSS custom properties used","HTML is semantic (article, figure, button tags)"],
            xp: 125, minutes: 35, level: 1,
          },
          {
            title: "Create a CSS Grid Layout for a Blog Page",
            context: "CSS Grid is the most powerful layout tool available in CSS. Mastering it allows you to build complex, responsive layouts that were impossible just a decade ago — a skill that sets senior frontend developers apart.",
            missionBrief: "Build a blog page layout using CSS Grid with: a full-width header, a two-column main area (article + sidebar), and a three-column card grid below. The layout must collapse to a single column on mobile. Use grid-template-areas for the overall layout.",
            constraints: ["Use CSS Grid (not Flexbox) for the main layout","Use grid-template-areas for the overall page structure","Collapse to single column at 768px breakpoint","No JavaScript or CSS frameworks"],
            expectedOutcomes: ["grid-template-areas used for page layout","Two-column layout on desktop, single column on mobile","Three-column card grid present","Header spans full width"],
            xp: 150, minutes: 45, level: 1,
          },
          {
            title: "Audit and Fix Accessibility Issues on a Sample Page",
            context: "Accessibility affects 15% of the global population and is legally required in many jurisdictions. Learning to audit and fix accessibility issues makes your web work usable by everyone and protects organisations from legal risk.",
            missionBrief: "Take the provided sample HTML page (with deliberately introduced accessibility issues) and use the axe DevTools browser extension to identify all errors. Fix every error: add alt text, ensure sufficient colour contrast, add ARIA labels, and fix heading hierarchy. Run axe again and achieve zero violations.",
            constraints: ["Use axe DevTools (free browser extension) for auditing","Fix ALL violations — zero remaining after fixes","Colour contrast ratio must meet WCAG AA (4.5:1 for normal text)","Document each fix with a before/after code snippet"],
            expectedOutcomes: ["axe DevTools reports zero violations after fixes","All images have descriptive alt text","Heading hierarchy is correct (h1 → h2 → h3)","Colour contrast meets WCAG AA","Before/after snippets for each fix documented"],
            xp: 175, minutes: 50, level: 2,
          },
        ],
      },
      {
        name: "JavaScript Essentials",
        description: "Go beyond syntax — master async programming, the DOM, event handling, and the JavaScript patterns that power modern web applications.",
        nodes: [
          {
            title: "Fetch and Display Data from a Public API",
            context: "Fetching data from an API and rendering it in the DOM is the most fundamental JavaScript skill for frontend developers. It underlies every dynamic web application you will ever build.",
            missionBrief: "Using the GitHub Users API (https://api.github.com/users/{username}), build a page where a user can type a GitHub username, click 'Search', and see the user's avatar, name, bio, follower count, and public repo count. Show a loading state while fetching and an error message if the user is not found.",
            constraints: ["Use fetch() and async/await — no Axios or jQuery","Show a loading spinner or text while the request is in flight","Display a user-friendly error message for 404 responses","No frontend frameworks — vanilla JavaScript only"],
            expectedOutcomes: ["Correct user data displayed on success","Loading state shown during fetch","Error message shown for 404 (user not found)","Search works without page reload"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Build a Real-Time Search Filter with Debouncing",
            context: "Debouncing is a critical performance technique that prevents an event handler from firing on every keystroke. Without it, a search that calls an API on every keypress would hammer the server — debouncing is the professional solution.",
            missionBrief: "Build a list of 50 items (hardcoded or fetched from an API). Add a search input that filters the list as the user types, but with a 300ms debounce — the filter must NOT run on every keystroke. Show the number of matching results. Highlight matched text in yellow.",
            constraints: ["Debounce must be implemented from scratch — no lodash","Debounce delay: 300ms","Show result count: '12 of 50 results'","Highlight matched text with a <mark> tag or yellow background"],
            expectedOutcomes: ["List filters correctly after 300ms pause","Debounce prevents filtering on every keystroke (verifiable in Network tab)","Result count updated dynamically","Matched text highlighted in results"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Implement a Shopping Cart with localStorage Persistence",
            context: "localStorage allows web applications to persist data across page reloads without a server. Building a shopping cart with it teaches state management, serialisation, and the data-driven UI pattern.",
            missionBrief: "Build a simple product listing page with 6 products. Users can add/remove products to a cart, change quantities, and see the total price. The cart must persist in localStorage so it survives a page refresh. Show an item count badge on the cart icon.",
            constraints: ["Use localStorage for persistence — no backend","Cart must survive a full page reload","Item count badge on the cart icon must update immediately","Total price must update correctly when quantity changes"],
            expectedOutcomes: ["Cart persists after page reload","Add, remove, and quantity change all work correctly","Total price updates correctly","Item count badge reflects current cart size"],
            xp: 200, minutes: 60, level: 2,
          },
        ],
      },
      {
        name: "React & Component Design",
        description: "Build scalable UIs with React — mastering components, hooks, state management, and the patterns that underpin modern frontend applications.",
        nodes: [
          {
            title: "Build a Multi-Step Form with React",
            context: "Multi-step forms are common in registration flows, checkout processes, and onboarding. Building one in React teaches you how to manage complex state across components, validate individual steps, and provide good UX with a progress indicator.",
            missionBrief: "Build a three-step React form: Step 1 (Personal Info: name, email), Step 2 (Preferences: subscription type, notifications toggle), Step 3 (Review & Submit: summary of all inputs + submit button). Show a progress bar indicating current step. Validate each step before proceeding.",
            constraints: ["No form libraries (no Formik or React Hook Form)","Validate required fields before allowing Next","Show a progress bar (e.g. Step 2 of 3)","On submit, log all form data to console and show a success message"],
            expectedOutcomes: ["Three-step form works with correct navigation","Validation prevents moving to the next step with empty required fields","Progress bar shows current step","Submit logs all data and shows success message"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Create a Custom useFetch Hook and Use It in Three Components",
            context: "Custom hooks are one of the most powerful patterns in React — they let you extract and reuse stateful logic across multiple components. Building a useFetch hook is a canonical example used in nearly every React codebase.",
            missionBrief: "Build a useFetch(url) custom hook that returns { data, loading, error }. Use it in three different components that each fetch from different JSONPlaceholder endpoints (/posts, /users, /todos). Each component must handle all three states: loading spinner, error message, and successful data display.",
            constraints: ["useFetch must handle loading, error, and success states","Abort fetch on component unmount (use AbortController)","All three components use the same hook","Loading state shows a spinner or 'Loading...' text"],
            expectedOutcomes: ["useFetch returns correct data, loading, and error values","All three components work independently","Fetch aborted on unmount (no memory leak warning)","All three states handled in each component"],
            xp: 200, minutes: 55, level: 2,
          },
          {
            title: "Implement Global State Management with Context API",
            context: "Prop drilling — passing state through many component layers — is a common pain point in React apps. The Context API solves this elegantly for medium-complexity state like user authentication, themes, and shopping carts.",
            missionBrief: "Build a React app with a global AuthContext providing: user object, login(email) function, and logout() function. Three components at different nesting levels (Header, Profile page, Sidebar) must all read and respond to auth state. Login must persist to sessionStorage so a refresh doesn't log the user out.",
            constraints: ["Use React Context API only — no Redux or Zustand","Persist login state to sessionStorage","At least three components at different nesting depths must consume the context","Logout clears sessionStorage and resets context state"],
            expectedOutcomes: ["All three components reflect auth state correctly","Login persists after page refresh (sessionStorage)","Logout clears state and sessionStorage","No prop drilling — components access context directly"],
            xp: 225, minutes: 65, level: 2,
          },
        ],
      },
      {
        name: "Responsive & Accessible UX",
        description: "Design and build interfaces that work beautifully on every device and are accessible to every user — skills that separate good developers from great ones.",
        nodes: [
          {
            title: "Build a Fully Responsive Navigation with a Mobile Hamburger Menu",
            context: "Navigation is often the first component users interact with. A responsive nav that collapses to a hamburger menu on mobile is a required skill for any frontend developer and appears in virtually every project.",
            missionBrief: "Build a navigation bar with a logo, five links, and a CTA button. On mobile (<768px), collapse links into a hamburger menu that opens/closes with animation. Ensure the menu is keyboard navigable (Tab, Escape to close) and screen-reader accessible.",
            constraints: ["Hamburger uses a CSS transition — no JavaScript animation libraries","Menu closes when Escape is pressed","All links are keyboard-focusable in the correct order","aria-expanded attribute toggles correctly on the hamburger button"],
            expectedOutcomes: ["Nav collapses at 768px breakpoint","Hamburger menu opens and closes with animation","Escape key closes the menu","aria-expanded updates on toggle","Tab order is correct"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Implement Dark Mode with CSS Custom Properties",
            context: "Dark mode is now expected by users across every platform. Implementing it correctly with CSS custom properties and localStorage persistence teaches theming, CSS variables, and respecting user system preferences.",
            missionBrief: "Build a page with at least three distinct sections. Implement a dark/light mode toggle that: switches all colours using CSS custom properties, respects the user's system preference on first load (prefers-color-scheme), and persists the user's choice to localStorage.",
            constraints: ["All colours defined as CSS custom properties","Respect prefers-color-scheme media query for default theme","Persist user toggle to localStorage","Toggle must be a visible, labelled button (not just a sun/moon icon)"],
            expectedOutcomes: ["Dark and light modes both look polished","System preference respected on first visit","Choice persists after page reload","Toggle button visible and labelled"],
            xp: 150, minutes: 45, level: 1,
          },
          {
            title: "Build a Skip Navigation Link and Test with a Screen Reader",
            context: "Skip navigation links allow keyboard and screen reader users to bypass repeated navigation and jump directly to main content — a simple, high-impact accessibility feature required by WCAG 2.1.",
            missionBrief: "Add a visually-hidden skip navigation link at the very top of a page that becomes visible on focus and jumps to the main content area. Test it with NVDA (Windows) or VoiceOver (Mac) and document what the screen reader announces. Fix any issues discovered.",
            constraints: ["Link is visually hidden by default but appears on :focus","Must jump to a main content area with id='main-content'","Test with at least one screen reader (NVDA or VoiceOver)","Document the screen reader announcement verbatim"],
            expectedOutcomes: ["Skip link visible on keyboard focus","Link jumps to #main-content","Screen reader announces the link correctly","Test documentation includes verbatim screen reader output"],
            xp: 150, minutes: 40, level: 1,
          },
        ],
      },
      {
        name: "Web Performance Optimisation",
        description: "Make websites load faster and feel more responsive — every 100ms improvement directly impacts user retention and conversion rates.",
        nodes: [
          {
            title: "Achieve a Lighthouse Score Above 90 on All Categories",
            context: "Google Lighthouse measures performance, accessibility, best practices, and SEO. A score above 90 on all categories is the industry benchmark for production-ready web pages and directly impacts search rankings.",
            missionBrief: "Take a provided sample webpage with a poor Lighthouse score and optimise it to score above 90 on Performance, Accessibility, Best Practices, and SEO. Document every change made and re-run Lighthouse to confirm the improvement.",
            constraints: ["Test in Chrome DevTools Lighthouse, not PageSpeed Insights","Document before and after scores for all four categories","Each change must be explained in one sentence","No CSS frameworks — optimisations must be in the existing code"],
            expectedOutcomes: ["All four Lighthouse categories score 90+","Before and after scores documented","Every change explained in one sentence","Lighthouse report screenshot included"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Lazy Load Images and Measure the Impact",
            context: "Lazy loading defers loading off-screen images until the user scrolls to them, reducing initial page load time significantly. It is a simple, high-impact optimisation now supported natively in all modern browsers.",
            missionBrief: "Build a page with 30 images (use Lorem Picsum for placeholder images). Implement native lazy loading with loading='lazy'. Use Chrome DevTools Network tab to measure: number of images loaded on initial page load and after scrolling to the bottom. Document the reduction in initial requests.",
            constraints: ["Use loading='lazy' on all images below the fold","Use Chrome DevTools to measure requests","Include 30 images using Lorem Picsum (picsum.photos)","Document before and after: initial request count and total bytes transferred"],
            expectedOutcomes: ["Only images in/near viewport load on initial page load","Additional images load as user scrolls","Initial request count reduced by at least 50% vs eager loading","Bytes transferred on load reduced and documented"],
            xp: 150, minutes: 40, level: 1,
          },
          {
            title: "Implement Code Splitting in a React App with React.lazy",
            context: "Code splitting divides your JavaScript bundle into smaller chunks that are loaded on demand, dramatically reducing the initial bundle size. It is a standard technique used in every large React application.",
            missionBrief: "In a React app with at least four routes, implement React.lazy and Suspense to code-split each route. Compare the initial bundle size before and after using the Vite or Webpack bundle analyser. Achieve a reduction of at least 30% in the initial bundle size.",
            constraints: ["Use React.lazy and Suspense — not third-party libraries","Analyse bundle with source-map-explorer or vite-bundle-visualizer","Document initial bundle size before and after","Suspense fallback must show a loading indicator"],
            expectedOutcomes: ["Each route loaded as a separate chunk","Initial bundle size reduced by at least 30%","Bundle analyser screenshot before and after","Suspense fallback visible during chunk loading"],
            xp: 200, minutes: 55, level: 2,
          },
        ],
      },
    ],
  },

  {
    name: "Backend Developer",
    districts: [
      {
        name: "REST API Design",
        description: "Design and build clean, standards-compliant REST APIs that are intuitive to consume, easy to version, and a pleasure to maintain.",
        nodes: [
          {
            title: "Build a CRUD REST API for a Todo App",
            context: "A CRUD REST API is the first building block of backend development. Building one for a Todo app forces you to make all the key decisions: routing, request validation, error handling, and HTTP status codes.",
            missionBrief: "Build a REST API with Express.js (or FastAPI/Django REST Framework) implementing: GET /todos, GET /todos/:id, POST /todos, PUT /todos/:id, DELETE /todos/:id. Store data in memory (array). Return appropriate HTTP status codes for all responses. Validate that every todo has a non-empty title.",
            constraints: ["No database required — use an in-memory array","Return 201 for successful POST, 404 for missing resource, 400 for invalid input","Validate title is non-empty string on POST and PUT","Include a Content-Type: application/json header on all responses"],
            expectedOutcomes: ["All five endpoints work correctly","404 returned for missing todo IDs","400 returned for empty title","201 returned on successful creation","All responses have Content-Type: application/json"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Document an API with OpenAPI (Swagger)",
            context: "API documentation is as important as the API itself. OpenAPI (Swagger) is the industry standard for REST API documentation — it is machine-readable, can generate client SDKs, and enables contract-first development.",
            missionBrief: "Write an OpenAPI 3.0 YAML specification for a User Management API with endpoints for: list users, get user by ID, create user, and delete user. Include request/response schemas, example values, and error responses for 400, 404, and 500. Render it in Swagger UI.",
            constraints: ["OpenAPI 3.0 format (YAML)","All endpoints must have request and response schemas","Include example values for each schema field","Render with Swagger UI (use swagger-ui-express or SwaggerHub)"],
            expectedOutcomes: ["YAML spec valid and renders in Swagger UI","All four endpoints documented","Request and response schemas for all endpoints","Error responses for 400, 404, and 500 included","Example values in all schemas"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Implement API Rate Limiting and Versioning",
            context: "Rate limiting protects your API from abuse and ensures fair usage. Versioning lets you evolve the API without breaking existing clients. Both are required in production APIs and are questions commonly asked in backend interviews.",
            missionBrief: "Add rate limiting (100 requests per 15 minutes per IP) and two API versions (v1 and v2) to an existing Express.js API. v2 must return one additional field in its responses compared to v1. Test that rate limiting works by making 101 requests in 15 minutes and verifying the 429 response.",
            constraints: ["Use express-rate-limit for rate limiting","Rate limit: 100 requests per 15-minute window per IP","Version endpoints as /api/v1/... and /api/v2/...","v2 response must include at least one additional field not in v1"],
            expectedOutcomes: ["101st request returns HTTP 429 Too Many Requests","v1 and v2 endpoints return different response schemas","Rate limit headers present in responses (X-RateLimit-Remaining)","v2 additional field documented"],
            xp: 200, minutes: 55, level: 2,
          },
        ],
      },
      {
        name: "Database Design & SQL",
        description: "Design databases that are fast, consistent, and easy to evolve — skills that directly affect every user interaction with a data-driven application.",
        nodes: [
          {
            title: "Normalise a Flat Table to Third Normal Form",
            context: "Database normalisation eliminates redundancy and ensures data integrity. Taking a flat, denormalised table to 3NF is a fundamental skill for any backend developer working with relational databases.",
            missionBrief: "Given a flat 'orders' table with 12 columns containing data about orders, customers, and products (all in one table), normalise it to 3NF: identify and eliminate partial dependencies, transitive dependencies, and create properly separated tables with foreign keys. Produce the normalised schema as SQL DDL.",
            constraints: ["Start from the provided flat orders table","Identify all functional dependencies first","Each normal form step must be documented","Final DDL must run without errors in PostgreSQL"],
            expectedOutcomes: ["Three or more normalised tables produced","All functional dependencies documented","Each NF step documented (1NF, 2NF, 3NF)","DDL runs in PostgreSQL without errors"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Write and Optimise a Complex JOIN Query",
            context: "JOINs are the most important concept in relational databases. Writing efficient multi-table JOINs and understanding their execution plans is a skill that separates junior and senior backend developers.",
            missionBrief: "Using the Northwind database, write a query that returns: customer name, total orders, total revenue, and most recently ordered product for each customer. Use at least three JOINs. Run EXPLAIN ANALYZE, identify the slowest step, add an appropriate index, and re-run to show the improvement.",
            constraints: ["Query must use at least three JOINs","Use EXPLAIN ANALYZE in PostgreSQL","Add at least one index based on the query plan","Document before and after execution times"],
            expectedOutcomes: ["Query returns correct results with three or more JOINs","EXPLAIN ANALYZE output documented","At least one index added","Execution time improved after adding index"],
            xp: 225, minutes: 65, level: 3,
          },
          {
            title: "Implement Database Migrations with a Migration Tool",
            context: "Database migrations allow schema changes to be versioned, reviewed, and applied consistently across environments. Every production backend uses a migration tool — managing schema changes manually leads to inconsistencies and outages.",
            missionBrief: "Set up Flyway or Liquibase (or Prisma Migrate/Drizzle for Node.js). Create three migrations: (1) create a users table, (2) add an email column, (3) add an index on email. Apply them in order. Write a rollback for migration 3. Verify the schema in the database after each migration.",
            constraints: ["Use a proper migration tool (not raw SQL files executed manually)","Three migrations applied in order","Rollback script for migration 3 included","Verify schema after each migration using \\d (psql) or equivalent"],
            expectedOutcomes: ["Three migrations applied in correct order","Schema matches expected structure after each migration","Rollback for migration 3 removes the index","Migration history table shows all three applied migrations"],
            xp: 200, minutes: 55, level: 2,
          },
        ],
      },
      {
        name: "Authentication & Security",
        description: "Build secure authentication and authorisation systems that protect your users' data and prevent the most common backend security vulnerabilities.",
        nodes: [
          {
            title: "Implement JWT Authentication with Refresh Tokens",
            context: "JWT authentication is the standard pattern for stateless API security. Understanding access tokens, refresh tokens, and token expiry is mandatory for any backend developer building multi-client applications.",
            missionBrief: "Build a Node.js API with: POST /auth/register, POST /auth/login (returns access token + refresh token), GET /me (protected route), and POST /auth/refresh (exchanges refresh token for new access token). Access tokens expire in 15 minutes; refresh tokens expire in 7 days.",
            constraints: ["Use jsonwebtoken library","Access token lifetime: 15 minutes","Refresh token lifetime: 7 days","Store refresh tokens in the database (not in-memory) to support revocation"],
            expectedOutcomes: ["Register and login return access and refresh tokens","GET /me returns user data with valid token, 401 without","Refresh endpoint returns new access token","Expired tokens return 401 with clear error message"],
            xp: 250, minutes: 75, level: 3,
          },
          {
            title: "Secure an API Against the OWASP Top 10",
            context: "The OWASP Top 10 represents the most critical web application security risks. Implementing the key defences against them is a non-negotiable baseline for any backend system handling user data.",
            missionBrief: "Audit an existing Express.js API and implement fixes for at least five OWASP Top 10 risks: injection (parameterised queries), broken auth (bcrypt + JWT), security misconfiguration (helmet.js), excessive data exposure (response filtering), and insufficient logging. Document each fix.",
            constraints: ["Use helmet.js for security headers","Use bcrypt for password hashing (minimum 10 rounds)","Use parameterised queries for all database operations","Log all auth attempts (success and failure) with timestamps"],
            expectedOutcomes: ["helmet.js applied with sensible defaults","Passwords hashed with bcrypt (10+ rounds)","Parameterised queries used throughout","Auth attempts logged with timestamp and outcome","Response objects filtered to remove sensitive fields"],
            xp: 250, minutes: 75, level: 3,
          },
          {
            title: "Implement Role-Based Access Control",
            context: "RBAC is the standard pattern for authorisation in multi-user systems — from content management to enterprise SaaS. Implementing it correctly prevents privilege escalation and data leakage between users.",
            missionBrief: "Extend a JWT API to support three roles: Admin, Editor, Viewer. Protect routes so that: Admin can access all endpoints, Editor can create and update but not delete, Viewer can only read. Write tests confirming that each role is correctly allowed or denied for each action.",
            constraints: ["Role stored in the JWT payload","Middleware must check role before controller logic runs","Tests must verify both allowed and denied cases for all three roles","Return 403 Forbidden (not 401) for insufficient permissions"],
            expectedOutcomes: ["Three roles implemented and enforced","Admin, Editor, and Viewer each have correct access","403 returned for insufficient permissions (not 401)","Tests confirm allowed and denied cases for all roles"],
            xp: 225, minutes: 65, level: 2,
          },
        ],
      },
      {
        name: "Caching & Performance",
        description: "Make your backend dramatically faster by caching strategically, optimising database queries, and profiling bottlenecks before they reach production.",
        nodes: [
          {
            title: "Add Redis Caching to an Express API Endpoint",
            context: "Caching expensive API responses in Redis can reduce response times from hundreds of milliseconds to under 10ms. It is a standard performance optimisation used in every high-traffic backend system.",
            missionBrief: "Add Redis caching to an endpoint that fetches data from a database (simulate with a 500ms artificial delay). Cache the response for 60 seconds. Measure response time with and without cache using curl's time flag. Add a Cache-Control header to the response.",
            constraints: ["Use ioredis or node-redis","Cache TTL: 60 seconds","Simulate DB delay with setTimeout(500ms)","Measure with curl -w '%{time_total}' and document both times"],
            expectedOutcomes: ["First request takes ~500ms (cache miss)","Subsequent requests within 60s take under 50ms (cache hit)","Cache-Control header present in response","Both response times documented"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Profile a Node.js API and Fix a Performance Bottleneck",
            context: "Performance profiling identifies the exact code path causing slowness — an essential skill when your API is slow in production and you need to fix it in hours, not days.",
            missionBrief: "Use Node.js's built-in --prof flag or clinic.js to profile an Express API endpoint under load (use autocannon or artillery for 100 req/s for 10 seconds). Identify the slowest function call in the flamegraph. Optimise it and re-run the load test to confirm the improvement.",
            constraints: ["Profile with --prof or clinic.js (both are free)","Load test with autocannon or artillery","Document the hotspot function identified in the flamegraph","Re-run load test and show improved req/s or latency"],
            expectedOutcomes: ["Profiling run completed and flamegraph/report produced","Hotspot function identified","Optimisation applied","Re-run shows measurable improvement in throughput or latency"],
            xp: 225, minutes: 65, level: 3,
          },
          {
            title: "Implement Database Connection Pooling",
            context: "Opening a new database connection for every request is expensive and limits scalability. Connection pooling maintains a pool of reusable connections — a configuration setting that can increase throughput by 10×.",
            missionBrief: "Configure pg-pool (Node.js) or SQLAlchemy's connection pool (Python) with: max 10 connections, idle timeout 30 seconds, and connection timeout 5 seconds. Load test the API with and without pooling using autocannon. Document the throughput difference.",
            constraints: ["Pool config: max=10, idleTimeout=30s, connectionTimeout=5s","Load test: 100 concurrent connections for 10 seconds","Document req/s with and without pooling","Log pool events: connect, acquire, remove"],
            expectedOutcomes: ["Pool configured with correct settings","Load test results documented for both configurations","Throughput higher with pooling","Pool events logged"],
            xp: 175, minutes: 50, level: 2,
          },
        ],
      },
      {
        name: "Microservices & Messaging",
        description: "Break monoliths into scalable, independently deployable services and connect them with message queues for resilient, asynchronous communication.",
        nodes: [
          {
            title: "Extract a User Service from a Monolith",
            context: "Microservice extraction is the most common architectural task in growing tech companies. Extracting the user service first is the canonical starting point — it is well-bounded and has clear APIs that other services consume.",
            missionBrief: "Given a monolithic Express app with users, orders, and products in one codebase, extract the user-related routes, controller, and database table into a separate User Service running on its own port. The Orders Service must communicate with the User Service via HTTP (not by importing its code). Document the API contract between them.",
            constraints: ["User Service runs on a different port to the main app","Inter-service communication via HTTP — no shared code","API contract documented as OpenAPI YAML","Both services must start independently"],
            expectedOutcomes: ["User Service runs independently on its own port","Orders Service fetches user data via HTTP","Both services start and function independently","OpenAPI contract documented"],
            xp: 250, minutes: 75, level: 3,
          },
          {
            title: "Send and Consume Messages with RabbitMQ",
            context: "Message queues decouple services and enable asynchronous processing — essential for tasks like sending emails, processing payments, and handling file uploads without blocking the main request cycle.",
            missionBrief: "Set up RabbitMQ with Docker. Build a producer service that publishes an order.created event to a queue when a POST /orders endpoint is called. Build a consumer service that listens to the queue and logs 'Processing order {id}' with a simulated 2-second delay. Verify messages are not lost if the consumer is offline.",
            constraints: ["RabbitMQ running in Docker","Producer publishes to a durable queue (survives RabbitMQ restart)","Consumer acknowledges (ack) messages only after processing","Test: stop consumer, send 5 orders, start consumer — all 5 must be processed"],
            expectedOutcomes: ["Producer publishes to RabbitMQ on POST /orders","Consumer logs processing message for each order","5 orders queued while consumer is offline are processed when it restarts","Queue is durable (persists through RabbitMQ restart)"],
            xp: 250, minutes: 75, level: 3,
          },
          {
            title: "Implement a Circuit Breaker for Inter-Service Calls",
            context: "When a downstream service is slow or failing, requests pile up and can cascade into a full outage. A circuit breaker detects failures and short-circuits calls to the failing service, protecting the overall system.",
            missionBrief: "Using opossum (Node.js) or a similar circuit breaker library, wrap an HTTP call to a downstream service. Simulate failures by making the downstream service return errors. Verify that after 5 failures within 10 seconds, the circuit opens and subsequent calls fail fast with a fallback response. Document the open, half-open, and closed states.",
            constraints: ["Use opossum (Node.js) or pybreaker (Python)","Circuit opens after 5 failures in 10 seconds","Fallback response must be a graceful degradation message","Document all three circuit states with console.log output"],
            expectedOutcomes: ["Circuit opens after 5 failures","Calls fail fast when circuit is open","Fallback response returned while circuit is open","All three states (closed, open, half-open) logged"],
            xp: 225, minutes: 65, level: 3,
          },
        ],
      },
    ],
  },

  {
    name: "Machine Learning Engineer",
    districts: [
      {
        name: "Python for ML",
        description: "Build the Python foundation that every machine learning engineer uses daily: NumPy, pandas, efficient code patterns, and reproducible environments.",
        nodes: [
          {
            title: "Vectorise a Data Processing Loop with NumPy",
            context: "NumPy vectorisation replaces slow Python loops with fast, C-optimised array operations. The performance difference is often 100×. Every ML engineer must be able to identify and vectorise bottlenecks.",
            missionBrief: "Write a Python function that normalises a 1 million-element array (subtract mean, divide by std) using (1) a plain for loop and (2) NumPy vectorisation. Measure execution time for both using timeit. The NumPy version must be at least 50× faster.",
            constraints: ["Array size: 1 000 000 elements","Use timeit with 3 repetitions for fair comparison","Both implementations must produce identical results (verify with np.allclose)","Document the speedup ratio"],
            expectedOutcomes: ["Both implementations produce identical results","NumPy version is at least 50× faster","timeit results printed for both","Speedup ratio documented in output"],
            xp: 150, minutes: 40, level: 1,
          },
          {
            title: "Set Up a Reproducible ML Environment with Docker",
            context: "Reproducibility is the most important requirement in ML engineering. A Dockerised environment ensures that every team member gets identical results regardless of their operating system or installed packages.",
            missionBrief: "Write a Dockerfile that installs: Python 3.11, numpy, pandas, scikit-learn, matplotlib, and jupyter. Run a Jupyter notebook server inside the container, accessible at localhost:8888. Verify a sample notebook runs end-to-end inside the container and produces a PNG chart.",
            constraints: ["Base image: python:3.11-slim","Pin all package versions in requirements.txt","Jupyter accessible at port 8888 from the host","Sample notebook runs without errors and saves a PNG"],
            expectedOutcomes: ["docker build completes without errors","Jupyter accessible at localhost:8888","Sample notebook produces a PNG chart","All package versions pinned in requirements.txt"],
            xp: 175, minutes: 50, level: 2,
          },
          {
            title: "Build a Data Pipeline with pandas and Validate with Great Expectations",
            context: "Production ML pipelines need data validation to catch bad data before it silently corrupts model training. Great Expectations is the industry standard for defining and testing data quality rules.",
            missionBrief: "Build a pandas data pipeline that reads a CSV, applies three transformations (drop nulls, cap outliers at the 99th percentile, normalise a numeric column), and outputs a clean CSV. Add Great Expectations checks: no nulls in key columns, all values in range [0,1] after normalisation, row count not less than 90% of input.",
            constraints: ["Three transformations applied in order","Three Great Expectations checks","Run ge.checkpoint.run() and produce an HTML report","Pipeline must handle a file with up to 10% corrupt rows"],
            expectedOutcomes: ["Three transformations applied in correct order","Three GE checks pass on clean output","HTML validation report generated","Pipeline handles 10% corrupt rows without crashing"],
            xp: 200, minutes: 60, level: 2,
          },
        ],
      },
      {
        name: "Supervised Learning",
        description: "Master the algorithms that power most real-world ML products: from linear models to ensembles, and how to evaluate them honestly.",
        nodes: [
          {
            title: "Build an End-to-End Classification Pipeline with scikit-learn",
            context: "End-to-end ML pipelines — from raw data to trained model — are the unit of work in production ML. Building one with scikit-learn's Pipeline class ensures preprocessing and modelling steps can't be applied out of order.",
            missionBrief: "Build a scikit-learn Pipeline that processes the Titanic dataset: impute missing values, encode categorical features, scale numerics, and train a Random Forest. Evaluate with 5-fold stratified cross-validation, reporting accuracy, ROC-AUC, and F1 for each fold. Achieve a mean accuracy above 78%.",
            constraints: ["Use sklearn.pipeline.Pipeline for all steps","5-fold stratified cross-validation (StratifiedKFold)","Report accuracy, ROC-AUC, and F1 for each fold","All preprocessing inside the pipeline (no data leakage)"],
            expectedOutcomes: ["Pipeline built with imputer, encoder, scaler, and classifier","Mean accuracy above 78%","AUC and F1 reported per fold","No preprocessing applied before the pipeline (no leakage)"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Tune Hyperparameters with Optuna",
            context: "Hyperparameter tuning is where most of the performance gains beyond a baseline model come from. Optuna is a modern, efficient tuning framework that uses Bayesian optimisation to find good hyperparameters in fewer trials than grid search.",
            missionBrief: "Use Optuna to tune a gradient boosting classifier (XGBoost or LightGBM) on the Titanic dataset. Tune at least four hyperparameters (n_estimators, max_depth, learning_rate, subsample) over 50 trials. Plot the optimisation history and parameter importance. Compare best Optuna result vs default parameters.",
            constraints: ["Optuna study with 50 trials","At least four hyperparameters tuned","Plot: optimization_history_plot and param_importances_plot","Report accuracy improvement over default parameters"],
            expectedOutcomes: ["50-trial Optuna study completed","4+ hyperparameters tuned","Both plots generated and saved","Accuracy improvement over defaults documented"],
            xp: 225, minutes: 65, level: 3,
          },
          {
            title: "Handle Class Imbalance with SMOTE and Compare Strategies",
            context: "Class imbalance — where one class has far fewer samples than another — causes models to ignore the minority class entirely. Fraud detection, disease diagnosis, and churn prediction all face this problem.",
            missionBrief: "Using the credit card fraud dataset from Kaggle, train a Logistic Regression with: (1) no treatment, (2) class_weight='balanced', (3) SMOTE oversampling. For each, report precision, recall, F1, and ROC-AUC for the minority class. Conclude which strategy you would recommend and why.",
            constraints: ["Use imblearn's SMOTE","Apply SMOTE only to the training set (never the test set)","Report minority-class metrics for all three strategies","Recommendation with one-paragraph justification"],
            expectedOutcomes: ["Three strategies compared on same train/test split","SMOTE applied only to training data","Minority-class metrics reported for all three","Written recommendation with metric citations"],
            xp: 225, minutes: 65, level: 2,
          },
        ],
      },
      {
        name: "Neural Networks & Deep Learning",
        description: "Build and train neural networks that power image recognition, NLP, and the most advanced AI applications in production today.",
        nodes: [
          {
            title: "Train a CNN to Classify Handwritten Digits (MNIST)",
            context: "The MNIST handwritten digit dataset is the 'Hello World' of deep learning. Training a Convolutional Neural Network on it teaches the full deep learning workflow: data loading, model architecture, training loop, and evaluation.",
            missionBrief: "Build and train a CNN in PyTorch or Keras on MNIST. Architecture: two conv layers (32 and 64 filters), max pooling, dropout (0.25), and two dense layers. Train for 5 epochs. Achieve at least 99% accuracy on the test set. Plot training and validation loss curves.",
            constraints: ["Architecture must include: 2 conv layers, max pooling, dropout, 2 dense layers","Train for exactly 5 epochs","Target: ≥99% test accuracy","Plot training and validation loss curves and save as PNG"],
            expectedOutcomes: ["CNN achieves ≥99% accuracy on test set","Training completes in 5 epochs","Loss curves saved as PNG","Architecture matches the specified structure"],
            xp: 225, minutes: 70, level: 2,
          },
          {
            title: "Fine-Tune a Pre-Trained BERT Model for Sentiment Analysis",
            context: "Fine-tuning pre-trained language models is the standard approach for NLP tasks in industry — it achieves state-of-the-art results with far less data and compute than training from scratch.",
            missionBrief: "Fine-tune distilbert-base-uncased on the IMDb sentiment dataset (Hugging Face datasets) for 3 epochs. Evaluate accuracy and F1 on the test set. Achieve at least 92% accuracy. Save the fine-tuned model and write an inference function that takes a text string and returns 'Positive' or 'Negative'.",
            constraints: ["Use Hugging Face transformers and datasets libraries","Fine-tune for 3 epochs","Target: ≥92% test accuracy","Save fine-tuned model and write an inference function"],
            expectedOutcomes: ["Fine-tuned model achieves ≥92% test accuracy","F1 score reported","Model saved to disk","Inference function returns 'Positive' or 'Negative' for input text"],
            xp: 300, minutes: 90, level: 3,
          },
          {
            title: "Detect Overfitting in a Deep Network and Apply Regularisation",
            context: "Overfitting is the most common failure mode in deep learning. Recognising it from training curves and knowing which regularisation techniques to apply — dropout, weight decay, data augmentation — is essential for production models.",
            missionBrief: "Train a deliberately overfit neural network on a small dataset (100 samples from CIFAR-10). Plot training vs validation accuracy. Then apply two regularisation techniques (dropout and L2 weight decay). Plot the before and after learning curves side by side. Report the validation accuracy improvement.",
            constraints: ["Deliberately overfit first (no regularisation)","Apply dropout (0.5) and L2 weight decay (0.001)","Use the same 100 training samples for both runs","Side-by-side plot saved as PNG"],
            expectedOutcomes: ["Overfit model shows large gap between train and val accuracy","Regularised model shows reduced gap","Side-by-side plot clearly shows the improvement","Validation accuracy improvement stated numerically"],
            xp: 225, minutes: 65, level: 2,
          },
        ],
      },
      {
        name: "Model Evaluation & Tuning",
        description: "Go beyond accuracy — learn the evaluation metrics and debugging techniques that separate reliable production models from misleading prototypes.",
        nodes: [
          {
            title: "Diagnose a Model with SHAP Explainability",
            context: "Black-box models are increasingly unacceptable in regulated industries. SHAP (SHapley Additive exPlanations) provides consistent, theoretically grounded explanations for any model's predictions — a skill increasingly required in finance, healthcare, and HR.",
            missionBrief: "Train a Random Forest on the Titanic dataset. Use SHAP to produce: (1) a summary bar plot of global feature importance, (2) a beeswarm plot showing feature impact direction, (3) a waterfall plot explaining one specific prediction. Write a 3-sentence interpretation of the results.",
            constraints: ["Use shap library","Train on 80% of data, explain predictions on 20%","Three SHAP plots required","3-sentence interpretation in plain English"],
            expectedOutcomes: ["Three SHAP plots generated and saved","Global feature importance identified","One individual prediction explained","Interpretation in plain English without technical jargon"],
            xp: 200, minutes: 60, level: 2,
          },
          {
            title: "Run Cross-Validation and Produce a Calibration Curve",
            context: "A well-calibrated model that says '70% probability' is correct 70% of the time is far more trustworthy for decision-making than an uncalibrated model. Calibration is critical for medical diagnosis, credit scoring, and fraud detection.",
            missionBrief: "Train a Logistic Regression and a Random Forest on a binary classification dataset. Plot calibration curves for both. If poorly calibrated, apply CalibratedClassifierCV (isotonic regression). Report the Brier score before and after calibration for the model that benefits most.",
            constraints: ["Use sklearn.calibration.CalibrationDisplay","Plot both uncalibrated and calibrated curves on the same figure","Apply CalibratedClassifierCV with method='isotonic'","Report Brier score before and after calibration"],
            expectedOutcomes: ["Calibration curves for both models plotted","CalibratedClassifierCV applied to the worse-calibrated model","Brier score before and after calibration reported","Improvement in Brier score documented"],
            xp: 200, minutes: 60, level: 2,
          },
          {
            title: "Detect Data Drift Between Training and Production Data",
            context: "Model performance degrades when the distribution of production data shifts away from training data. Data drift detection is a critical ML operations skill for maintaining model quality over time.",
            missionBrief: "Using the Evidently library, compare two datasets: a 'training' dataset and a 'production' dataset (modify 20% of values to simulate drift). Generate a data drift report and identify which features have drifted. Set an alert threshold of p-value < 0.05. Export the report as HTML.",
            constraints: ["Use Evidently for drift detection","Simulate drift by modifying 20% of values in the production dataset","Drift threshold: p-value < 0.05","Export report as HTML"],
            expectedOutcomes: ["Evidently drift report generated","Drifted features correctly identified","p-value < 0.05 threshold applied","HTML report exported and viewable in browser"],
            xp: 200, minutes: 55, level: 2,
          },
        ],
      },
      {
        name: "Model Deployment & MLOps",
        description: "Take models from notebooks into production — serving predictions reliably, monitoring for drift, and automating the ML lifecycle.",
        nodes: [
          {
            title: "Serve a scikit-learn Model as a REST API with FastAPI",
            context: "A model that only exists in a Jupyter notebook creates zero business value. Wrapping it in a REST API is the first step to production, and FastAPI is the fastest and most developer-friendly way to do it in Python.",
            missionBrief: "Train a simple sklearn model and save it with joblib. Create a FastAPI app with a POST /predict endpoint that accepts a JSON body matching the model's input schema and returns a prediction. Validate inputs with Pydantic. Containerise with Docker and test with curl.",
            constraints: ["Save model with joblib","Input validation with Pydantic models","POST /predict returns {prediction: value, probability: float}","Dockerfile runs the FastAPI app on port 8000"],
            expectedOutcomes: ["POST /predict returns correct predictions","Invalid input returns 422 with validation error","Model loaded once at startup (not per request)","Docker container serves predictions on port 8000"],
            xp: 200, minutes: 60, level: 2,
          },
          {
            title: "Track Experiments with MLflow",
            context: "Without experiment tracking, ML development becomes chaotic — you can't remember which hyperparameters produced which results, can't reproduce experiments, and can't compare approaches systematically. MLflow is the industry standard solution.",
            missionBrief: "Run five training experiments on the same dataset with different hyperparameter combinations. Log each experiment in MLflow: parameters, metrics (accuracy, F1, training time), and the trained model artifact. Use the MLflow UI to compare all five experiments and identify the best model. Register the best model in the MLflow Model Registry.",
            constraints: ["Five distinct hyperparameter combinations","Log: params, metrics (accuracy, F1, training_time_s), and model artifact","Use MLflow Model Registry to register the best model","Document the winning hyperparameters"],
            expectedOutcomes: ["Five experiments logged in MLflow","Each experiment has params, metrics, and model artifact","Best model registered in Model Registry","Winning hyperparameters documented"],
            xp: 225, minutes: 65, level: 2,
          },
          {
            title: "Build a CI/CD Pipeline for an ML Model",
            context: "ML CI/CD automates the cycle of training, testing, and deploying models — preventing untested models from reaching production and enabling teams to ship improvements confidently and frequently.",
            missionBrief: "Build a GitHub Actions pipeline that: (1) trains the model on every push to main, (2) runs model tests (accuracy > threshold, input/output schema validation), (3) builds a Docker image and pushes to Docker Hub if tests pass, and (4) fails with a clear error if model accuracy drops below 80%.",
            constraints: ["Pipeline runs on every push to main","Model accuracy threshold: 80%","Docker image pushed to Docker Hub only if tests pass","Pipeline fails with a descriptive error if accuracy is below threshold"],
            expectedOutcomes: ["Pipeline runs end-to-end on push to main","Accuracy check fails the pipeline if below 80%","Docker image pushed only after tests pass","Error message describes the accuracy failure clearly"],
            xp: 275, minutes: 80, level: 3,
          },
        ],
      },
    ],
  },
];

/* ── main ─────────────────────────────────────────────────────────────────── */
async function main() {
  console.log("=".repeat(60));
  console.log(" Brainepedia Tech & IT Content Seeder");
  console.log("=".repeat(60));

  /* 1. Login */
  log("\n[1/4] Authenticating...");
  const loginRes = await post("/api/Account/auth_login", { email: EMAIL, password: PASSWORD });
  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, JSON.stringify(loginRes.data));
    process.exit(1);
  }
  const d = loginRes.data;
  const token = d?.token || d?.Token || d?.accessToken
    || d?.userProfile?.token || d?.userProfile?.Token
    || d?.data?.token || d?.data?.accessToken;
  const userId = d?.userId || d?.UserId
    || d?.userProfile?.userId || d?.userProfile?.UserId
    || d?.data?.userId || d?.data?.UserId
    || String(d?.id || d?.Id || "");
  if (!token) { console.error("No token in response:", JSON.stringify(d)); process.exit(1); }
  log(`    ✓ Logged in. userId=${userId}`, true);

  /* 2. Fetch difficulties */
  log("\n[2/4] Fetching difficulty levels...");
  const diffRes = await get("/api/Difficulties", token);
  const diffArr = Array.isArray(diffRes.data) ? diffRes.data : diffRes.data?.data || diffRes.data?.difficulties || [];
  const difficulties = diffArr.map((d) => ({
    id: String(d.id ?? d.difficultyId ?? ""),
    name: (d.levelName || d.name || d.difficultyName || "").toLowerCase(),
    level: Number(d.level ?? 0),
  })).filter(d => d.id);

  log(`    Found ${difficulties.length} difficulty levels: ${difficulties.map(d => d.name || d.level).join(", ")}`, true);

  function pickDiff(level) {
    if (!difficulties.length) return "";
    const sorted = [...difficulties].sort((a, b) => a.level - b.level);
    const idx = Math.min(level - 1, sorted.length - 1);
    return sorted[Math.max(0, idx)].id;
  }

  /* 3. Seed */
  log("\n[3/4] Creating professions, districts, and problem nodes...\n");

  let totalProf = 0, totalDist = 0, totalNodes = 0, errors = 0;

  for (const prof of PROFESSIONS) {
    log(`▶ Profession: ${prof.name}`);

    /* Create profession — fall back to existing if already present */
    const profFd = fd({ Name: prof.name });
    const profRes = await post(`/api/Professions?userId=${encodeURIComponent(userId)}`, profFd, token, true);
    let profId = String(profRes.data?.professionId || profRes.data?.id || profRes.data?.data?.professionId || profRes.data?.data?.id || "");

    if (!profRes.ok) {
      if (profRes.status === 400 && JSON.stringify(profRes.data).toLowerCase().includes("exist")) {
        /* Profession already exists — look it up by name */
        const listRes = await get("/api/Professions", token);
        const all = Array.isArray(listRes.data) ? listRes.data : listRes.data?.data || listRes.data?.professions || [];
        const match = all.find(p => (p.name || p.professionName || "").toLowerCase() === prof.name.toLowerCase());
        if (!match) {
          log(`    ✗ Could not find existing profession "${prof.name}" — skipping`, true);
          errors++;
          continue;
        }
        profId = String(match.id ?? match.professionId ?? match.professionsId ?? "");
        log(`    ↩ Already exists (id=${profId})`, true);
      } else {
        log(`    ✗ Failed to create profession (${profRes.status}): ${JSON.stringify(profRes.data).slice(0, 120)}`, true);
        errors++;
        continue;
      }
    } else {
      if (!profId) {
        log(`    ✗ No professionId in response: ${JSON.stringify(profRes.data).slice(0, 120)}`, true);
        errors++;
        continue;
      }
      log(`    ✓ Created (id=${profId})`, true);
    }
    totalProf++;
    await sleep(300);

    for (const dist of prof.districts) {
      log(`    ▶ District: ${dist.name}`, true);

      /* Create district */
      const distFd = fd({ Name: dist.name, Description: dist.description, ProfessionId: profId, MapCoordinatesJson: "" });
      const distRes = await post(`/api/Districts?userId=${encodeURIComponent(userId)}`, distFd, token, true);
      if (!distRes.ok) {
        log(`        ✗ Failed (${distRes.status}): ${JSON.stringify(distRes.data).slice(0, 100)}`, true);
        errors++;
        continue;
      }
      const distId = String(distRes.data?.districtId || distRes.data?.id || distRes.data?.data?.districtId || distRes.data?.data?.id || "");
      if (!distId) {
        log(`        ✗ No districtId in response: ${JSON.stringify(distRes.data).slice(0, 100)}`, true);
        errors++;
        continue;
      }
      log(`        ✓ Created (id=${distId})`, true);
      totalDist++;
      await sleep(200);

      for (const node of dist.nodes) {
        const diffId = pickDiff(node.level);
        const nodeFd = fd({
          Title: node.title,
          Context: node.context,
          MissionBrief: node.missionBrief,
          Constraints: JSON.stringify(node.constraints),
          ExpectedOutcomes: JSON.stringify(node.expectedOutcomes),
          ExperiencePoints: String(node.xp),
          EstimatedMinutes: String(node.minutes),
          DifficultyId: diffId,
          DistrictId: distId,
        });
        const nodeRes = await post(`/api/ProblemNodes?userId=${encodeURIComponent(userId)}`, nodeFd, token, true);
        if (!nodeRes.ok) {
          log(`            ✗ Node "${node.title}" failed (${nodeRes.status})`, true);
          errors++;
        } else {
          log(`            ✓ Node: ${node.title} (${node.xp} XP, ${node.minutes} min)`, true);
          totalNodes++;
        }
        await sleep(200);
      }
    }
    await sleep(500);
  }

  /* 4. Summary */
  log("\n[4/4] Done!");
  log("=".repeat(60));
  log(`  Professions created : ${totalProf} / ${PROFESSIONS.length}`);
  log(`  Districts created   : ${totalDist} / ${PROFESSIONS.reduce((s, p) => s + p.districts.length, 0)}`);
  log(`  Problem nodes created: ${totalNodes} / ${PROFESSIONS.reduce((s, p) => s + p.districts.reduce((ds, d) => ds + d.nodes.length, 0), 0)}`);
  log(`  Errors              : ${errors}`);
  log("=".repeat(60));
}

main().catch(err => { console.error(err); process.exit(1); });
