import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ---------- INTENT CLASSIFIER ----------
const INTENT_PROMPT = `
Classify the user message.

Return ONLY valid JSON:
{
  "intent": "chat" | "schedule"
}

Rules:
- Greetings, questions, casual talk → "chat"
- Add / move / remove / reschedule tasks → "schedule"
`;

// ---------- SCHEDULER PROMPT ----------
const SCHEDULER_PROMPT = `
You are an AI scheduling agent.

Return ONLY valid JSON (no text, no markdown).

Example task object:
{
  "task": "Study",
  "start": "18:00",
  "end": "20:00",
  "priority": "high"
}


Rules:
- Every task MUST include a priority: high, medium, or low
- Assign priority based on importance, urgency, and consequences
- Studying, exams, deadlines, and academic work are typically high priority
- Practice, gym, skill-building are typically medium priority
- Leisure and rest are typically low priority
- Use your judgment — do not guess randomly
- Be consistent across the schedule
- Return the FULL updated schedule
- CRITICAL: NEVER schedule tasks over blocks marked with "isClass": true - classes are IMMUTABLE and CANNOT BE MOVED
- If you see tasks with "isClass": true in the current schedule, preserve them EXACTLY as they are
- Do NOT overlap with class times under any circumstances
- If the user requests to move, reschedule, or delete a class, you MUST return an error instead of a schedule
- Classes have fixed times and cannot be changed by scheduling requests

TIME MANAGEMENT RULES:
- CRITICAL: NO OVERLAPPING TASKS - Every task must have a unique, non-overlapping time slot
- When inserting a new task into an existing time slot, adjust the surrounding tasks to fill ALL time
- If a task from 2:00-4:00 exists and user adds a task from 2:00-3:00, the original task should become 3:00-4:00
- NEVER create tasks with overlapping time ranges (e.g., 2:00-4:00 and 3:00-5:00 is FORBIDDEN)
- NEVER leave gaps or unscheduled time - if there are gaps, add "Free Time" blocks with priority "low"
- Ensure all tasks are contiguous and account for all hours in the day
- When removing or moving tasks, either extend adjacent tasks or add "Free Time" to fill the gap
- Double-check all time ranges to ensure no two tasks on the same day overlap
`;

function overlaps(a: any, b: any) {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
}


function chronotypeRules(animal: string | null) {
  if (!animal) {
    return `
User has no chronotype data.
Use a balanced, neutral schedule.
    `;
  }

  switch (animal.toLowerCase()) {
    case "lion":
      return `
User is a LION chronotype.
Peak focus: early morning (5:00–11:00).
Schedule high-priority tasks early.
Avoid late-night work.
      `;
    case "bear":
      return `
User is a BEAR chronotype.
Peak focus: 9:00–17:00.
Follow a standard daytime schedule.
      `;
    case "wolf":
      return `
User is a WOLF chronotype.
Peak focus: 15:00–23:00.
Avoid early-morning high-priority tasks.
      `;
    case "dolphin":
      return `
User is a DOLPHIN chronotype.
Focus comes in short bursts.
Prefer shorter tasks with breaks.
Avoid very late nights.
      `;
    default:
      return "";
  }
}



