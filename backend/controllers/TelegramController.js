const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const apiId = 28426783;
const apiHash = '8d1eaac8b1871959a218bd2e0f4c1d67';
let stringSession = new StringSession('');
let sentCodeInfo = null;
const client = new TelegramClient(stringSession, apiId, apiHash, {});

class TelegramController {
    static async SendCode(req, res) {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: "Phone number is required" });
        }

        try {
            await client.connect();

            sentCodeInfo = await client.invoke(
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

            res.json({ message: "Code sent successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    static async VerifyCode(req, res) {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ error: "Phone and code are required" });
        }

        try {
            const signedInUser = await client.invoke(
                new Api.auth.SignIn({
                    phoneNumber: '+855' + phone,
                    phoneCode: code,       
                    phoneCodeHash: sentCodeInfo.phoneCodeHash
                })
            );

            stringSession = client.session.save();
            res.json({ message: "Logged in", session: stringSession });
        } catch (err) {
            // Check if 2FA password is needed
            if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
                return res.status(200).json({ message: "2FA password required", twoFA: true });
            }
            return res.status(500).json({ error: err.message });
        }
    }

    static async CheckPassword(req, res) {
        const { password: pwdPlainText } = req.body;

        if (!pwdPlainText) {
            return res.status(400).json({ error: "Password is required" });
        }

        try {
            const password = await client.invoke(new Api.account.GetPassword());
            const { srpId, currentAlgo, srpB } = password;

            const { Crypto } = require('telegram');
            const result = await Crypto.computeCheckPasswordSRP(currentAlgo, srpB, srpId, pwdPlainText);

            const signedInUser = await client.invoke(new Api.auth.CheckPassword({
                password: result
            }));

            stringSession = client.session.save();
            return res.json({ message: "Logged in with 2FA", session: stringSession });

        } catch (err) {
            return res.status(403).json({ error: "Invalid 2FA password", details: err.message });
        }
    }
}

module.exports = TelegramController;