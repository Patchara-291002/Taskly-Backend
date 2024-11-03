const User = require('../models/User');

exports.getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch the user', error })
    }
};