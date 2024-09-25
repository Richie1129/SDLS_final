const Question = require('../models/question')
const QuestionMessage = require('../models/question_message')

exports.getAllChatrooms = async (req, res) => {
    const projectId = req.params.projectId;
    // console.log("Chatroom_message",Question); 

    await Question.findAll({
        where: { projectId: projectId }
    })
        .then(result => {
            console.log(result);
            res.status(200).json(result)
        })
        .catch(err => console.log(err));
};

exports.getUserChatrooms = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.params.userId;
    // console.log("Chatroom_message",Question); 

    await Question.findAll({
        where: {
            projectId: projectId,
            userId: userId
        }
    })
        .then(result => {
            console.log(result);
            res.status(200).json(result)
        })
        .catch(err => console.log(err));
};

exports.getMessages = async (req, res) => {
    const questionId = req.params.questionId;

    await QuestionMessage.findAll({
        where: { questionId: questionId }
    })
        .then(result => {
            console.log(result);
            res.status(200).json(result)
        })
        .catch(err => console.log(err));
};

exports.createChatroom = async (req, res) => {
    const { title, userId, projectId } = req.body;
    if (!title) {
        return res.status(404).send({ message: 'please enter title!' })
    }

    await Question.create({
        userId: userId,
        projectId: projectId,
        title: title,
    })
        .then(() => {
            return res.status(200).send({ message: 'create success!' });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send({ message: 'create failed!' });
        });
}

exports.createMessage = async (req, res) => {
    const { message, author, questionId } = req.body;
    if (!message) {
        return res.status(404).send({ message: 'please enter title!' })
    }
    if (!author) {
        return res.status(404).send({ message: 'please enter author!' })
    }

    await QuestionMessage.create({
        message: message,
        author: author,
        questionId: questionId,
    })
        .then(() => {
            return res.status(200).send({ message: 'create success!' });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).send({ message: 'create failed!' });
        });
}


exports.deleteChatroom = async (req, res) => {
    const questionId = req.params.questionId;
    try {
        const chatroom = await Question.findByPk(questionId);
        if (!chatroom) {
            return res.status(404).send({ message: 'Chatroom not found!' });
        }

        await Question.destroy({
            where: { id: questionId }
        });
        await QuestionMessage.destroy({
            where: { questionId: questionId }
        });

        res.status(200).send({ message: 'Chatroom deleted successfully!' });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Failed to delete chatroom.' });
    }
}