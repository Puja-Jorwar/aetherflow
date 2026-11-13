const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/pgDb');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { OpenAI } = require('openai');

const groq = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    })
  : null;

// Helper to map DB snake_case columns to React camelCase properties for backward compatibility
const mapStudent = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    businessId: row.business_id,
    studentName: row.student_name,
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    email: row.email,
    admissionNumber: row.admission_number,
    joinedDate: row.joined_date,
    status: row.status || 'Active'
  };
};

const mapLead = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.student_name,
    parentPhone: row.phone,
    email: row.email,
    courseOfInterest: row.course_of_interest || row.course || 'Science',
    source: row.source,
    status: row.status,
    notes: row.notes || ''
  };
};

const mapDoubt = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentName: row.student_name,
    question: row.question,
    aiResponse: row.ai_response,
    createdAt: row.created_at
  };
};

// Helper to find or create course for batch compatibility
async function getOrCreateCourse(businessId, courseName) {
  const existing = await db.query(
    'SELECT id FROM courses WHERE business_id = $1 AND name = $2',
    [businessId, courseName]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  const created = await db.query(
    'INSERT INTO courses (business_id, name, total_fees) VALUES ($1, $2, 0) RETURNING id',
    [businessId, courseName]
  );
  return created.rows[0].id;
}

// 1. GET all students
router.get('/students', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM student_profiles WHERE business_id = $1 ORDER BY created_at DESC',
      [req.businessId]
    );
    const students = result.rows.map(mapStudent);
    return successResponse(res, 'Students fetched successfully', students);
  } catch (err) {
    next(err);
  }
});

