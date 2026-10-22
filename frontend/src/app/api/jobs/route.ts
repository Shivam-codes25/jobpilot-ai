import { NextResponse } from "next/server";

export const jobSources = [
  { id: "remotive", name: "Remotive", region: "Remote", method: "api", status: "connected", searchUrl: "https://remotive.com" },
  { id: "arbeitnow", name: "Arbeitnow", region: "Europe", method: "api", status: "connected", searchUrl: "https://www.arbeitnow.com" },
  { id: "greenhouse", name: "Greenhouse ATS", region: "Company careers", method: "api", status: "connected", searchUrl: "https://boards.greenhouse.io" }
];

function scoreJob(title: string, desc: string, loc: string, targetRole: string) {
  const text = `${title} ${desc} ${loc}`.toLowerCase();
  let score = 50;
  
  // Boost if it matches the user's specific target role
  if (text.includes(targetRole.toLowerCase())) score += 25;
  if (/\b(intern|internship|junior|entry|fresher|graduate)\b/i.test(text)) score += 15;

  const skills = ["sql", "python", "tableau", "power bi", "excel", "machine learning", "analytics"];
  const matchedSkills: string[] = [];
  for (const s of skills) {
    if (text.includes(s)) {
      matchedSkills.push(s.toUpperCase());
      score += 4;
    }
  }

  return {
    matchScore: Math.min(98, score),
    matchedSkills: matchedSkills.slice(0, 5),
    eligibilityStatus: score >= 75 ? "High Match" : "Review",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "data analyst";
  const location = searchParams.get("loc")?.trim().toLowerCase() || "";
  const isRemoteOnly = searchParams.get("remote") === "true";

  const allJobs: any[] = [];
  
  const isSenior = (t: string) => /\b(senior|sr\.?|lead|principal|director|head|vp|manager|architect)\b/i.test(t);
  const isGermanOnly = (t: string) => /\b(m\/w\/d|praktikum|werkstudent|duales studium)\b/i.test(t);

  // 1. Remotive
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=150", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const filtered = (data.jobs || []).filter((j: any) => {
        const titleStr = (j.title || "").toLowerCase();
        const locStr = (j.candidate_required_location || "").toLowerCase();
        if (isSenior(titleStr)) return false;
        
        // Location filtering
        if (location && location !== "remote" && !locStr.includes(location) && !locStr.includes("worldwide")) return false;
        
        return titleStr.includes("data") || titleStr.includes("analyst") || titleStr.includes("analytics");
      }).map((j: any) => ({
        id: `rem-`+j.id, title: j.title, company: j.company_name, location: j.candidate_required_location || "Remote",
        type: j.job_type, url: j.url, source: "Remotive", ...scoreJob(j.title, j.category, j.candidate_required_location, query)
      }));
      allJobs.push(...filtered);
    }
  } catch (e) {}

  // 2. Arbeitnow
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const filtered = (data.data || []).filter((j: any) => {
        const titleStr = (j.title || "").toLowerCase();
        const locStr = (j.location || "").toLowerCase();
        if (isSenior(titleStr) || isGermanOnly(titleStr)) return false;
        if (isRemoteOnly && !j.remote) return false;
        if (location && location !== "remote" && !locStr.includes(location)) return false;
        
        return titleStr.includes("data") || titleStr.includes("analyst");
      }).map((j: any) => ({
        id: `arb-`+j.slug, title: j.title, company: j.company_name, location: j.remote ? "Remote" : j.location,
        type: "Full time", url: j.url, source: "Arbeitnow", ...scoreJob(j.title, "", j.location, query)
      }));
      allJobs.push(...filtered);
    }
  } catch (e) {}

  allJobs.sort((a, b) => b.matchScore - a.matchScore);

  return NextResponse.json({ total: allJobs.length, jobs: allJobs });
}
