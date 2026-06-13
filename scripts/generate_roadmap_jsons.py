"""
Generate roadmap graph JSON files matching backend.json format exactly.
Every topic from every PDF is included.
Colors: #ffee55 = milestone/section, #ffdfb3 = subtopic, #4147d3 = special group
"""
import json, os, re

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'assets', 'roadmaps')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def slugify(label):
    s = label.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def build_graph(sections):
    """sections = [ (section_label, [subtopic_labels...]), ... ]
    Builds graph with milestone nodes and subtopic nodes, connected by edges.
    """
    nodes = []
    edges = []
    used_ids = set()
    y = 0
    prev_section_id = None

    def unique_id(label, parent_id=None):
        base = slugify(label)
        candidate = base
        if candidate in used_ids and parent_id:
            candidate = f"{parent_id}-{base}"
        counter = 2
        while candidate in used_ids:
            candidate = f"{base}-{counter}"
            counter += 1
        used_ids.add(candidate)
        return candidate

    for sec_label, subtopics in sections:
        sec_id = unique_id(sec_label)
        nodes.append({
            "id": sec_id, "label": sec_label,
            "x": 0, "y": y, "width": 240, "height": 40,
            "bgColor": "#ffee55", "textColor": "#000000"
        })
        if prev_section_id:
            edges.append({"id": f"e-{prev_section_id}-{sec_id}", "source": prev_section_id, "target": sec_id})
        prev_section_id = sec_id
        y += 45

        for sub in subtopics:
            sub_id = unique_id(sub, sec_id)
            nodes.append({
                "id": sub_id, "label": sub,
                "x": 0, "y": y, "width": 180, "height": 40,
                "bgColor": "#ffdfb3", "textColor": "#000000"
            })
            edges.append({"id": f"e-{sec_id}-{sub_id}", "source": sec_id, "target": sub_id})
            y += 45

        y += 20

    return {"nodes": nodes, "edges": edges}

def save(name, data):
    path = os.path.join(OUTPUT_DIR, f"{name}.json")
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"  OK {path} - {len(data['nodes'])} nodes, {len(data['edges'])} edges")

# ============================================================================
# FRONTEND (from frontend.pdf - every single topic)
# ============================================================================
frontend = [
    ("Internet", [
        "How does the internet work?", "What is HTTP?", "What is Domain Name?",
        "What is hosting?", "DNS and how it works?", "Browsers and how they work?"
    ]),
    ("HTML", [
        "Learn the Basics", "Writing Semantic HTML", "Forms and Validations",
        "Accessibility", "SEO Basics"
    ]),
    ("CSS", [
        "Learn the Basics", "Making Layouts", "Responsive Design",
        "CSS Architecture", "BEM", "CSS Preprocessors", "Sass", "PostCSS"
    ]),
    ("JavaScript", [
        "Learn DOM Manipulation", "Fetch API / Ajax (XHR)", "CORS", "HTTPS"
    ]),
    ("Version Control Systems", ["Git"]),
    ("VCS Hosting", ["GitHub", "GitLab", "Bitbucket"]),
    ("Package Managers", ["npm", "pnpm", "yarn"]),
    ("Pick a Framework", [
        "React", "Vue.js", "Angular", "Svelte", "Solid JS", "Qwik"
    ]),
    ("Writing CSS", ["Tailwind", "CSS Modules", "Styled Components"]),
    ("Build Tools", [
        "Vite", "Webpack", "Rollup", "Parcel", "esbuild", "SWC"
    ]),
    ("Linters and Formatters", ["Prettier", "ESLint"]),
    ("Testing", ["Vitest", "Jest", "Playwright", "Cypress"]),
    ("Type Checkers", ["TypeScript"]),
    ("Web Security Basics", ["OWASP Security Risks", "Content Security Policy"]),
    ("Authentication Strategies", [
        "JWT", "OAuth", "SSO", "Basic Auth", "Session Auth"
    ]),
    ("Web Components", ["HTML Templates", "Custom Elements", "Shadow DOM"]),
    ("SSR", ["Next.js", "Nuxt.js", "Svelte Kit", "Astro"]),
    ("GraphQL", ["Apollo", "Relay Modern"]),
    ("Static Site Generators", ["Eleventy", "Vuepress", "Astro"]),
    ("Mobile Apps", ["React Native", "Flutter", "Ionic"]),
    ("Desktop Apps", ["Electron", "Tauri", "Flutter"]),
    ("Performance Best Practices", [
        "PRPL Pattern", "RAIL Model", "Performance Metrics",
        "Using Lighthouse", "Using DevTools"
    ]),
    ("Browser APIs", [
        "Web Sockets", "Server Sent Events", "Service Workers",
        "Storage", "Location", "Notifications",
        "Device Orientation", "Payments", "Credentials"
    ]),
    ("PWAs", ["Progressive Web Apps"]),
]
save("frontend", build_graph(frontend))

