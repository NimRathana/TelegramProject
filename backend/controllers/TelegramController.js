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
    static async Test(req, res){
        res.json({ data: "Test" })
    }
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

            const entity = await client.getEntity(me.username);

            if (entity.className !== "User") {
                return res.status(400).json({ error: "Provided username does not refer to a user." });
            }

            const full = await client.invoke(new Api.users.GetFullUser({ id: entity }));
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
                    profileImage,
                    about: full.fullUser.about ?? null,
                    date: (full.fullUser.birthday && full.fullUser.birthday.day != null && full.fullUser.birthday.month != null && full.fullUser.birthday.year != null) ? `${full.fullUser.birthday.day}-${full.fullUser.birthday.month}-${full.fullUser.birthday.year}` : null,

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

            const entity = await client.getEntity(me.username);

            if (entity.className !== "User") {
                return res.status(400).json({ error: "Provided username does not refer to a user." });
            }

            const full = await client.invoke(new Api.users.GetFullUser({ id: entity }));
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
                    profileImage, 
                    about: full.fullUser.about ?? null,
                    date: (full.fullUser.birthday && full.fullUser.birthday.day != null && full.fullUser.birthday.month != null && full.fullUser.birthday.year != null) ? `${full.fullUser.birthday.day}-${full.fullUser.birthday.month}-${full.fullUser.birthday.year}` : null,
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

            const entity = await client.getEntity(me.username);

            if (entity.className !== "User") {
                return res.status(400).json({ error: "Provided username does not refer to a user." });
            }

            const full = await client.invoke(new Api.users.GetFullUser({ id: entity }));

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
                    about: full.fullUser.about ?? null,
                    date: (full.fullUser.birthday && full.fullUser.birthday.day != null && full.fullUser.birthday.month != null && full.fullUser.birthday.year != null) ? `${full.fullUser.birthday.day}-${full.fullUser.birthday.month}-${full.fullUser.birthday.year}` : null,
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
                    phone: user.phone || null,
                    username: user.username || null,
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

                let entity;
                try {
                    const participants = await client.getParticipants(u.groupId);
                    entity = participants.find(p => {
                        return p.id.toString() === u.id.toString();
                    });
                } catch (e) {
                    console.warn(`Skipping user ${u.id}: ${e.message}`);
                    continue; // Skip users who can't be resolved
                }

                try {
                    const parts = [];
                    let imageIndex = 0;

                    const regex = /<p>(.*?)<\/p>|<img[^>]+src="data:(image\/[^;]+);base64,([^"]+)"[^>]*>|<iframe[^>]+src="([^"]+)"[^>]*><\/iframe>/gi;

                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        // <p>...</p>
                        if (match[1]) {
                            const paragraph = match[1].trim();

                            // Image inside <p>
                            const imgMatch = paragraph.match(/<img[^>]+src="data:(image\/[^;]+);base64,([^"]+)"[^>]*>/);
                            if (imgMatch) {
                                const mimeType = imgMatch[1];
                                const base64 = imgMatch[2];
                                const extension = mimeType.split('/')[1];

                                parts.push({
                                    type: 'image',
                                    buffer: Buffer.from(base64, 'base64'),
                                    name: `image_${++imageIndex}.${extension}`,
                                    mimeType
                                });
                            } else if (paragraph.replace(/<[^>]+>/g, '').trim()) {
                                parts.push({
                                    type: 'text',
                                    content: paragraph
                                });
                            }
                        }

                        // Standalone <img>
                        else if (match[2] && match[3]) {
                            const mimeType = match[2];
                            const base64 = match[3];
                            const extension = mimeType.split('/')[1];

                            parts.push({
                                type: 'image',
                                buffer: Buffer.from(base64, 'base64'),
                                name: `image_${++imageIndex}.${extension}`,
                                mimeType
                            });
                        }

                        // <iframe> (video)
                        else if (match[4]) {
                            const videoUrl = match[4];
                            parts.push({
                                type: 'video',
                                url: videoUrl
                            });
                        }
                    }

                    // Send each part
                    for (const part of parts) {
                        if (part.type === 'text') {
                            await client.sendMessage(entity, {
                                message: part.content,
                                parseMode: 'html'
                            });
                        } else if (part.type === 'image') {
                            await client.sendFile(entity, {
                                file: part.buffer,
                                attributes: [
                                    new Api.DocumentAttributeFilename({ fileName: part.name })
                                ]
                            });
                        } else if (part.type === 'video') {
                            await client.sendMessage(entity, {
                                message: part.url,
                                parseMode: 'html'
                            });
                        }
                    }

                } catch (err) {
                    console.error(`Failed to message user ${u.id}:`, err.message);
                }
            }

            await client.disconnect();
            res.status(200).json({ message: 'Messages sent successfully.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to send messages.' });
        }
    }

    static async GetPosts(req, res) {
        const { phone, channelUsername, limit = 10 } = req.body;

        if (!phone || !channelUsername) {
            return res.status(400).json({ error: 'phone and channelUsername are required' });
        }

        try {
            const sessionString = loadSession(phone.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: 'No saved session found for this phone' });
            }

            const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
                connectionRetries: 5,
                autoReconnect: true,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phone.slice(3));
                return res.status(401).json({ error: 'Session expired. Please log in again.' });
            }

            const me = await client.getMe();
            const selfPeer = await client.getEntity(me);

            const peerStories = await client.invoke(new Api.stories.GetPeerStories({ peer: selfPeer }));
            if (!peerStories || !peerStories.stories || peerStories.stories.length === 0) {
                return res.status(404).json({ error: 'No stories found for this user.' });
            }
            
            const storyMedia = [];

            for (const storyItem of peerStories.stories.stories) {
                try {
                    let mediaType = 'unknown';
                    let mimeType = 'application/octet-stream';

                    const media = storyItem.media;

                    if (media instanceof Api.MessageMediaPhoto) {
                        mediaType = 'image';
                        mimeType = 'image/jpeg'; // Telegram doesn't provide exact type, but it's usually JPEG
                    } else if (media instanceof Api.MessageMediaDocument) {
                        const doc = media.document;
                        mimeType = doc.mimeType;

                        if (mimeType.startsWith('video/')) {
                            mediaType = 'video';
                        } else if (mimeType.startsWith('image/')) {
                            mediaType = 'image';
                        } else if (mimeType.startsWith('audio/')) {
                            mediaType = 'audio';
                        } else {
                            mediaType = 'file';
                        }
                    }

                    const buffer = await client.downloadMedia(media);
                    const base64Data = buffer.toString('base64');

                    storyMedia.push({
                        id: storyItem.id,
                        mediaType,
                        mimeType,
                        mediaBase64: base64Data,
                    });
                } catch (err) {
                    throw new Error(err);
                }
            }

            saveSession(phone.slice(3), client.session.save());

            return res.status(200).json({ stories: storyMedia });
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

    static async GetPhotos(req, res) {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'phone is required' });
        }

        try {
            const sessionString = loadSession(phone.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: 'No saved session found for this phone' });
            }

            const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
                connectionRetries: 5,
                autoReconnect: true,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phone.slice(3));
                return res.status(401).json({ error: 'Session expired. Please log in again.' });
            }

            const me = await client.getMe();
            const photosResult = await client.invoke(
                new Api.photos.GetUserPhotos({
                userId: me,
                offset: 0,
                maxId: 0,
                limit: 10,
                })
            );

            const photoBase64List = [];

            for (const photo of photosResult.photos) {
                try {
                    const buffer = await client.downloadMedia(photo);
                    const base64 = buffer.toString('base64');

                    photoBase64List.push({
                        id: photo.id,
                        base64,
                        mimeType: 'image/jpeg',
                    });
                } catch (err) {
                    console.warn(`Failed to download photo ${photo.id}:`, err.message);
                }
            }

            saveSession(phone.slice(3), client.session.save());

            return res.status(200).json({ photos: photoBase64List });
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

    static async GetArchivedChats(req, res) {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'phone is required' });
        }

        try {
            const sessionString = loadSession(phone.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: 'No saved session found for this phone' });
            }

            const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
                connectionRetries: 5,
                autoReconnect: true,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phone.slice(3));
                return res.status(401).json({ error: 'Session expired. Please log in again.' });
            }

            const dialogs = await client.getDialogs({ folderId: 1 });
            const archivedChats = dialogs.filter(dialog => dialog.dialog.folderId === 1);

            const result = [];

            for (const chat of archivedChats) {
                let imageBase64 = null;

                try {
                    const buffer = await client.downloadProfilePhoto(chat);
                    if (buffer) {
                        imageBase64 = buffer.toString('base64');
                    }
                } catch (err) {
                    console.warn(`No image for chat ${chat.id}:`, err.message);
                }

                result.push({
                    id: chat.id,
                    name: chat.title || (chat.user && `${chat.user.firstName} ${chat.user.lastName || ''}`),
                    type: chat.className,
                    hasImage: !!imageBase64,
                    image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
                    phone: chat.entity.phone ? chat.entity.phone : '',
                    username: chat.entity.username ? chat.entity.username : '',
                });
            }

            saveSession(phone.slice(3), client.session.save());

            return res.status(200).json({ archivedChats: result });
        } catch (err) {
            res.status(500).json({ error: err.errorMessage || err.message });
        }
    }

    static async GetContacts(req, res) {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'phone is required' });
        }

        try {
            const sessionString = loadSession(phone.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: 'No saved session found for this phone' });
            }

            const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
                connectionRetries: 5,
                autoReconnect: true,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phone.slice(3));
                return res.status(401).json({ error: 'Session expired. Please log in again.' });
            }

            const result = await client.invoke(new Api.contacts.GetContacts({ hash: 0 }));
            const contacts = [];

            for (const user of result.users) {
                if (!user.firstName && !user.lastName) continue; // skip empty entries

                let imageBase64 = null;

                try {
                    const buffer = await client.downloadProfilePhoto(user);
                    if (buffer) {
                        imageBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
                    }
                } catch (err) {
                    // No profile photo or can't fetch — this is normal
                    console.warn(`No profile photo for ${user.id}: ${err.message}`);
                }

                contacts.push({
                    id: user.id,
                    name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                    username: user.username ?? '',
                    phone: user.phone ?? '',
                    hasImage: !!imageBase64,
                    image: imageBase64,
                });
            }

            saveSession(phone.slice(3), client.session.save());

            return res.status(200).json({ contacts });
        } catch (err) {
            res.status(500).json({ error: err.errorMessage || err.message });
        }
    }

    static async GetAbout(req, res) {
        const { phone, channelUsername } = req.body;

        if (!phone || !channelUsername) {
            return res.status(400).json({ error: 'phone and channelUsername are required' });
        }

        try {
            const sessionString = loadSession(phone.slice(3));
            if (!sessionString) {
                return res.status(400).json({ error: 'No saved session found for this phone' });
            }

            const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
                connectionRetries: 5,
                autoReconnect: true,
            });

            await client.connect();

            const isAuthorized = await client.checkAuthorization();
            if (!isAuthorized) {
                deleteSession(phone.slice(3));
                return res.status(401).json({ error: 'Session expired. Please log in again.' });
            }

            const entity = await client.getEntity(channelUsername);

            if (entity.className !== "User") {
                return res.status(400).json({ error: "Provided username does not refer to a user." });
            }

            const full = await client.invoke(new Api.users.GetFullUser({ id: entity }));

            const userDetails = [{
                id: entity.id,
                name: `${entity.firstName ?? ''} ${entity.lastName ?? ''}`.trim(),
                username: entity.username ?? null,
                phone: entity.phone ?? null,
                bio: full.fullUser.about ?? null,
                date: full.fullUser.birthday.day ? `${full.fullUser.birthday.day}-${full.fullUser.birthday.month}-${full.fullUser.birthday.year}` : null,
            }];

            saveSession(phone.slice(3), client.session.save());

            return res.status(200).json({ userDetails });
        } catch (err) {
            res.status(500).json({ error: err.errorMessage || err.message });
        }
    }
}

module.exports = TelegramController;