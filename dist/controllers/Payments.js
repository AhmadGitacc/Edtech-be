"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystackWebhook = exports.initializePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const Payments_1 = require("../models/Payments");
const crypto_1 = __importDefault(require("crypto"));
const Courses_1 = require("../models/Courses");
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const initializePayment = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user?.id;
        const email = req.user?.email;
        if (!userId || !email)
            return res.sendStatus(401);
        const course = await (0, Courses_1.getCourseById)(Number(courseId));
        if (!course)
            return res.status(404).json({ success: false, message: "Course not found" });
        const amount = course.price * 100; // Paystack amount in kobo
        const response = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount,
            metadata: { courseId, userId }
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            }
        });
        const { authorization_url, reference } = response.data.data;
        await (0, Payments_1.createEnrollment)(userId, Number(courseId), reference);
        return res.status(200).json({ success: true, data: { authorization_url, reference }, message: "Payment initialized" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};
exports.initializePayment = initializePayment;
const paystackWebhook = async (req, res) => {
    try {
        const hash = crypto_1.default.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
            return res.sendStatus(401);
        }
        const event = req.body;
        if (event.event === 'charge.success') {
            const { reference } = event.data;
            await (0, Payments_1.updateEnrollmentStatus)(reference, 'success');
        }
        return res.sendStatus(200);
    }
    catch (err) {
        console.error(err);
        return res.sendStatus(500);
    }
};
exports.paystackWebhook = paystackWebhook;
//# sourceMappingURL=Payments.js.map