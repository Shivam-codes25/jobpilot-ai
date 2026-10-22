"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [profileRole, setProfileRole] = useState("Data Analyst");
  const [profileLocation, setProfileLocation] = useState("India");
  const [isRemote, setIsRemote] = useState(true);
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  // Standard API fetch
  const runEngine = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: profileRole,
        loc: isRemote ? "remote" : profileLocation,
        remote: isRemote.toString()
      });
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger the Python Playwright Backend
  const runDeepScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch("http://localhost:8000/api/scrape/duckduckgo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: profileRole,
          location: isRemote ? "remote" : profileLocation,
        }),
      });
      const data = await res.json();
      
      // Map the scraped results to match our job card structure
      const newJobs = (data.jobs || []).map((j: any, idx: number) => ({
        id: `scraped-${idx}`,
        title: j.title,
        company: "Discovered via Search",
        location: isRemote ? "Remote" : profileLocation,
        type: "Unknown",
        url: j.url,
        source: "Playwright Automation",
        matchScore: 90, 
      }));
      
      // Prepend the newly scraped jobs to the existing list
      setJobs((prev) => [...newJobs, ...prev]);
    } catch (err) {
      console.error("Scrape failed", err);
      alert("Failed to connect to Python Backend. Is server.py running?");
    } finally {
      setScraping(false);
    }
  };

  useEffect(() => {
    runEngine();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col h-screen sticky top-0">
        <div className="flex items-center space-x-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30">J</div>
          <h1 className="text-xl font-bold tracking-tight">JobPilot AI</h1>
        </div>

        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Your Job Profile</h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Role</label>
            <input 
              type="text" 
              value={profileRole} 
              onChange={(e) => setProfileRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Location</label>
            <input 
              type="text" 
              value={profileLocation} 
              onChange={(e) => setProfileLocation(e.target.value)}
              disabled={isRemote}
              className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none ${isRemote ? 'opacity-50 cursor-not-allowed' : 'focus:border-indigo-500'}`}
            />
          </div>

          <label className="flex items-center space-x-3 bg-slate-950 border border-slate-800 p-3 rounded-lg cursor-pointer hover:border-slate-700 transition">
            <input 
              type="checkbox" 
              checked={isRemote} 
              onChange={(e) => setIsRemote(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-600 bg-slate-900"
            />
            <span className="text-sm font-medium">Remote Jobs Only</span>
          </label>

          <button 
            onClick={runEngine}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition shadow-lg shadow-indigo-600/20"
          >
            {loading ? "Scanning APIs..." : "Save Profile & Scan APIs"}
          </button>
          
          {/* THE NEW AUTOMATION BUTTON */}
          <button 
            onClick={runDeepScrape}
            disabled={scraping}
            className={`w-full font-medium py-2.5 rounded-lg transition border ${scraping ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-wait' : 'bg-slate-950 hover:bg-slate-900 text-emerald-400 border-emerald-500/30 hover:border-emerald-400'}`}
          >
            {scraping ? "🤖 Browser Scraping..." : "Run Deep Web Scrape (Python)"}
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold">Discovery Engine</h2>
            <p className="text-sm text-slate-400 mt-1">Found {jobs.length} roles matching your profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">{job.source}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{job.matchScore}% Match</span>
                </div>
                <h3 className="font-bold text-slate-100">{job.title}</h3>
                <p className="text-sm text-slate-300 mt-1">{job.company}</p>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center">📍 {job.location}</p>
              </div>
              
              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
                <a href={job.url} target="_blank" className="text-xs font-medium px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700">View Job ↗</a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
