import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import Groq from "groq-sdk";
import { Octokit } from "@octokit/rest";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Helper to reliably construct redirect URI
function getRedirectUri(req: express.Request) {
  // Always prefer the exact APP_URL from runtime context for OAuth setups
  // If not injected, fallback to constructing from request headers.
  if (process.env.APP_URL) {
    return `${process.env.APP_URL}/auth/callback`;
  }
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers.host;
  return `${protocol}://${host}/auth/callback`;
}

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Main server initialization

// === OAuth Routes ===
  
  // 1. Return URL for frontend to open in popup
  app.get("/api/auth/url", (req, res) => {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ error: "Missing GITHUB_CLIENT_ID" });
    }
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "repo user",
      state: "github_auth",
    });
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // 2. OAuth Callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("No code provided.");
    }
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return res.status(500).send("GitHub credentials missing.");
    }
    try {
      // Exchange code for token
      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: typeof code === "string" ? code : code[0],
            redirect_uri: getRedirectUri(req),
          }),
        }
      );
      
      const tokenData = await tokenResponse.json();
      if (tokenData.access_token) {
        // Set cookie with the token that the iframe can access
        res.cookie("github_token", tokenData.access_token, {
          secure: true,
          sameSite: "none",
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Close popup and message parent
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. You can close this window.</p>
            </body>
          </html>
        `);
      } else {
        res.status(400).send("Failed to retrieve access token.");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error processing OAuth.");
    }
  });

  // 3. User info endpoint
  app.get("/api/auth/me", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.rest.users.getAuthenticated();
      res.json({
        id: data.id,
        login: data.login,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
      });
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
  
  // 4. Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("github_token", {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    });
    res.json({ success: true });
  });

  // === App API Routes ===

  app.post("/api/github/issues", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    
    // Hardcoded logic here to simulate finding good first issues for demo
    // Alternatively you can pass specific query in body
    const { query } = req.body;
    
    try {
      const octokit = new Octokit({ auth: token });
      // Search for open issues labeled 'good first issue'
      const { data } = await octokit.rest.search.issuesAndPullRequests({
        q: query || "label:\"good first issue\" state:open",
        sort: "updated",
        order: "desc",
        per_page: 5,
      });
      res.json({ items: data.items });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to search issues" });
    }
  });

  app.get("/api/github/user/issues", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const { data } = await octokit.rest.search.issuesAndPullRequests({
        q: `author:${user.login} type:issue`,
        sort: 'updated',
        order: 'desc',
        per_page: 30
      });
      res.json({ items: data.items });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch user issues" });
    }
  });

  app.get("/api/github/user/pulls", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const { data } = await octokit.rest.search.issuesAndPullRequests({
        q: `author:${user.login} type:pr`,
        sort: 'updated',
        order: 'desc',
        per_page: 30
      });
      res.json({ items: data.items });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch user PRs" });
    }
  });

  app.get("/api/github/user/commits", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      
      const { data } = await octokit.rest.search.commits({
        q: `author:${user.login}`,
        sort: 'author-date',
        order: 'desc',
        per_page: 30,
        headers: {
          accept: "application/vnd.github.cloak-preview"
        }
      });
      
      const commits = data.items.map((item: any) => ({
        sha: item.sha,
        message: item.commit.message,
        repo: item.repository,
        created_at: item.commit.author.date
      }));
      res.json({ items: commits });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch user commits" });
    }
  });

  app.get("/api/github/stats", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const username = user.login;

      // Use GraphQL for contribution graph
      const query = `
        query($userName:String!) {
          user(login: $userName){
            repositories(first: 6, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
              totalCount
              nodes {
                name
                description
                stargazerCount
                url
              }
            }
            repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
              totalCount
            }
            forkedRepositories: repositories(first: 1, ownerAffiliations: OWNER, isFork: true) {
              totalCount
            }
            pullRequests(first: 1) {
              totalCount
            }
            issues(first: 1) {
              totalCount
            }
            contributionsCollection {
              totalCommitContributions
              totalIssueContributions
              totalPullRequestContributions
              totalRepositoryContributions
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `;

      let graphqlData: any = {};
      try {
        graphqlData = await octokit.graphql(query, { userName: username });
      } catch (err: any) {
        console.error("GraphQL error:", err);
        graphqlData = err.data || {}; 
      }

      const userStats = graphqlData?.user || {};
      const collection = userStats.contributionsCollection || {};
      const calendar = collection.contributionCalendar || {};

      // Prepare heatmap data
      const heatmapData = [];
      let maxContributions = 0;
      let busiestDay = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let ongoingStreak = 0;

      if (calendar.weeks) {
        calendar.weeks.forEach((week: any) => {
          week.contributionDays.forEach((day: any) => {
             const count = day.contributionCount;
             heatmapData.push({ date: day.date, count });
             if (count > busiestDay) busiestDay = count;
             
             if (count > 0) {
               ongoingStreak++;
               if (ongoingStreak > longestStreak) longestStreak = ongoingStreak;
             } else {
               ongoingStreak = 0;
             }
          });
        });
        
        // Calculate current streak (look backwards from today)
        const reversedDays = [...heatmapData].reverse();
        let todayFound = false;
        for (const day of reversedDays) {
          // Find today or yesterday
          if (new Date(day.date).toDateString() === new Date().toDateString()) {
             todayFound = true;
          }
          if (todayFound || new Date(day.date).toDateString() === new Date(Date.now() - 86400000).toDateString()) {
             if (day.count > 0) currentStreak++;
             else {
               if (todayFound && day.count === 0 && currentStreak === 0) {
                 // Ignore if today has 0, maybe check yesterday
               } else {
                 break;
               }
             }
          }
        }
      }

      res.json({
        totalContributions: calendar.totalContributions || 0,
        totalCommits: collection.totalCommitContributions || 0,
        pullRequests: collection.totalPullRequestContributions || 0,
        issuesOpened: collection.totalIssueContributions || 0,
        forksCreated: userStats.forkedRepositories?.totalCount || 0,
        publicRepos: user.public_repos || 0,
        recentRepos: userStats.repositories?.nodes || [],
        busiestDay,
        currentStreak,
        longestStreak,
        // Send heatmap data
        heatmapData
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/ai/issue-solution", async (req, res) => {
    const { issueTitle, issueBody, repoName } = req.body;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Groq API Key missing" });

    try {
      const groq = new Groq({ apiKey });
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert Open Source Maintainer and Senior Developer mentoring a contributor. 
Provide the response strictly in this format using Markdown:
## 1. Comment for the Issue
(Write a polite, professional comment they can post to ask to work on the issue, showing they understand it.)

## 2. Issue Explanation
(Explain simply what the issue is about, why it's happening, and the context of the repository.)

## 3. Setup & Contribution Workflow
(Provide the standard open-source workflow steps: Forking the repository, cloning the fork locally, creating a new descriptive branch, and installing any necessary dependencies. Provide example git commands.)

## 4. Step-by-Step Fix Guide
(Provide detailed, step-by-step instructions on how to solve the issue. Include exactly where to look, what code they might need to change, and any edge cases to consider. Be as comprehensive as possible.)

## 5. Testing, Verification & PR
(Provide potential test cases, manual verification steps, or commands they can run to verify that their proposed solution works. Conclude with instructions on how to commit the changes, push to their fork, and open a Pull Request.)`
          },
          {
            role: "user",
            content: `Provide a solution guide for this GitHub issue in ${repoName}.\n\nTitle: ${issueTitle}\nBody: ${issueBody}`
          }
        ]
      });
      res.json({ solution: response.choices[0]?.message?.content || "" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate solution." });
    }
  });

// === Setup and Start ===
async function setupViteAndStart() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only start the server if not deployed as a Serverless Function on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

setupViteAndStart();

export default app;