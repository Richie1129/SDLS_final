const controller = require('../controllers/daily');
const router = require('express').Router();
const {upload} = require('../middlewares/uploadMiddleware')

router.get('/', controller.getPersonalDaily); 
router.get('/team', controller.getTeamDaily);
router.post('/',upload.array("attachFile"), controller.createPersonalDaily);
router.post('/team',upload.array("attachFile"), controller.createTeamDaily);
router.put('/:id', controller.updatePersonalDaily);
router.put('/team/:id', controller.updateTeamDaily);

// router.put('/team/:id', upload.array("attachFile"), controller.updateTeamDaily);

module.exports = router;