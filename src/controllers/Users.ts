import express from 'express';
import { authentication, random } from '../helpers';
import { deleteUserById, getUserById, getUsers, updateUserById } from '../models/Users';

export const getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
        const users = await getUsers();

        return res.status(200).json(users);

    } catch (err) {
        console.log(err)
        return res.sendStatus(400)
    }
}

export const deleteUser = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params
        const deletedUser = await deleteUserById(Number(id))

        res.json({ "user deleted": deletedUser })

    } catch (err) {
        console.log(err)
        return res.sendStatus(400)
    }
}

export const updateUser = async (req: express.Request, res: express.Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { email, username, password } = req.body;

        const user = await getUserById(Number(userId));
        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }

        const updateValues: any = {};
        if (email) updateValues.email = email;
        if (username) updateValues.username = username;
        if (password) {
            const salt = random();
            updateValues.salt = salt;
            updateValues.password = authentication(salt, password);
        }

        if (Object.keys(updateValues).length === 0) {
            return res.status(400).json({ message: "No changes detected" });
        }

        await updateUserById(Number(userId), updateValues);

        const safeResponse = {
            id: userId,
            email: email || user.email,
            username: username || user.username,
        };

        return res.status(200).json({ 
            success: true, 
            data: safeResponse, 
            message: "Profile updated successfully" 
        });

    } catch (err) {
        console.error("Update User Error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}