// 2. POST create/enroll a student
router.post('/students', protect, async (req, res, next) => {
  try {
    const { studentName, parentName, parentPhone, email, admissionNumber, joinedDate, status } = req.body;
    if (!studentName || !parentPhone || !admissionNumber) {
      return next(new AppError('Please provide studentName, parentPhone, and admissionNumber', 400));
    }
    
    // Check if duplicate admission number under same tenant
    const existing = await db.query(
      'SELECT id FROM student_profiles WHERE business_id = $1 AND admission_number = $2',
      [req.businessId, admissionNumber]
    );
    if (existing.rows.length > 0) {
      return next(new AppError(`Admission Number ${admissionNumber} already exists for your organization`, 400));
    }

    const result = await db.query(
      `INSERT INTO student_profiles (business_id, student_name, parent_name, parent_phone, email, admission_number, joined_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.businessId,
        studentName,
        parentName || '',
        parentPhone,
        email || '',
        admissionNumber,
        joinedDate || new Date().toISOString().split('T')[0]
      ]
    );

    return successResponse(res, 'Student enrolled successfully', mapStudent(result.rows[0]), 201);
  } catch (err) {
    next(err);
  }
});

// 3. GET all batches
router.get('/batches', protect, async (req, res, next) => {
  try {
    // Join batches and courses to retrieve courseName
    const batchResult = await db.query(
      `SELECT b.id, b.name, b.timings, c.name as "courseName"
       FROM batches b
       JOIN courses c ON b.course_id = c.id
       WHERE c.business_id = $1
       ORDER BY b.created_at DESC`,
      [req.businessId]
    );

    const batches = [];
    for (const row of batchResult.rows) {
      // Find students enrolled in this batch
      const studentsResult = await db.query(
        `SELECT sp.* 
         FROM student_profiles sp
         JOIN enrollments e ON sp.id = e.student_id
         WHERE e.batch_id = $1 AND e.status = 'Active'`,
        [row.id]
      );
      
      batches.push({
        _id: row.id,
        id: row.id,
        name: row.name,
        courseName: row.courseName,
        timings: row.timings,
        students: studentsResult.rows.map(mapStudent)
      });
    }

    return successResponse(res, 'Batches fetched successfully', batches);
  } catch (err) {
    next(err);
  }
});

// 4. POST create a batch
router.post('/batches', protect, async (req, res, next) => {
  try {
    const { name, courseName, timings, students } = req.body;
    if (!name || !courseName || !timings) {
      return next(new AppError('Please provide name, courseName, and timings', 400));
    }

    // Get or Create Course ID
    const courseId = await getOrCreateCourse(req.businessId, courseName);

    const batchResult = await db.query(
      `INSERT INTO batches (course_id, name, timings)
       VALUES ($1, $2, $3) RETURNING *`,
      [courseId, name, timings]
    );
    const batch = batchResult.rows[0];

    // Enroll students if provided
    if (students && Array.isArray(students)) {
      for (const studentId of students) {
        await db.query(
          'INSERT INTO enrollments (student_id, batch_id, status) VALUES ($1, $2, \'Active\') ON CONFLICT DO NOTHING',
          [studentId, batch.id]
        );
      }
    }

    // Fetch populated student profiles
    const enrolledStudents = await db.query(
      `SELECT sp.* 
       FROM student_profiles sp
       JOIN enrollments e ON sp.id = e.student_id
       WHERE e.batch_id = $1`,
      [batch.id]
    );

    const responsePayload = {
      _id: batch.id,
      id: batch.id,
      name: batch.name,
      courseName,
      timings: batch.timings,
      students: enrolledStudents.rows.map(mapStudent)
    };

    return successResponse(res, 'Batch created successfully', responsePayload, 201);
  } catch (err) {
    next(err);
  }
});

// 5. POST enroll student in batch
router.post('/batches/:id/enroll', protect, async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return next(new AppError('Please provide studentId', 400));
    }

    const batchCheck = await db.query(
      `SELECT b.*, c.name as "courseName" FROM batches b JOIN courses c ON b.course_id = c.id WHERE b.id = $1 AND c.business_id = $2`,
      [req.params.id, req.businessId]
    );
    if (batchCheck.rows.length === 0) {
      return next(new AppError('Batch not found', 404));
    }
    const batch = batchCheck.rows[0];

    const studentCheck = await db.query(
      'SELECT * FROM student_profiles WHERE id = $1 AND business_id = $2',
      [studentId, req.businessId]
    );
    if (studentCheck.rows.length === 0) {
      return next(new AppError('Student not found or unauthorized', 404));
    }

    await db.query(
      'INSERT INTO enrollments (student_id, batch_id, status) VALUES ($1, $2, \'Active\') ON CONFLICT DO NOTHING',
      [studentId, batch.id]
    );

    const enrolledStudents = await db.query(
      `SELECT sp.* 
       FROM student_profiles sp
       JOIN enrollments e ON sp.id = e.student_id
       WHERE e.batch_id = $1`,
      [batch.id]
    );

    const responsePayload = {
      _id: batch.id,
      id: batch.id,
      name: batch.name,
      courseName: batch.courseName,
      timings: batch.timings,
      students: enrolledStudents.rows.map(mapStudent)
    };

    return successResponse(res, 'Student enrolled in batch successfully', responsePayload);
  } catch (err) {
    next(err);
  }
});

// 6. GET fee installments
router.get('/fees', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT f.*, sp.student_name, sp.parent_phone, sp.email, sp.admission_number
       FROM fee_installments f
       JOIN student_profiles sp ON f.student_id = sp.id
       WHERE sp.business_id = $1
       ORDER BY f.due_date ASC`,
      [req.businessId]
    );

    const fees = result.rows.map(row => ({
      _id: row.id,
      id: row.id,
      studentId: {
        _id: row.student_id,
        id: row.student_id,
        studentName: row.student_name,
        parentPhone: row.parent_phone,
        email: row.email,
        admissionNumber: row.admission_number
      },
      amount: Number(row.amount),
      dueDate: row.due_date,
      status: row.status,
      razorpayPaymentLinkId: row.razorpay_payment_link_id,
      paidAt: row.paid_at
    }));

    return successResponse(res, 'Fee installments fetched successfully', fees);
  } catch (err) {
    next(err);
  }
});

