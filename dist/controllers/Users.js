"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteUser = exports.getAllUsers = void 0;
const helpers_1 = require("../helpers");
const Users_1 = require("../models/Users");
const getAllUsers = async (req, res) => {
    try {
        const users = await (0, Users_1.getUsers)();
        return res.status(200).json(users);
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(400);
    }
};
exports.getAllUsers = getAllUsers;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await (0, Users_1.deleteUserById)(Number(id));
        res.json({ "user deleted": deletedUser });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(400);
    }
};
exports.deleteUser = deleteUser;
const updateUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const { email, username, password } = req.body;
        const user = await (0, Users_1.getUserById)(Number(userId));
        if (!user) {
            return res.status(404).json({ message: "User doesn't exist" });
        }
        const updateValues = {};
        if (email)
            updateValues.email = email;
        if (username)
            updateValues.username = username;
        if (password) {
            const salt = (0, helpers_1.random)();
            updateValues.salt = salt;
            updateValues.password = (0, helpers_1.authentication)(salt, password);
        }
        if (Object.keys(updateValues).length === 0) {
            return res.status(400).json({ message: "No changes detected" });
        }
        await (0, Users_1.updateUserById)(Number(userId), updateValues);
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
    }
    catch (err) {
        console.error("Update User Error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.updateUser = updateUser;
//# sourceMappingURL=Users.js.map