import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box, TextField } from '@mui/material';
import api from '../../api/api'; // Fix import path
import { toast } from 'react-toastify';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const SecuritySettings: React.FC = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false); // Ideally fetch this state from user profile on mount
    const [step, setStep] = useState<"initial" | "scan" | "verify">("initial");

    // Check status on mount (Mock logic - in real app, fetch user profile)
    // For this demo, we assume user knows their status or we fetch it.

    const handleGenerate = async () => {
        try {
            const res = await api.post('/2fa/generate');
            if (res.data.success) {
                setQrCodeUrl(res.data.data.qrCodeUrl); // Backend sends DataURL string
                setSecret(res.data.data.secret);
                setStep("scan");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to generate 2FA");
        }
    };

    const handleEnable = async () => {
        try {
            await api.post('/2fa/enable', { code });
            setIs2FAEnabled(true);
            setStep("initial");
            toast.success("Two-Factor Authentication Enabled Successfully!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid Code");
        }
    };

    const handleDisable = async () => {
        // In a real flow, we should ask for code here too!
        // But for UI simplicity, let's assume valid session or ask code in a modal (which we just built!)
        // For now, let's just try to call disable (backend requires code, so this might fail without input)
        // We will reuse the code input for disabling if needed, or keeping it simple for now.
        if (!code) {
            toast.info("Please enter a code to confirm disabling/enabling");
            return;
        }

        try {
            await api.post('/2fa/disable', { code });
            setIs2FAEnabled(false);
            setCode("");
            toast.success("Two-Factor Authentication Disabled.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to disable.");
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Typography variant="h4" className="mb-6 font-bold flex items-center gap-2">
                <SecurityIcon fontSize="large" color="primary" /> Security Settings
            </Typography>

            <Card className="shadow-lg rounded-xl">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Status Section */}
                        <div className="flex-1">
                            <Typography variant="h6" className="font-semibold mb-2">
                                Two-Factor Authentication (2FA)
                            </Typography>
                            <Typography variant="body2" color="textSecondary" className="mb-4">
                                Add an extra layer of security to your account. When enabled, you'll need to enter a code from your mobile app to perform sensitive actions like deleting users.
                            </Typography>

                            <Box className={`p-4 rounded-lg flex items-center gap-3 mb-6 ${is2FAEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                                {is2FAEnabled ? <LockIcon className="text-green-600" /> : <LockOpenIcon className="text-gray-500" />}
                                <div>
                                    <Typography variant="subtitle1" className={`font-bold ${is2FAEnabled ? 'text-green-700' : 'text-gray-700'}`}>
                                        Status: {is2FAEnabled ? "Enabled" : "Disabled"}
                                    </Typography>
                                    <Typography variant="caption" className="text-gray-500">
                                        {is2FAEnabled ? "Your account is secure." : "Your account is vulnerable."}
                                    </Typography>
                                </div>
                            </Box>

                            {!is2FAEnabled && step === "initial" && (
                                <Button variant="contained" color="primary" onClick={handleGenerate}>
                                    Enable 2FA
                                </Button>
                            )}

                            {/* Input for Verify/Disable */}
                            {(step === "scan" || is2FAEnabled) && (
                                <Box className="mt-4">
                                    <Typography variant="body2" className="mb-2 font-medium">
                                        Enter Code from Authenticator App:
                                    </Typography>
                                    <div className="flex gap-2 items-center">
                                        <TextField
                                            size="small"
                                            placeholder="123456"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            inputProps={{ maxLength: 6 }}
                                        />
                                        {step === "scan" && (
                                            <Button variant="contained" color="success" onClick={handleEnable} disabled={code.length !== 6}>
                                                Verify & Enable
                                            </Button>
                                        )}
                                        {is2FAEnabled && (
                                            <Button variant="outlined" color="error" onClick={handleDisable} disabled={code.length !== 6}>
                                                Disable 2FA
                                            </Button>
                                        )}
                                    </div>
                                </Box>
                            )}

                        </div>

                        {/* QR Code Section */}
                        {step === "scan" && qrCodeUrl && (
                            <div className="flex-1 flex flex-col items-center justify-center border-l pl-8 border-gray-200">
                                <Typography variant="h6" className="mb-4">Scan QR Code</Typography>
                                <div className="p-4 bg-white border rounded-lg shadow-sm">
                                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                                <Typography variant="caption" className="mt-4 text-center text-gray-500 block max-w-xs">
                                    Open Google Authenticator (or any TOTP app) on your phone and scan this code.
                                    <br />
                                    <strong>Secret Key:</strong> {secret}
                                </Typography>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SecuritySettings;