// 7. POST create fee installment
router.post('/fees', protect, async (req, res, next) => {
  try {
    const { studentId, amount, dueDate, status } = req.body;
    if (!studentId || !amount || !dueDate) {
      return next(new AppError('Please provide studentId, amount, and dueDate', 400));
    }

    const studentCheck = await db.query(
      'SELECT * FROM student_profiles WHERE id = $1 AND business_id = $2',
      [studentId, req.businessId]
    );
    if (studentCheck.rows.length === 0) {
      return next(new AppError('Student not found or unauthorized', 404));
    }

    const linkId = 'plink_' + Math.random().toString(36).substring(2, 12);

    const result = await db.query(
      `INSERT INTO fee_installments (student_id, amount, due_date, status, razorpay_payment_link_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [studentId, amount, dueDate, status || 'Unpaid', linkId]
    );
    const fee = result.rows[0];

    const responsePayload = {
      _id: fee.id,
      id: fee.id,
      studentId,
      amount: Number(fee.amount),
      dueDate: fee.due_date,
      status: fee.status,
      razorpayPaymentLinkId: fee.razorpay_payment_link_id
    };

    return successResponse(res, 'Fee installment created successfully', responsePayload, 201);
  } catch (err) {
    next(err);
  }
});

// 8. POST send manual fee reminder
router.post('/fees/:id/remind', protect, async (req, res, next) => {
  try {
    const feeResult = await db.query(
      `SELECT f.*, sp.student_name, sp.parent_phone
       FROM fee_installments f
       JOIN student_profiles sp ON f.student_id = sp.id
       WHERE f.id = $1 AND sp.business_id = $2`,
      [req.params.id, req.businessId]
    );

    if (feeResult.rows.length === 0) {
      return next(new AppError('Fee installment not found', 404));
    }
    const fee = feeResult.rows[0];

    const parentPhone = fee.parent_phone;
    const studentName = fee.student_name;
    const amount = fee.amount;
    const paymentLink = `https://rzp.io/i/${fee.razorpay_payment_link_id || 'mocklink'}`;
    const message = `Dear Parent, this is a reminder from Coaching Academy that the fee installment of ₹${amount} for ${studentName} is due. Please pay using this link: ${paymentLink}`;

    // Simulate sending WhatsApp alert
    console.log(`[WhatsApp Fee Reminder] To: ${parentPhone} | Message: ${message}`);

    // Log message to communications database table
    await db.query(
      `INSERT INTO messages (business_id, sender_type, recipient_phone, content, platform, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.businessId, 'System', parentPhone, message, 'WhatsApp', 'Sent']
    );

    return successResponse(res, `Fee reminder sent to parent's phone ${parentPhone} successfully!`, {
      phone: parentPhone,
      message,
      sentAt: new Date()
    });
  } catch (err) {
    next(err);
  }
});

// 9. POST mark absent and alert parent
router.post('/batches/:id/absent', protect, async (req, res, next) => {
  try {
    const { studentId, date } = req.body;
    if (!studentId) {
      return next(new AppError('Please provide studentId', 400));
    }

    const batchResult = await db.query(
      `SELECT b.name, c.name as "courseName" FROM batches b JOIN courses c ON b.course_id = c.id WHERE b.id = $1 AND c.business_id = $2`,
      [req.params.id, req.businessId]
    );
    if (batchResult.rows.length === 0) {
      return next(new AppError('Batch not found', 404));
    }
    const batch = batchResult.rows[0];

    const studentResult = await db.query(
      'SELECT * FROM student_profiles WHERE id = $1 AND business_id = $2',
      [studentId, req.businessId]
    );
    if (studentResult.rows.length === 0) {
      return next(new AppError('Student not found', 404));
    }
    const student = studentResult.rows[0];

    const parentPhone = student.parent_phone;
    const message = `Dear Parent, this is to inform you that ${student.student_name} was marked ABSENT for their class batch (${batch.name} - ${batch.courseName}) on ${date || new Date().toLocaleDateString()}.`;

    console.log(`[WhatsApp Absent Notification] To: ${parentPhone} | Message: ${message}`);

    // Log message to database
    await db.query(
      `INSERT INTO messages (business_id, sender_type, recipient_phone, content, platform, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.businessId, 'System', parentPhone, message, 'WhatsApp', 'Sent']
    );

    return successResponse(res, `Absent alert sent to parent's phone ${parentPhone} successfully!`, {
      phone: parentPhone,
      message,
      sentAt: new Date()
    });
  } catch (err) {
    next(err);
  }
});

