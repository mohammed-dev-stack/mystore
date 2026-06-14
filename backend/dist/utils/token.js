import jwt from 'jsonwebtoken';
export const generateToken = (payload) => {
    return jwt.sign({ id: payload.id, role: payload.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
};
//# sourceMappingURL=token.js.map