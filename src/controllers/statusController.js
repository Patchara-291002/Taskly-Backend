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

        // ตรวจสอบ isDone
        if (isDone) {
            const existingDoneStatus = await Status.findOne({ projectId, isDone: true });
            if (existingDoneStatus) {
                return res.status(400).json({ message: 'There can only be one "Done" status per project' });
            }
        }

        // หา position สุดท้ายและตำแหน่งของ isDone status (ถ้ามี)
        const statuses = await Status.find({ projectId }).sort({ position: 1 });
        const doneStatus = statuses.find(s => s.isDone);

        let newPosition;
        if (isDone) {
            // ถ้าเป็น isDone ให้ไปอยู่ท้ายสุด
            newPosition = statuses.length + 1;
        } else if (doneStatus) {
            // ถ้าไม่ใช่ isDone และมี doneStatus อยู่แล้ว ให้แทรกก่อน doneStatus
            newPosition = doneStatus.position;
            // เลื่อน position ของ status ที่อยู่หลังจากตำแหน่งใหม่ (รวมถึง doneStatus)
            await Status.updateMany(
                { projectId, position: { $gte: newPosition } },
                { $inc: { position: 1 } }
            );
        } else {
            // ถ้าไม่มี doneStatus ให้ต่อท้ายตามปกติ
            newPosition = statuses.length + 1;
        }

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

        // หา status ที่จะย้ายและ status ทั้งหมดในโปรเจค
        const targetStatus = await Status.findById(id).session(session);
        if (!targetStatus) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Status not found' });
        }

        const statuses = await Status.find({ projectId }).sort({ position: 1 }).session(session);
        const doneStatus = statuses.find(s => s.isDone);

        // ตรวจสอบตำแหน่งที่จะย้ายไป
        if (position < 1 || position > statuses.length) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid position value' });
        }

        // ตรวจสอบว่าจะย้ายไปเกิน isDone status หรือไม่
        if (doneStatus && position >= doneStatus.position && !targetStatus.isDone) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Cannot move status beyond Done status' });
        }

        const currentPosition = targetStatus.position;
        if (position === currentPosition) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ message: 'Position is the same, no update needed' });
        }

        // อัพเดตตำแหน่งของ status อื่นๆ
        if (position < currentPosition) {
            await Status.updateMany(
                {
                    projectId,
                    position: { $gte: position, $lt: currentPosition }
                },
                { $inc: { position: 1 } },
                { session }
            );
        } else {
            await Status.updateMany(
                {
                    projectId,
                    position: { $gt: currentPosition, $lte: position }
                },
                { $inc: { position: -1 } },
                { session }
            );
        }

        targetStatus.position = position;
        await targetStatus.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Position updated successfully'
        });
    } catch (error) {
        console.error('Failed to update position:', error);
        res.status(500).json({ message: 'Failed to update position', error });
    }
};





