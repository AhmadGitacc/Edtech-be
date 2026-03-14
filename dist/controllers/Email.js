"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEnquiryMessage = void 0;
const email_1 = require("helpers/email");
const sendEnquiryMessage = async (req, res) => {
    try {
        const { email, fullname, message } = req.body;
        await (0, email_1.sendEnquiryEmail)(email, fullname, message);
        return res.status(200).json({ success: true, data: { email, message }, message: "Enquiry sent successfully." });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err });
    }
};
exports.sendEnquiryMessage = sendEnquiryMessage;
//# sourceMappingURL=Email.js.map