export async function POST(req: Request) {
  try {
    const { message, messages, currentSchedule,userId } = await req.json();

    let chronotype: string | null = null;

    if (userId){
      const snap = await getDoc(doc(db,"users",userId));
      if (snap.exists()){
        chronotype = snap.data()?.animal ?? null;
      }
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    // ---------- BUILD MEMORY ----------
    const chatHistory = messages
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    // ---------- 1️⃣ INTENT ----------
    const intentRes = await model.generateContent(`
${INTENT_PROMPT}

CONVERSATION:
${chatHistory}

LAST_MESSAGE:
"${message}"
`);

    const { intent } = JSON.parse(intentRes.response.text().replace(/```json|```/g, "").trim());

    // ---------- 2️⃣ CHAT ----------
    if (intent === "chat") {
      const chatRes = await model.generateContent(`
You are a helpful AI assistant.
Continue the conversation naturally.

The user has the following weekly schedule:
${JSON.stringify(currentSchedule, null, 2)}

Use it ONLY if relevant.

Conversation so far:  
${chatHistory}

ASSISTANT:
`);

      return NextResponse.json({
        type: "chat",
        reply: chatRes.response.text(),
      });
    }

    // ---------- 3️⃣ SCHEDULE ----------
    const scheduleRes = await model.generateContent(`
${SCHEDULER_PROMPT}


CHRONOTYPE_CONTEXT:
${chronotypeRules(chronotype)}

IMPORTANT:
- Respect the user's chronotype when scheduling
- Place high-priority tasks inside peak focus hours, when possible
- If the user's request conflicts with chronotype, adjust intelligently

CONVERSATION:
${chatHistory}

CURRENT_SCHEDULE:
${JSON.stringify(currentSchedule, null, 2)}

USER_REQUEST:
"${message}"
`);

  const rawSchedule = JSON.parse(
    scheduleRes.response.text().replace(/```json|```/g, "").trim()
  );

  for (const day of Object.keys(rawSchedule.days)) {
    rawSchedule.days[day] = rawSchedule.days[day].map((b: any) => {
      if (!["high", "medium", "low"].includes(b.priority)) {
        throw new Error("Invalid priority returned by model");
      }
      return b;
    });
  }


  const conflicts = [];
  const classConflicts = [];
  const movedOrDeletedClasses = [];
  const internalOverlaps = [];

  for (const day of Object.keys(rawSchedule.days)) {
  const oldDayBlocks = currentSchedule.days?.[day] ?? [];
  const newDayBlocks = rawSchedule.days[day] ?? [];

  // Get immutable classes for this day (no classes on weekends)
  const classBlocks = oldDayBlocks.filter((b: any) => b.isClass);

  // ---------- CHECK IF CLASSES WERE MOVED OR DELETED (only for weekdays) ----------
  if (day !== "Saturday" && day !== "Sunday") {
    for (const classBlock of classBlocks) {
      const classStillExists = newDayBlocks.some((b: any) =>
        b.isClass &&
        b.task === classBlock.task &&
        b.start === classBlock.start &&
        b.end === classBlock.end
      );

      if (!classStillExists) {
        movedOrDeletedClasses.push({
          day,
          class: classBlock
        });
      }
    }

    // ---------- CLASS CONFLICT CHECK (only for weekdays) ----------
    for (const newB of newDayBlocks) {
      if (newB.isClass) continue;

      for (const classBlock of classBlocks) {
        if (
          overlaps(
            { start: newB.start, end: newB.end },
            { start: classBlock.start, end: classBlock.end }
          )
        ) {
          classConflicts.push({
            day,
            class: classBlock,
            conflicting: newB,
          });
        }
      }
    }
  }

  // ---------- INTERNAL OVERLAP CHECK (all days including weekends) ----------
  for (let i = 0; i < newDayBlocks.length; i++) {
    for (let j = i + 1; j < newDayBlocks.length; j++) {
      const blockA = newDayBlocks[i];
      const blockB = newDayBlocks[j];

      if (overlaps(blockA, blockB)) {
        internalOverlaps.push({
          day,
          task1: blockA.task,
          time1: `${blockA.start}-${blockA.end}`,
          task2: blockB.task,
          time2: `${blockB.start}-${blockB.end}`
        });
      }
    }
  }

  // ---------- HIGH PRIORITY CONFLICT CHECK (all days) ----------
  for (const oldB of oldDayBlocks) {
    for (const newB of newDayBlocks) {
      const oldPriority = oldB.priority ?? "high";

      // Only check conflicts for non-class tasks
      if (
        overlaps(oldB, newB) &&
        oldPriority === "high" &&
        !oldB.isClass &&
        !newB.isClass
      ) {
        conflicts.push({ day, old: oldB, new: newB });
      }
    }
  }
}


  // Check for internal overlaps first (critical error in AI-generated schedule)
  if (internalOverlaps.length > 0) {
    const overlapMessages = internalOverlaps.slice(0, 3).map(o =>
      `${o.task1} (${o.time1}) overlaps with ${o.task2} (${o.time2}) on ${o.day}`
    ).join("; ");

    return NextResponse.json({
      type: "chat",
      reply: `❌ Schedule conflict detected: ${overlapMessages}. Tasks cannot overlap with each other. Please rephrase your request to avoid time conflicts.`,
    });
  }

  // Classes cannot be moved, deleted, or overridden - reject immediately
  if (movedOrDeletedClasses.length > 0) {
    const uniqueMoved = Array.from(new Map(
      movedOrDeletedClasses.map(c => [`${c.day}-${c.class.task}-${c.class.start}`, c])
    ).values());

    const classNames = uniqueMoved.map(c =>
      `${c.class.task} (${c.class.start} - ${c.class.end}) on ${c.day}`
    ).join(", ");

    return NextResponse.json({
      type: "chat",
      reply: `❌ Cannot move or delete classes. The following classes cannot be changed: ${classNames}. Classes are immutable and have fixed times. If you need to modify your class schedule, please update it in the courses section.`,
    });
  }

  if (classConflicts.length > 0) {
    const uniqueConflicts = Array.from(new Map(
      classConflicts.map(c => [`${c.day}-${c.class.task}-${c.class.start}`, c])
    ).values());

    const classNames = uniqueConflicts.map(c =>
      `${c.class.task} (${c.class.start} - ${c.class.end}) on ${c.day}`
    ).join(", ");

    return NextResponse.json({
      type: "chat",
      reply: `❌ Cannot schedule tasks during class times. The following classes conflict with your request: ${classNames}. Classes are immutable and cannot be moved or overridden. Please choose a different time slot.`,
    });
  }

  if (conflicts.length > 0) {
  const conflict = conflicts[0];

  return NextResponse.json({
    type: "confirmation",
    message: `❌ **${conflict.new.task}** overlaps with a **high-priority task** (${conflict.old.task}, ${conflict.old.start}–${conflict.old.end}).  
Do you want to replace it anyway?`,
    pendingSchedule: rawSchedule,
    conflicts,
  });
}


  return NextResponse.json({
    type: "schedule",
    reply: JSON.stringify(rawSchedule),
  });





  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gemini failed" },
      { status: 500 }
    );
  }
}