# ============================================================================
# AI ENGINEER (from ai-engineer.pdf - every single topic)
# ============================================================================
ai_engineer = [
    ("What is an AI Engineer?", [
        "Roles and Responsibilities", "AI Engineer vs ML Engineer",
        "Impact on Product Development", "AI vs AGI"
    ]),
    ("Common Terminology", [
        "LLMs", "Inference", "Training", "Embeddings",
        "Vector Databases", "AI Agents", "RAG", "Prompt Engineering"
    ]),
    ("Pre-trained Models", [
        "Using Pre-trained Models", "Benefits of Pre-trained Models",
        "Limitations and Considerations"
    ]),
    ("Popular AI Models", [
        "OpenAI Models", "Capabilities / Context Length", "Cut-off Dates / Knowledge",
        "Anthropic's Claude", "Google's Gemini", "Azure AI",
        "AWS Sagemaker", "Mistral AI", "Cohere", "Replicate"
    ]),
    ("OpenAI API", [
        "Chat Completions API", "Open AI Playground", "Fine-tuning"
    ]),
    ("Managing Tokens", [
        "Writing Prompts", "Maximum Tokens", "Token Counting", "Pricing Considerations"
    ]),
    ("Prompt Engineering", [
        "Robust prompt engineering", "ReAct Prompting", "Prompt Engineering Roadmap"
    ]),
    ("AI Safety and Ethics", [
        "Security and Privacy Concerns", "Bias and Fairness",
        "Understanding AI Safety Issues", "OpenAI Moderation API",
        "Adding end-user IDs in prompts", "Prompt Injection Attacks",
        "Conducting adversarial testing"
    ]),
    ("OpenSource AI", [
        "Open vs Closed Source Models", "Popular Open Source Models",
        "Finding Open Source Models"
    ]),
    ("Hugging Face", [
        "Hugging Face Hub", "Hugging Face Tasks", "Hugging Face Models",
        "Sentence Transformers", "Models on Hugging Face",
        "Inference SDK", "Transformers.js"
    ]),
    ("Ollama", [
        "Ollama Models", "Ollama SDK", "Using Open Source Models"
    ]),
    ("Embeddings & Vector Databases", [
        "What are Embeddings", "Open AI Embedding Models",
        "Open AI Embeddings API", "Open-Source Embeddings", "Pricing Considerations"
    ]),
    ("Use Cases for Embeddings", [
        "Semantic Search", "Data Classification",
        "Recommendation Systems", "Anomaly Detection"
    ]),
    ("Vector Databases", [
        "Purpose and Functionality", "Chroma", "Pinecone",
        "Weaviate", "FAISS", "LanceDB", "Qdrant",
        "Supabase", "MongoDB Atlas"
    ]),
    ("RAG & Implementation", [
        "RAG vs Fine-tuning", "Implementing RAG",
        "Chunking", "Embedding", "Vector Database",
        "Retrieval Process", "Generation",
        "Using SDKs Directly", "Langchain", "Llama Index",
        "Implementing Vector Search", "Indexing Embeddings",
        "Performing Similarity Search", "RAG Alternative", "Open AI Assistant API"
    ]),
    ("AI Agents", [
        "Agents Usecases", "Know your Customers / Usecases",
        "Constraining outputs and inputs", "Safety Best Practices",
        "Building AI Agents", "Manual Implementation",
        "OpenAI Functions / Tools", "OpenAI Assistant API"
    ]),
    ("Development Tools", [
        "AI Code Editors", "Code Completion Tools"
    ]),
    ("Multimodal AI", [
        "Image Understanding", "Image Generation", "Video Understanding",
        "Audio Processing", "Text-to-Speech", "Speech-to-Text",
        "OpenAI Vision API", "DALL-E API", "Whisper API",
        "Hugging Face Models", "LangChain for Multimodal Apps",
        "LlamaIndex for Multimodal Apps", "Implementing Multimodal AI"
    ]),
]
save("ai-engineer", build_graph(ai_engineer))

