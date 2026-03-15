"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEnquiryEmail = exports.sendCertificateEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendCertificateEmail = async (email, certificateUuid) => {
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
    }
    catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error };
    }
};
exports.sendCertificateEmail = sendCertificateEmail;
const sendEnquiryEmail = async (email, fullname, message) => {
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
    }
    catch (error) {
        console.error('Exception sending email:', error);
        return { success: false, error };
    }
};
exports.sendEnquiryEmail = sendEnquiryEmail;
//# sourceMappingURL=email.js.map