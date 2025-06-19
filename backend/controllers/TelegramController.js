const { Api, TelegramClient, password } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const sessions = new Map();

// === Utility Functions ===
function getSessionPath(phone) {
    return path.join(__dirname, 'sessions', `${phone}.session`);
}

function loadSession(phone) {
    const sessionPath = getSessionPath(phone);
    if (fs.existsSync(sessionPath)) {
        return fs.readFileSync(sessionPath, 'utf8');
    }
    return '';
}

function saveSession(phone, sessionString) {
    const sessionPath = getSessionPath(phone);
    const dir = path.dirname(sessionPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(sessionPath, sessionString);
}

function deleteSession(phone) {
    const sessionPath = getSessionPath(phone);
    if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
    }
}

class TelegramController {
    static async SendCode(req, res) {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        try {
            const sessionString = loadSession(phone);
            const stringSession = new StringSession(sessionString);
            const client = new TelegramClient(stringSession, apiId, apiHash, { autoReconnect: true });
            
            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (isAuthorized) {
                const me = await client.getMe();
                let profileImage = null;
                if (me.photo) {
                    const photoBuffer = await client.downloadProfilePhoto(me);
                    profileImage = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;
                }
                return res.status(200).json({ 
                    message: "Already logged in",
                    user: {
                        id: me.id,
                        phone: me.phone,
                        username: me.username,
                        firstName: me.firstName,
                        lastName: me.lastName,
                        fullName: `${me.firstName || ''} ${me.lastName || ''}`.trim(),
                        profileImage, // ✅ base64 image string
                    }, 
                    session: sessionString
                });
            }

            const sentCode = await client.invoke(
                new Api.auth.SendCode({
                    phoneNumber: '+855' + phone,
                    apiId,
                    apiHash,
                    settings: new Api.CodeSettings({
                        allowFlashCall: false,
                        currentNumber: false,
                    }),
                })
            );
            sessions.set(phone, { client, stringSession, sentCode });
            res.json({ message: "Code sent successfully", session: sessionString });
        } catch (err) {
            if (err.errorMessage === 'AUTH_RESTART') {
                deleteSession(phone); // reset session and let user try again
                return res.status(500).json({ error: "Session error, please try again." });
            }
            if (err.errorMessage === 'FLOOD' && err.seconds) {
                return res.status(429).json({
                    error: "Too many attempts. Please wait before trying again.",
                    waitSeconds: err.seconds,
                    waitMinutes: Math.ceil(err.seconds / 60),
                });
            }
            res.status(500).json({ error: err.errorMessage });
        }
    }

