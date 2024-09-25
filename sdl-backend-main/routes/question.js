
const controller = require('../controllers/question');
const router = require('express').Router();

router.get('/messages/:questionId', controller.getMessages);
router.get('/:projectId', controller.getAllChatrooms);
router.get('/:projectId/:userId', controller.getUserChatrooms);
router.post('/createChatroom', controller.createChatroom);
router.post('/createMessage', controller.createMessage)
router.delete('/chatrooms/:questionId', controller.deleteChatroom);

module.exports = router;