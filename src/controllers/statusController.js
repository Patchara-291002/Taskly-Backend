const Status = require('../models/Status');
const Project = require('../models/Project');

exports.createStatus = async (req, res) => {
    try {
        const { projectId, statusName, color } = req.body;

        const projectExists = await Project.findById(projectId);
        if (!projectExists) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const lastPosition = await Status.find({ projectId }).sort({ position: -1 }).limit(1);
        const newPosition = lastPosition.length > 0 ? lastPosition[0].position + 1 : 1;

        const newStatus = new Status({
            projectId,
            statusName,
            color,
            position: newPosition,
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
        const { statusName, color } = req.body;

        const updatedStatatus = await Status.findByIdAndUpdate(
            id,
            {
                statusName,
                color,
                updatedAt: Date.now()
            },
            {
                new: true
            }
        )

        if (!updatedStatatus) {
            return res.status(404).json({ message: 'Status not found' });
        }

        res.status(200).json(updatedStatatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update status', error });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // ค้นหา Status ที่จะลบและเก็บค่า position เดิมไว้
        const statusToDelete = await Status.findById(id);
        if (!statusToDelete) {
            return res.status(404).json({ message: 'Status not found' });
        }

        const positionToDelete = statusToDelete.position;

        // ลบ Status
        await statusToDelete.deleteOne();

        // อัปเดต position ของ Status ที่มี position มากกว่า position ที่ลบไป
        await Status.updateMany(
            { projectId: statusToDelete.projectId, position: { $gt: positionToDelete } },
            { $inc: { position: -1 } }
        );

        res.status(200).json({ message: 'Status deleted and positions updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete status and update positions', error });
    }
};

exports.updateStatusPosition = async (req, res) => {
    const { id } = req.params;
    const {  projectId ,position } = req.body;

    try {
        // ตรวจสอบว่า status และ projectId มีอยู่ในฐานข้อมูลหรือไม่
        const targetStatus = await Status.findById(id);
        if (!targetStatus) {
            return res.status(404).json({ message: 'Status not found' });
        }

        if (targetStatus.projectId.toString() !== projectId) {
            return res.status(400).json({ message: 'Status does not belong to the specified project' });
        }

        const currentPosition = targetStatus.position;

        // ตรวจสอบว่า position ใหม่อยู่ในขอบเขตที่ยอมรับได้หรือไม่
        const statusesInProject = await Status.find({ projectId }).sort({ position: 1 });
        if (position < 1 || position > statusesInProject.length) {
            return res.status(400).json({ message: 'Invalid position value' });
        }

        // ถ้าไม่มีการเปลี่ยนตำแหน่ง ให้ return ทันที
        if (position === currentPosition) {
            return res.status(200).json({ message: 'Position is the same, no update needed' });
        }

        // Handle position shifting
        if (position < currentPosition) {
            // ย้ายขึ้น: เพิ่ม position ของ status ในช่วงที่ได้รับผลกระทบ
            await Promise.all(
                statusesInProject.map(async (status) => {
                    if (status.position >= position && status.position < currentPosition) {
                        status.position += 1;
                        await status.save();
                    }
                })
            );
        } else if (position > currentPosition) {
            // ย้ายลง: ลด position ของ status ในช่วงที่ได้รับผลกระทบ
            await Promise.all(
                statusesInProject.map(async (status) => {
                    if (status.position <= position && status.position > currentPosition) {
                        status.position -= 1;
                        await status.save();
                    }
                })
            );
        }

        // ตั้งค่า position ใหม่ให้กับ status ที่ย้าย
        targetStatus.position = position;
        await targetStatus.save();

        // เรียง position ของ status ทั้งหมดให้เป็นลำดับต่อเนื่อง
        const reorderedStatuses = await Status.find({ projectId }).sort({ position: 1 });
        for (let i = 0; i < reorderedStatuses.length; i++) {
            reorderedStatuses[i].position = i + 1;
            await reorderedStatuses[i].save();
        }

        res.status(200).json({ message: 'Position updated successfully', targetStatus });
    } catch (error) {
        console.error('Failed to update position:', error);
        res.status(500).json({ message: 'Failed to update position', error });
    }
};