    static async VerifyCode(req, res) {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ error: "Phone and code are required" });
        }

        const sessionInfo = sessions.get(phone);
        if (!sessionInfo) {
            return res.status(400).json({ error: "No session found. Please request a code first." });
        }
        const { client, sentCode } = sessionInfo;

        try {
            await client.start({
                phoneNumber: '+855' + phone,
                phoneCode: async () => code,
                phoneCodeHash: sentCode.phoneCodeHash,
            });

            const sessionString = client.session.save();
            saveSession(phone, sessionString);
            const me = await client.getMe();
            let profileImage = null;
            let user = null;
            if (me) {
                if(me.photo){
                    const photoBuffer = await client.downloadProfilePhoto(me);
                    profileImage = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;
                }
                user = {
                    id: me.id,
                    phone: me.phone,
                    username: me.username,
                    firstName: me.firstName,
                    lastName: me.lastName,
                    fullName: `${me.firstName || ''} ${me.lastName || ''}`.trim(),
                    profileImage, // ✅ base64 image string
                };
            }
            res.json({ message: "Logged in", session: sessionString, user: user });
        } catch (err) {
            // Check if 2FA password is needed
            if (err.message === 'Account has 2FA enabled.') {
                return res.status(200).json({ message: "2FA password required", twoFA: true });
            }
            if (err.errorMessage === 'PHONE_CODE_INVALID') {
                return res.status(400).json({ error: "The verification code is invalid or expired." });
            }
            if (err.errorMessage === 'FLOOD' && err.seconds) {
                return res.status(429).json({
                    error: "Too many attempts. Please wait before trying again.",
                    waitSeconds: err.seconds,
                    waitMinutes: Math.ceil(err.seconds / 60),
                });
            }
            return res.status(500).json({ error: err.errorMessage || err.message });
        }
    }

    static async CheckPassword(req, res) {
        const { phone, code, password: pass } = req.body;

        if (!phone || !pass || !code) {
            return res.status(400).json({ error: "Password is required" });
        }

        const sessionInfo = sessions.get(phone);
        if (!sessionInfo) {
            return res.status(400).json({ error: "No session found. Please request a code first." });
        }
        const { client } = sessionInfo;
        try {
            await client.connect();

            const pwdInfo = await client.invoke(new Api.account.GetPassword());
            const inputCheckPasswordSRP = await password.computeCheck(pwdInfo, pass);

            await client.invoke(new Api.auth.CheckPassword({ password: inputCheckPasswordSRP }));

            const sessionString = client.session.save();
            saveSession(phone, sessionString);
            const me = await client.getMe();
            let profileImage = null;
            let user = null;
            if (me) {
                if(me.photo){
                    const photoBuffer = await client.downloadProfilePhoto(me);
                    profileImage = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;
                }
                user = {
                    id: me.id,
                    phone: me.phone,
                    username: me.username,
                    firstName: me.firstName,
                    lastName: me.lastName,
                    fullName: `${me.firstName || ''} ${me.lastName || ''}`.trim(),
                    profileImage, // ✅ base64 image string
                };
            }
            return res.json({ message: "Logged in with 2FA", session: sessionString, user: user });

        } catch (err) {
            if (err.errorMessage === 'FLOOD' && err.seconds) {
                return res.status(429).json({
                    error: "Too many attempts. Please wait before trying again.",
                    waitSeconds: err.seconds,
                    waitMinutes: Math.ceil(err.seconds / 60),
                });
            }
            if (err.errorMessage === 'PHONE_CODE_INVALID') {
                return res.status(400).json({ error: "The verification code is invalid or expired." });
            }
            if (err.errorMessage === 'PASSWORD_HASH_INVALID') {
                return res.status(400).json({ error: "The password is incorrect." });
            }
            return res.status(403).json({ error: err.errorMessage || err.message });
        }
    }

    static async Logout(req, res) {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: "Phone is required" });
        }
        const slicePhone = phone.slice(3);
        const sessionFilePath = path.join(__dirname, 'sessions', `${slicePhone}.session`);

        if (!fs.existsSync(sessionFilePath)) {
            return res.status(404).json({ error: "Session not found" });
        }

        const sessionString = fs.readFileSync(sessionFilePath, 'utf8');
        const stringSession = new StringSession(sessionString);
        const client = new TelegramClient(stringSession, apiId, apiHash, { autoReconnect: true });

        try {
            await client.connect();
            await client.invoke(new Api.auth.LogOut());
            await client.disconnect();

            deleteSession(slicePhone);
            sessions.delete(slicePhone);

            res.json({ message: "Logged out successfully" });
        } catch (err) {
            if (err.errorMessage === 'FLOOD' && err.seconds) {
                return res.status(429).json({
                    error: "Too many attempts. Please wait before trying again.",
                    waitSeconds: err.seconds,
                    waitMinutes: Math.ceil(err.seconds / 60),
                });
            }
            res.status(500).json({ error: err.errorMessage || err.message });
        }
    }

    static async Reconnect(req, res) {
        const { phone } = req.body;

        try {
            const sessionString = loadSession(phone.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: "No saved session found" });
            }

            const stringSession = new StringSession(sessionString);
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                autoReconnect: true,
                useWSS: false,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phone.slice(3));
                return res.status(401).json({ error: "Session expired. Please log in again." });
            }

            const me = await client.getMe();

            let profileImage = null;
            if (me.photo) {
                const photoBuffer = await client.downloadProfilePhoto(me);
                profileImage = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;
            }

            res.json({
                message: "Reconnected Successfully",
                user: {
                    id: me.id,
                    phone: me.phone,
                    username: me.username,
                    firstName: me.firstName,
                    lastName: me.lastName,
                    fullName: `${me.firstName || ''} ${me.lastName || ''}`.trim(),
                    profileImage,
                }
            });

        } catch (err) {
            if (err.errorMessage === 'FLOOD' && err.seconds) {
                return res.status(429).json({
                    error: "Too many attempts. Please wait before trying again.",
                    waitSeconds: err.seconds,
                    waitMinutes: Math.ceil(err.seconds / 60),
                });
            }
            res.status(500).json({ error: err.errorMessage || err.message });
        }
    }

    static async GetAllGroups(req, res) {
        try {
            const { phone } = req.body;
            const phoneStr = String(phone);

            const sessionString = loadSession(phoneStr.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: "No saved session found" });
            }

            const stringSession = new StringSession(sessionString);
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                autoReconnect: true,
                useWSS: false,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phoneStr.slice(3));
                return res.status(401).json({ error: "Session expired. Please log in again." });
            }

            const groups = [];
            for await (const dialog of client.iterDialogs()) {
                if (dialog.isGroup) {
                    let photoUrl = null;
                    if (dialog.entity.photo && dialog.entity.participantsCount > 0) {
                        try{
                            const photo = await client.downloadProfilePhoto(dialog.entity, { fileSize: 200 });
                            photoUrl = `data:image/jpeg;base64,${photo.toString('base64')}`;
                        }catch(e) {
                            photoUrl = null;
                        }
                    }

                    if (dialog.entity.participantsCount > 0) {
                        groups.push({
                            id: dialog.id.value.toString(),
                            name: dialog.name,
                            type: dialog.isGroup ? 'group' : 'channel',
                            membersCount: dialog.entity.participantsCount,
                            photoUrl: photoUrl,
                            children: [],
                        });
                    }
                }
            }

            return res.status(200).json({ groups });
        } catch (err) {
            res.status(500).json({ error: err.errorMessage || err.message });
        }
    }

    static async GetAllGroupMembers(req, res) {
        try {
            const { phone, id: groupId } = req.body;
            const phoneStr = String(phone);

            const sessionString = loadSession(phoneStr.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: "No saved session found" });
            }

            const stringSession = new StringSession(sessionString);
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                autoReconnect: true,
                useWSS: false,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phoneStr.slice(3));
                return res.status(401).json({ error: "Session expired. Please log in again." });
            }

            const users = [];
            for await (const user of client.iterParticipants(groupId)) {
                let photoUrl = null;

                if (user.photo) {
                    try {
                        const photoBuffer = await client.downloadProfilePhoto(user, { fileSize: 200 });
                        photoUrl = `data:image/jpeg;base64,${photoBuffer.toString('base64')}`;
                    } catch (err) {
                        photoUrl = null;
                    }
                }

                users.push({
                    groupId: groupId,
                    id: user.id.value.toString(),
                    name: user.firstName == null ? '' : user.firstName + ' ' + (user.lastName == null ? '' : user.lastName),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    type: 'member',
                    photoUrl: photoUrl,
                });
            }

            return res.status(200).json({ members: users });

        } catch (err) {
            res.status(500).json({ error: err.errorMessage || err.message });
        }
    }

    static async SendMessage(req, res){
        try {
            const { phone, user, text } = req.body;

             const phoneStr = String(phone);

            const sessionString = loadSession(phoneStr.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: "No saved session found" });
            }

            const stringSession = new StringSession(sessionString);
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                autoReconnect: true,
                useWSS: false,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phoneStr.slice(3));
                return res.status(401).json({ error: "Session expired. Please log in again." });
            }

            await client.connect();

            for (const u of user) {
                if (!u.id) continue;

                try {
                    await client.sendMessage(Number(u.id), {
                        message: text,
                        parseMode: 'html',
                    });
                } catch (innerError) {
                    console.error(`Failed to message user ${u.id}:`, innerError.message);
                }
            }

            await client.disconnect();
            res.status(200).json({ message: 'Messages sent successfully.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to send messages.' });
        }
    }
}

module.exports = TelegramController;