# ============================================================================
# API DESIGN (from api-design.pdf - every single topic)
# ============================================================================
api_design = [
    ("What are APIs", ["Building APIs"]),
    ("HTTP", [
        "Learn the Basics", "HTTP Versions", "HTTP Methods",
        "HTTP Status Codes", "HTTP Headers", "Cookies", "CORS", "HTTP Caching"
    ]),
    ("Understand TCP / IP", ["Basics of DNS"]),
    ("Different API Styles", [
        "RESTful APIs", "Simple JSON APIs", "SOAP APIs",
        "GraphQL APIs", "gRPC APIs"
    ]),
    ("Building JSON / RESTful APIs", [
        "REST Principles", "URI Design", "Versioning Strategies",
        "Handling CRUD Operations", "URL, Query & Path Parameters",
        "Content Negotiation"
    ]),
    ("API Authentication and Authorization", [
        "Basic Auth", "Token Based Auth", "JWT",
        "OAuth 2.0", "Session Based Auth"
    ]),
    ("Authorization Methods", [
        "Role Based Access Control (RBAC)",
        "Attribute Based Access Control (ABAC)",
        "API Keys & Management"
    ]),
    ("Pagination", ["Rate Limiting", "Idempotency", "HATEOAS"]),
    ("Error Handling", ["RFC 7807 - Problem Details for APIs"]),
    ("API Security", [
        "Common Vulnerabilities", "API Security Best Practices"
    ]),
    ("API Documentation Tools", [
        "Swagger / Open API", "Readme.com", "Stoplight", "Postman"
    ]),
    ("API Testing", [
        "Unit Testing", "Integration Testing", "Functional Testing",
        "Load Testing", "Mocking APIs", "Contract Testing"
    ]),
    ("API Performance", [
        "Performance Metrics", "Caching Strategies", "Load Balancing",
        "Rate Limiting / Throttling", "Profiling and Monitoring",
        "Performance Testing", "Error Handling / Retries"
    ]),
    ("API Integration Patterns", [
        "Synchronous vs Asynchronous APIs", "Event Driven Architecture",
        "Webhooks vs Polling", "Batch Processing"
    ]),
    ("Messaging Queues", ["RabbitMQ", "Kafka"]),
    ("API Gateways", ["Microservices Architecture"]),
    ("Real-time APIs", ["Web Sockets", "Server Sent Events"]),
    ("API Lifecycle Management", [
        "Standards and Compliance", "GDPR", "CCPA",
        "PCI DSS", "HIPAA", "PII"
    ]),
]
save("api-design", build_graph(api_design))

