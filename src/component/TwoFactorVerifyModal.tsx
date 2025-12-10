import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Box } from '@mui/material';
import api from '../api/api';
import { toast } from 'react-toastify';

interface TwoFactorVerifyModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (code: string) => void;
    title?: string;
}

const TwoFactorVerifyModal: React.FC<TwoFactorVerifyModalProps> = ({ open, onClose, onSuccess, title = "Security Check" }) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (code.length < 6) {
            setError("Code must be 6 digits");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Verify code with backend first to ensure it's valid
            await api.post('/2fa/verify', { code });

            // If API does not throw, code is valid
            onSuccess(code); // Pass valid code back to caller
            setCode("");
            onClose();
        } catch (err: any) {
            console.error("2FA Verification Failed", err);
            setError(err.response?.data?.message || "Invalid Code. Please try again.");
            toast.error("Invalid Code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>{title}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
                    Please enter the 6-digit code from your Google Authenticator app to proceed.
                </Typography>
                <Box display="flex" justifyContent="center">
                    <TextField
                        autoFocus
                        value={code}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                            setCode(val);
                            if (val.length === 6) setError("");
                        }}
                        placeholder="000 000"
                        variant="outlined"
                        inputProps={{
                            style: { textAlign: 'center', fontSize: '24px', letterSpacing: '4px' },
                            maxLength: 6
                        }}
                        error={!!error}
                        helperText={error}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
                <Button onClick={handleVerify} disabled={loading || code.length !== 6} variant="contained" color="primary">
                    {loading ? 'Verifying...' : 'Verify'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TwoFactorVerifyModal;
