import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/src/lib/firebase-admin';

// Initialize Gemini AI (optional - used only for response phrasing)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    console.log(`\n========== BUNK AI REQUEST ==========`);
    console.log(`Message: "${message}"`);
    console.log(`User ID: ${userId}`);

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // STEP 1: NORMALIZE MESSAGE
    const normalizedMessage = message.toLowerCase().trim();

    // STEP 2: HANDLE BASIC CHAT FIRST (PROGRAMMATIC RESPONSES)

    // Greetings
    if (/^(hi|hello|hey|yo)$/i.test(normalizedMessage)) {
      const response = "Hi there! I'm your Bunking Assistant. Ask me if you can safely skip a class!";
      console.log(`Chat response: greeting`);

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: response,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response });
    }

    if (/good (morning|afternoon|evening|night)/i.test(normalizedMessage)) {
      const response = "Good day! How can I help you with your attendance today?";
      console.log(`Chat response: time greeting`);

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: response,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response });
    }

    // Small talk
    if (/how are you|how're you|what'?s up|wassup/i.test(normalizedMessage)) {
      const response = "I'm doing great! Ready to help you manage your attendance. What would you like to know?";
      console.log(`Chat response: how are you`);

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: response,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response });
    }

    if (/^(thanks|thank you|thankyou|thx|ty)$/i.test(normalizedMessage)) {
      const response = "You're welcome! Feel free to ask if you need help with attendance or bunking decisions.";
      console.log(`Chat response: thanks`);

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: response,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response });
    }

    if (/^(bye|goodbye|see you|cya|later)$/i.test(normalizedMessage)) {
      const response = "Goodbye! Come back anytime you need attendance advice.";
      console.log(`Chat response: goodbye`);

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: response,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response });
    }

    // Identity questions
    if (/who are you|what (are|do) you|what'?s your (name|purpose)|help me/i.test(normalizedMessage)) {
      const response = "I'm your Bunking Assistant! I help you decide if you can safely skip a class based on your attendance. Just ask me something like 'Can I bunk Physics?' and I'll check your attendance and let you know!";
      console.log(`Chat response: identity/help`);

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: response,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response });
    }

    // STEP 2.5: HANDLE SUBJECT LISTING QUERIES
    if (/what subjects|my subjects|which subjects|list (my )?subjects|subjects (do )?i have/i.test(normalizedMessage)) {
      console.log(`Chat response: subject listing`);

      try {
        // Fetch user's courses from Firestore
        const coursesSnapshot = await adminDb
          .collection('users')
          .doc(userId)
          .collection('courses')
          .get();

        if (coursesSnapshot.empty) {
          const response = "You haven't added any subjects yet. Please add your courses in the Classes section first.";

          await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
            text: message,
            isUser: true,
            timestamp: new Date(),
          });

          await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
            text: response,
            isUser: false,
            timestamp: new Date(),
          });

          return NextResponse.json({ response });
        }

        // Extract subject names
        const subjects: string[] = [];
        coursesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name) {
            subjects.push(data.name);
          }
        });

        const response = subjects.length > 0
          ? `You currently have the following subjects: ${subjects.join(', ')}.`
          : "You haven't added any subjects yet.";

        await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
          text: message,
          isUser: true,
          timestamp: new Date(),
        });

        await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
          text: response,
          isUser: false,
          timestamp: new Date(),
        });

        return NextResponse.json({ response });
      } catch (error) {
        console.error('Error fetching subjects:', error);
        const response = "I had trouble fetching your subjects. Please try again.";

        await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
          text: message,
          isUser: true,
          timestamp: new Date(),
        });

        await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
          text: response,
          isUser: false,
          timestamp: new Date(),
        });

        return NextResponse.json({ response });
      }
    }

    // STEP 3: DETECT ATTENDANCE / BUNK QUERY
    const isAttendanceQuery = /bunk|skip|miss|attendance/i.test(normalizedMessage);

    console.log(`Attendance query detected: ${isAttendanceQuery}`);

    if (!isAttendanceQuery) {
      // STEP 6: FALLBACK for unrecognized messages
      const response = "I can help you with attendance and bunking questions. Try asking something like 'Can I bunk Physics?' or 'What's my attendance?'";
      console.log(`Fallback response`);

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: response,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response });
    }

    // STEP 4: EXECUTE BUNK LOGIC (MANDATORY)
    console.log(`Executing attendance logic...`);

    // Fetch user's course data from Firestore
    const coursesSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('courses')
      .get();

    if (coursesSnapshot.empty) {
      const fallbackResponse = "You haven't added any courses yet. Please add courses first to check bunking safety.";

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response: fallbackResponse });
    }

    // Build attendance data
    const coursesData: Record<string, any> = {};
    coursesSnapshot.forEach((doc) => {
      const data = doc.data();
      coursesData[data.name] = {
        attended: data.attendedClasses || 0,
        total: data.totalClasses || 0,
        minRequired: data.minAttendance || 75,
      };
    });

    // Extract subject from user message with improved matching
    const subjectNames = Object.keys(coursesData);
    const messageLower = message.toLowerCase().trim();

    let targetSubject: string | null = null;
    let matchScore = 0;

    // Try exact and partial matches
    for (const subject of subjectNames) {
      const subjectLower = subject.toLowerCase();

      // Exact match (highest priority)
      if (messageLower.includes(subjectLower)) {
        targetSubject = subject;
        matchScore = 100;
        break;
      }

      // Partial match - subject starts with word in message
      const words = messageLower.split(/\s+/);
      for (const word of words) {
        if (word.length >= 3) {
          // Forward match: "phy" matches "Physics"
          if (subjectLower.startsWith(word) && matchScore < 80) {
            targetSubject = subject;
            matchScore = 80;
          }
          // Backward match: "physics" matches "Advanced Physics"
          if (subjectLower.includes(word) && matchScore < 60) {
            targetSubject = subject;
            matchScore = 60;
          }
        }
      }
    }

    console.log(`Subject extraction: message="${message}", detected="${targetSubject}", score=${matchScore}`);

    // If no subject detected, ask for clarification
    if (!targetSubject) {
      const availableSubjects = subjectNames.join(', ');
      const clarificationResponse = `I couldn't identify which subject you're asking about. Please specify one of your subjects: ${availableSubjects}`;

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      await adminDb.collection('users').doc(userId).collection('bunkChatMessages').add({
        text: clarificationResponse,
        isUser: false,
        timestamp: new Date(),
      });

      return NextResponse.json({ response: clarificationResponse });
    }

    // ===== CALCULATE BUNK DECISION (DETERMINISTIC) =====
    const data = coursesData[targetSubject];
    const { attended, total, minRequired } = data;

    console.log(`Bunk calculation for ${targetSubject}: attended=${attended}, total=${total}, minRequired=${minRequired}`);

    let deterministicResponse = '';

    if (total === 0) {
      deterministicResponse = `No classes recorded yet for ${targetSubject}. You currently have 0% attendance. You should attend classes to build up your attendance before considering bunking.`;
      console.log(`Result: No data available`);
    } else {
      // Current percentage
      const currentPercentage = (attended / total) * 100;

      // Calculate percentage after bunking one class
      const newTotal = total + 1;
      const newPercentage = (attended / newTotal) * 100;

      // Calculate safe bunks
      let safeBunks = 0;
      let tempTotal = total;
      while ((attended / (tempTotal + 1)) * 100 >= minRequired) {
        safeBunks++;
        tempTotal++;
      }

      const canBunk = newPercentage >= minRequired;

      console.log(`Calculation: current=${currentPercentage.toFixed(1)}%, afterBunk=${newPercentage.toFixed(1)}%, canBunk=${canBunk}, safeBunks=${safeBunks}`);

      // Build deterministic response
      if (canBunk) {
        deterministicResponse = `Yes, you can bunk ${targetSubject}. Your current attendance is ${currentPercentage.toFixed(1)}% (${attended}/${total} classes). After bunking one class, it would be ${newPercentage.toFixed(1)}%, which is still above the required ${minRequired}%. You can safely bunk ${safeBunks} more class(es).`;
      } else {
        deterministicResponse = `No, you should not bunk ${targetSubject}. Your current attendance is ${currentPercentage.toFixed(1)}% (${attended}/${total} classes). After bunking one class, it would drop to ${newPercentage.toFixed(1)}%, which is below the required ${minRequired}%. You need to attend classes to maintain your attendance.`;
      }
    }

    // STEP 5: OPTIONAL AI REPHRASING
    let finalResponse = deterministicResponse;

    console.log(`Deterministic response ready: "${deterministicResponse}"`);

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const enhancementPrompt = `Rephrase this attendance advice in a conversational, friendly way (2-3 sentences max):

"${deterministicResponse}"

Keep the YES/NO decision, percentages, and numbers exactly the same. Just make it sound more natural.`;

        const result = await model.generateContent(enhancementPrompt);
        const enhancedText = result.response.text();

        // Only use enhanced version if it's valid
        if (enhancedText && enhancedText.length > 10) {
          finalResponse = enhancedText;
          console.log(`Enhanced response: "${enhancedText}"`);
        }
      } catch (error) {
        // Silently fall back to deterministic response
        console.log('Gemini unavailable for attendance query, using deterministic response');
      }
    } else {
      console.log('Gemini not configured, using deterministic response');
    }

    console.log(`Final response to send: "${finalResponse}"`);

    // Store chat history
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('bunkChatMessages')
      .add({
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('bunkChatMessages')
      .add({
        text: finalResponse,
        isUser: false,
        timestamp: new Date(),
      });

    console.log(`========== BUNK AI RESPONSE SENT ==========\n`);
    return NextResponse.json({ response: finalResponse });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
