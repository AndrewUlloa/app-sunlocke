import { QuizResponse, Report } from './types';

interface EmailTemplateProps {
  quizResponse: QuizResponse;
  report: Report;
}

function generateEmailTemplate({ quizResponse, report }: EmailTemplateProps): string {
  const { visitorInfo, scores } = quizResponse;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
          .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
          .section { margin-bottom: 25px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
          .score-item { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
          .score-item strong { display: block; color: #1e40af; margin-bottom: 5px; }
          .score-item span { font-size: 24px; font-weight: bold; color: #0f172a; }
          .recommendations { list-style-type: none; margin: 0; padding: 0; }
          .recommendations li { margin-bottom: 10px; padding-left: 24px; position: relative; }
          .recommendations li:before { content: "•"; position: absolute; left: 8px; color: #1e40af; }
          .cta { background: #1e40af; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px; }
          .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Marketing Assessment Results</h1>
          </div>
          
          <div class="section">
            <h2>Hello ${visitorInfo.firstName},</h2>
            <p>Thank you for completing our marketing assessment. We've analyzed your responses and prepared a detailed report of your marketing effectiveness.</p>
          </div>

          <div class="section">
            <h3>Your Marketing Scores</h3>
            <div class="score-grid">
              ${Object.entries(scores)
                .map(([metric, score]) => `
                  <div class="score-item">
                    <strong>${metric.charAt(0).toUpperCase() + metric.slice(1)}</strong>
                    <span>${(score * 100).toFixed(0)}%</span>
                  </div>
                `)
                .join('')}
            </div>
          </div>

          <div class="section">
            <h3>Key Insights</h3>
            <p style="color: #334155; line-height: 1.8;">${report.insights}</p>
          </div>

          <div class="section">
            <h3>Personalized Recommendations</h3>
            <ul class="recommendations">
              ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            <a href="https://calendly.com/your-link" class="cta">Schedule a Free Consultation</a>
          </div>

          <div class="footer">
            <p>This report was generated based on your responses to our marketing assessment.</p>
            <p>Email sent to ${visitorInfo.email}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendQuizCompletionEmail(quizResponse: QuizResponse, report: Report) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_Z4RcTSSz_BzU9Gg8tqZQJo3TZ1wpHi8LT';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Sun Locke Marketing <marketing@sunlocke.com>',
        to: quizResponse.visitorInfo.email,
        subject: `${quizResponse.visitorInfo.firstName}, Your Marketing Assessment Results Are Ready`,
        html: generateEmailTemplate({ quizResponse, report }),
        reply_to: 'support@sunlocke.com'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
} 