// 10. GET all exams
router.get('/exams', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT e.*, b.name as "batchName"
       FROM exams e
       JOIN batches b ON e.batch_id = b.id
       WHERE e.business_id = $1
       ORDER BY e.date DESC`,
      [req.businessId]
    );

    const exams = result.rows.map(row => ({
      _id: row.id,
      id: row.id,
      batchId: {
        _id: row.batch_id,
        id: row.batch_id,
        name: row.batchName
      },
      testName: row.test_name,
      subject: row.subject,
      maxMarks: row.max_marks,
      date: row.date,
      scores: row.scores
    }));

    return successResponse(res, 'Exams fetched successfully', exams);
  } catch (err) {
    next(err);
  }
});

// 11. POST create exam
router.post('/exams', protect, async (req, res, next) => {
  try {
    const { batchId, testName, subject, maxMarks, date, scores } = req.body;
    if (!batchId || !testName || !subject || !maxMarks || !date) {
      return next(new AppError('Please provide batchId, testName, subject, maxMarks, and date', 400));
    }

    const examResult = await db.query(
      `INSERT INTO exams (business_id, batch_id, test_name, subject, max_marks, date, scores)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.businessId,
        batchId,
        testName,
        subject,
        maxMarks,
        date,
        JSON.stringify(scores || [])
      ]
    );
    const exam = examResult.rows[0];

    return successResponse(res, 'Exam recorded successfully', {
      _id: exam.id,
      id: exam.id,
      batchId,
      testName: exam.test_name,
      subject: exam.subject,
      maxMarks: exam.max_marks,
      date: exam.date,
      scores: exam.scores
    }, 201);
  } catch (err) {
    next(err);
  }
});

// 12. POST publish exam reports
router.post('/exams/:id/publish', protect, async (req, res, next) => {
  try {
    const examResult = await db.query(
      `SELECT e.*, b.name as "batchName" FROM exams e JOIN batches b ON e.batch_id = b.id WHERE e.id = $1 AND e.business_id = $2`,
      [req.params.id, req.businessId]
    );
    if (examResult.rows.length === 0) {
      return next(new AppError('Exam record not found', 404));
    }
    const exam = examResult.rows[0];

    const reports = [];
    const updatedScores = [];
    
    for (const entry of exam.scores) {
      const studentResult = await db.query(
        'SELECT * FROM student_profiles WHERE id = $1 AND business_id = $2',
        [entry.studentId, req.businessId]
      );
      if (studentResult.rows.length === 0) continue;
      const student = studentResult.rows[0];

      const pct = ((entry.marksObtained / exam.max_marks) * 100).toFixed(0);
      
      let aiReview = '';
      const promptText = `Student Name: ${student.student_name}, Test: ${exam.test_name}, Subject: ${exam.subject}, Marks: ${entry.marksObtained}/${exam.max_marks} (${pct}%). Write a concise, encouraging 1-2 sentence performance review in Hinglish/English for their parent. Highlight strengths or focus areas.`;

      if (groq) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are a helpful tutor writing a brief parent update review.' },
              { role: 'user', content: promptText }
            ]
          });
          aiReview = response.choices[0].message.content.trim();
        } catch (e) {
          aiReview = `${student.student_name} has scored ${entry.marksObtained}/${exam.max_marks}. Good effort, needs to practice more in ${exam.subject}.`;
        }
      } else {
        aiReview = `${student.student_name} scored ${entry.marksObtained}/${exam.max_marks} (${pct}%). ${pct >= 75 ? 'Excellent performance in class!' : 'Needs to focus more on revision and practice.'}`;
      }

      const message = `Dear Parent, here is the test report card of your ward ${student.student_name} for the test ${exam.test_name} (${exam.subject}):\nMarks: ${entry.marksObtained}/${exam.max_marks} (${pct}%)\nTeacher Feedback: ${aiReview}`;
      console.log(`[WhatsApp Exam Report] To: ${student.parent_phone} | Message: ${message}`);
      
      // Save message to DB
      await db.query(
        `INSERT INTO messages (business_id, sender_type, recipient_phone, content, platform, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.businessId, 'System', student.parent_phone, message, 'WhatsApp', 'Sent']
      );

      entry.remarks = aiReview;
      updatedScores.push(entry);
      
      reports.push({
        studentName: student.student_name,
        phone: student.parent_phone,
        message,
        review: aiReview
      });
    }

    // Save updated exam scores containing teacher feedback
    await db.query(
      'UPDATE exams SET scores = $1 WHERE id = $2',
      [JSON.stringify(updatedScores), exam.id]
    );

    return successResponse(res, `Test report cards dispatched successfully to all batch parents!`, reports);
  } catch (err) {
    next(err);
  }
});

// 13. GET all leads
router.get('/leads', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM leads WHERE business_id = $1 ORDER BY created_at DESC',
      [req.businessId]
    );
    const leads = result.rows.map(mapLead);
    return successResponse(res, 'Leads fetched successfully', leads);
  } catch (err) {
    next(err);
  }
});

// 14. POST create lead
router.post('/leads', protect, async (req, res, next) => {
  try {
    const { name, parentPhone, email, courseOfInterest, source, status, notes } = req.body;
    if (!name || !parentPhone || !courseOfInterest) {
      return next(new AppError('Please provide name, parentPhone, and courseOfInterest', 400));
    }

    const result = await db.query(
      `INSERT INTO leads (business_id, student_name, phone, email, course_of_interest, source, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.businessId,
        name,
        parentPhone,
        email || '',
        courseOfInterest,
        source || 'Website',
        status || 'New',
        notes || ''
      ]
    );

    return successResponse(res, 'Lead registered successfully', mapLead(result.rows[0]), 201);
  } catch (err) {
    next(err);
  }
});

