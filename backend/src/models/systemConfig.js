import mongoose from 'mongoose';

const systemConfig = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

const SystemConfig = mongoose.model('SystemConfig', systemConfig);

export default SystemConfig;