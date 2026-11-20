import fs from "fs";

async function test() {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  const env = {};
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }

  const apiKey = env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  // 1. Test nonsense answer
  const payload1 = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are an AI interviewer for an SDE campus placement interview.
Round: CS Fundamentals (Operating Systems, DBMS, Networks)
Question asked: "Can you explain the difference between a process and a thread in an Operating System?"
Candidate's response: "hello"

Task:
Assess the candidate's answer.
Return JSON with format:
{
  "is_relevant": false,
  "reply": "Politely note that the response doesn't answer the question, and re-ask or rephrase the question clearly under 100 words."
}`
          }
        ]
      }
    ],
    generationConfig: { responseMimeType: "application/json" }
  };

  const res1 = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload1)
  });
  const data1 = await res1.json();
  console.log("NONSENSE TEST RESULT:", data1.candidates[0].content.parts[0].text);

  // 2. Test valid technical answer
  const payload2 = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are an AI interviewer for an SDE campus placement interview.
Round: CS Fundamentals (Operating Systems, DBMS, Networks)
Question asked: "Can you explain the difference between a process and a thread in an Operating System?"
Candidate's response: "A process is an executing program with its own dedicated memory space, address space, and PCB. A thread is a lightweight unit of execution within a process that shares the code, data, and OS resources of the parent process, but has its own stack and registers."

Task:
Assess the candidate's answer.
Return JSON with format:
{
  "is_relevant": true,
  "reply": "One-line reaction acknowledging what was accurate, and ask a relevant technical follow-up (e.g. context switching overhead or multithreading synchronization) under 100 words."
}`
          }
        ]
      }
    ],
    generationConfig: { responseMimeType: "application/json" }
  };

  const res2 = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload2)
  });
  const data2 = await res2.json();
  console.log("\nVALID ANSWER TEST RESULT:", data2.candidates[0].content.parts[0].text);
}

test().catch(console.error);