// 15. POST simulate lead inquiry webhook
router.post('/leads/simulate-inquiry', protect, async (req, res, next) => {
  try {
    const firstNames = ['Amit', 'Sunita', 'Vikram', 'Divya', 'Preeti'];
    const lastNames = ['Sharma', 'Verma', 'Kumar', 'Joshi', 'Gupta'];
    const courses = ['10th Standard Science', '12th Standard Physics', 'IIT-JEE Mathematics', 'NEET Biology'];
    const sources = ['Google Business', 'Facebook Ads', 'Website'];
    
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const parentPhone = '+91' + Math.floor(6000000000 + Math.random() * 3999999999).toString();
    const email = name.toLowerCase().replace(' ', '.') + '@example.com';
    const courseOfInterest = courses[Math.floor(Math.random() * courses.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];

    const result = await db.query(
      `INSERT INTO leads (business_id, student_name, phone, email, course_of_interest, source, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.businessId,
        name,
        parentPhone,
        email,
        courseOfInterest,
        source,
        'New',
        'Simulated inquiry incoming webhook.'
      ]
    );
    const lead = result.rows[0];

    let aiResponse = '';
    const promptText = `Draft a welcoming WhatsApp message in Hinglish/English for a parent named ${name} who just inquired about "${courseOfInterest}" via ${source}. Politely welcome them to Excellence Academy, mention class timings are standard evening slots, monthly fee is ₹1,500, and include a simulated digital brochure link: https://excellenceacademy.in/brochure.pdf.`;

    if (groq) {
      try {
        const response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an intake coordinator for Excellence Academy.' },
            { role: 'user', content: promptText }
          ]
        });
        aiResponse = response.choices[0].message.content;
      } catch (e) {
        aiResponse = `Hello ${name}, thank you for inquiring about our ${courseOfInterest} classes at Excellence Academy! We offer high-quality batches (Mon-Wed-Fri 4-6 PM) at a monthly fee of ₹1,500. Here is our brochure: https://excellenceacademy.in/brochure.pdf. Let us know if you want to book a free demo class.`;
      }
    } else {
      aiResponse = `Hello ${name}, thank you for inquiring about our ${courseOfInterest} classes at Excellence Academy! We offer high-quality batches (Mon-Wed-Fri 4-6 PM) at a monthly fee of ₹1,500. Here is our brochure: https://excellenceacademy.in/brochure.pdf. Let us know if you want to book a free demo class.`;
    }

    console.log(`[WhatsApp Lead Welcomer] To: ${parentPhone} | Message: ${aiResponse}`);

    // Log message to DB
    await db.query(
      `INSERT INTO messages (business_id, sender_type, recipient_phone, content, platform, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.businessId, 'System', parentPhone, aiResponse, 'WhatsApp', 'Sent']
    );

    return successResponse(res, `Simulated ad lead webhook triggered successfully! Nurture auto-reply dispatched to ${parentPhone}.`, {
      lead: mapLead(lead),
      nurtureMessage: aiResponse
    });
  } catch (err) {
    next(err);
  }
});

// 16. GET doubts list
router.get('/doubts', protect, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM doubts WHERE business_id = $1 ORDER BY created_at DESC',
      [req.businessId]
    );
    const doubts = result.rows.map(mapDoubt);
    return successResponse(res, 'Doubts fetched successfully', doubts);
  } catch (err) {
    next(err);
  }
});

// 17. POST submit student doubt
router.post('/doubts', protect, async (req, res, next) => {
  try {
    const { studentName, question } = req.body;
    if (!studentName || !question) {
      return next(new AppError('Please provide studentName and question', 400));
    }

    let aiResponse = '';
    const promptText = `You are Excellence Academy's WhatsApp AI Doubt Solver. Provide a clear, friendly, and step-by-step educational solution to this student doubt: "${question}". Break down mathematical steps or scientific concepts clearly. Keep it under 200 words.`;

    if (groq) {
      try {
        const response = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an encouraging AI academic tutor.' },
            { role: 'user', content: promptText }
          ]
        });
        aiResponse = response.choices[0].message.content;
      } catch (e) {
        aiResponse = `Thanks for asking! Here is the explanation for: "${question}". Speed is a scalar quantity (only magnitude), while Velocity is a vector quantity (contains both speed and direction). For example, 50 km/h is speed, but 50 km/h North is velocity.`;
      }
    } else {
      aiResponse = `Thanks for asking! Here is the explanation for: "${question}". Speed is a scalar quantity (only magnitude), while Velocity is a vector quantity (contains both speed and direction). For example, 50 km/h is speed, but 50 km/h North is velocity.`;
    }

    const result = await db.query(
      `INSERT INTO doubts (business_id, student_name, question, ai_response)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.businessId, studentName, question, aiResponse]
    );

    return successResponse(res, 'Doubt solved successfully by AI Tutor', mapDoubt(result.rows[0]), 201);
  } catch (err) {
    next(err);
  }
});

// 18. POST reschedule batch
router.post('/batches/:id/reschedule', protect, async (req, res, next) => {
  try {
    const { newTimings, reason } = req.body;
    if (!newTimings) {
      return next(new AppError('Please provide newTimings', 400));
    }

    // Verify batch
    const batchCheck = await db.query(
      `SELECT b.*, c.name as "courseName" FROM batches b JOIN courses c ON b.course_id = c.id WHERE b.id = $1 AND c.business_id = $2`,
      [req.params.id, req.businessId]
    );
    if (batchCheck.rows.length === 0) {
      return next(new AppError('Batch not found', 404));
    }
    const batch = batchCheck.rows[0];
    const oldTimings = batch.timings;

    // Update timings
    await db.query('UPDATE batches SET timings = $1 WHERE id = $2', [newTimings, batch.id]);
    batch.timings = newTimings;

    // Fetch students
    const studentsResult = await db.query(
      `SELECT sp.* FROM student_profiles sp JOIN enrollments e ON sp.id = e.student_id WHERE e.batch_id = $1`,
      [batch.id]
    );

    const notifications = [];
    for (const student of studentsResult.rows) {
      const message = `Dear Parent, please note that the class timings for batch "${batch.name}" (${batch.courseName}) have been rescheduled from "${oldTimings}" to "${newTimings}" due to ${reason || 'unforeseen teacher scheduling updates'}. Sorry for the inconvenience!`;
      console.log(`[WhatsApp Broadcast Reschedule] To: ${student.parent_phone} | Message: ${message}`);
      
      // Log message
      await db.query(
        `INSERT INTO messages (business_id, sender_type, recipient_phone, content, platform, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.businessId, 'System', student.parent_phone, message, 'WhatsApp', 'Sent']
      );

      notifications.push({
        studentName: student.student_name,
        phone: student.parent_phone,
        message
      });
    }

    const responsePayload = {
      batch: {
        _id: batch.id,
        id: batch.id,
        name: batch.name,
        courseName: batch.courseName,
        timings: batch.timings
      },
      notifications
    };

    return successResponse(res, `Batch rescheduled. Emergency alerts sent to ${studentsResult.rows.length} parents!`, responsePayload);
  } catch (err) {
    next(err);
  }
});