# ============================================================================
# DSA (from datastructures-and-algorithms.pdf - every single topic)
# ============================================================================
dsa = [
    ("Pick a Language", [
        "C#", "C++", "Python", "Rust", "JavaScript", "Java", "Go", "Ruby"
    ]),
    ("Programming Fundamentals", [
        "Language Syntax", "Control Structures", "Pseudo Code",
        "Functions", "OOP Basics"
    ]),
    ("What are Data Structures?", ["Why are Data Structures Important?"]),
    ("Algorithmic Complexity", [
        "Time vs Space Complexity", "How to Calculate Complexity?",
        "Asymptotic Notation", "Big-O Notation",
        "Common Runtimes", "Constant", "Logarithmic", "Linear",
        "Polynomial", "Exponential", "Factorial"
    ]),
    ("Basic Data Structures", [
        "Array", "Linked Lists", "Stacks", "Queues", "Hash Tables"
    ]),
    ("Sorting Algorithms", [
        "Bubble Sort", "Insertion Sort", "Selection Sort",
        "Merge Sort", "Quick Sort", "Heap Sort"
    ]),
    ("Search Algorithms", ["Linear Search", "Binary Search"]),
    ("Tree Data Structures", [
        "Binary Trees", "Binary Search Trees", "AVL Trees",
        "B-Trees", "Heap", "Trie"
    ]),
    ("Tree Traversal", [
        "In-Order Traversal", "Pre-Order Traversal", "Post-Order Traversal",
        "Breadth First Search", "Depth First Search"
    ]),
    ("Graph Data Structures", ["Directed Graph", "Undirected Graph"]),
    ("Graph Search", ["Breadth First Search", "Depth First Search"]),
    ("Shortest Path Algorithms", [
        "Dijkstra's Algorithm", "Bellman-Ford Algorithm", "A* Algorithm"
    ]),
    ("Minimum Spanning Tree", ["Prim's Algorithm", "Kruskal's Algorithm"]),
    ("Advanced Data Structures", ["2-3 Trees", "B/B+ Trees", "Skip List", "ISAM"]),
    ("Complex Data Structures", [
        "Segment Trees", "Fenwick Trees",
        "Disjoint Set (Union-Find)", "Suffix Trees and Arrays"
    ]),
    ("Indexing", ["Linear", "Tree-Based"]),
    ("Problem Solving Techniques", [
        "Brute Force", "Backtracking", "Greedy Algorithms",
        "Divide and Conquer", "Recursion", "Dynamic Programming",
        "Randomised Algorithms"
    ]),
    ("Advanced Techniques", [
        "Two Pointer Technique", "Fast and Slow Pointers",
        "Sliding Window Technique", "Merge Intervals",
        "Cyclic Sort", "Two Heaps", "Kth Element", "Island traversal",
        "Multi-threaded"
    ]),
    ("Platforms to Practice", ["Leetcode", "Edabit"]),
]
save("datastructures-and-algorithms", build_graph(dsa))

# ============================================================================
# DJANGO (from django.pdf - every single topic)
# ============================================================================
django = [
    ("Introduction", [
        "How the Web Works", "Why use web frameworks",
        "The MVC Model", "Virtual envs", "Installing Django"
    ]),
    ("Your First Project", ["Projects & Apps", "Running your Project"]),
    ("Project Structure", ["manage.py", "settings.py", "urls.py"]),
    ("App Structure", [
        "models.py", "views.py", "tests.py", "admin.py", "migrations", "urls.py"
    ]),
    ("Other Files", ["static", "media", "templates"]),
    ("Routing", [
        "URL patterns", "Path converters", "Grouping URLs",
        "Regex Paths", "Named URLs", "Reverse URL", "Routing Middleware"
    ]),
    ("Views", [
        "Function-based views", "Class-based views", "Generic views",
        "ListView", "DetailView", "CreateView", "UpdateView", "DeleteView",
        "Customizing Views", "Rendering Templates"
    ]),
    ("Templates", [
        "DTL Syntax", "Variables", "Filters & custom filters",
        "Tags & custom tags", "for", "if", "Comments", "Template Inheritance"
    ]),
    ("Models", [
        "Model Fields", "Field types", "Field options", "Custom fields",
        "Model relationships", "Model methods", "Model inheritance"
    ]),
    ("Models, Databases & ORM", [
        "Setting up the Database", "Supported DBs",
        "SQLite", "PostgreSQL", "MySQL", "MariaDB"
    ]),
    ("Django ORM", [
        "Querying data", "Create, Update, Delete", "Aggregations",
        "Filtering & lookups", "Raw SQL", "Query Optimization"
    ]),
    ("Migrations", ["Django Migrations"]),
    ("Django Forms", ["Model Forms", "Form Validation", "Validation"]),
    ("Django Admin", ["Customization", "Admin Customization"]),
    ("Middleware", ["Request Response Flow"]),
    ("Authentication", [
        "Built-in user model", "Custom user model", "Users & Permissions"
    ]),
    ("Authorization", ["Protecting views", "django-allauth"]),
    ("API Development", [
        "Django REST Framework", "Serializers",
        "Views & ViewSets", "Routers"
    ]),
    ("Logging", [
        "Logging framework", "Loggers", "Handlers", "Filters", "Formatters"
    ]),
    ("Debugging", [
        "Error Pages", "debug_toolbar", "PDB, IPDB", "django_silk"
    ]),
    ("Django Test Framework", ["pytest", "unittest & TestCase"]),
    ("Static Files", ["Whitenoise"]),
    ("Advanced Topics", [
        "Pagination", "Message Framework", "Django Shell",
        "Caching", "Asynchronous Django", "Background Tasks",
        "Localization", "Signals"
    ]),
    ("Deployment", ["Production Checklist"]),
]
save("django", build_graph(django))

