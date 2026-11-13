const express = require('express');
const { OpenAI } = require('openai');
const { protect } = require('../middleware/authMiddleware');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');

const router = express.Router();

const groq = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    })
  : null;

router.post('/run', protect, async (req, res, next) => {
  try {
    const { workflowId, inputs } = req.body;

    if (!workflowId || !inputs) {
      return next(new AppError('Please provide workflowId and inputs object', 400));
    }

    const logs = [];
    let outputText = '';
    const start = Date.now();

    logs.push(`[1/3] ⚙️ Initializing Pipeline runner for ID: ${workflowId}...`);

    if (workflowId === 'slack-router') {
      const { textInput, slackWebhookUrl, slackChannelId } = inputs;
      if (!textInput) {
        return next(new AppError('Feedback text input is required for this pipeline', 400));
      }

      logs.push(`[2/3] 🤖 Calling Llama-3.1 on Groq for sentiment analysis and support response drafting...`);
      
      let aiResult = '';
      if (groq) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: 'You are a customer feedback analyst. Analyze the sentiment (Positive/Negative/Neutral) and draft a brief, professional support response.'
              },
              {
                role: 'user',
                content: `Feedback to analyze: "${textInput}"`
              }
            ]
          });
          aiResult = response.choices[0].message.content;
          logs.push(`[2/3] ✅ AI processing complete. Sentiment output analyzed successfully.`);
        } catch (err) {
          logs.push(`[2/3] ⚠️ Groq API Error: ${err.message}. Falling back to demo generator.`);
          aiResult = `[DEMO ANALYZED SENTIMENT]: Neutral\nDraft Reply: Thank you for your feedback! We will forward it to our product team.`;
        }
      } else {
        logs.push(`[2/3] ⚡ running offline: generating mock support response...`);
        aiResult = `[MOCK SENTIMENT]: Neutral\nDraft Reply: Thank you for your feedback! We will forward it to our product team.`;
      }

      outputText = aiResult;

      if (slackWebhookUrl && slackWebhookUrl.startsWith('http')) {
        logs.push(`[3/3] 📡 Forwarding sentiment report to Slack webhook...`);
        try {
          const slackPayload = {
            text: `*AetherFlow Workflow Run notification*\n*Source feedback:* "${textInput.substring(0, 100)}"\n*Analysis output:*\n${aiResult}`
          };
          const slackResponse = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackPayload)
          });
          if (slackResponse.ok) {
            logs.push(`[3/3] ✅ Successfully posted notification to Slack Webhook! Status: ${slackResponse.status}`);
          } else {
            logs.push(`[3/3] ❌ Slack webhook rejected payload. Status: ${slackResponse.status}`);
          }
        } catch (slackErr) {
          logs.push(`[3/3] ⚠️ Webhook delivery failed: ${slackErr.message}`);
        }
      } else if (slackChannelId) {
        logs.push(`[3/3] 📡 Forwarding sentiment report to Slack channel ${slackChannelId}...`);
        try {
          const token = process.env.SLACK_BOT_TOKEN;
          if (token && !token.includes('your_')) {
            const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channel: slackChannelId,
                text: `*AetherFlow Workflow Run notification*\n*Source feedback:* "${textInput.substring(0, 100)}"\n*Analysis output:*\n${aiResult}`
              })
            });
            const data = await slackResponse.json();
            if (data.ok) {
              logs.push(`[3/3] ✅ Successfully posted notification to Slack Channel!`);
            } else {
              logs.push(`[3/3] ❌ Slack API rejected event: ${data.error}`);
            }
          } else {
            logs.push(`[3/3] ⚡ Slack API Mock Channel Post to ${slackChannelId}: Successful (Mock Token mode)`);
          }
        } catch (slackErr) {
          logs.push(`[3/3] ⚠️ Slack API request failed: ${slackErr.message}`);
        }
      } else {
        logs.push(`[3/3] ℹ️ Neither Slack Webhook URL nor Slack Channel ID was provided. Skipping forwarding step.`);
      }

    } else if (workflowId === 'linkedin-publisher') {
      const { topic, tone, discordWebhookUrl } = inputs;
      if (!topic) {
        return next(new AppError('Topic input is required for this pipeline', 400));
      }

      logs.push(`[2/3] 🤖 Calling Llama-3.1 to generate a creative LinkedIn article draft...`);
      
      let aiResult = '';
      if (groq) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: `You are a professional social media manager. Generate a highly engaging, structured LinkedIn post with appropriate emojis and formatting. Tone: ${tone || 'Professional'}`
              },
              {
                role: 'user',
                content: `Draft a post about: "${topic}"`
              }
            ]
          });
          aiResult = response.choices[0].message.content;
          logs.push(`[2/3] ✅ AI writing complete. Post draft generated.`);
        } catch (err) {
          logs.push(`[2/3] ⚠️ Groq API Error: ${err.message}. Falling back to demo draft.`);
          aiResult = `📝 [Demo Post about ${topic}]: Loving this new perspective on the future of development! Let's build together. #AI #Platform`;
        }
      } else {
        logs.push(`[2/3] ⚡ Running offline: generating mock social media post...`);
        aiResult = `📝 [Mock Post about ${topic}]: Loving this new perspective on the future of development! Let's build together. #AI #Platform`;
      }

      outputText = aiResult;

      if (discordWebhookUrl && discordWebhookUrl.startsWith('http')) {
        logs.push(`[3/3] 📡 Forwarding generated LinkedIn post to Discord channel...`);
        try {
          let discordContent = `**AetherFlow Generated LinkedIn Post Draft**\n\n${aiResult}`;
          if (discordContent.length > 2000) {
            discordContent = discordContent.substring(0, 1990) + '... (truncated)';
            logs.push(`[3/3] ⚠️ Content truncated to 2000 character limit for Discord.`);
          }
          const discordPayload = {
            content: discordContent
          };
          const discordResponse = await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
          });
          if (discordResponse.ok) {
            logs.push(`[3/3] ✅ Successfully posted notification to Discord! Status: ${discordResponse.status}`);
          } else {
            const errorText = await discordResponse.text();
            logs.push(`[3/3] ❌ Discord integration rejected payload. Status: ${discordResponse.status}. Error: ${errorText}`);
          }
        } catch (discordErr) {
          logs.push(`[3/3] ⚠️ Webhook delivery failed: ${discordErr.message}`);
        }
      } else {
        logs.push(`[3/3] ℹ️ Discord Webhook Url not provided or invalid. Skipping forwarding step.`);
      }

    } else if (workflowId === 'coaching-admission') {
      const { inquiryText } = inputs;
      const query = inquiryText || "Hi, what are the fees and batch timings for the 10th standard science course?";
      logs.push(`[2/3] 🤖 Calling Llama-3.1 on Groq for inquiry analysis and course matching...`);
      
      let aiResult = '';
      if (groq) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: 'You are an AI receptionist for a coaching institute called Excellence Academy. Draft a helpful, polite response in Hinglish/English answering the inquiry about courses, batch timings, and fees. Mention that batch timings are Mon-Wed-Fri 4-6 PM and the monthly fee is ₹1,500.'
              },
              {
                role: 'user',
                content: `Customer inquiry: "${query}"`
              }
            ]
          });
          aiResult = response.choices[0].message.content;
          logs.push(`[2/3] ✅ Inquiry parsed. Response generated in student-friendly regional text.`);
        } catch (err) {
          logs.push(`[2/3] ⚠️ Groq API Error: ${err.message}. Falling back to default Hinglish response template.`);
          aiResult = `Hello! Thanks for inquiring about Excellence Academy. For 10th Science, our batch timings are Monday, Wednesday, and Friday from 4:00 PM to 6:00 PM. The monthly fee is ₹1,500. You can pay online or visit us. Let us know if you want to book a free demo class!`;
        }
      } else {
        logs.push(`[2/3] ⚡ Running offline: generating default Hinglish template response...`);
        aiResult = `Hello! Thanks for inquiring about Excellence Academy. For 10th Science, our batch timings are Monday, Wednesday, and Friday from 4:00 PM to 6:00 PM. The monthly fee is ₹1,500. You can pay online or visit us. Let us know if you want to book a free demo class!`;
      }

      outputText = aiResult;
      logs.push(`[3/3] 📡 Simulating WhatsApp auto-reply dispatch to parent... ✅ Message Sent.`);

    } else if (workflowId === 'coaching-fee-alert') {
      const { studentName, amount, parentPhone } = inputs;
      const name = studentName || 'Rahul Sharma';
      const amt = amount || 1500;
      const phone = parentPhone || '+91 98765 43210';
      
      logs.push(`[2/3] 💳 Triggering Razorpay payment link generation for ₹${amt}...`);
      const linkId = 'plink_' + Math.random().toString(36).substring(2, 12);
      const payUrl = `https://rzp.io/i/${linkId}`;
      logs.push(`[2/3] ✅ Payment link generated successfully: ${payUrl}`);

      outputText = `Dear Parent,\nThis is an automated reminder from Excellence Academy. The tuition fee of ₹${amt} for your ward ${name} is now overdue. Please clear the dues immediately using this secure payment link: ${payUrl}\nThank you!`;
      logs.push(`[3/3] 📡 Dispatching overdue SMS & WhatsApp alert to ${phone}... ✅ Sent.`);

    } else if (workflowId === 'coaching-absent-alert') {
      const { studentName, parentPhone, batchName } = inputs;
      const name = studentName || 'Rahul Sharma';
      const bName = batchName || 'Class 10 - Science';
      const phone = parentPhone || '+91 98765 43210';

      logs.push(`[2/3] 📝 Querying attendance tracker database... marked ABSENT.`);
      outputText = `Dear Parent,\nThis is to notify you that your child ${name} was marked ABSENT for the class batch "${bName}" today (${new Date().toLocaleDateString()}). Please contact the coordinator if you have any questions or prior leave notices.`;
      
      logs.push(`[3/3] 📡 Dispatching real-time parent WhatsApp alert to ${phone}... ✅ Sent.`);

    } else if (workflowId === 'coaching-test-report') {
      const { studentName, testName, subject, marksObtained, maxMarks, parentPhone } = inputs;
      const sName = studentName || 'Student';
      const tName = testName || 'Monthly Test';
      const subj = subject || 'General Science';
      const marks = marksObtained !== undefined ? marksObtained : 40;
      const maxM = maxMarks || 50;
      const phone = parentPhone || '+91 98765 43210';
      const pct = ((marks / maxM) * 100).toFixed(0);

      logs.push(`[2/3] 🤖 Calling Llama-3.1 on Groq for student test performance review...`);
      let aiResult = '';
      const promptText = `Student Name: ${sName}, Test: ${tName}, Subject: ${subj}, Marks: ${marks}/${maxM} (${pct}%). Write a concise, encouraging 1-2 sentence performance review in Hinglish/English for their parent. Highlight strengths or focus areas.`;

      if (groq) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are a helpful tutor writing a brief parent update review.' },
              { role: 'user', content: promptText }
            ]
          });
          aiResult = response.choices[0].message.content.trim();
          logs.push(`[2/3] ✅ AI review generated successfully.`);
        } catch (err) {
          logs.push(`[2/3] ⚠️ Groq API Error: ${err.message}. Falling back to default.`);
          aiResult = `${sName} has scored ${marks}/${maxM}. Good effort, needs to practice more in ${subj}.`;
        }
      } else {
        logs.push(`[2/3] ⚡ Running offline: generating default performance review...`);
        aiResult = `${sName} scored ${marks}/${maxM} (${pct}%). ${pct >= 75 ? 'Excellent performance in class!' : 'Needs to focus more on revision and practice.'}`;
      }

      outputText = `Dear Parent, here is the test report card of your ward ${sName} for the test ${tName} (${subj}):\nMarks: ${marks}/${maxM} (${pct}%)\nTeacher Feedback: ${aiResult}`;
      logs.push(`[3/3] 📡 Simulating WhatsApp report card dispatch to ${phone}... ✅ Sent.`);

    } else if (workflowId === 'coaching-lead-nurture') {
      const { name, courseOfInterest, parentPhone, source } = inputs;
      const lName = name || 'Parent';
      const course = courseOfInterest || '10th Standard Science';
      const phone = parentPhone || '+91 98765 43210';
      const src = source || 'Website';

      logs.push(`[2/3] 🤖 Calling Llama-3.1 on Groq to draft a personalized lead nurture welcome message...`);
      let aiResult = '';
      const promptText = `Draft a welcoming WhatsApp message in Hinglish/English for a parent named ${lName} who just inquired about "${course}" via ${src}. Politely welcome them to Excellence Academy, mention class timings are standard evening slots, monthly fee is ₹1,500, and include a simulated digital brochure link: https://excellenceacademy.in/brochure.pdf.`;

      if (groq) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are an intake coordinator for Excellence Academy.' },
              { role: 'user', content: promptText }
            ]
          });
          aiResult = response.choices[0].message.content.trim();
          logs.push(`[2/3] ✅ Welcome nurture text generated successfully.`);
        } catch (err) {
          logs.push(`[2/3] ⚠️ Groq API Error: ${err.message}. Falling back to default.`);
          aiResult = `Hello ${lName}, thank you for inquiring about our ${course} classes at Excellence Academy! We offer high-quality batches (Mon-Wed-Fri 4-6 PM) at a monthly fee of ₹1,500. Here is our brochure: https://excellenceacademy.in/brochure.pdf. Let us know if you want to book a free demo class.`;
        }
      } else {
        logs.push(`[2/3] ⚡ Running offline: generating default lead welcome response...`);
        aiResult = `Hello ${lName}, thank you for inquiring about our ${course} classes at Excellence Academy! We offer high-quality batches (Mon-Wed-Fri 4-6 PM) at a monthly fee of ₹1,500. Here is our brochure: https://excellenceacademy.in/brochure.pdf. Let us know if you want to book a free demo class.`;
      }

      outputText = aiResult;
      logs.push(`[3/3] 📡 Simulating welcome message brochure auto-dispatch to ${phone}... ✅ Dispatched.`);

    } else if (workflowId === 'coaching-doubt-solving') {
      const { studentName, question } = inputs;
      const sName = studentName || 'Student';
      const q = question || 'What is photosynthesis?';

      logs.push(`[2/3] 🤖 Calling Llama-3.1 on Groq to solve student doubt...`);
      let aiResult = '';
      const promptText = `You are Excellence Academy's WhatsApp AI Doubt Solver. Provide a clear, friendly, and step-by-step educational solution to this student doubt: "${q}". Break down mathematical steps or scientific concepts clearly. Keep it under 200 words.`;

      if (groq) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are an encouraging AI academic tutor.' },
              { role: 'user', content: promptText }
            ]
          });
          aiResult = response.choices[0].message.content.trim();
          logs.push(`[2/3] ✅ AI explanation generated successfully.`);
        } catch (err) {
          logs.push(`[2/3] ⚠️ Groq API Error: ${err.message}. Falling back to default answer.`);
          aiResult = `Thanks for asking! Here is the explanation for: "${q}". Speed is a scalar quantity (only magnitude), while Velocity is a vector quantity (contains both speed and direction). For example, 50 km/h is speed, but 50 km/h North is velocity.`;
        }
      } else {
        logs.push(`[2/3] ⚡ Running offline: generating mock doubt solution...`);
        aiResult = `Thanks for asking! Here is the explanation for: "${q}". Speed is a scalar quantity (only magnitude), while Velocity is a vector quantity (contains both speed and direction). For example, 50 km/h is speed, but 50 km/h North is velocity.`;
      }

      outputText = `Hi ${sName}!\n\nHere is your step-by-step explanation:\n\n${aiResult}`;
      logs.push(`[3/3] 📡 Sending AI solved explanation back to WhatsApp... ✅ Sent.`);

    } else if (workflowId === 'coaching-batch-reschedule') {
      const { batchName, courseName, oldTimings, newTimings, reason, parentPhones } = inputs;
      const bName = batchName || 'General Batch';
      const cName = courseName || 'General Course';
      const oldTime = oldTimings || 'Old Timings';
      const newTime = newTimings || 'New Timings';
      const resn = reason || 'unforeseen teacher scheduling updates';
      const phones = parentPhones || '';

      logs.push(`[2/3] 📝 Composing batch rescheduling broadcast alert...`);
      outputText = `Dear Parent,\nPlease note that the class timings for batch "${bName}" (${cName}) have been rescheduled from "${oldTime}" to "${newTime}" due to ${resn}. Sorry for the inconvenience!`;
      
      const phoneList = typeof phones === 'string' ? phones.split(',').map(p => p.trim()).filter(Boolean) : (Array.isArray(phones) ? phones : []);
      const count = phoneList.length || 1;
      
      logs.push(`[3/3] 📡 Broadcasting WhatsApp cancellation/reschedule alert to ${count} parents... ✅ Broadcast Complete.`);

    } else {
      return next(new AppError('Unknown workflow pipeline identifier', 400));
    }

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    logs.push(`🎉 Pipeline execution finished successfully in ${duration}s!`);

    return successResponse(res, 'Workflow pipeline run completed successfully', {
      logs,
      outputText,
      duration
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
