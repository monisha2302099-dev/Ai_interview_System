export interface SampleResume {
  id: string;
  title: string;
  targetRole: string;
  badge: string;
  jobDescription: string;
  resumeText: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'swe-fullstack',
    title: 'Alex Chen — Full Stack Engineer',
    targetRole: 'Full Stack Software Engineer',
    badge: 'Strong ATS Profile',
    jobDescription: `We are looking for a Full Stack Software Engineer proficient in React, Node.js, TypeScript, PostgreSQL, Docker, and AWS. 
The ideal candidate will design scalable RESTful APIs, develop intuitive user interfaces, write comprehensive automated tests, and collaborate with cross-functional teams in an Agile environment. Experience with CI/CD pipelines, Kubernetes, and Redis caching is a strong plus.`,
    resumeText: `ALEX CHEN
San Francisco, CA | alex.chen@email.com | (555) 234-5678 | linkedin.com/in/alexchen | github.com/alexchen

SUMMARY
Results-driven Full Stack Engineer with 2+ years of experience designing scalable web applications and microservices. Skilled in TypeScript, React, Node.js, and cloud deployments. Proven track record of improving system latency by 35% and mentoring junior developers.

EDUCATION
University of California, Berkeley
B.S. in Computer Science | GPA: 3.82 | Graduated: May 2024

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
Frameworks & Libraries: React, Next.js, Node.js, Express, Tailwind CSS, Jest
Databases & Cloud: PostgreSQL, MongoDB, Redis, AWS (S3, EC2), Docker, Git, REST APIs

EXPERIENCE
Software Engineer Intern | CloudScale Technologies | Jun 2023 – Aug 2023
• Architected a real-time analytics dashboard using React, TypeScript, and Tailwind CSS, serving 15,000+ daily active users.
• Built high-throughput REST APIs in Node.js and Express, reducing server response times from 320ms to 180ms (-43%).
• Integrated Redis caching layer, decreasing database load by 35% during peak traffic spikes.
• Implemented automated CI/CD workflows using GitHub Actions and Docker, reducing deployment cycle times by 25%.

Full Stack Developer (Capstone Project) | Apex Commerce | Sep 2023 – Dec 2023
• Engineered a multi-tenant e-commerce platform using React, Node.js, PostgreSQL, and Stripe payment webhooks.
• Designed relational schema with Prisma ORM supporting 50,000+ product SKUs with sub-50ms query latency.
• Authored comprehensive end-to-end and unit test suites achieving 88% code coverage using Jest and React Testing Library.

PROJECTS
DevPulse – Developer Performance Tracker
• Developed a full-stack SaaS tool integrating GitHub REST API to visualize team commit velocities and pull request cycle times.
• Built with Next.js, TypeScript, Tailwind CSS, and deployed on AWS ECS.`,
  },
  {
    id: 'data-analyst',
    title: 'Priya Patel — Junior Data Analyst',
    targetRole: 'Machine Learning & Data Analyst',
    badge: 'Skills Gap Example',
    jobDescription: `Seeking an enthusiastic Data Analyst & Machine Learning Engineer to join our AI insights team. 
Must possess strong command of Python, PyTorch/TensorFlow, SQL, Scikit-learn, Tableau, and data warehousing (Snowflake/BigQuery). Responsibilities include building predictive models, designing KPI dashboards, conducting A/B test experiments, and communicating findings to executive leadership.`,
    resumeText: `PRIYA PATEL
Chicago, IL | priya.patel@email.com | (555) 789-0123

PROFESSIONAL SUMMARY
Detail-oriented Data Analyst with a solid background in statistical analysis, Excel modeling, and business reporting. Passionate about uncovering data insights to drive business strategy.

EDUCATION
Illinois Institute of Technology
B.S. in Information Systems & Statistics | Expected May 2025

SKILLS
Tools: Microsoft Excel (VLOOKUP, Pivot Tables, Macros), Tableau, Power BI
Languages: Basic Python (pandas), SQL (PostgreSQL, MySQL)
Core: Data Cleaning, Exploratory Data Analysis, Descriptive Statistics, Reporting

ACADEMIC & INTERNSHIP EXPERIENCE
Business Intelligence Intern | Midwest Financial Partners | Jun 2024 – Aug 2024
• Created interactive Tableau dashboards tracking monthly revenue across 4 regional branches.
• Executed SQL queries to extract and cleanse transactional data from relational databases.
• Prepared weekly summary reports in PowerPoint and Excel for the Senior Operations Manager.
• Helped clean customer survey datasets containing over 2,000 responses using Excel formulas.

Student Data Analyst | IIT Student Analytics Lab | Jan 2024 – May 2024
• Conducted an exploratory data analysis project on campus dining traffic patterns.
• Wrote basic Python scripts using pandas and matplotlib to visualize peak student dining hours.
• Presented final poster presentation to the university dining committee.`,
  },
  {
    id: 'frontend-starter',
    title: 'Jordan Smith — Frontend Developer',
    targetRole: 'Senior Frontend Engineer',
    badge: 'Grammar & Impact Gaps',
    jobDescription: `Senior Frontend Engineer needed to architect enterprise web platforms using modern React, TypeScript, GraphQL, Next.js, and Web Performance optimization techniques. 
Must demonstrate deep understanding of Core Web Vitals, accessibility (WCAG 2.1 AA), state management (Zustand/Redux), and mentoring engineering teams. Candidates should have measurable achievements demonstrating performance tuning and architectural leadership.`,
    resumeText: `JORDAN SMITH
New York, NY | jsmith_dev@gmail.com

Objective:
Looking for a challenging position as Senior Frontend Engineer where I can use my skills to help the company grow and learn new technologies.

Experience:
Web Developer | Digital Horizons | 2022 - Present
- Was responsible for maintaining website pages and fixing bugs when reported by QA.
- Worked on React components for our clients website.
- Handled styling using CSS and Bootstrap.
- Participated in daily standup meetings with team members and did code reviews.
- Tried to improve page loading speed and helped other junior devs when they had problems.
- Responsible for updating javascript libraries and making sure things didn't break.

Junior Web Intern | Creative Studio | 2021 - 2022
- Made responsive websites using HTML, CSS, and jQuery.
- Fixed layout issues across Chrome and Firefox browsers.
- Helped upload blog posts and images to WordPress CMS.

Skills:
HTML5, CSS3, JavaScript, React, Bootstrap, jQuery, WordPress, Git, Visual Studio Code

Education:
B.A. in Digital Arts, NYU (2021)`,
  },
];