# ============================================================================
# SQL (from sql.pdf - every single topic)
# ============================================================================
sql = [
    ("Learn the Basics", [
        "What are Relational Databases?", "RDBMS Benefits and Limitations",
        "SQL vs NoSQL Databases", "Basic SQL Syntax",
        "SQL Keywords", "Data Types", "Operators"
    ]),
    ("Data Definition Language (DDL)", [
        "Create Table", "Alter Table", "Drop Table", "Truncate Table"
    ]),
    ("Data Manipulation Language (DML)", [
        "SELECT", "INSERT", "UPDATE", "DELETE"
    ]),
    ("Data Constraints", [
        "Primary Key", "Foreign Key", "Unique", "NOT NULL", "CHECK"
    ]),
    ("Statements", [
        "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING"
    ]),
    ("Aggregate Queries", ["SUM", "COUNT", "AVG", "MIN", "MAX"]),
    ("JOIN Queries", [
        "INNER JOIN", "LEFT JOIN", "RIGHT JOIN",
        "FULL OUTER JOIN", "Self Join", "Cross Join"
    ]),
    ("Subqueries", [
        "Nested Subqueries", "Correlated Subqueries",
        "Different Types", "Scalar", "Column", "Row", "Table"
    ]),
    ("String Functions", [
        "CONCAT", "LENGTH", "SUBSTRING", "REPLACE", "UPPER", "LOWER"
    ]),
    ("Numeric Functions", ["ABS", "ROUND", "CEILING", "FLOOR", "MOD"]),
    ("Date and Time", ["DATE", "TIME", "TIMESTAMP", "DATEPART", "DATEADD"]),
    ("Conditional", ["CASE", "NULLIF", "COALESCE"]),
    ("Advanced Functions", [
        "Window Functions", "rank", "dense_rank",
        "lead", "lag", "Row_number"
    ]),
    ("Views", ["Creating Views", "Modifying Views", "Dropping Views"]),
    ("Indexes", ["Managing Indexes", "Query Optimization"]),
    ("Stored Procedures & Functions", ["Creating Procedures", "Parameters"]),
    ("Transactions", [
        "BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT",
        "ACID", "Transaction Isolation Levels"
    ]),
    ("Data Integrity & Security", [
        "Data Integrity Constraints", "GRANT and Revoke",
        "DB Security Best Practices"
    ]),
    ("Performance Optimization", [
        "Query Analysis Techniques", "Using Indexes",
        "Optimizing Joins", "Reducing Subqueries",
        "Selective Projection", "Query Optimization Techniques"
    ]),
    ("Advanced SQL", [
        "Recursive Queries", "Pivot / Unpivot Operations",
        "Common Table Expressions", "Dynamic SQL"
    ]),
]
save("sql", build_graph(sql))

