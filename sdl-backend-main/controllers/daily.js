//controllers/daily.js
const Daily_personal = require('../models/daily_personal');
const Daily_team = require('../models/daily_team');

exports.getPersonalDaily = async (req, res) => {
    const { userId, projectId, isTeacher } = req.query;

    try {
        let personalDaily;

        if (isTeacher === "true") {
            // 教師端：獲取該 projectId 內所有學生的個人日誌
            personalDaily = await Daily_personal.findAll({
                where: { projectId }
            });
        } else {
            // 學生端：僅獲取自己(userId)的日誌
            personalDaily = await Daily_personal.findAll({
                where: { projectId, userId }
            });
        }

        res.status(200).json(personalDaily);
    } catch (err) {
        console.error("取得個人日誌失敗:", err);
        res.status(500).json({ message: "獲取日誌失敗", error: err });
    }
};


exports.createPersonalDaily = async (req, res) => {
    const { userId, projectId, title, content } = req.body;
    if (!title) {
        return res.status(404).send({ message: 'please enter title!' })
    }

    const fs = require('fs').promises; // 使用 Promise 接口

    if (!content) {
        return res.status(404).send({ message: 'please fill in the form !' })
    }
    if (req.files.length > 0) {
        try {
            await Promise.all(req.files.map(async (item) => {
                // const fileData = item.fileData;
                console.log("CreateItem:", item)

                const fileData = await fs.readFile(item.path);

                req.files.map(item => {
                    const filename = item.filename
                    Daily_personal.create({
                        userId: userId,
                        projectId: projectId,
                        title: title,
                        content: content,
                        fileData: fileData,
                        filename: filename
                    })
                        .then(() => {
                            return res.status(200).send({ message: 'create success!' })
                        })
                        .catch(err => {
                            console.log(err)
                            return res.status(500).send({ message: 'create failed!' });
                        });
                })
            }));
        } catch (err) {
            console.log(err);
            return res.status(500).send({ message: 'create failed!' });
        }
    } else {
        await Daily_personal.create({
            userId: userId,
            projectId: projectId,
            title: title,
            content: content,
        })
            .then(() => {
                return res.status(200).send({ message: 'create success!' });
            })
            .catch(err => {
                console.log(err);
                return res.status(500).send({ message: 'create failed!' });
            });
    }
}

exports.getTeamDaily = async (req, res) => {
    const { projectId } = req.query;
    const teamDaily = await Daily_team.findAll({
        where: {
            projectId: projectId,
        }
    })
        .then(result => {
            console.log(result);
            res.status(200).json(result)
        })
        .catch(err => console.log(err));
}

exports.createTeamDaily = async (req, res) => {
    const { userId, projectId, title, content, creator } = req.body;
    if (!title) {
        return res.status(404).send({ message: 'please enter title!' })
    }
    const fs = require('fs').promises; // 使用 Promise 接口

    if (req.files.length > 0) {
        try {
            await Promise.all(req.files.map(async (item) => {
                // const fileData = item.fileData;
                console.log("CreateItem:", item)

                const fileData = await fs.readFile(item.path);

                req.files.map(item => {
                    const filename = item.filename
                    Daily_team.create({
                        userId: userId,
                        projectId: projectId,
                        title: title,
                        content: content,
                        creator: creator,
                        fileData: fileData,
                        filename: filename,
                        // stage: stage,
                        // type: type
                    })
                        .then(() => {
                            return res.status(200).send({ message: 'create success!' })
                        })
                        .catch(err => {
                            console.log(err)
                            return res.status(500).send({ message: 'create failed!' });
                        });
                })
            }));
        } catch (err) {
            console.log(err);
            return res.status(500).send({ message: 'create failed!' });
        }
    } else {
        await Daily_team.create({
            userId: userId,
            projectId: projectId,
            title: title,
            content: content,
            creator: creator,
            // stage: stage,
            // type: type
        })
            .then(() => {
                return res.status(200).send({ message: 'create success!' });
            })
            .catch(err => {
                console.log(err);
                return res.status(500).send({ message: 'create failed!' });
            });
    }

}
exports.updatePersonalDaily = async (req, res) => {
    console.log("收到的 params:", req.params);
    console.log("收到的請求:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "請求體 (body) 為空，請確認 Content-Type 設定為 JSON" });
    }

    const { id } = req.params;
    const { title, content } = req.body;

    try {
        const daily = await Daily_personal.findOne({ where: { id } });
        if (!daily) {
            return res.status(404).json({ message: "日誌未找到" });
        }

        await daily.update({ title, content });
        return res.status(200).json({ message: "更新成功", data: daily });
    } catch (error) {
        console.error("更新錯誤:", error);
        return res.status(500).json({ message: "更新失敗" });
    }
};

exports.updateTeamDaily = async (req, res) => {
    console.log("收到的 params:", req.params);
    console.log("收到的請求:", req.body);
    
    const { id } = req.params;
    const { title, content } = req.body;
    
    try {
        const daily = await Daily_team.findOne({ where: { id } });
        if (!daily) {
            return res.status(404).json({ message: "小組日誌未找到" });
        }

        let updatedData = { title, content };
        
        if (req.files && req.files.length > 0) {
            const fs = require('fs').promises;
            const fileData = await fs.readFile(req.files[0].path);
            updatedData.fileData = fileData;
            updatedData.filename = req.files[0].originalname;
        }

        await daily.update(updatedData);
        return res.status(200).json({ message: "更新成功", data: daily });
    } catch (error) {
        console.error("更新錯誤:", error);
        return res.status(500).json({ message: "更新失敗" });
    }
};