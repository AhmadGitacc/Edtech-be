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

export const sendEnquiryEmail = async (email: string, fullname: string, message: string) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'CityCruise International <onboarding@resend.dev>',
            to: "citycruiseinternational.com",
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
