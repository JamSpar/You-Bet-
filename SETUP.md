# You Bet! — Deploy Guide

This turns You Bet! into a normal, always-there website with its own URL —
no more claude.ai artifact sharing, no more "page not found." Everything
here is free for a private league's worth of traffic.

You'll create two free accounts (Neon for the database, Render for hosting)
and one free GitHub repo to connect them. Budget about 20 minutes the first
time.

## What you're building

```
Your browser  --->  Render (runs the app, free)  --->  Neon (Postgres database, free)
```

Render hosts the app itself and gives you a stable URL like
`https://you-bet-yourname.onrender.com` — that's the link you email to your
league. Neon stores the actual league data (members, bets, squares, chat)
so it survives restarts and redeploys.

**One tradeoff to know about up front:** on the free tier, Render "spins
down" the app after 15 minutes with no visitors, and the first visitor
after that waits about a minute for it to wake back up (Neon does something
similar after 5 minutes idle, but wakes in a couple seconds). After that
it's instant for everyone until it goes quiet again. Fine for a private
league; if it ever bugs you, upgrading Render to its $7/mo tier removes the
sleep entirely — nothing else about the setup changes.

---

## 1. Create your database (Neon)

1. Go to **neon.com** and sign up (free, no credit card required).
2. Create a new project — any name is fine, e.g. "you-bet".
3. On the project dashboard, find **Connection Details** and copy the
   connection string. It looks like:
   `postgresql://user:password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Keep this tab open — you'll paste this string into Render in step 3.

## 2. Push the code to GitHub

1. Go to **github.com** and sign up if you don't already have an account.
2. Create a new **private** repository (e.g. "you-bet").
3. Upload everything in this folder to that repo. The easiest way if you're
   not familiar with git: on the new repo's page, click "uploading an
   existing file" and drag in every file from this folder (keep the
   `public/` folder structure intact — `index.html` needs to stay inside
   `public/`). Commit the upload.
   - If you *are* comfortable with git, the usual `git init`, `git add .`,
     `git commit`, `git remote add origin ...`, `git push` works too.

## 3. Deploy on Render

1. Go to **render.com** and sign up (you can sign up with your GitHub
   account, which makes the next step easier).
2. Click **New +** → **Web Service**.
3. Connect the GitHub repo you just created.
4. Fill in:
   - **Name**: whatever you want the URL to contain, e.g. `you-bet`
   - **Region**: closest to you and your league
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Before clicking Create, scroll to **Environment Variables** and add one:
   - **Key**: `DATABASE_URL`
   - **Value**: the Neon connection string you copied in step 1
6. Click **Create Web Service**. Render will build and deploy — takes a
   couple minutes the first time. Watch the logs; you're looking for
   `You Bet! server listening on port ...`.
7. Once it's live, Render shows you the URL at the top of the page
   (`https://you-bet-yourname.onrender.com` or similar). Open it — you
   should see the "Set Up Your League" screen, exactly like the very first
   time you set up the app.

That URL is what you email to your league. It works the same for everyone
— no sign-in, no claude.ai account, no sharing toggle to fight with. Anyone
who opens it lands on "Which one's you?" and picks their name, same as
before.

## 4. Bringing your existing league data over

If you already set up your league on the old artifact-based version and
want that data (members, balances, bet history) on the new site instead of
starting fresh:

1. On the **old** artifact link (if you can still reach it), use the Host
   Console's backup export to download the league's JSON backup file.
   (If you can't reach the old link at all, you'll just re-create the
   league from scratch on the new URL — sorry, there's no way around that
   one.)
2. On the **new** Render URL, on the "Set Up Your League" screen, click
   "Restore from backup" and upload that same JSON file.

## Updating the app later

Whenever another change is made to the code, the new files just need to
replace the old ones in your GitHub repo (upload again the same way as
step 2, overwriting the old files). Render watches the repo and
automatically redeploys within a minute or two of any push — no other
steps needed, and your league's data is untouched since it lives in Neon,
not in the app code.

## If something goes wrong

- **Render build fails**: check the build logs on the Render dashboard —
  almost always a typo in the Environment Variable name/value, or a file
  that didn't upload to GitHub correctly.
- **App loads but league data won't save**: double check the
  `DATABASE_URL` environment variable in Render's dashboard (Settings →
  Environment) exactly matches what Neon gave you, including the
  `?sslmode=require` at the end.
- **"Application failed to respond" right after a long idle period**:
  that's the free-tier spin-down described above — wait about a minute and
  reload.
