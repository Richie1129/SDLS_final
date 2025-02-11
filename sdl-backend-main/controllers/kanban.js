const Kanban = require('../models/kanban');
const Column = require('../models/column');
const Task = require('../models/task');
const Project = require('../models/project');

exports.getKanban = async ( req, res ) => {
    const projectId = req.params.projectId;
    //kanban
    const kanbanData = await Kanban.findAll({
        attributes:[
            'id',
            'column'],
        where:{
            projectId : projectId
        },
    })
    if(!kanbanData){
        res.status(500).send({message: 'NoRecord!'})
    }
    const { id, column } = kanbanData[0];

    //column
    const columnData = await Column.findAll({
            attributes:[
                'id',
                'name',
                'task'
            ],
            where:{
                kanbanId : id
            }
    })
    // const sortedColumnData = [];
    // const arrone = columnData.findIndex( item => item.id === column[0]);
    // sortedColumnData.push(columnData[arrone]);
    // const arrtwo = columnData.findIndex( item => item.id === column[1]);
    // sortedColumnData.push(columnData[arrtwo]);
    // const arrthree = columnData.findIndex( item => item.id === column[2]);
    // sortedColumnData.push(columnData[arrthree]);
    // //task
    // const taskData1 = await Task.findAll({
    //     attributes:[
    //         'id', 
    //         'title', 
    //         'content', 
    //         'labels', 
    //         'assignees'
    //     ],
    //     where:{
    //         columnId : sortedColumnData[0].id
    //     }
    // })
    // const sortTaskData1 = [];
    // sortedColumnData[0].task.map( column => {
    //     taskData1.map((task, index) => {
    //         if(task.id === column){
    //             sortTaskData1.push(taskData1[index])
    //         }
    //     })
    // })
    // sortedColumnData[0].task = sortTaskData1;
    // const taskData2 = await Task.findAll({
    //     attributes:[
    //         'id', 
    //         'title', 
    //         'content', 
    //         'labels', 
    //         'assignees'
    //     ],
    //     where:{
    //         columnId : sortedColumnData[1].id
    //     }
    // })
    // const sortTaskData2 = [];
    // sortedColumnData[1].task.map(column => {
    //     taskData2.map((task, index) => {
    //         if(task.id === column){
    //             sortTaskData2.push(taskData2[index])
    //         }
    //     })
    // })
    // sortedColumnData[1].task = sortTaskData2;
    // const taskData3 = await Task.findAll({
    //     attributes:[
    //         'id', 
    //         'title', 
    //         'content', 
    //         'labels', 
    //         'assignees'
    //     ],
    //     where:{
    //         columnId : sortedColumnData[2].id
    //     }
    // })
    // const sortTaskData3 = [];
    // sortedColumnData[2].task.map(column => {
    //     taskData3.map((task, index) => {
    //         if(task.id === column){
    //             sortTaskData3.push(taskData3[index])
    //         }
    //     })
    // })
    // sortedColumnData[2].task = sortTaskData3;
    const sortedColumnData = column.map(columnId => columnData.find(item => item.id === columnId));

    // 对于每个排序后的列，获取并排序其任务
    await Promise.all(sortedColumnData.map(async (columnItem, columnIndex) => {
        // 获取当前列的所有任务
        const taskData = await Task.findAll({
            attributes: ['id', 'title', 'content', 'labels', 'owner', 'assignees', 'images'],
            where: {
                columnId: columnItem.id
            }
        });
    
        // 根据列中的任务顺序排序这些任务
        const sortedTaskData = columnItem.task.map(taskId => taskData.find(task => task.id === taskId));
    
        // 更新当前列的任务数据
        sortedColumnData[columnIndex].task = sortedTaskData;
    }));

    res.status(200).json(sortedColumnData);

}

exports.getKanbanTask = async ( req, res ) =>{
    console.log("🔍 取得的任務資料:", JSON.stringify(taskData, null, 2));
    const columnId = req.params.columnId;
    const taskData = await Task.findAll({
        attributes:[
            'id', 
            'title', 
            'content', 
            'labels', 
            'owner',
            'assignees',
            'images',
        ],
        where:{
            columnId : columnId
        }
    })
    .then( result =>{
        console.log("🔍 取得的任務資料:", JSON.stringify(taskData, null, 2)); // ✅ 確認後端回傳
        res.status(200).json(taskData); // ✅ 確保 API 回傳 `createdAt`
        res.status(200).json(result);
    })
    .catch( err => {
        console.log(err);
        res.status(500).send({message: 'Something Wrong!'})
    });
}
exports.createKanban = async ( projectId ) => {
    const kanban = await Kanban.create({
        column:[], 
        projectId:projectId
    });
    const todo = await Column.create({
        name:"待處理", 
        task:[], 
        kanbanId:kanban.id
    });
    const inProgress = await Column.create({
        name:"進行中", 
        task:[], 
        kanbanId:kanban.id
    });
    const Completed = await Column.create({
        name:"完成", 
        task:[], 
        kanbanId:kanban.id
    });
    Kanban.findByPk(kanban.id)
    .then(kanban =>{
        kanban.column = [
            todo.id, 
            inProgress.id, 
            Completed.id 
        ];
        return kanban.save();
    })
}

