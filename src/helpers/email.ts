import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCertificateEmail = async (email: string, certificateUuid: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'CityCruise International <onboarding@resend.dev>',
            to: [email],
            subject: 'Congratulations! Your Certificate is Ready',
            html: `
                <h1>Congratulations!</h1>
                <p>You have successfully completed the exam and your certificate has been generated.</p>
                <p>Your Certificate UUID: <strong>${certificateUuid}</strong></p>
                <p>You can download your certificate from your dashboard.</p>
            `,
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error };
    }
};

export const sendFailedEmail = async (email: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'CityCruise International <onboarding@resend.dev>',
            to: [email],
            subject: 'Your Exam Result',
            html: `
                <h1>Failed</h1>
                <p>You have not met the passing criteria for the exam. Please review the course materials and try again.</p>
            `,
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error };
    }
};

export const sendEnquiryEmail = async (email: string, fullname: string, message: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'CityCruise International <onboarding@resend.dev>',
            to: "citycruisesupport@gmail.com",
            subject: `Enquiry Form Entry`,
            replyTo: email,
            html: `
                <h1>Enquiry from <strong>${fullname}</strong>!</h1>
                <p>Email: <strong>${email}</strong></p>
                <p>${message}</p>
            `,
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error };
    }
};

export const sendForgotPasswordEmail = async (email: string, otp: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'CityCruise International <onboarding@resend.dev>',
            to: [email],
            subject: 'Password Reset Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333 text-align: center;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your password. Here is your Verification Code:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center;">
                        ${otp}
                    </div>
                    <p>OTP expires in 15 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });

        if (error) {
            console.error('Error sending reset password email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception sending reset password email:', error);
        return { success: false, error };
    }
};
