import express from "express";
import axios from "axios";
import { createEnrollment, updateEnrollmentStatus, getEnrollmentByReference } from "../models/Payments";
import { AuthRequest } from "../middlewares/auth";
import crypto from "crypto";
import { getCourseById } from "../models/Courses";
import { createLog } from "../models/ActivityLogs";
import { getUserById } from "../models/Users";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

export const initializePayment = async (req: AuthRequest, res: express.Response) => {
    try {
        const { courseId } = req.body;
        const userId = req.user?.id;
        const email = req.user?.email;
        const user = await getUserById(Number(userId))

        if (!userId || !email) return res.sendStatus(401);

        const course = await getCourseById(Number(courseId));
        if (!course) return res.status(404).json({ success: false, message: "Course not found" });

        const amount = course.price * 100; // Paystack amount in kobo

        const response = await axios.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount,
            metadata: { courseId, userId }
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        const { authorization_url, reference } = (response as any).data.data;

        await createEnrollment(userId, Number(courseId), reference);

        await createLog(user.id, user.username, 'PAYMENT_INIT', `Started payment for ${course.title}`);

        return res.status(200).json({ success: true, data: { authorization_url, reference }, message: "Payment initialized" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, data: null, message: "Internal server error" });
    }
};

export const paystackWebhook = async (req: express.Request, res: express.Response) => {
    try {
        const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');
        if (hash !== req.headers['x-paystack-signature']) {
            return res.sendStatus(401);
        }

        const event = req.body;
        if (event.event === 'charge.success') {
            const { reference } = event.data;
            await updateEnrollmentStatus(reference, 'success');
            await createLog(reference, "confirmation", 'PAYMENT', `Payment Confirmed for ${reference})`);
        }

        return res.sendStatus(200);
    } catch (err) {
        console.error(err);
        return res.sendStatus(500);
    }
};