// 19. POST seed mock data
router.post('/seed', protect, async (req, res, next) => {
  try {
    const businessId = req.businessId;

    // Check if database already has students for this tenant
    const countCheck = await db.query('SELECT COUNT(*) FROM student_profiles WHERE business_id = $1', [businessId]);
    if (Number(countCheck.rows[0].count) > 0) {
      return successResponse(res, 'Database already contains data, skipping seed.', { seeded: false });
    }

    // Create Students
    const s1 = await db.query(
      `INSERT INTO student_profiles (business_id, student_name, parent_name, parent_phone, email, admission_number, joined_date)
       VALUES ($1, 'Aarav Mehta', 'Rajesh Mehta', '+919876543210', 'aarav.mehta@example.com', 'ADM-2026-001', '2026-01-10') RETURNING id`,
      [businessId]
    );
    const student1Id = s1.rows[0].id;

    const s2 = await db.query(
      `INSERT INTO student_profiles (business_id, student_name, parent_name, parent_phone, email, admission_number, joined_date)
       VALUES ($1, 'Ishita Patel', 'Vikram Patel', '+919123456789', 'ishita.patel@example.com', 'ADM-2026-002', '2026-01-12') RETURNING id`,
      [businessId]
    );
    const student2Id = s2.rows[0].id;

    const s3 = await db.query(
      `INSERT INTO student_profiles (business_id, student_name, parent_name, parent_phone, email, admission_number, joined_date)
       VALUES ($1, 'Rohan Das', 'Amit Das', '+919988776655', 'rohan.das@example.com', 'ADM-2026-003', '2026-02-05') RETURNING id`,
      [businessId]
    );
    const student3Id = s3.rows[0].id;

    const s4 = await db.query(
      `INSERT INTO student_profiles (business_id, student_name, parent_name, parent_phone, email, admission_number, joined_date)
       VALUES ($1, 'Sneha Kapoor', 'Sanjay Kapoor', '+919876123456', 'sneha.kapoor@example.com', 'ADM-2026-004', '2026-02-15') RETURNING id`,
      [businessId]
    );
    const student4Id = s4.rows[0].id;

    // Create Courses & Batches
    const mathCourseId = await getOrCreateCourse(businessId, 'Mathematics');
    const physCourseId = await getOrCreateCourse(businessId, 'Physics');

    const b1 = await db.query(
      `INSERT INTO batches (course_id, name, timings) VALUES ($1, 'Class 10 - Mathematics', 'Mon-Wed-Fri 4PM - 6PM') RETURNING id`,
      [mathCourseId]
    );
    const batch1Id = b1.rows[0].id;

    const b2 = await db.query(
      `INSERT INTO batches (course_id, name, timings) VALUES ($1, 'Class 12 - Physics', 'Tue-Thu-Sat 5PM - 7PM') RETURNING id`,
      [physCourseId]
    );
    const batch2Id = b2.rows[0].id;

    // Enroll students in batches
    await db.query(`INSERT INTO enrollments (student_id, batch_id, status) VALUES ($1, $2, 'Active')`, [student1Id, batch1Id]);
    await db.query(`INSERT INTO enrollments (student_id, batch_id, status) VALUES ($1, $2, 'Active')`, [student2Id, batch1Id]);
    await db.query(`INSERT INTO enrollments (student_id, batch_id, status) VALUES ($1, $2, 'Active')`, [student3Id, batch1Id]);
    await db.query(`INSERT INTO enrollments (student_id, batch_id, status) VALUES ($1, $2, 'Active')`, [student2Id, batch2Id]);
    await db.query(`INSERT INTO enrollments (student_id, batch_id, status) VALUES ($1, $2, 'Suspended')`, [student4Id, batch2Id]);

    // Create Fee Installments
    await db.query(
      `INSERT INTO fee_installments (student_id, amount, due_date, status, razorpay_payment_link_id)
       VALUES ($1, 1500, '2026-04-01', 'Paid', 'plink_paid123456')`,
      [student1Id]
    );
    await db.query(
      `INSERT INTO fee_installments (student_id, amount, due_date, status, razorpay_payment_link_id)
       VALUES ($1, 2000, '2026-06-15', 'Unpaid', 'plink_unpaid' || substring(md5(random()::text), 0, 6))`,
      [student2Id]
    );
    await db.query(
      `INSERT INTO fee_installments (student_id, amount, due_date, status, razorpay_payment_link_id)
       VALUES ($1, 1500, '2026-05-01', 'Unpaid', 'plink_overdue' || substring(md5(random()::text), 0, 6))`,
      [student3Id]
    );

    // Create Exams
    const examScores = [
      { studentId: student1Id, marksObtained: 46, remarks: 'Excellent math logic demonstrated!' },
      { studentId: student2Id, marksObtained: 38, remarks: 'Very good algebraic solving steps.' },
      { studentId: student3Id, marksObtained: 25, remarks: 'Needs revision in linear equations.' }
    ];
    await db.query(
      `INSERT INTO exams (business_id, batch_id, test_name, subject, max_marks, date, scores)
       VALUES ($1, $2, 'Algebra Test-1', 'Mathematics', 50, '2026-05-15', $3)`,
      [businessId, batch1Id, JSON.stringify(examScores)]
    );

    // Create CRM leads
    await db.query(
      `INSERT INTO leads (business_id, student_name, phone, email, course_of_interest, source, status, notes)
       VALUES ($1, 'Vikrant Singh', '+919812345678', 'vikrant.singh@example.com', '12th Standard Physics', 'Facebook Ads', 'New', 'Parent wants evening classes schedule.')`,
      [businessId]
    );
    await db.query(
      `INSERT INTO leads (business_id, student_name, phone, email, course_of_interest, source, status, notes)
       VALUES ($1, 'Neha Patil', '+919004455667', 'neha.patil@example.com', '10th Standard Science', 'Google Business', 'Demo Scheduled', 'Demo class booked for this Saturday.')`,
      [businessId]
    );
    await db.query(
      `INSERT INTO leads (business_id, student_name, phone, email, course_of_interest, source, status, notes)
       VALUES ($1, 'Aman Verma', '+918877665544', 'aman.verma@example.com', 'IIT-JEE Mathematics', 'Website', 'Contacted', 'Enquired about installment payment options.')`,
      [businessId]
    );

    // Create Academic doubts
    await db.query(
      `INSERT INTO doubts (business_id, student_name, question, ai_response)
       VALUES ($1, 'Aarav Mehta', 'What is the formula for the volume of a sphere?', 'The formula for the volume of a sphere is V = (4/3) * π * r³, where r is the radius of the sphere. For example, if radius is 3cm, volume is 36π cm³ (~113.1 cm³).')`,
      [businessId]
    );
    await db.query(
      `INSERT INTO doubts (business_id, student_name, question, ai_response)
       VALUES ($1, 'Ishita Patel', 'What is the difference between an element and a compound?', 'An element consists of only one type of atom (e.g. pure Gold). A compound is made of different elements chemically bonded (e.g. Water H2O).')`,
      [businessId]
    );

    return successResponse(res, 'Demo students, batches, fee records, exams, leads, and doubts seeded successfully!', { seeded: true }, 201);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