# ============================================================================
# SYSTEM DESIGN (from system-design.pdf - every single topic)
# ============================================================================
system_design = [
    ("Introduction", [
        "What is System Design?", "How to approach System Design?"
    ]),
    ("CAP Theorem", [
        "CP - Consistency + Partition Tolerance",
        "AP - Availability + Partition Tolerance"
    ]),
    ("Performance vs Scalability", ["Latency vs Throughput"]),
    ("Availability vs Consistency", [
        "Consistency Patterns", "Weak Consistency",
        "Eventual Consistency", "Strong Consistency"
    ]),
    ("Availability Patterns", [
        "Fail-Over", "Active - Active", "Active - Passive",
        "Replication", "Master - Slave", "Master - Master"
    ]),
    ("Availability in Numbers", [
        "99.9% Availability - three 9s",
        "99.99% Availability - four 9s",
        "Availability in Parallel vs Sequence"
    ]),
    ("Domain Name System", ["DNS Basics"]),
    ("Content Delivery Networks", ["Push CDNs", "Pull CDNs"]),
    ("Load Balancers", [
        "Layer 4 Load Balancing", "Layer 7 Load Balancing",
        "LB vs Reverse Proxy", "Load Balancing Algorithms",
        "Horizontal Scaling"
    ]),
    ("Application Layer", ["Microservices", "Service Discovery"]),
    ("Databases", ["RDBMS", "NoSQL", "SQL vs NoSQL"]),
    ("NoSQL", [
        "Key-Value Store", "Document Store",
        "Wide Column Store", "Graph Databases"
    ]),
    ("Database Scaling", [
        "Replication", "Sharding", "Federation",
        "Denormalization", "SQL Tuning"
    ]),
    ("Caching", [
        "Types of Caching", "Client Caching", "CDN Caching",
        "Web Server Caching", "Database Caching", "Application Caching"
    ]),
    ("Caching Strategies", [
        "Cache Aside", "Write-through", "Write-behind", "Refresh Ahead"
    ]),
    ("Asynchronism", ["Message Queues", "Task Queues", "Back Pressure"]),
    ("Background Jobs", ["Event-Driven", "Schedule Driven"]),
    ("Communication", [
        "HTTP", "TCP", "UDP", "REST", "RPC", "gRPC", "GraphQL"
    ]),
    ("Idempotent Operations", ["Returning Results"]),
    ("Performance Antipatterns", [
        "Busy Database", "Busy Frontend", "Chatty I/O",
        "Synchronous I/O", "Extraneous Fetching",
        "Improper Instantiation", "Monolithic Persistence",
        "Noisy Neighbor", "No Caching", "Retry Storm"
    ]),
    ("Monitoring", [
        "Health Monitoring", "Availability Monitoring",
        "Performance Monitoring", "Security Monitoring",
        "Usage Monitoring", "Instrumentation", "Visualization & Alerts"
    ]),
    ("Cloud Design Patterns", [
        "Ambassador", "Anti-Corruption Layer", "Backends for Frontend",
        "CQRS", "Compute Resource Consolidation",
        "External Config Store", "Gateway Aggregation",
        "Gateway Offloading", "Gateway Routing",
        "Leader Election", "Pipes & Filters",
        "Sidecar", "Static Content Hosting",
        "Strangler Fig", "Valet Key", "Sequential Convoy"
    ]),
    ("Data Management Patterns", [
        "Cache-Aside", "CQRS", "Event Sourcing",
        "Index Table", "Materialized View", "Sharding"
    ]),
    ("Messaging Patterns", [
        "Async Request Reply", "Claim Check",
        "Choreography", "Competing Consumers",
        "Pipes and Filters", "Priority Queue",
        "Publisher/Subscriber", "Queue-Based Load Leveling"
    ]),
    ("Reliability Patterns", [
        "Availability", "High Availability", "Resiliency",
        "Bulkhead", "Circuit Breaker", "Compensating Transaction",
        "Health Endpoint Monitoring", "Deployment Stamps",
        "Geodes", "Throttling", "Retry",
        "Scheduler Agent Supervisor"
    ]),
    ("Security Patterns", [
        "Federated Identity", "Gatekeeper", "Valet Key"
    ]),
]
save("system-design", build_graph(system_design))

print("\nDone! All roadmap JSONs regenerated with full PDF detail.")
