const sendMessageToChatBot = async (sender, message) => {
    const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sender, message }),
    })
    const data = await response.json()
    return data
}

export const chatBotService = {
    sendMessageToChatBot,
}