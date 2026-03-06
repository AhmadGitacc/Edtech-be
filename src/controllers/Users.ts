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
        const { id } = req.params
        const { email, username, password } = req.body

        const user = await getUserById(Number(id))

        if (!user) {
            return res.status(400).json("user doesn't exist")
        }

        const updateValues: any = {}
        if (email) updateValues.email = email
        if (username) updateValues.username = username
        if (password) {
            const salt = random();
            updateValues.salt = salt;
            updateValues.password = authentication(salt, password);
        }

        if (Object.keys(updateValues).length > 0) {
            await updateUserById(Number(id), updateValues)
        }

        return res.status(200).json({ ...user, ...updateValues })

    } catch (err) {
        console.log(err)
        return res.sendStatus(400)
    }
}