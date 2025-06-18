const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiId = Number(process.env.API_ID);
// const apiId = 20343500;
const apiHash = process.env.API_HASH;
// const apiHash = 'b551d2fa37b2e9258b56876524ec929f';
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
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                autoReconnect: true,
                useWSS: false,
                updateWorkers: 0
            });
            
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
                onError: (err) => { throw err; },
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
        const { phone, code, password } = req.body;

        if (!phone || !password || !code) {
            return res.status(400).json({ error: "Password is required" });
        }

        const sessionInfo = sessions.get(phone);
        if (!sessionInfo) {
            return res.status(400).json({ error: "No session found. Please request a code first." });
        }
        const { client, sentCode } = sessionInfo;
        try {
            const pwdInfo = await client.invoke(new Api.account.GetPassword());
            await client.start({
                phoneNumber: '+855' + phone,
                phoneCode: async () => code,
                phoneCodeHash: sentCode.phoneCodeHash,
                password: async () => password,
                onError: (err) => { throw err; },
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
            return res.status(403).json({ error: err.errorMessage || err.message });
        }
    }

    static async Logout(req, res) {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: "Phone is required" });
        }
        const slicePhone = phone.slice(3);
        const sessionInfo = sessions.get(slicePhone);
        if (!sessionInfo) {
            return res.status(404).json({ error: "Session not found" });
        }

        const { client } = sessionInfo;

        try {
            await client.invoke(new Api.auth.LogOut());
            await client.disconnect();

            deleteSession(phone);
            sessions.delete(phone);

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
                deleteSession(phone);
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
}

module.exports = TelegramController;