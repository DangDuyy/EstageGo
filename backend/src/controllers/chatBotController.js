const { chatBotService } = require("~/services/chatBotService")

const sendMessageToChatBot = async (req, res) => {
    const { sender, message } = req.body
    await chatBotService.sendMessageToChatBot(sender, message)
        .then((data) => {
            res.status(200).json(data)
        })
        .catch((error) => {
            res.status(500).json({ error: 'Failed to send message to chatbot', details: error.message })
        })
}

export const chatBotController = {
    sendMessageToChatBot,
}