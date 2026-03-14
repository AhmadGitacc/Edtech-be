import express from "express";
import { sendEnquiryEmail } from "helpers/email";

export const sendEnquiryMessage = async (req: express.Request, res: express.Response) => {
    try {
        const { email, fullname, message } = req.body;

        await sendEnquiryEmail(email, fullname, message);

        return res.status(200).json({ success: true, data: { email, message }, message: "Enquiry sent successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err });

    }
}