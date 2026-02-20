import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { from, replyTo, cc, subject, content, recipients } = body;

    // 1. Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients list is empty' }, { status: 400 });
    }

    // 2. Transporter Configuration 
    // Ginagamit natin ang env variables para safe ang credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'jpablobscs@tfvc.edu.ph',
        pass: process.env.GMAIL_APP_PASSWORD || 'cvdl lggo btbz oill', 
      },
    });

    // 3. Email Dispatching Logic
    const emailPromises = recipients.map(async (recipientEmail: string) => {
      
      // Personalized and Formatted Content
      const formattedContent = content
        .replace(/\n/g)
        .replace(/{email}/g, recipientEmail);

      // Adrenaline Junky Style HTML Template
      // Adrenaline Junky - Executive Professional Edition
const announcementHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { margin: 0; padding: 0; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
      .wrapper { width: 100%; table-layout: fixed; background-color: #f6f6f6; padding: 40px 0; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 0px; overflow: hidden; }
      
      /* Header with Logo Area */
      .header { padding: 40px 20px; text-align: center; border-bottom: 4px solid #000000; }
      .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
      .header h1 { margin: 0; color: #000000; font-size: 18px; font-weight: 300; letter-spacing: 5px; text-transform: uppercase; }
      
      /* Body Content */
      .body { padding: 50px 40px; color: #1a1a1a; line-height: 1.6; font-size: 15px; }
      .content-box { margin-bottom: 30px; }
      .announcement-label { color: #888888; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; display: block; }
      
      /* Typography */
      h2 { color: #000000; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; }
      p { margin-bottom: 20px; }
      
      /* Footer */
      .footer { background-color: #ffffff; padding: 40px; text-align: center; font-size: 10px; color: #999999; border-top: 1px solid #eeeeee; letter-spacing: 1px; }
      .signature { margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #000000; font-weight: 700; font-size: 14px; text-transform: uppercase; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <img src="https://res.cloudinary.com/diwrwmjgw/image/upload/v1770200378/pic4_oxfpnf.png" alt="ADRENALINE JUNKY" class="logo">
          <h1>Official Correspondence</h1>
        </div>
        <div class="body">
          <span class="announcement-label">Public Announcement</span>
          <h2>${subject || 'Notification'}</h2>
          
          <div class="content-box">
            ${formattedContent}
          </div>
          
          <div class="signature">
            Respectfully,<br>
            ${from || 'Adrenaline Junky Administration'}
          </div>
        </div>
        <div class="footer">
          <div class="legal">
            <p>&copy; ${new Date().getFullYear()} ADRENALINE JUNKY PIERCINKS & TATTOO.</p>
            <p>7/11, 2nd Flr, National Road, Putatan, Muntinlupa City, PH</p>
            <p style="margin-top: 10px;">This is a confidential digital transmission intended solely for the recipient.</p>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

      return transporter.sendMail({
        from: `"${from || 'Adrenaline Junky'}" <${process.env.GMAIL_USER || 'jpablobscs@tfvc.edu.ph'}>`,
        to: recipientEmail,
        replyTo: replyTo || process.env.GMAIL_USER || 'jpablobscs@tfvc.edu.ph',
        cc: cc || undefined,
        subject: subject || 'New Announcement from Adrenaline Junky',
        html: announcementHtml,
      });
    });

    // 4. Result Gathering
    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ 
      success: true, 
      summary: { successful, failed } 
    });

  } catch (error: any) {
    console.error("Critical System Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}