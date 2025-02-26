const Status = require('../models/Status');
const Project = require('../models/Project');
const mongoose = require('mongoose')

exports.createStatus = async (req, res) => {
    try {
        const { projectId, statusName, color, isDone } = req.body;

        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // ✅ ตรวจสอบว่า isDone มีอยู่แล้วในโปรเจคหรือไม่
        if (isDone) {
            const existingDoneStatus = await Status.findOne({ projectId, isDone: true });
            if (existingDoneStatus) {
                return res.status(400).json({ message: 'There can only be one "Done" status per project' });
            }
        }

        const lastPosition = await Status.find({ projectId }).sort({ position: -1 }).limit(1);
        const newPosition = lastPosition.length > 0 ? lastPosition[0].position + 1 : 1;

        const newStatus = new Status({
            projectId,
            statusName,
            color,
            position: newPosition,
            isDone: isDone || false
        });

        await newStatus.save();
        res.status(201).json(newStatus);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create status', error });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statusName, color, isDone } = req.body;

        const statusToUpdate = await Status.findById(id);
        if (!statusToUpdate) {
            return res.status(404).json({ message: 'Status not found' });
        }

        // ✅ ตรวจสอบว่า isDone เปลี่ยนจาก false -> true หรือไม่
        if (isDone && !statusToUpdate.isDone) {
            const existingDoneStatus = await Status.findOne({ projectId: statusToUpdate.projectId, isDone: true });
            if (existingDoneStatus) {
                return res.status(400).json({ message: 'There can only be one "Done" status per project' });
            }
        }

        statusToUpdate.statusName = statusName ?? statusToUpdate.statusName;
        statusToUpdate.color = color ?? statusToUpdate.color;
        statusToUpdate.isDone = isDone ?? statusToUpdate.isDone;

        await statusToUpdate.save();
        res.status(200).json(statusToUpdate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update status', error });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const statusToDelete = await Status.findById(id);
        if (!statusToDelete) {
            return res.status(404).json({ message: 'Status not found' });
        }

        // ✅ ป้องกันการลบ Status ที่เป็น Done
        if (statusToDelete.isDone) {
            return res.status(400).json({ message: 'Cannot delete a "Done" status' });
        }

        const positionToDelete = statusToDelete.position;

        await statusToDelete.deleteOne();

        // ✅ อัปเดตตำแหน่ง Status ที่เหลือ
        await Status.updateMany(
            { projectId: statusToDelete.projectId, position: { $gt: positionToDelete } },
            { $inc: { position: -1 } }
        );

        res.status(200).json({ message: 'Status deleted and positions updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete status and update positions', error });
    }
};
// exports.updateStatusPosition = async (req, res) => {
//     const { id } = req.params;
//     const {  projectId ,position } = req.body;

//     try {
//         // ตรวจสอบว่า status และ projectId มีอยู่ในฐานข้อมูลหรือไม่
//         const targetStatus = await Status.findById(id);
//         if (!targetStatus) {
//             return res.status(404).json({ message: 'Status not found' });
//         }

//         if (targetStatus.projectId.toString() !== projectId) {
//             return res.status(400).json({ message: 'Status does not belong to the specified project' });
//         }

//         const currentPosition = targetStatus.position;

//         // ตรวจสอบว่า position ใหม่อยู่ในขอบเขตที่ยอมรับได้หรือไม่
//         const statusesInProject = await Status.find({ projectId }).sort({ position: 1 });
//         if (position < 1 || position > statusesInProject.length) {
//             return res.status(400).json({ message: 'Invalid position value' });
//         }

//         // ถ้าไม่มีการเปลี่ยนตำแหน่ง ให้ return ทันที
//         if (position === currentPosition) {
//             return res.status(200).json({ message: 'Position is the same, no update needed' });
//         }

//         // Handle position shifting
//         if (position < currentPosition) {
//             // ย้ายขึ้น: เพิ่ม position ของ status ในช่วงที่ได้รับผลกระทบ
//             await Promise.all(
//                 statusesInProject.map(async (status) => {
//                     if (status.position >= position && status.position < currentPosition) {
//                         status.position += 1;
//                         await status.save();
//                     }
//                 })
//             );
//         } else if (position > currentPosition) {
//             // ย้ายลง: ลด position ของ status ในช่วงที่ได้รับผลกระทบ
//             await Promise.all(
//                 statusesInProject.map(async (status) => {
//                     if (status.position <= position && status.position > currentPosition) {
//                         status.position -= 1;
//                         await status.save();
//                     }
//                 })
//             );
//         }

//         // ตั้งค่า position ใหม่ให้กับ status ที่ย้าย
//         targetStatus.position = position;
//         await targetStatus.save();

//         // เรียง position ของ status ทั้งหมดให้เป็นลำดับต่อเนื่อง
//         const reorderedStatuses = await Status.find({ projectId }).sort({ position: 1 });
//         for (let i = 0; i < reorderedStatuses.length; i++) {
//             reorderedStatuses[i].position = i + 1;
//             await reorderedStatuses[i].save();
//         }

//         res.status(200).json({ message: 'Position updated successfully', targetStatus });
//     } catch (error) {
//         console.error('Failed to update position:', error);
//         res.status(500).json({ message: 'Failed to update position', error });
//     }
// };

exports.updateStatusPosition = async (req, res) => {
    const { id } = req.params;
    const { projectId, position } = req.body;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        const targetStatus = await Status.findById(id).session(session);
        if (!targetStatus) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Status not found' });
        }

        if (targetStatus.isDone) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Cannot move a "Done" status' });
        }

        const currentPosition = targetStatus.position;

        const statusesInProject = await Status.find({ projectId }).sort({ position: 1 }).session(session);
        if (position < 1 || position > statusesInProject.length) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid position value' });
        }

        if (position === currentPosition) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ message: 'Position is the same, no update needed' });
        }

        await Status.bulkWrite(
            statusesInProject
                .filter(status => status.position >= position && status.position < currentPosition)
                .map(status => ({
                    updateOne: {
                        filter: { _id: status._id },
                        update: { $inc: { position: 1 } }
                    }
                })),
            { session }
        );

        targetStatus.position = position;
        await targetStatus.save();

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Position updated successfully' });
    } catch (error) {
        console.error('Failed to update position:', error);
        res.status(500).json({ message: 'Failed to update position', error });
    }
};





